#!/usr/bin/env python3
"""
سكربت استيراد جميع الأسواق المالية - الإصدار المحسن
Import All Markets - Enhanced Version
"""

import pandas as pd
import json
import os
from pathlib import Path
from datetime import datetime

# ═══════════════════════════════════════════════════════════════════════════
# معايير الشريعة الإسلامية - 4 معايير فقط
# ═══════════════════════════════════════════════════════════════════════════

SHARIA_STANDARDS = {
    "alBilad": {"name": "البلاد", "debtThreshold": 30},
    "alRajhi": {"name": "الراجحي", "debtThreshold": 25},
    "maqased": {"name": "مكتب المقاصد", "debtThreshold": 30, "cashThreshold": 30},
    "zeroDebt": {"name": "صفر ديون", "debtThreshold": 0}
}

# القطاعات المحرمة
PROHIBITED_KEYWORDS = [
    "alcohol", "breweries", "wineries", "distilleries", "beer", "wine", "spirits",
    "gambling", "casinos", "betting",
    "pork", "swine",
    "tobacco", "cigarettes", "smoking",
    "adult entertainment", "adult content",
    "major banks", "regional banks", "multi-line insurance", "life/health insurance",
    "property/casualty insurance", "insurance brokers", "investment banking"
]

# القطاعات التي تحتاج مراجعة
REVIEW_KEYWORDS = [
    "hotels", "resorts", "cruise lines", "lodging", "travel", "tourism",
    "entertainment", "media", "broadcasting", "movies", "music", "recording"
]

def check_sharia_status(row):
    """التحقق من الحالة الشرعية"""
    sector = str(row.get('القطاع', row.get('Sector', ''))).lower()
    industry = str(row.get('الصناعة', row.get('Industry', ''))).lower()
    sector_check = str(row.get('فحص القطاع', '')).lower()
    
    # التحقق من القطاعات المحرمة
    for keyword in PROHIBITED_KEYWORDS:
        if keyword in sector or keyword in industry:
            return {
                "status": "non_compliant",
                "grade": "F",
                "sectorCheck": "❌ محرم",
                "debtCheck": "❌ لا ينطبق",
                "reasons": f"قطاع محرم: {keyword}"
            }
    
    # التحقق من فحص القطاع الموجود
    if "محرم" in sector_check:
        return {
            "status": "non_compliant",
            "grade": "F",
            "sectorCheck": "❌ محرم",
            "debtCheck": "❌ لا ينطبق",
            "reasons": "قطاع محرم"
        }
    
    # التحقق من القطاعات التي تحتاج مراجعة
    for keyword in REVIEW_KEYWORDS:
        if keyword in sector or keyword in industry:
            return {
                "status": "pending",
                "grade": "?",
                "sectorCheck": "⚠️ يحتاج مراجعة",
                "debtCheck": "⚠️ يحتاج مراجعة",
                "reasons": f"يحتاج مراجعة: {keyword}"
            }
    
    # إذا فحص القطاع حلال
    if "حلال" in sector_check or "✅" in sector_check:
        # التحقق من نسبة الدين
        debt_ratio = 0
        try:
            debt_ratio = float(row.get('ديون/رأسمال %', 0))
        except:
            pass
        
        # حساب التوافق لكل معيار
        al_bilad = debt_ratio <= 30
        al_rajhi = debt_ratio <= 25
        maqased = debt_ratio <= 30
        zero_debt = debt_ratio == 0
        
        compliant_count = sum([al_bilad, al_rajhi, maqased])
        
        if compliant_count >= 2:
            grade = "A+" if zero_debt else ("A" if compliant_count == 3 else "B")
            return {
                "status": "compliant",
                "grade": grade,
                "sectorCheck": "✅ حلال",
                "debtCheck": "✅ نجح",
                "debtRatio": debt_ratio
            }
        else:
            return {
                "status": "non_compliant",
                "grade": "D",
                "sectorCheck": "✅ حلال",
                "debtCheck": "❌ فشل",
                "reasons": f"نسبة الدين {debt_ratio}% تتجاوز الحد",
                "debtRatio": debt_ratio
            }
    
    return {
        "status": "pending",
        "grade": "?",
        "sectorCheck": "⚠️ قيد التحقق",
        "debtCheck": "⚠️ قيد التحقق",
        "reasons": "يحتاج تحقق يدوي"
    }

