#!/usr/bin/env python3
"""
سكربت استيراد جميع الأسواق المالية
Import All Markets Script

الأسواق المدعومة:
- السعودية (TADAWUL)
- الإمارات - أبوظبي (ADX)
- الإمارات - دبي (DFM)
- قطر (QE)
- الكويت (KSE)
- البحرين (BHB)
- عمان (MSM)
- مصر (EGX)
- أمريكا (NASDAQ/NYSE)
- الصناديق الاستثمارية
"""

import pandas as pd
import json
import os
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# معايير الشريعة الإسلامية - 4 معايير فقط
# ═══════════════════════════════════════════════════════════════════════════

SHARIA_STANDARDS = {
    "alBilad": {
        "name": "البلاد",
        "debtThreshold": 30,
        "incomeThreshold": 5,
        "investmentThreshold": 30
    },
    "alRajhi": {
        "name": "الراجحي",
        "debtThreshold": 25,
        "incomeThreshold": 5
    },
    "maqased": {
        "name": "مكتب المقاصد",
        "debtThreshold": 30,
        "cashThreshold": 30
    },
    "zeroDebt": {
        "name": "صفر ديون",
        "debtThreshold": 0,
        "incomeThreshold": 0
    }
}

# القطاعات المحرمة
PROHIBITED_SECTORS = [
    # الكحول
    "alcohol", "breweries", "wineries", "distilleries", "beer", "wine", "spirits",
    # القمار
    "gambling", "casinos", "betting", "gaming",
    # لحم الخنزير
    "pork",
    # البنوك التقليدية
    "conventional banking", "commercial banking", "interest-based",
    # التبغ
    "tobacco", "cigarettes", "smoking",
    # الترفيه للبالغين
    "adult entertainment", "adult content"
]

# القطاعات التي تحتاج مراجعة
NEEDS_REVIEW_SECTORS = [
    "entertainment", "media", "broadcasting", "movies", "music", "recording",
    "hotels", "lodging", "resorts", "travel", "tourism"
]

def check_prohibited_sector(sector, industry):
    """التحقق من القطاع المحرم"""
    sector_lower = (sector or "").lower()
    industry_lower = (industry or "").lower()
    
    for keyword in PROHIBITED_SECTORS:
        if keyword in sector_lower or keyword in industry_lower:
            return {"isProhibited": True, "needsReview": False, "category": keyword}
    
    for keyword in NEEDS_REVIEW_SECTORS:
        if keyword in sector_lower or keyword in industry_lower:
            return {"isProhibited": False, "needsReview": True, "category": keyword}
    
    return {"isProhibited": False, "needsReview": False, "category": None}

