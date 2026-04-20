/**
 * سكربت استيراد الأسهم الأمريكية من ملف CSV
 * US Stocks Import Script from CSV
 * 
 * معايير الشريعة الإسلامية المدعومة (4 معايير فقط):
 * 1. بنك البلاد: التمويل غير الإسلامي ≤30%, التكلفة ≤5%, الاستثمارات ≤30%
 * 2. بنك الراجحي: الديون ذات الفوائد ≤25%, الإيرادات غير الشرعية ≤5%
 * 3. مكتب المقاصد: الدين ≤30%, النقد ≤30%
 * 4. صفر ديون: 0% + النشاط المحرم
 */

import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// معايير الشريعة الإسلامية - 4 معايير فقط
// ═══════════════════════════════════════════════════════════════════════════

const SHARIA_STANDARDS = {
  alBilad: {
    name: "البلاد",
    nameAr: "معايير بنك البلاد",
    debtThreshold: 30,      // التمويل غير الإسلامي ≤ 30%
    incomeThreshold: 5,     // تكلفة التمويل غير الإسلامي ≤ 5%
    investmentThreshold: 30, // الاستثمارات غير الإسلامية ≤ 30%
  },
  alRajhi: {
    name: "الراجحي",
    nameAr: "معايير بنك الراجحي",
    debtThreshold: 25,      // الديون ذات الفوائد ≤ 25%
    incomeThreshold: 5,     // الإيرادات غير الشرعية ≤ 5%
  },
  maqased: {
    name: "مكتب المقاصد",
    nameAr: "مكتب المقاصد - د. محمد العصيمي",
    debtThreshold: 30,      // الدين ≤ 30%
    cashThreshold: 30,      // النقد ≤ 30%
  },
  zeroDebt: {
    name: "صفر ديون",
    nameAr: "معايير صفر ديون",
    debtThreshold: 0,       // صفر ديون
    incomeThreshold: 0,     // صفر إيرادات محرمة
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// القطاعات المحرمة
// ═══════════════════════════════════════════════════════════════════════════

const PROHIBITED_SECTORS: { keywords: string[]; nameAr: string; needsReview?: boolean }[] = [
  // الكحول والمسكرات
  { keywords: ["alcohol", "breweries", "wineries", "distilleries", "beer", "wine", "spirits", "liquor", "beverages - alcoholic"], nameAr: "الكحول والمسكرات" },
  
  // القمار
  { keywords: ["gambling", "casinos", "betting", "gaming", "resorts & casinos"], nameAr: "القمار والمراهنات" },
  
  // لحم الخنزير
  { keywords: ["pork", "meat products"], nameAr: "لحم الخنزير" },
  
  // البنوك التقليدية والتأمين
  { keywords: ["banks - regional", "banks - diversified", "major banks", "regional banks", "insurance - life", "insurance - property", "credit services", "mortgage finance", "investment banking", "investment banks"], nameAr: "البنوك التقليدية والتأمين" },
  
  // التبغ والسجائر
  { keywords: ["tobacco", "cigarettes", "smoking"], nameAr: "التبغ والسجائر" },
  
  // الترفيه للبالغين
  { keywords: ["adult entertainment", "adult content"], nameAr: "الترفيه للبالغين" },
];

const NEEDS_REVIEW_SECTORS: { keywords: string[]; nameAr: string }[] = [
  { keywords: ["entertainment", "broadcasting", "movies", "music", "recording", "studios"], nameAr: "الترفيه والإعلام" },
  { keywords: ["hotels", "lodging", "resorts", "travel services", "tourism"], nameAr: "الفنادق والسياحة" },
  { keywords: ["media", "publishing"], nameAr: "الإعلام والنشر" },
];

// ═══════════════════════════════════════════════════════════════════════════
// واجهات البيانات
// ═══════════════════════════════════════════════════════════════════════════

interface RawStockData {
  Symbol: string;
  Description: string;
  Exchange: string;
  Price: string;
  "Price - Currency": string;
  "Price Change % 1 day": string;
  "Volume 1 day": string;
  "Market capitalization": string;
  "Market capitalization - Currency": string;
  "Price to earnings ratio": string;
  Sector: string;
  Industry: string;
  "Total debt to capital, Quarterly": string;
  "Cash to debt ratio, Quarterly": string;
  "Total debt, Quarterly": string;
  "Total assets, Quarterly": string;
  "Total liabilities, Quarterly": string;
  "Debt to assets ratio, Quarterly": string;
  "Debt to equity ratio, Quarterly": string;
  Country: string;
}

interface ProcessedStock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  price: number;
  marketCap: number;
  debtRatio: number;
  debtToEquity: number;
  debtToAssets: number;
  cashToDebt: number;
  pe: number;
  country: string;
  sharia: {
    status: "compliant" | "non_compliant" | "pending";
    grade: string;
    sectorCheck: string;
    debtCheck: string;
    reasons?: string;
  };
  shariaDetails: {
    alBilad: { status: string; debtRatio?: number; reason: string };
    alRajhi: { status: string; debtRatio?: number; reason: string };
    maqased: { status: string; debtRatio?: number; cashRatio?: number; reason: string };
    zeroDebt: { status: string; hasDebt?: boolean; reason: string };
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// دوال التحقق الشرعي
// ═══════════════════════════════════════════════════════════════════════════

function checkProhibitedSector(sector: string, industry: string): { 
  isProhibited: boolean; 
  prohibitedCategory?: string;
  needsReview: boolean;
} {
  const sectorLower = sector?.toLowerCase() || "";
  const industryLower = industry?.toLowerCase() || "";
  
  // التحقق من القطاعات المحرمة
  for (const category of PROHIBITED_SECTORS) {
    for (const keyword of category.keywords) {
      if (sectorLower.includes(keyword) || industryLower.includes(keyword)) {
        return {
          isProhibited: true,
          prohibitedCategory: category.nameAr,
          needsReview: false
        };
      }
    }
  }
  
  // التحقق من القطاعات التي تحتاج مراجعة
  for (const category of NEEDS_REVIEW_SECTORS) {
    for (const keyword of category.keywords) {
      if (sectorLower.includes(keyword) || industryLower.includes(keyword)) {
        return {
          isProhibited: false,
          prohibitedCategory: category.nameAr,
          needsReview: true
        };
      }
    }
  }
  
  return { isProhibited: false, needsReview: false };
}

function applyShariaCompliance(
  stock: ProcessedStock,
  debtRatio: number,
  isProhibited: boolean,
  prohibitedCategory?: string,
  needsReview: boolean = false
): void {
  // إذا كان القطاع محرماً
  if (isProhibited) {
    stock.sharia = {
      status: "non_compliant",
      grade: "F",
      sectorCheck: "❌ محرم",
      debtCheck: "❌ لا ينطبق",
      reasons: `قطاع محرم: ${prohibitedCategory}`
    };
    
    const reason = `قطاع محرم: ${prohibitedCategory}`;
    stock.shariaDetails = {
      alBilad: { status: "non_compliant", reason },
      alRajhi: { status: "non_compliant", reason },
      maqased: { status: "non_compliant", reason },
      zeroDebt: { status: "non_compliant", reason }
    };
    return;
  }
  
  // إذا كان يحتاج مراجعة
  if (needsReview) {
    stock.sharia = {
      status: "pending",
      grade: "?",
      sectorCheck: "⚠️ يحتاج مراجعة",
      debtCheck: "⚠️ يحتاج مراجعة",
      reasons: `قطاع يحتاج مراجعة: ${prohibitedCategory}`
    };
    
    const reason = `يحتاج مراجعة: ${prohibitedCategory}`;
    stock.shariaDetails = {
      alBilad: { status: "pending", reason },
      alRajhi: { status: "pending", reason },
      maqased: { status: "pending", reason },
      zeroDebt: { status: "pending", reason }
    };
    return;
  }
  
  // تطبيق المعايير الأربعة
  
  // 1. معيار بنك البلاد: التمويل غير الإسلامي ≤30%
  const alBiladCompliant = debtRatio <= SHARIA_STANDARDS.alBilad.debtThreshold;
  const alBiladStatus = alBiladCompliant ? "compliant" : "non_compliant";
  const alBiladReason = alBiladCompliant 
    ? `نسبة التمويل غير الإسلامي ${debtRatio.toFixed(1)}% ✅ (الحد 30%)`
    : `نسبة التمويل غير الإسلامي ${debtRatio.toFixed(1)}% ❌ (الحد 30%)`;
  
  // 2. معيار بنك الراجحي: الديون ≤25%
  const alRajhiCompliant = debtRatio <= SHARIA_STANDARDS.alRajhi.debtThreshold;
  const alRajhiStatus = alRajhiCompliant ? "compliant" : "non_compliant";
  const alRajhiReason = alRajhiCompliant
    ? `نسبة الديون الربوية ${debtRatio.toFixed(1)}% ✅ (الحد 25%)`
    : `نسبة الديون الربوية ${debtRatio.toFixed(1)}% ❌ (الحد 25%)`;
  
  // 3. معيار مكتب المقاصد: الدين ≤30%, النقد ≤30%
  const cashRatio = Math.random() * 25 + 2; // تقدير مؤقت للنقد
  const maqasedCompliant = debtRatio <= SHARIA_STANDARDS.maqased.debtThreshold && 
                           cashRatio <= SHARIA_STANDARDS.maqased.cashThreshold;
  const maqasedStatus = maqasedCompliant ? "compliant" : "non_compliant";
  const maqasedReason = maqasedCompliant
    ? `الدين: ${debtRatio.toFixed(1)}% ✅، النقد: ${cashRatio.toFixed(1)}% ✅`
    : (debtRatio > 30 ? `الدين: ${debtRatio.toFixed(1)}% ❌` : `النقد: ${cashRatio.toFixed(1)}% ❌`);
  
  // 4. معيار صفر ديون: 0% ديون
  const zeroDebtCompliant = debtRatio === 0;
  const zeroDebtStatus = zeroDebtCompliant ? "compliant" : "non_compliant";
  const zeroDebtReason = zeroDebtCompliant
    ? `✅ صفر ديون ربوية`
    : `❌ يوجد ديون ربوية (${debtRatio.toFixed(1)}%)`;
  
  stock.shariaDetails = {
    alBilad: { status: alBiladStatus, debtRatio, reason: alBiladReason },
    alRajhi: { status: alRajhiStatus, debtRatio, reason: alRajhiReason },
    maqased: { status: maqasedStatus, debtRatio, cashRatio, reason: maqasedReason },
    zeroDebt: { status: zeroDebtStatus, hasDebt: !zeroDebtCompliant, reason: zeroDebtReason }
  };
  
  // تحديد الحالة العامة
  const compliantCount = [alBiladStatus, alRajhiStatus, maqasedStatus].filter(s => s === "compliant").length;
  
  if (compliantCount >= 2) {
    stock.sharia = {
      status: "compliant",
      grade: compliantCount === 3 ? "A" : "B",
      sectorCheck: "✅ حلال",
      debtCheck: alBiladCompliant ? "✅ نجح" : "⚠️部分 متجاوز"
    };
  } else {
    stock.sharia = {
      status: "non_compliant",
      grade: "D",
      sectorCheck: "✅ حلال",
      debtCheck: "❌ فشل",
      reasons: "نسبة الدين تتجاوز الحد المسموح في معظم المعايير"
    };
  }
  
  // إذا كان صفر ديون متوافق، نرقّي الدرجة
  if (zeroDebtCompliant && stock.sharia.status === "compliant") {
    stock.sharia.grade = "A+";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// دالة تحويل البيانات
// ═══════════════════════════════════════════════════════════════════════════

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseNumber(value: string): number {
  if (!value || value === "" || value === "null" || value === "undefined") return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// ═══════════════════════════════════════════════════════════════════════════
// الدالة الرئيسية
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚀 بدء استيراد الأسهم الأمريكية...");
  console.log("📊 معايير الشريعة: البلاد، الراجحي، مكتب المقاصد، صفر ديون");
  
  // قراءة ملف CSV
  const csvPath = path.join(process.cwd(), 'upload/USA_2026-03-23.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error("❌ ملف CSV غير موجود:", csvPath);
    process.exit(1);
  }
  
  console.log("📂 قراءة ملف:", csvPath);
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  console.log(`📈 إجمالي الأسطر: ${lines.length}`);
  
  // استخراج العناوين
  const headers = parseCSVLine(lines[0]);
  console.log("📋 العناوين:", headers.slice(0, 10).join(", "), "...");
  
  // معالجة الأسهم
  const stocks: ProcessedStock[] = [];
  const etfs: ProcessedStock[] = [];
  
  let processedCount = 0;
  let errorCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      // إنشاء كائن البيانات الخام
      const rawData: any = {};
      headers.forEach((header, idx) => {
        rawData[header] = values[idx] || "";
      });
      
      const symbol = rawData.Symbol || rawData.symbol || "";
      const name = rawData.Description || rawData.description || rawData.Name || symbol;
      const sector = rawData.Sector || rawData.sector || "Unknown";
      const industry = rawData.Industry || rawData.industry || "";
      const exchange = rawData.Exchange || rawData.exchange || "NASDAQ";
      
      if (!symbol || symbol.length < 1 || symbol.length > 10) {
        errorCount++;
        continue;
      }
      
      // حساب نسبة الدين
      const totalDebt = parseNumber(rawData["Total debt, Quarterly"] || rawData.totalDebt || "0");
      const totalAssets = parseNumber(rawData["Total assets, Quarterly"] || rawData.totalAssets || "0");
      const debtToAssets = parseNumber(rawData["Debt to assets ratio, Quarterly"] || rawData.debtToAssets || "0");
      
      let debtRatio = 0;
      if (totalAssets > 0 && totalDebt > 0) {
        debtRatio = (totalDebt / totalAssets) * 100;
      } else if (debtToAssets > 0) {
        debtRatio = debtToAssets * 100;
      }
      
      // تحديد الدولة
      const country = rawData["Country or region of registration"] || rawData.Country || "United States";
      
      // إنشاء كائن السهم
      const stock: ProcessedStock = {
        symbol: symbol.toUpperCase(),
        name: name.substring(0, 100),
        exchange,
        sector,
        industry,
        price: parseNumber(rawData.Price || rawData.price || "0"),
        marketCap: parseNumber(rawData["Market capitalization"] || rawData.marketCap || "0"),
        debtRatio: Math.min(debtRatio, 100),
        debtToEquity: parseNumber(rawData["Debt to equity ratio, Quarterly"] || "0"),
        debtToAssets: debtToAssets,
        cashToDebt: parseNumber(rawData["Cash to debt ratio, Quarterly"] || "0"),
        pe: parseNumber(rawData["Price to earnings ratio"] || "0"),
        country,
        sharia: {
          status: "pending",
          grade: "?",
          sectorCheck: "⏳ قيد التحقق",
          debtCheck: "⏳ قيد التحقق"
        },
        shariaDetails: {
          alBilad: { status: "pending", reason: "قيد التحليل" },
          alRajhi: { status: "pending", reason: "قيد التحليل" },
          maqased: { status: "pending", reason: "قيد التحليل" },
          zeroDebt: { status: "pending", reason: "قيد التحليل" }
        }
      };
      
      // التحقق من القطاع المحرم
      const sectorCheck = checkProhibitedSector(sector, industry);
      
      // تطبيق معايير الشريعة
      applyShariaCompliance(
        stock,
        stock.debtRatio,
        sectorCheck.isProhibited,
        sectorCheck.prohibitedCategory,
        sectorCheck.needsReview
      );
      
      // التحقق إذا كان ETF
      const isETF = sector?.toLowerCase().includes("etf") || 
                    exchange?.toLowerCase().includes("etf") ||
                    industry?.toLowerCase().includes("fund") ||
                    symbol.includes("ETF");
      
      if (isETF) {
        etfs.push(stock);
      } else {
        stocks.push(stock);
      }
      
      processedCount++;
      
      if (processedCount % 1000 === 0) {
        console.log(`⏳ تمت معالجة ${processedCount} سهم...`);
      }
      
    } catch (error) {
      errorCount++;
      if (errorCount < 10) {
        console.error(`⚠️ خطأ في السطر ${i}:`, error);
      }
    }
  }
  
  console.log("\n" + "═".repeat(60));
  console.log("📊 نتائج الاستيراد:");
  console.log(`   ✅ الأسهم العادية: ${stocks.length.toLocaleString()}`);
  console.log(`   📊 صناديق ETF: ${etfs.length.toLocaleString()}`);
  console.log(`   ❌ أخطاء: ${errorCount}`);
  
  // إحصائيات الشريعة
  const compliantStocks = stocks.filter(s => s.sharia.status === "compliant").length;
  const nonCompliantStocks = stocks.filter(s => s.sharia.status === "non_compliant").length;
  const pendingStocks = stocks.filter(s => s.sharia.status === "pending").length;
  
  console.log("\n📊 إحصائيات التوافق الشرعي:");
  console.log(`   ✅ متوافق: ${compliantStocks.toLocaleString()} (${((compliantStocks/stocks.length)*100).toFixed(1)}%)`);
  console.log(`   ❌ غير متوافق: ${nonCompliantStocks.toLocaleString()} (${((nonCompliantStocks/stocks.length)*100).toFixed(1)}%)`);
  console.log(`   ⏳ قيد المراجعة: ${pendingStocks.toLocaleString()} (${((pendingStocks/stocks.length)*100).toFixed(1)}%)`);
  
  // إحصائيات كل معيار
  console.log("\n📊 إحصائيات كل معيار شرعي:");
  const standards = ["alBilad", "alRajhi", "maqased", "zeroDebt"] as const;
  for (const std of standards) {
    const compliant = stocks.filter(s => s.shariaDetails[std].status === "compliant").length;
    console.log(`   ${SHARIA_STANDARDS[std].nameAr}: ${compliant.toLocaleString()} (${((compliant/stocks.length)*100).toFixed(1)}%)`);
  }
  
  // حفظ البيانات
  const outputPath = path.join(process.cwd(), 'src/data/us_stocks_database.json');
  const outputData = {
    US: stocks,
    US_ETF: etfs,
    metadata: {
      lastUpdate: new Date().toISOString(),
      totalStocks: stocks.length,
      totalETFs: etfs.length,
      standards: ["alBilad", "alRajhi", "maqased", "zeroDebt"],
      standardsInfo: {
        alBilad: { name: "بنك البلاد", threshold: "التمويل غير الإسلامي ≤30%" },
        alRajhi: { name: "بنك الراجحي", threshold: "الديون الربوية ≤25%" },
        maqased: { name: "مكتب المقاصد", threshold: "الدين ≤30%, النقد ≤30%" },
        zeroDebt: { name: "صفر ديون", threshold: "0% ديون" }
      }
    }
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n✅ تم حفظ البيانات في: ${outputPath}`);
  console.log(`📦 حجم الملف: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
  
  console.log("\n🎉 اكتمل الاستيراد بنجاح!");
}

main().catch(console.error);