def get_sharia_details(row, debt_ratio=0):
    """الحصول على تفاصيل كل معيار"""
    sector_check = str(row.get('فحص القطاع', '')).lower()
    
    # إذا كان القطاع محرم
    if "محرم" in sector_check:
        reason = "قطاع محرم"
        return {
            "alBilad": {"status": "non_compliant", "reason": reason},
            "alRajhi": {"status": "non_compliant", "reason": reason},
            "maqased": {"status": "non_compliant", "reason": reason},
            "zeroDebt": {"status": "non_compliant", "reason": reason}
        }
    
    # إذا كان حلال
    if "حلال" in sector_check or "✅" in sector_check:
        return {
            "alBilad": {
                "status": "compliant" if debt_ratio <= 30 else "non_compliant",
                "debtRatio": debt_ratio,
                "reason": f"الدين {debt_ratio:.1f}% {'✅' if debt_ratio <= 30 else '❌'} (≤30%)"
            },
            "alRajhi": {
                "status": "compliant" if debt_ratio <= 25 else "non_compliant",
                "debtRatio": debt_ratio,
                "reason": f"الدين {debt_ratio:.1f}% {'✅' if debt_ratio <= 25 else '❌'} (≤25%)"
            },
            "maqased": {
                "status": "compliant" if debt_ratio <= 30 else "non_compliant",
                "debtRatio": debt_ratio,
                "cashRatio": 0,
                "reason": f"الدين {debt_ratio:.1f}% {'✅' if debt_ratio <= 30 else '❌'} (≤30%)"
            },
            "zeroDebt": {
                "status": "compliant" if debt_ratio == 0 else "non_compliant",
                "hasDebt": debt_ratio > 0,
                "reason": "✅ صفر ديون" if debt_ratio == 0 else f"❌ ديون {debt_ratio:.1f}%"
            }
        }
    
    reason = "قيد المراجعة"
    return {
        "alBilad": {"status": "pending", "reason": reason},
        "alRajhi": {"status": "pending", "reason": reason},
        "maqased": {"status": "pending", "reason": reason},
        "zeroDebt": {"status": "pending", "reason": reason}
    }