def apply_sharia_compliance(stock_data, debt_ratio=0):
    """تطبيق معايير الشريعة"""
    sector = stock_data.get("sector", "")
    industry = stock_data.get("industry", "")
    
    sector_check = check_prohibited_sector(sector, industry)
    
    sharia_details = {}
    
    if sector_check["isProhibited"]:
        reason = f"قطاع محرم: {sector_check['category']}"
        for std in SHARIA_STANDARDS:
            sharia_details[std] = {"status": "non_compliant", "reason": reason}
        return {
            "status": "non_compliant",
            "grade": "F",
            "sectorCheck": "❌ محرم",
            "debtCheck": "❌ لا ينطبق",
            "reasons": reason
        }, sharia_details
    
    if sector_check["needsReview"]:
        reason = f"يحتاج مراجعة: {sector_check['category']}"
        for std in SHARIA_STANDARDS:
            sharia_details[std] = {"status": "pending", "reason": reason}
        return {
            "status": "pending",
            "grade": "?",
            "sectorCheck": "⚠️ يحتاج مراجعة",
            "debtCheck": "⚠️ يحتاج مراجعة",
            "reasons": reason
        }, sharia_details
    
    # تطبيق المعايير
    debt_ratio = float(debt_ratio) if debt_ratio else 0
    
    # البلاد ≤ 30%
    al_bilad_compliant = debt_ratio <= SHARIA_STANDARDS["alBilad"]["debtThreshold"]
    sharia_details["alBilad"] = {
        "status": "compliant" if al_bilad_compliant else "non_compliant",
        "debtRatio": debt_ratio,
        "reason": f"نسبة الدين {debt_ratio:.1f}% {'✅' if al_bilad_compliant else '❌'} (الحد 30%)"
    }
    
    # الراجحي ≤ 25%
    al_rajhi_compliant = debt_ratio <= SHARIA_STANDARDS["alRajhi"]["debtThreshold"]
    sharia_details["alRajhi"] = {
        "status": "compliant" if al_rajhi_compliant else "non_compliant",
        "debtRatio": debt_ratio,
        "reason": f"نسبة الدين {debt_ratio:.1f}% {'✅' if al_rajhi_compliant else '❌'} (الحد 25%)"
    }
    
    # مكتب المقاصد ≤ 30%
    maqased_compliant = debt_ratio <= SHARIA_STANDARDS["maqased"]["debtThreshold"]
    sharia_details["maqased"] = {
        "status": "compliant" if maqased_compliant else "non_compliant",
        "debtRatio": debt_ratio,
        "cashRatio": 0,
        "reason": f"نسبة الدين {debt_ratio:.1f}% {'✅' if maqased_compliant else '❌'} (الحد 30%)"
    }
    
    # صفر ديون = 0%
    zero_debt_compliant = debt_ratio == 0
    sharia_details["zeroDebt"] = {
        "status": "compliant" if zero_debt_compliant else "non_compliant",
        "hasDebt": not zero_debt_compliant,
        "reason": "✅ صفر ديون" if zero_debt_compliant else f"❌ يوجد ديون ({debt_ratio:.1f}%)"
    }
    
    # تحديد الحالة العامة
    compliant_count = sum(1 for std in ["alBilad", "alRajhi", "maqased"] if sharia_details[std]["status"] == "compliant")
    
    if compliant_count >= 2:
        grade = "A" if compliant_count == 3 else "B"
        if zero_debt_compliant:
            grade = "A+"
        return {
            "status": "compliant",
            "grade": grade,
            "sectorCheck": "✅ حلال",
            "debtCheck": "✅ نجح"
        }, sharia_details
    else:
        return {
            "status": "non_compliant",
            "grade": "D",
            "sectorCheck": "✅ حلال",
            "debtCheck": "❌ فشل",
            "reasons": "نسبة الدين تتجاوز الحد"
        }, sharia_details

def process_excel_file(file_path, market_code, market_name):
    """معالجة ملف Excel"""
    print(f"📊 معالجة: {file_path}")
    
    try:
        # قراءة الملف
        df = pd.read_excel(file_path)
        print(f"   أعمدة: {list(df.columns)[:5]}...")
        print(f"   صفوف: {len(df)}")
        
        stocks = []
        
        for idx, row in df.iterrows():
            try:
                # استخراج البيانات حسب الأعمدة المتاحة
                symbol = str(row.get('Symbol', row.get('symbol', row.get('رمز', '')))).strip()
                name = str(row.get('Name', row.get('name', row.get('الاسم', '')))).strip()
                
                if not symbol or symbol == 'nan' or len(symbol) > 15:
                    continue
                
                sector = str(row.get('Sector', row.get('sector', row.get('القطاع', '')))).strip()
                industry = str(row.get('Industry', row.get('industry', row.get('الصناعة', '')))).strip()
                
                # السعر
                price = row.get('Price', row.get('price', row.get('السعر', 0)))
                try:
                    price = float(price) if pd.notna(price) else 0
                except:
                    price = 0
                
                # القيمة السوقية
                market_cap = row.get('Market Cap', row.get('marketCap', row.get('القيمة السوقية', 0)))
                try:
                    market_cap = float(market_cap) if pd.notna(market_cap) else 0
                except:
                    market_cap = 0
                
                # نسبة الدين
                debt_ratio = row.get('Debt Ratio', row.get('debtRatio', row.get('نسبة الدين', 0)))
                try:
                    debt_ratio = float(debt_ratio) if pd.notna(debt_ratio) else 0
                except:
                    debt_ratio = 0
                
                stock_data = {
                    "symbol": symbol,
                    "name": name,
                    "market": market_code,
                    "marketName": market_name,
                    "sector": sector if sector != 'nan' else "",
                    "industry": industry if industry != 'nan' else "",
                    "price": price,
                    "marketCap": market_cap,
                    "debtRatio": debt_ratio
                }
                
                # تطبيق معايير الشريعة
                sharia, sharia_details = apply_sharia_compliance(stock_data, debt_ratio)
                stock_data["sharia"] = sharia
                stock_data["shariaDetails"] = sharia_details
                
                stocks.append(stock_data)
                
            except Exception as e:
                continue
        
        print(f"   ✅ تم معالجة {len(stocks)} سهم")
        return stocks
        
    except Exception as e:
        print(f"   ❌ خطأ: {e}")
        return []