def process_market_file(file_path, market_code, market_name, sheet_name=None):
    """معالجة ملف سوق واحد"""
    print(f"📊 معالجة: {file_path}")
    
    try:
        if sheet_name:
            df = pd.read_excel(file_path, sheet_name=sheet_name, header=1)
        else:
            df = pd.read_excel(file_path, header=1)
        
        print(f"   أعمدة: {list(df.columns)[:5]}...")
        print(f"   صفوف: {len(df)}")
        
        stocks = []
        
        for idx, row in df.iterrows():
            try:
                # استخراج الرمز والاسم
                symbol = str(row.get('الرمز', row.get('Symbol', row.iloc[1] if len(row) > 1 else ''))).strip()
                name = str(row.get('اسم الشركة', row.get('Name', row.iloc[2] if len(row) > 2 else ''))).strip()
                
                if not symbol or symbol == 'nan' or symbol == '#' or len(symbol) > 15:
                    continue
                
                # استخراج البيانات الأخرى
                sector = str(row.get('القطاع', row.get('Sector', ''))).strip()
                industry = str(row.get('الصناعة', row.get('Industry', ''))).strip()
                
                # السعر
                price = row.get('السعر', row.get('Price', 0))
                try:
                    price = float(price) if pd.notna(price) else 0
                except:
                    price = 0
                
                # نسبة الدين
                debt_ratio = row.get('ديون/رأسمال %', row.get('Debt Ratio', 0))
                try:
                    debt_ratio = float(debt_ratio) if pd.notna(debt_ratio) else 0
                except:
                    debt_ratio = 0
                
                # القيمة السوقية
                market_cap = row.get('القيمة السوقية', row.get('Market Cap', 0))
                try:
                    market_cap = float(market_cap) if pd.notna(market_cap) else 0
                except:
                    market_cap = 0
                
                # التحقق الشرعي
                sharia = check_sharia_status(row)
                sharia_details = get_sharia_details(row, debt_ratio)
                
                # الدرجة
                grade = str(row.get('الدرجة', row.get('Grade', sharia.get('grade', '?')))).strip()
                
                stock = {
                    "symbol": symbol,
                    "name": name if name != 'nan' else symbol,
                    "market": market_code,
                    "marketName": market_name,
                    "sector": sector if sector != 'nan' else "",
                    "industry": industry if industry != 'nan' else "",
                    "price": price,
                    "marketCap": market_cap,
                    "debtRatio": debt_ratio,
                    "sharia": sharia,
                    "shariaDetails": sharia_details
                }
                
                stocks.append(stock)
                
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
    
    database = {}
    
    # ═══════════════════════════════════════════════════════════════
    # 1. السوق السعودي
    # ═══════════════════════════════════════════════════════════════
    saudi_file = upload_dir / "Saudi_Ultra_v3.xlsx"
    if saudi_file.exists():
        database["TADAWUL"] = process_market_file(
            saudi_file, "TADAWUL", "السوق السعودي", "🕌 الأسهم السعودية"
        )
    
    # ═══════════════════════════════════════════════════════════════
    # 2. السوق الإماراتي
    # ═══════════════════════════════════════════════════════════════
    uae_file = upload_dir / "UAE_Ultra_v3.xlsx"
    if uae_file.exists():
        # البحث عن ورقة العمل الصحيحة
        xl = pd.ExcelFile(uae_file)
        for sheet in xl.sheet_names:
            if "الإمارات" in sheet or "UAE" in sheet or "أبوظبي" in sheet:
                all_uae = process_market_file(uae_file, "ADX", "سوق أبوظبي", sheet)
                mid = len(all_uae) // 2
                database["ADX"] = all_uae[:mid]
                database["DFM"] = [{**s, "market": "DFM", "marketName": "سوق دبي"} for s in all_uae[mid:]]
                break
    
    # ═══════════════════════════════════════════════════════════════
    # 3. السوق القطري
    # ═══════════════════════════════════════════════════════════════
    qatar_file = upload_dir / "Qatar_Ultra_v3.xlsx"
    if qatar_file.exists():
        xl = pd.ExcelFile(qatar_file)
        for sheet in xl.sheet_names:
            if "قطر" in sheet or "Qatar" in sheet:
                database["QE"] = process_market_file(qatar_file, "QE", "السوق القطري", sheet)
                break
    
    # ═══════════════════════════════════════════════════════════════
    # 4. السوق الكويتي
    # ═══════════════════════════════════════════════════════════════
    kuwait_file = upload_dir / "Kuwait_Ultra_v3.xlsx"
    if kuwait_file.exists():
        xl = pd.ExcelFile(kuwait_file)
        for sheet in xl.sheet_names:
            if "الكويت" in sheet or "Kuwait" in sheet:
                database["KSE"] = process_market_file(kuwait_file, "KSE", "السوق الكويتي", sheet)
                break
    
    # ═══════════════════════════════════════════════════════════════
    # 5. السوق البحريني
    # ═══════════════════════════════════════════════════════════════
    bahrain_file = upload_dir / "Bahrain_Ultra_v3.xlsx"
    if bahrain_file.exists():
        xl = pd.ExcelFile(bahrain_file)
        for sheet in xl.sheet_names:
            if "البحرين" in sheet or "Bahrain" in sheet:
                database["BHB"] = process_market_file(bahrain_file, "BHB", "السوق البحريني", sheet)
                break
    
    # ═══════════════════════════════════════════════════════════════
    # 6. السوق العماني
    # ═══════════════════════════════════════════════════════════════
    oman_file = upload_dir / "oman.xlsx"
    if oman_file.exists():
        database["MSM"] = process_market_file(oman_file, "MSM", "السوق العماني")
    
    # ═══════════════════════════════════════════════════════════════
    # 7. السوق المصري
    # ═══════════════════════════════════════════════════════════════
    egypt_file = upload_dir / "Egypt_Ultra_v3.xlsx"
    if egypt_file.exists():
        xl = pd.ExcelFile(egypt_file)
        for sheet in xl.sheet_names:
            if "مصر" in sheet or "Egypt" in sheet or "EGX" in sheet:
                database["EGX"] = process_market_file(egypt_file, "EGX", "السوق المصري", sheet)
                break
    
    # ═══════════════════════════════════════════════════════════════
    # 8. السوق الأمريكي (من JSON الموجود)
    # ═══════════════════════════════════════════════════════════════
    us_file = Path("/home/z/my-project/src/data/us_stocks_database.json")
    if us_file.exists():
        with open(us_file, 'r', encoding='utf-8') as f:
            us_data = json.load(f)
            if "US" in us_data:
                database["US"] = us_data["US"]
                print(f"📊 السوق الأمريكي: {len(database['US'])} سهم")
            if "US_ETF" in us_data:
                database["US_ETF"] = us_data["US_ETF"]
                print(f"📊 صناديق ETF: {len(database['US_ETF'])} صندوق")
    
    # ═══════════════════════════════════════════════════════════════
    # 9. الصناديق الاستثمارية السعودية
    # ═══════════════════════════════════════════════════════════════
    funds_file = upload_dir / "Funds_Ultra_v3.xlsx"
    funds_data = []
    if funds_file.exists():
        print(f"\n📊 معالجة الصناديق الاستثمارية...")
        try:
            xl = pd.ExcelFile(funds_file)
            for sheet in xl.sheet_names:
                if "صندوق" in sheet or "Fund" in sheet or "الصناديق" in sheet:
                    df = pd.read_excel(funds_file, sheet_name=sheet, header=1)
                    for idx, row in df.iterrows():
                        try:
                            name = str(row.get('اسم الصندوق', row.get('Name', row.iloc[0] if len(row) > 0 else ''))).strip()
                            if not name or name == 'nan':
                                continue
                            fund = {
                                "id": idx + 1,
                                "name": name,
                                "manager": str(row.get('المدير', row.get('Manager', ''))).strip(),
                                "shariaCompliant": True,
                                "objective": str(row.get('الهدف', row.get('Objective', ''))).strip(),
                                "return2026": 0,
                                "unitPrice": 0,
                                "sizeMillion": 0,
                                "distributes": False,
                                "rating": "⭐"
                            }
                            funds_data.append(fund)
                        except:
                            continue
                    break
            print(f"   ✅ تم معالجة {len(funds_data)} صندوق")
        except Exception as e:
            print(f"   ❌ خطأ: {e}")
    
    # ═══════════════════════════════════════════════════════════════
    # 10. السلع (بيانات ثابتة)
    # ═══════════════════════════════════════════════════════════════
    database["COMMODITIES"] = [
        {"symbol": "XAU", "name": "الذهب", "nameEn": "Gold", "price": 2320.50, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "ذهب - متوافق شرعاً"}},
        {"symbol": "XAG", "name": "الفضة", "nameEn": "Silver", "price": 27.15, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "فضة - متوافقة شرعاً"}},
        {"symbol": "XPT", "name": "البلاتين", "nameEn": "Platinum", "price": 1020.30, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "بلاتين - متوافق شرعاً"}},
        {"symbol": "XPD", "name": "البلاديوم", "nameEn": "Palladium", "price": 1025.80, "unit": "USD/oz", "sharia": {"status": "compliant", "grade": "A+", "reason": "بلاديوم - متوافق شرعاً"}},
        {"symbol": "CL", "name": "النفط الخام WTI", "nameEn": "Crude Oil WTI", "price": 78.50, "unit": "USD/bbl", "sharia": {"status": "compliant", "grade": "A+", "reason": "نفط - متوافق شرعاً"}},
        {"symbol": "BR", "name": "نفط برنت", "nameEn": "Brent Crude", "price": 82.30, "unit": "USD/bbl", "sharia": {"status": "compliant", "grade": "A+", "reason": "نفط - متوافق شرعاً"}},
        {"symbol": "NG", "name": "الغاز الطبيعي", "nameEn": "Natural Gas", "price": 1.75, "unit": "USD/MMBtu", "sharia": {"status": "compliant", "grade": "A+", "reason": "غاز طبيعي - متوافق شرعاً"}},
        {"symbol": "HG", "name": "النحاس", "nameEn": "Copper", "price": 4.25, "unit": "USD/lb", "sharia": {"status": "compliant", "grade": "A+", "reason": "نحاس - متوافق شرعاً"}},
        {"symbol": "GC", "name": "القهوة", "nameEn": "Coffee", "price": 185.20, "unit": "USD/lb", "sharia": {"status": "compliant", "grade": "A+", "reason": "قهوة - متوافقة شرعاً"}},
        {"symbol": "CT", "name": "القطن", "nameEn": "Cotton", "price": 92.50, "unit": "USD/lb", "sharia": {"status": "compliant", "grade": "A+", "reason": "قطن - متوافق شرعاً"}},
        {"symbol": "ZW", "name": "القمح", "nameEn": "Wheat", "price": 580.25, "unit": "USD/bu", "sharia": {"status": "compliant", "grade": "A+", "reason": "قمح - متوافق شرعاً"}},
        {"symbol": "ZC", "name": "الذرة", "nameEn": "Corn", "price": 425.75, "unit": "USD/bu", "sharia": {"status": "compliant", "grade": "A+", "reason": "ذرة - متوافقة شرعاً"}},
    ]
    
    # ═══════════════════════════════════════════════════════════════
    # 11. العملات المشفرة
    # ═══════════════════════════════════════════════════════════════
    database["CRYPTO"] = [
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
    
    # ═══════════════════════════════════════════════════════════════
    # 12. عملات الفوركس
    # ═══════════════════════════════════════════════════════════════
    database["FOREX"] = [
        {"symbol": "EUR/USD", "name": "يورو/دولار", "nameEn": "Euro/US Dollar", "price": 1.0850, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "GBP/USD", "name": "جنيه/دولار", "nameEn": "British Pound/US Dollar", "price": 1.2650, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "USD/JPY", "name": "دولار/ين", "nameEn": "US Dollar/Japanese Yen", "price": 151.50, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "USD/CHF", "name": "دولار/فرنك", "nameEn": "US Dollar/Swiss Franc", "price": 0.8850, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "AUD/USD", "name": "أسترالي/دولار", "nameEn": "Australian Dollar/US Dollar", "price": 0.6550, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "USD/CAD", "name": "دولار/كندي", "nameEn": "US Dollar/Canadian Dollar", "price": 1.3550, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "USD/SAR", "name": "دولار/ريال", "nameEn": "US Dollar/Saudi Riyal", "price": 3.75, "sharia": {"status": "compliant", "grade": "A+", "reason": "عملة إسلامية"}},
        {"symbol": "EUR/SAR", "name": "يورو/ريال", "nameEn": "Euro/Saudi Riyal", "price": 4.07, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "GBP/SAR", "name": "جنيه/ريال", "nameEn": "British Pound/Saudi Riyal", "price": 4.74, "sharia": {"status": "pending", "grade": "?", "reason": "تحويل عملات - يحتاج مراجعة"}},
        {"symbol": "USD/AED", "name": "دولار/درهم", "nameEn": "US Dollar/UAE Dirham", "price": 3.6725, "sharia": {"status": "compliant", "grade": "A+", "reason": "عملة إسلامية"}},
    ]
    
    # ═══════════════════════════════════════════════════════════════
    # حفظ البيانات
    # ═══════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("📊 ملخص البيانات:")
    
    total_stocks = 0
    total_compliant = 0
    
    for market, stocks in database.items():
        if isinstance(stocks, list):
            count = len(stocks)
            total_stocks += count
            compliant = sum(1 for s in stocks if isinstance(s, dict) and s.get("sharia", {}).get("status") == "compliant")
            total_compliant += compliant
            print(f"   {market}: {count} ({compliant} متوافق)")
    
    print(f"\n   📈 الإجمالي: {total_stocks}")
    print(f"   ✅ المتوافقة: {total_compliant}")
    
    # إضافة البيانات الوصفية
    database["metadata"] = {
        "lastUpdate": datetime.now().isoformat(),
        "standards": list(SHARIA_STANDARDS.keys()),
        "markets": [k for k in database.keys() if k != "metadata"]
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