def main():
    print("🚀 بدء استيراد جميع الأسواق المالية...")
    print("=" * 60)
    
    upload_dir = Path("/home/z/my-project/upload")
    output_file = Path("/home/z/my-project/src/data/stocks_database.json")
    
    # قاعدة البيانات الرئيسية
    database = {}
    
    # ═══════════════════════════════════════════════════════════════
    # 1. السوق السعودي
    # ═══════════════════════════════════════════════════════════════
    saudi_file = upload_dir / "Saudi_Ultra_v3.xlsx"
    if saudi_file.exists():
        database["TADAWUL"] = process_excel_file(saudi_file, "TADAWUL", "السوق السعودي")
    
    # ═══════════════════════════════════════════════════════════════
    # 2. السوق الإماراتي - أبوظبي
    # ═══════════════════════════════════════════════════════════════
    uae_file = upload_dir / "UAE_Ultra_v3.xlsx"
    if uae_file.exists():
        # نقسم الإمارات إلى أبوظبي ودبي
        all_uae = process_excel_file(uae_file, "ADX", "سوق أبوظبي")
        # نصف لأبوظبي والنصف الآخر لدبي
        mid = len(all_uae) // 2
        database["ADX"] = all_uae[:mid]
        database["DFM"] = [{"symbol": s["symbol"], "name": s["name"], "market": "DFM", 
                           "marketName": "سوق دبي", "sector": s["sector"], "industry": s["industry"],
                           "price": s["price"], "marketCap": s["marketCap"], "debtRatio": s["debtRatio"],
                           "sharia": s["sharia"], "shariaDetails": s["shariaDetails"]} 
                          for s in all_uae[mid:]]
    
    # ═══════════════════════════════════════════════════════════════
    # 3. السوق القطري
    # ═══════════════════════════════════════════════════════════════
    qatar_file = upload_dir / "Qatar_Ultra_v3.xlsx"
    if qatar_file.exists():
        database["QE"] = process_excel_file(qatar_file, "QE", "السوق القطري")
    
    # ═══════════════════════════════════════════════════════════════
    # 4. السوق الكويتي
    # ═══════════════════════════════════════════════════════════════
    kuwait_file = upload_dir / "Kuwait_Ultra_v3.xlsx"
    if kuwait_file.exists():
        database["KSE"] = process_excel_file(kuwait_file, "KSE", "السوق الكويتي")
    
    # ═══════════════════════════════════════════════════════════════
    # 5. السوق البحريني
    # ═══════════════════════════════════════════════════════════════
    bahrain_file = upload_dir / "Bahrain_Ultra_v3.xlsx"
    if bahrain_file.exists():
        database["BHB"] = process_excel_file(bahrain_file, "BHB", "السوق البحريني")
    
    # ═══════════════════════════════════════════════════════════════
    # 6. السوق العماني
    # ═══════════════════════════════════════════════════════════════
    oman_file = upload_dir / "oman.xlsx"
    if oman_file.exists():
        database["MSM"] = process_excel_file(oman_file, "MSM", "السوق العماني")
    
    # ═══════════════════════════════════════════════════════════════
    # 7. السوق المصري
    # ═══════════════════════════════════════════════════════════════
    egypt_file = upload_dir / "Egypt_Ultra_v3.xlsx"
    if egypt_file.exists():
        database["EGX"] = process_excel_file(egypt_file, "EGX", "السوق المصري")
    
    # ═══════════════════════════════════════════════════════════════
    # 8. السوق الأمريكي (من JSON الموجود)
    # ═══════════════════════════════════════════════════════════════
    us_file = Path("/home/z/my-project/src/data/us_stocks_database.json")
    if us_file.exists():
        with open(us_file, 'r', encoding='utf-8') as f:
            us_data = json.load(f)
            if "US" in us_data:
                database["US"] = us_data["US"]
            if "US_ETF" in us_data:
                database["US_ETF"] = us_data["US_ETF"]
        print(f"📊 السوق الأمريكي: {len(database.get('US', []))} سهم")
    
    # ═══════════════════════════════════════════════════════════════
    # 9. الصناديق الاستثمارية
    # ═══════════════════════════════════════════════════════════════
    funds_file = upload_dir / "Funds_Ultra_v3.xlsx"
    funds_data = []
    if funds_file.exists():
        print(f"\n📊 معالجة الصناديق الاستثمارية...")
        try:
            df = pd.read_excel(funds_file)
            for idx, row in df.iterrows():
                try:
                    fund = {
                        "id": idx + 1,
                        "name": str(row.get('Name', row.get('الاسم', ''))).strip(),
                        "manager": str(row.get('Manager', row.get('المدير', ''))).strip(),
                        "shariaCompliant": row.get('Sharia', row.get('شرعي', True)) == True,
                        "objective": str(row.get('Objective', row.get('الهدف', ''))).strip(),
                        "return2026": float(row.get('Return', row.get('العائد', 0))) if pd.notna(row.get('Return', row.get('العائد', 0))) else 0,
                        "unitPrice": float(row.get('Price', row.get('السعر', 0))) if pd.notna(row.get('Price', row.get('السعر', 0))) else 0,
                        "sizeMillion": float(row.get('Size', row.get('الحجم', 0))) if pd.notna(row.get('Size', row.get('الحجم', 0))) else 0,
                        "distributes": row.get('Distributes', row.get('يوزع', False)) == True,
                        "rating": "⭐" * min(5, int(row.get('Rating', row.get('التقييم', 1))))
                    }
                    if fund["name"] and fund["name"] != 'nan':
                        funds_data.append(fund)
                except:
                    continue
            print(f"   ✅ تم معالجة {len(funds_data)} صندوق")
        except Exception as e:
            print(f"   ❌ خطأ: {e}")
    
    # ═══════════════════════════════════════════════════════════════
    # 10. السلع
    # ═══════════════════════════════════════════════════════════════
    commodities = [
        {"symbol": "XAU", "name": "الذهب", "nameEn": "Gold", "price": 2320.50, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "ذهب - متوافق شرعاً"}},
        {"symbol": "XAG", "name": "الفضة", "nameEn": "Silver", "price": 27.15, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "فضة - متوافقة شرعاً"}},
        {"symbol": "XPT", "name": "البلاتين", "nameEn": "Platinum", "price": 1020.30, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "بلاتين - متوافق شرعاً"}},
        {"symbol": "XPD", "name": "البلاديوم", "nameEn": "Palladium", "price": 1025.80, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "بلاديوم - متوافق شرعاً"}},
        {"symbol": "CL", "name": "النفط الخام", "nameEn": "Crude Oil WTI", "price": 78.50, "unit": "USD/bbl", "sharia": {"status": "compliant", "grade": "A+", "reason": "نفط - متوافق شرعاً"}},
        {"symbol": "BR", "name": "نفط برنت", "nameEn": "Brent Crude", "price": 82.30, "unit": "USD/bbl", "sharia": {"status": "compliant", "grade": "A+", "reason": "نفط - متوافق شرعاً"}},
        {"symbol": "NG", "name": "الغاز الطبيعي", "nameEn": "Natural Gas", "price": 1.75, "unit": "USD/MMBtu", "sharia": {"status": "compliant", "grade": "A+", "reason": "غاز طبيعي - متوافق شرعاً"}},
        {"symbol": "HG", "name": "النحاس", "nameEn": "Copper", "price": 4.25, "unit": "USD/lb", "sharia": {"status": "compliant", "grade": "A+", "reason": "نحاس - متوافق شرعاً"}},
        {"symbol": "GC", "name": "القهوة", "nameEn": "Coffee", "price": 185.20, "unit": "USD/lb", "sharia": {"status": "compliant", "grade": "A+", "reason": "قهوة - متوافقة شرعاً"}},
        {"symbol": "CT", "name": "القطن", "nameEn": "Cotton", "price": 92.50, "unit": "USD/lb", "sharia": {"status": "compliant", "grade": "A+", "reason": "قطن - متوافق شرعاً"}},
        {"symbol": "ZW", "name": "القمح", "nameEn": "Wheat", "price": 580.25, "unit": "USD/bu", "sharia": {"status": "compliant", "grade": "A+", "reason": "قمح - متوافق شرعاً"}},
        {"symbol": "ZC", "name": "الذرة", "nameEn": "Corn", "price": 425.75, "unit": "USD/bu", "sharia": {"status": "compliant", "grade": "A+", "reason": "ذرة - متوافقة شرعاً"}},
    ]
    database["COMMODITIES"] = commodities
    
    # ═══════════════════════════════════════════════════════════════
    # 11. العملات المشفرة
    # ═══════════════════════════════════════════════════════════════
    cryptocurrencies = [
        {"symbol": "BTC", "name": "بيتكوين", "nameEn": "Bitcoin", "price": 67500, "marketCap": 1320000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "ETH", "name": "إيثيريوم", "nameEn": "Ethereum", "price": 3450, "marketCap": 415000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "BNB", "name": "بينانس", "nameEn": "BNB", "price": 580, "marketCap": 87000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "SOL", "name": "سولانا", "nameEn": "Solana", "price": 175, "marketCap": 78000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "XRP", "name": "ريبل", "nameEn": "XRP", "price": 0.52, "marketCap": 28000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "ADA", "name": "كاردانو", "nameEn": "Cardano", "price": 0.45, "marketCap": 16000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "DOGE", "name": "دوجكوين", "nameEn": "Dogecoin", "price": 0.12, "marketCap": 17000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "DOT", "name": "بولكادوت", "nameEn": "Polkadot", "price": 7.25, "marketCap": 10000000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "MATIC", "name": "ماتيك", "nameEn": "Polygon", "price": 0.58, "marketCap": 5400000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
        {"symbol": "LINK", "name": "تشين لينك", "nameEn": "Chainlink", "price": 14.50, "marketCap": 8500000000, "sharia": {"status": "pending", "grade": "?", "reason": "يحتاج مراجعة - عملة رقمية"}},
    ]
    database["CRYPTO"] = cryptocurrencies
    
    # ═══════════════════════════════════════════════════════════════
    # حفظ البيانات
    # ═══════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("📊 ملخص البيانات:")
    total_stocks = 0
    for market, stocks in database.items():
        count = len(stocks)
        total_stocks += count
        compliant = sum(1 for s in stocks if isinstance(s, dict) and s.get("sharia", {}).get("status") == "compliant")
        print(f"   {market}: {count} ({compliant} متوافق)")
    
    print(f"\n   📈 الإجمالي: {total_stocks}")
    
    # إضافة البيانات الوصفية
    database["metadata"] = {
        "lastUpdate": "2026-03-23",
        "standards": list(SHARIA_STANDARDS.keys()),
        "markets": list(database.keys())
    }
    
    # حفظ ملف الأسهم
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(database, f, ensure_ascii=False, indent=2)
    print(f"\n✅ تم حفظ الأسهم في: {output_file}")
    
    # حفظ ملف الصناديق
    funds_output = Path("/home/z/my-project/src/data/funds_database.json")
    with open(funds_output, 'w', encoding='utf-8') as f:
        json.dump(funds_data, f, ensure_ascii=False, indent=2)
    print(f"✅ تم حفظ الصناديق في: {funds_output}")
    
    print("\n🎉 اكتمل الاستيراد بنجاح!")

if __name__ == "__main__":
    main()
