'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Thermometer,
  Grid3X3,
  List,
  Info,
  X,
  BarChart3,
  Star,
  ArrowUpDown,
  DollarSign,
  Activity,
  PieChart,
  Search,
  RefreshCw,
  ExternalLink,
  Bell,
  LayoutGrid,
  Filter,
  ChevronRight,
  Maximize2,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StockData {
  symbol: string;
  name: string;
  change: number;
  price: number;
  volume?: number;
}

interface SectorData {
  sector: string;
  stocks: StockData[];
}

// دالة توليد القيمة السوقية (احتياطية)
function estimateMarketCap(price: number): string {
  const cap = price * 1e9;
  if (cap >= 1e12) return (cap / 1e12).toFixed(2) + ' تريليون';
  if (cap >= 1e9) return (cap / 1e9).toFixed(2) + ' مليار';
  return (cap / 1e6).toFixed(2) + ' مليون';
}

// خريطة تحويل رموز الخريطة إلى رموز ياهو فاينس
const YAHOO_SYMBOL_MAP: Record<string, Record<string, string>> = {
  tasi: {
    '1120': '1120.SR', '1180': '1180.SR', '1060': '1060.SR', '1050': '1050.SR',
    '4260': '4260.SR', '4002': '4002.SR', '1030': '1030.SR', '1010': '1010.SR',
    '4050': '4050.SR', '4190': '4190.SR',
    '2222': '2222.SR', '2002': '2002.SR', '2290': '2290.SR', '2310': '2310.SR',
    '2001': '2001.SR', '2170': '2170.SR', '2060': '2060.SR', '2280': '2280.SR',
    '2210': '2210.SR', '2250': '2250.SR',
    '7010': '7010.SR', '7020': '7020.SR', '7030': '7030.SR', '7040': '7040.SR',
    '7050': '7050.SR', '6001': '6001.SR', '7201': '7201.SR', '4070': '4070.SR',
    '4071': '4071.SR', '7200': '7200.SR',
    '4150': '4150.SR', '4320': '4320.SR', '4300': '4300.SR', '4310': '4310.SR',
    '4020': '4020.SR', '4250': '4250.SR', '4100': '4100.SR', '4230': '4230.SR',
    '4240': '4240.SR',
    '4001': '4001.SR', '4003': '4003.SR', '4004': '4004.SR', '4005': '4005.SR',
    '4006': '4006.SR', '4007': '4007.SR', '4160': '4160.SR', '4161': '4161.SR',
    '4162': '4162.SR', '4163': '4163.SR',
    '2010': '2010.SR', '2020': '2020.SR', '2030': '2030.SR', '2040': '2040.SR',
    '2050': '2050.SR', '2070': '2070.SR', '2080': '2080.SR', '2090': '2090.SR',
    '2100': '2100.SR', '2110': '2110.SR',
    '8010': '8010.SR', '8020': '8020.SR', '8030': '8030.SR', '8040': '8040.SR',
    '8050': '8050.SR', '8060': '8060.SR', '8070': '8070.SR', '8080': '8080.SR',
    '8100': '8100.SR', '8110': '8110.SR',
    '4013': '4013.SR', '4014': '4014.SR', '4015': '4015.SR', '4016': '4016.SR',
    '4017': '4017.SR', '4009': '4009.SR',
    '5110': '5110.SR', '5120': '5120.SR', '5130': '5130.SR', '5140': '5140.SR',
    '5150': '5150.SR', '5160': '5160.SR', '5170': '5170.SR', '5180': '5180.SR',
    '5190': '5190.SR', '5200': '5200.SR',
    '4030': '4030.SR', '4031': '4031.SR', '4040': '4040.SR', '4060': '4060.SR',
    '4080': '4080.SR', '4081': '4081.SR', '4082': '4082.SR', '4083': '4083.SR',
    '4084': '4084.SR',
  },
  us: {
    'AAPL': 'AAPL', 'MSFT': 'MSFT', 'GOOGL': 'GOOGL', 'AMZN': 'AMZN',
    'NVDA': 'NVDA', 'META': 'META', 'TSLA': 'TSLA', 'AMD': 'AMD',
    'INTC': 'INTC', 'CRM': 'CRM',
    'JPM': 'JPM', 'BAC': 'BAC', 'GS': 'GS', 'MS': 'MS', 'WFC': 'WFC',
    'C': 'C', 'BRK.B': 'BRK-B', 'AXP': 'AXP', 'V': 'V', 'MA': 'MA',
    'JNJ': 'JNJ', 'PFE': 'PFE', 'UNH': 'UNH', 'MRK': 'MRK', 'ABBV': 'ABBV',
    'TMO': 'TMO', 'ABT': 'ABT', 'LLY': 'LLY', 'BMY': 'BMY', 'AMGN': 'AMGN',
    'XOM': 'XOM', 'CVX': 'CVX', 'COP': 'COP', 'SLB': 'SLB', 'EOG': 'EOG',
    'PXD': 'PXD', 'MPC': 'MPC', 'OXY': 'OXY', 'DVN': 'DVN', 'HAL': 'HAL',
    'WMT': 'WMT', 'PG': 'PG', 'KO': 'KO', 'PEP': 'PEP', 'COST': 'COST',
    'NKE': 'NKE', 'MCD': 'MCD', 'SBUX': 'SBUX', 'TGT': 'TGT', 'HD': 'HD',
    'BA': 'BA', 'CAT': 'CAT', 'GE': 'GE', 'HON': 'HON', 'UPS': 'UPS',
    'RTX': 'RTX', 'DE': 'DE', 'LMT': 'LMT', 'MMM': 'MMM', 'FDX': 'FDX',
    'DIS': 'DIS', 'NFLX': 'NFLX', 'CMCSA': 'CMCSA', 'T': 'T', 'VZ': 'VZ',
    'TMUS': 'TMUS', 'CHTR': 'CHTR', 'SPOT': 'SPOT', 'ROKU': 'ROKU', 'PARA': 'PARA',
    'AMT': 'AMT', 'PLD': 'PLD', 'CCI': 'CCI', 'EQIX': 'EQIX', 'SPG': 'SPG',
    'O': 'O', 'PSA': 'PSA', 'DLR': 'DLR', 'VICI': 'VICI', 'WELL': 'WELL',
    'NEE': 'NEE', 'DUK': 'DUK', 'SO': 'SO', 'D': 'D', 'AEP': 'AEP',
    'EXC': 'EXC', 'XEL': 'XEL', 'WEC': 'WEC', 'ED': 'ED', 'PEG': 'PEG',
    'LIN': 'LIN', 'APD': 'APD', 'SHW': 'SHW', 'ECL': 'ECL', 'NEM': 'NEM',
    'FCX': 'FCX', 'NUE': 'NUE', 'DOW': 'DOW', 'DD': 'DD', 'PPG': 'PPG',
  },
  uae: {
    'ENBD': 'EMIRATESNBD.DU', 'FAB': 'FAB.AD', 'DIB': 'DIB.DU', 'ADCB': 'ADCB.AD',
    'ADIB': 'ADIB.AD', 'CBD': 'CBD.DU', 'MASHREQ': 'MASHREQ.DU', 'NBF': 'NBF.DU',
    'AJMANBANK': 'AJMANBANK.DU', 'SIB': 'SHARJAHISLAMIC.DU',
    'EMAAR': 'EMAAR.DU', 'ALDAR': 'ALDAR.AD', 'DAMAC': 'DAMAC.DU', 'DEYAR': 'DEYAR.DU',
    'ESHRAQ': 'ESHRAQ.DU', 'UPP': 'UNIONPROPERTIES.DU', 'MAZAYA': 'ALMAZAYA.DU',
    'RAKPROP': 'RAKPROP.DU', 'DSI': 'DSI.DU', 'AZIZA': 'AZIZA.DU',
    'EAND': 'EAND.AD', 'EITC': 'EITC.DU', 'YAHASAT': 'YAHASAT.AD', 'DEWA': 'DEWA.AD',
    'BAYANAT': 'BAYANAT.AD', 'PRESIGHT': 'PRESIGHT.AD', 'EMPOWER': 'EMPOWER.DU', 'SPACE42': 'SPACE42.AD',
    'ADNOCGAS': 'ADNOCGAS.AD', 'ADNOCDS': 'ADNOCDS.AD', 'TAQA': 'TAQA.AD',
    'DANA': 'DANA.DU', 'FERTIGLOBE': 'FERTIGLOBE.AD', 'BOROUGE': 'BOROUGE.AD',
    'ADNOCFERT': 'ADNOCFERT.AD', 'ADNOCDFM': 'ADNOCDFM.DU',
    'SALAMA': 'SALAMA.DU', 'ORIENT': 'ORIENTINS.DU', 'DHAFRA': 'ALDHAFRA.DU',
    'WATANIA': 'NATIONAL.DU', 'AIN': 'ALAIN.DU', 'ABNIC': 'ABNIC.DU',
    'ATIG': 'ATIG.DU', 'ARIE': 'ARIE.DU',
    'AGTHIA': 'AGTHIA.AD', 'JULPHAR': 'JULPHAR.AD', 'RAKCERAM': 'RAKCERAM.AD',
    'ARKAN': 'ARKAN.DU', 'TABREED': 'TABREED.AD', 'NATCEM': 'NATCEM.AD',
    'ALFA': 'ALFA.DU', 'ITC': 'ITC.DU',
    'AIRARABIA': 'AIRARABIA.DU', 'SALIK': 'SALIK.DU', 'PARKIN': 'PARKIN.DU',
    'ARAMEX': 'ARAMEX.DU', 'DPWORLD': 'DPWORLD.DU', 'GULFNAV': 'GULFNAV.DU',
    'ADPORTS': 'ADPORTS.AD', 'DFMCO': 'DFM.DU',
    'SPINNEYS': 'SPINNEYS.DU', 'LULU': 'LULU.DU', 'ALANSARI': 'ALANSARI.DU',
    'CARAVAN': 'CARAVAN.DU', 'MHOUSE': 'MHOUSE.DU', 'GMF': 'GMF.DU', 'BHM': 'BHM.DU', 'CITYSTAR': 'CITYSTAR.DU',
    'SHUAA': 'SHUAA.DU', 'WAHA': 'WAHA.AD', 'AMLAK': 'AMLAK.DU',
    'DUBAIINV': 'DUBAIINV.DU', 'GFH': 'GFH.AD', 'IHC': 'IHC.AD',
    'MIRACLE': 'MIRACLE.AD', 'CIRCLE': 'CIRCLE.DU',
  },
  kw: {
    'NBK': 'NBK.KW', 'KFH': 'KFH.KW', 'BURGAN': 'BURGAN.KW', 'GULFBANK': 'GULFBANK.KW',
    'ABK': 'ABK.KW', 'CBK': 'COMMERCIALBK.KW', 'KIB': 'KIB.KW', 'BOUBYAN': 'BOUBYAN.KW',
    'WARBA': 'WARBA.KW', 'BKME': 'BKME.KW',
    'ZAIN': 'ZAIN.KW', 'OOREDOO': 'OOREDOO.KW', 'STC_KW': 'STC.KW',
    'MABANEE': 'MABANEE.KW', 'TAMDEEN': 'TAMDEEN.KW', 'SALHIA': 'SALHIA.KW',
    'NREC': 'NREC.KW', 'URC': 'URC.KW', 'ALIMTIAZ': 'ALIMTIAZ.KW',
    'ARZAN': 'ARZAN.KW', 'AAYAN': 'AAYAN.KW',
    'NAPESCO': 'NAPESCO.KW', 'EQUATE': 'EQUATE.KW', 'KCPC': 'KCPC.KW',
    'HEISCO': 'HEISCO.KW', 'ACICO': 'ACICO.KW',
    'AMERICANA': 'AMERICANA.KW', 'MEZZAN': 'MEZZAN.KW', 'KOUT': 'KOUT.KW', 'XCITE': 'XCITE.KW',
    'GIG': 'GIG.KW', 'KINSURANCE': 'KINSURANCE.KW', 'WETHAQ': 'WETHAQ.KW',
    'AHLEIA': 'AHLEIA.KW', 'TAKAFUL': 'TAKAFUL.KW',
    'KAMCO': 'KAMCO.KW', 'MARKAZ': 'MARKAZ.KW', 'KIPCO': 'KIPCO.KW',
    'NIG': 'NIG.KW', 'GIC': 'GIC.KW', 'ITHMAAR': 'ITHMAAR.KW',
    'KFG': 'KFG.KW', 'COAST': 'COAST.KW',
    'AGILITY': 'AGILITY.KW', 'JAZEERA': 'JAZEERA.KW', 'MENA': 'MENA.KW',
  },
  qa: {
    'QNB': 'QNBK.QA', 'CBQK': 'CBQK.QA', 'MARK': 'MARK.QA', 'QIIB': 'QIIB.QA',
    'DHBK': 'DHBK.QA', 'QIBK': 'QIBK.QA', 'QABK': 'QABK.QA', 'QFBK': 'QFBK.QA',
    'IQCD': 'IQCD.QA', 'QGTS': 'QGTS.QA', 'QNCD': 'QNCD.QA', 'MPHC': 'MPHC.QA',
    'QEWS': 'QEWS.QA', 'WOQOD': 'WOQOD.QA', 'QIMD': 'QIMD.QA', 'AAMC': 'AAMC.QA',
    'ORDS': 'ORDS.QA', 'VFQS': 'VFQS.QA', 'OOREDOO': 'ORDS.QA',
    'BRES': 'BRES.QA', 'UDCD': 'UDCD.QA', 'ERES': 'ERES.QA',
    'ZHCD': 'ZHCD.QA', 'MERS': 'MERS.QA', 'QNSR': 'QNSR.QA',
    'QATI': 'QATI.QA', 'QGRI': 'QGRI.QA', 'QLII': 'QLII.QA', 'ABRI': 'ABRI.QA', 'QLMI': 'QLMI.QA',
    'BALADNA': 'BALADNA.QA', 'WIDAM': 'WIDAM.QA', 'ZMCC': 'ZMCC.QA',
    'DLALA': 'DLALA.QA', 'QNBFS': 'QNBFS.QA', 'QSMC': 'QSMC.QA',
    'MILHAHA': 'MILHAHA.QA', 'GIQS': 'GIQS.QA',
  },
  eg: {
    'COMI': 'COMI.CA', 'QNBA': 'QNBA.CA', 'FAISAL': 'FAISAL.CA',
    'CIEB': 'CIEB.CA', 'HDBK': 'HDBK.CA', 'SAIB': 'SAIB.CA',
    'MIDB': 'MIDB.CA', 'CAIE': 'CAIE.CA',
    'TMGH': 'TMGH.CA', 'OCDI': 'OCDI.CA', 'PHDC': 'PHDC.CA',
    'MNHD': 'MNHD.CA', 'EMFD': 'EMFD.CA', 'SODIC': 'SODIC.CA',
    'MTQS': 'MTQS.CA', 'NESH': 'NESH.CA',
    'ETEL': 'ETEL.CA', 'OTMT': 'OTMT.CA', 'RAYA': 'RAYA.CA',
    'FAWRY': 'FAWRY.CA', 'SWDY': 'SWDY.CA', 'IGIH': 'IGIH.CA',
    'AMOC': 'AMOC.CA', 'ABUK': 'ABUK.CA', 'SKPC': 'SKPC.CA',
    'MOPCO': 'MOPCO.CA', 'ESRS': 'ESRS.CA', 'EGCH': 'EGCH.CA',
    'JUFO': 'JUFO.CA', 'EAST': 'EAST.CA', 'DOMTY': 'DOMTY.CA',
    'EFID': 'EFID.CA', 'IBNSINA': 'IBNSINA.CA', 'ARWA': 'ARWA.CA',
    'ORCI': 'ORCI.CA', 'EGAS': 'EGAS.CA', 'EKHO': 'EKHO.CA', 'SUGR': 'SUGR.CA',
    'PHAR': 'PHAR.CA', 'GLAX': 'GLAX.CA', 'MEMR': 'MEMR.CA',
    'CLHO': 'CLHO.CA', 'ISPHC': 'ISPHC.CA',
    'MISR': 'MISR.CA', 'DELTAINS': 'DELTAINS.CA', 'ARABINS': 'ARABINS.CA',
    'ALLIANZ': 'ALLIANZ.CA', 'GIGE': 'GIGE.CA',
    'APCC': 'APCC.CA', 'ALCN': 'ALCN.CA', 'NATD': 'NATD.CA',
    'CIRA': 'CIRA.CA', 'GBAUTO': 'GBAUTO.CA',
  },
  bh: {
    'NBB': 'NBB.BH', 'BBK': 'BBK.BH', 'SALAM': 'SALAM.BH', 'BISB': 'BISB.BH',
    'ABC': 'ABC.BH', 'KHCB': 'KHCB.BH', 'ALBARAKA': 'ALBARAKA.BH',
    'BEYON': 'BEYON.BH', 'ZAINBH': 'ZAINBH.BH', 'STCBH': 'STCBH.BH',
    'SEEF': 'SEEF.BH', 'BDFREE': 'BDFREE.BH', 'INOVEST': 'INOVEST.BH',
    'REEL': 'REEL.BH', 'AMWAJ': 'AMWAJ.BH',
    'BKIC': 'BKIC.BH', 'TAKAFUL': 'TAKAFUL.BH', 'BNIR': 'BNIR.BH', 'ARIG': 'ARIG.BH',
    'ALBA': 'ALBA.BH', 'GPIC': 'GPIC.BH', 'NASS': 'NASS.BH', 'BAPECO': 'BAPECO.BH',
    'GFH': 'GFH.BH', 'INVESTCORP': 'INVESTCORP.BH', 'BMMI': 'BMMI.BH',
    'TRAFCO': 'TRAFCO.BH', 'YBAKANOO': 'YBAKANOO.BH', 'BHC': 'BHC.BH',
  },
  om: {
    'BKMB': 'BKMB.OM', 'BKSB': 'BKSB.OM', 'BKDB': 'BKDB.OM', 'BKNB': 'BKNB.OM',
    'HSBCOM': 'HSBCOM.OM', 'ALIZZ': 'ALIZZ.OM', 'AHLI': 'AHLI.OM', 'OAB': 'OAB.OM',
    'OTEL': 'OTEL.OM', 'OORD': 'OORD.OM', 'RENNA': 'RENNA.OM',
    'OMRAN': 'OMRAN.OM', 'ALARGAN': 'ALARGAN.OM', 'TILAL': 'TILAL.OM',
    'MUSCATRE': 'MUSCATRE.OM', 'SARAYA': 'SARAYA.OM', 'SOHARRE': 'SOHARRE.OM',
    'OQEP': 'OQEP.OM', 'RAYSUT': 'RAYSUT.OM', 'SHELL': 'SHELL.OM', 'DALEEL': 'DALEEL.OM',
    'NLIF': 'NLIF.OM', 'DHOF': 'DHOF.OM', 'MUSI': 'MUSI.OM',
    'OUIS': 'OUIS.OM', 'ARSI': 'ARSI.OM',
    'OCEI': 'OCEI.OM', 'OMANCEM': 'OMANCEM.OM', 'OMANFLOUR': 'OMANFLOUR.OM',
    'OMANFISH': 'OMANFISH.OM', 'AREEJ': 'AREEJ.OM', 'SALFOOD': 'SALFOOD.OM',
    'OMANINV': 'OMANINV.OM', 'MUSCATFIN': 'MUSCATFIN.OM',
    'SOHARFIN': 'SOHARFIN.OM', 'UBHAR': 'UBHAR.OM',
    'OEPW': 'OEPW.OM', 'NAMA': 'NAMA.OM', 'SOHARPWR': 'SOHARPWR.OM',
    'ASYAD': 'ASYAD.OM', 'SALPORT': 'SALPORT.OM',
  },
  jo: {
    'ARBK': 'ARBK.JO', 'BOJX': 'BOJX.JO', 'JOKB': 'JOKB.JO', 'CABK': 'CABK.JO',
    'HBTF': 'HBTF.JO', 'INVB': 'INVB.JO', 'UBSI': 'UBSI.JO', 'SGBJ': 'SGBJ.JO',
    'JOPH': 'JOPH.JO', 'JOPT': 'JOPT.JO', 'JOST': 'JOST.JO', 'JOCE': 'JOCE.JO',
    'AALU': 'AALU.JO', 'NATA': 'NATA.JO',
    'JTEL': 'JTEL.JO', 'UMNIAH': 'UMNIAH.JO', 'JOEP': 'JOEP.JO', 'ELEC_JO': 'ELEC.JO',
    'AIEI': 'AIEI.JO', 'ZARA': 'ZARA.JO', 'IHLC': 'IHLC.JO', 'AMMN': 'AMMN.JO', 'TOUR': 'TOUR.JO',
    'JOIT': 'JOIT.JO', 'ARMI': 'ARMI.JO', 'MENAI': 'MENAI.JO',
    'DELTAINS': 'DELTAINS.JO', 'ARABLIFE': 'ARABLIFE.JO',
    'SIGA': 'SIGA.JO', 'FLOV': 'FLOV.JO', 'NATP': 'NATP.JO',
    'JODA': 'JODA.JO', 'DAIRYJO': 'DAIRYJO.JO',
    'SPIC': 'SPIC.JO', 'JOFN': 'JOFN.JO', 'JOIB': 'JOIB.JO',
    'AMAD': 'AMAD.JO', 'SAFWA': 'SAFWA.JO',
    'SPEC': 'SPEC.JO', 'HIKMA': 'HIKMA.JO', 'DARDAWA': 'DARDAWA.JO',
    'PHARMA': 'PHARMA.JO', 'KHALDI': 'KHALDI.JO',
    'RJAL': 'RJAL.JO', 'JETT': 'JETT.JO', 'AQABA': 'AQABA.JO', 'LOGJO': 'LOGJO.JO',
  },
};

// معلومات الأسواق
const marketInfo: Record<string, { label: string; currency: string }> = {
  tasi: { label: '\u{1F1F8}\u{1F1E6} السوق السعودي (تداول)', currency: 'ر.س' },
  us: { label: '\u{1F1FA}\u{1F1F8} السوق الأمريكي', currency: '$' },
  uae: { label: '\u{1F1E6}\u{1F1EA} سوق الإمارات (DFM/ADX)', currency: 'د.إ' },
  kw: { label: '\u{1F1F0}\u{1F1FC} السوق الكويتي', currency: 'د.ك' },
  qa: { label: '\u{1F1F6}\u{1F1E6} السوق القطري', currency: 'ر.ق' },
  eg: { label: '\u{1F1EA}\u{1F1EC} السوق المصري', currency: 'ج.م' },
  bh: { label: '\u{1F1E7}\u{1F1ED} السوق البحريني', currency: 'د.ب' },
  om: { label: '\u{1F1F4}\u{1F1F2} السوق العماني', currency: 'ر.ع' },
  jo: { label: '\u{1F1EF}\u{1F1F4} السوق الأردني (عمّان)', currency: 'د.أ' },
};

// خريطة رموز TradingView لكل سوق
const MARKET_TV_PREFIX: Record<string, string> = {
  tasi: 'TADAWUL',
  us: '',
  uae: 'DFM',
  kw: 'KSE',
  qa: 'QSE',
  eg: 'EGX',
  bh: 'BHB',
  om: 'MSM',
  jo: 'ASE',
};

// روابط الأسواق الداخلية
const MARKET_INTERNAL_PATH: Record<string, string> = {
  tasi: 'TADAWUL',
  us: 'NASDAQ',
  uae: 'DFM',
  kw: 'KSE',
  qa: 'QSE',
  eg: 'EGX',
  bh: 'BHB',
  om: 'MSM',
  jo: 'ASE',
};

function getTradingViewUrl(symbol: string, market: string): string {
  const prefix = MARKET_TV_PREFIX[market];
  return `https://www.tradingview.com/chart/?symbol=${prefix ? prefix + ':' : ''}${symbol}`;
}

function makeStock(symbol: string, name: string, price: number): StockData {
  return { symbol, name, change: 0, price };
}

const heatmapData: Record<string, SectorData[]> = {
  tasi: [
    { sector: 'البنوك', stocks: [
      makeStock('1120', 'الراجحي', 108.50),
      makeStock('1180', 'الأهلي', 45.20),
      makeStock('1060', 'الرياض', 32.40),
      makeStock('1050', 'الجزيرة', 18.75),
      makeStock('4260', 'الإنماء', 28.90),
      makeStock('4002', 'الرياض', 25.60),
      makeStock('1030', 'ساب', 38.50),
      makeStock('1010', 'الأهلي', 45.20),
      makeStock('4050', 'الاستثمار', 16.80),
      makeStock('4190', 'الجزيرة', 22.30),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('2222', 'أرامكو', 28.75),
      makeStock('2002', 'سابك', 85.30),
      makeStock('2290', 'ينساب', 42.50),
      makeStock('2310', 'الزامل', 28.60),
      makeStock('2001', 'كيمانول', 12.45),
      makeStock('2170', 'اللجين', 55.80),
      makeStock('2060', 'تكوين', 9.85),
      makeStock('2280', 'المتقدمة', 68.20),
      makeStock('2210', 'نماء', 45.30),
      makeStock('2250', 'المجموعة السعودية', 15.70),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('7010', 'STC', 138.25),
      makeStock('7020', 'موبايلي', 52.80),
      makeStock('7030', 'زين', 15.90),
      makeStock('7040', 'عذيب', 8.45),
      makeStock('7050', 'اتحاد اتصالات', 22.10),
      makeStock('6001', 'هرفي', 35.60),
      makeStock('7201', 'جرير', 168.40),
      makeStock('4070', 'تهامة', 42.80),
      makeStock('4071', 'اتزان', 18.90),
      makeStock('7200', 'بترومين', 95.20),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('4150', 'دار الأركان', 22.50),
      makeStock('4320', 'جبل عمر', 85.20),
      makeStock('4300', 'المعذر', 14.60),
      makeStock('4310', 'إعمار', 18.90),
      makeStock('4020', 'العقارية', 32.40),
      makeStock('4250', 'جبل', 25.80),
      makeStock('4100', 'مكة', 115.00),
      makeStock('4230', 'البحر الأحمر', 48.50),
      makeStock('4240', 'فيبكو', 28.30),
      makeStock('4260B', 'بدجت', 35.70),
    ]},
    { sector: 'التجزئة', stocks: [
      makeStock('4001', 'العثيم', 42.30),
      makeStock('4003', 'إكسترا', 28.90),
      makeStock('4004', 'بنده', 55.60),
      makeStock('4005', 'ساكو', 38.20),
      makeStock('4006', 'فتيحي', 12.80),
      makeStock('4007', 'ثوب الأصيل', 45.90),
      makeStock('4160', 'صافولا', 32.40),
      makeStock('4161', 'بن داود', 128.50),
      makeStock('4162', 'المنجم', 72.30),
      makeStock('4163', 'الدواء', 58.40),
    ]},
    { sector: 'المواد الأساسية', stocks: [
      makeStock('2010', 'سابك للصناعات', 35.60),
      makeStock('2020', 'سافكو', 88.40),
      makeStock('2030', 'ينبع', 62.30),
      makeStock('2040', 'بتروكيم', 28.45),
      makeStock('2050', 'صافولا', 42.80),
      makeStock('2070', 'المجموعة', 18.60),
      makeStock('2080', 'غاز', 25.40),
      makeStock('2090', 'جبسكو', 15.80),
      makeStock('2100', 'وفرة', 32.90),
      makeStock('2110', 'سدافكو', 145.20),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('8010', 'التعاونية', 98.50),
      makeStock('8020', 'ملاذ', 22.30),
      makeStock('8030', 'ميدغلف', 18.90),
      makeStock('8040', 'بوبا', 145.60),
      makeStock('8050', 'سلامة', 28.40),
      makeStock('8060', 'ولاء', 35.80),
      makeStock('8070', 'الراجحي تكافل', 85.20),
      makeStock('8080', 'العربية', 42.60),
      makeStock('8100', 'سايكو', 15.30),
      makeStock('8110', 'أسيج', 22.80),
    ]},
    { sector: 'الرعاية الصحية', stocks: [
      makeStock('4002H', 'المواساة', 185.40),
      makeStock('4004H', 'دله', 128.60),
      makeStock('4005H', 'رعاية', 75.30),
      makeStock('4007H', 'الحمادي', 52.80),
      makeStock('4009', 'المتكاملة', 88.90),
      makeStock('4013', 'سليمان الحبيب', 285.00),
      makeStock('4014', 'دواء', 62.40),
      makeStock('4015', 'المتوسط', 38.70),
      makeStock('4016', 'تبوك', 25.30),
      makeStock('4017', 'فقيه', 45.80),
    ]},
    { sector: 'المرافق العامة', stocks: [
      makeStock('5110', 'SEC', 22.80),
      makeStock('5120', 'ماريدايف', 8.45),
      makeStock('5130', 'تطوير', 15.60),
      makeStock('5140', 'كيان', 12.30),
      makeStock('5150', 'بحري', 38.50),
      makeStock('5160', 'ثمار', 28.90),
      makeStock('5170', 'المتطورة', 62.40),
      makeStock('5180', 'بترورابغ', 18.70),
      makeStock('5190', 'شمس', 42.30),
      makeStock('5200', 'ملكية', 25.60),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('4030', 'بحري', 35.80),
      makeStock('4031', 'سابتكو', 22.40),
      makeStock('4040', 'سار', 48.90),
      makeStock('4050N', 'العبداللطيف', 62.30),
      makeStock('4060', 'النقل الجماعي', 15.60),
      makeStock('4080', 'طيبة', 28.40),
      makeStock('4081', 'النايفات', 85.20),
      makeStock('4082', 'المطاحن', 125.60),
      makeStock('4083', 'سلوشنز', 298.00),
      makeStock('4084', 'جاهز', 185.40),
    ]},
  ],
  us: [
    { sector: 'التقنية', stocks: [
      makeStock('AAPL', 'Apple', 228),
      makeStock('MSFT', 'Microsoft', 425),
      makeStock('GOOGL', 'Google', 178),
      makeStock('AMZN', 'Amazon', 195),
      makeStock('NVDA', 'NVIDIA', 890),
      makeStock('META', 'Meta', 510),
      makeStock('TSLA', 'Tesla', 178),
      makeStock('AMD', 'AMD', 165),
      makeStock('INTC', 'Intel', 32),
      makeStock('CRM', 'Salesforce', 298),
    ]},
    { sector: 'المالية', stocks: [
      makeStock('JPM', 'JPMorgan', 198),
      makeStock('BAC', 'BofA', 38),
      makeStock('GS', 'Goldman Sachs', 485),
      makeStock('MS', 'Morgan Stanley', 98),
      makeStock('WFC', 'Wells Fargo', 62),
      makeStock('C', 'Citigroup', 68),
      makeStock('BRK.B', 'Berkshire', 425),
      makeStock('AXP', 'American Express', 235),
      makeStock('V', 'Visa', 298),
      makeStock('MA', 'Mastercard', 485),
    ]},
    { sector: 'الرعاية الصحية', stocks: [
      makeStock('JNJ', 'J&J', 158),
      makeStock('PFE', 'Pfizer', 28),
      makeStock('UNH', 'UnitedHealth', 525),
      makeStock('MRK', 'Merck', 128),
      makeStock('ABBV', 'AbbVie', 178),
      makeStock('TMO', 'Thermo Fisher', 585),
      makeStock('ABT', 'Abbott', 112),
      makeStock('LLY', 'Eli Lilly', 798),
      makeStock('BMY', 'Bristol-Myers', 52),
      makeStock('AMGN', 'Amgen', 298),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('XOM', 'Exxon', 108),
      makeStock('CVX', 'Chevron', 158),
      makeStock('COP', 'ConocoPhillips', 118),
      makeStock('SLB', 'Schlumberger', 52),
      makeStock('EOG', 'EOG Resources', 128),
      makeStock('PXD', 'Pioneer', 258),
      makeStock('MPC', 'Marathon', 168),
      makeStock('OXY', 'Occidental', 62),
      makeStock('DVN', 'Devon', 48),
      makeStock('HAL', 'Halliburton', 38),
    ]},
    { sector: 'الاستهلاك', stocks: [
      makeStock('WMT', 'Walmart', 178),
      makeStock('PG', 'P&G', 168),
      makeStock('KO', 'Coca-Cola', 62),
      makeStock('PEP', 'PepsiCo', 178),
      makeStock('COST', 'Costco', 728),
      makeStock('NKE', 'Nike', 98),
      makeStock('MCD', "McDonald's", 298),
      makeStock('SBUX', 'Starbucks', 98),
      makeStock('TGT', 'Target', 148),
      makeStock('HD', 'Home Depot', 358),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('BA', 'Boeing', 185),
      makeStock('CAT', 'Caterpillar', 358),
      makeStock('GE', 'GE', 168),
      makeStock('HON', 'Honeywell', 208),
      makeStock('UPS', 'UPS', 148),
      makeStock('RTX', 'Raytheon', 108),
      makeStock('DE', 'Deere', 398),
      makeStock('LMT', 'Lockheed', 458),
      makeStock('MMM', '3M', 108),
      makeStock('FDX', 'FedEx', 268),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('DIS', 'Disney', 108),
      makeStock('NFLX', 'Netflix', 628),
      makeStock('CMCSA', 'Comcast', 42),
      makeStock('T', 'AT&T', 18),
      makeStock('VZ', 'Verizon', 42),
      makeStock('TMUS', 'T-Mobile', 178),
      makeStock('CHTR', 'Charter', 298),
      makeStock('SPOT', 'Spotify', 328),
      makeStock('ROKU', 'Roku', 68),
      makeStock('PARA', 'Paramount', 12),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('AMT', 'American Tower', 208),
      makeStock('PLD', 'Prologis', 128),
      makeStock('CCI', 'Crown Castle', 108),
      makeStock('EQIX', 'Equinix', 798),
      makeStock('SPG', 'Simon Property', 158),
      makeStock('O', 'Realty Income', 58),
      makeStock('PSA', 'Public Storage', 298),
      makeStock('DLR', 'Digital Realty', 148),
      makeStock('VICI', 'VICI', 32),
      makeStock('WELL', 'Welltower', 98),
    ]},
    { sector: 'المرافق العامة', stocks: [
      makeStock('NEE', 'NextEra', 78),
      makeStock('DUK', 'Duke', 108),
      makeStock('SO', 'Southern Co', 78),
      makeStock('D', 'Dominion', 52),
      makeStock('AEP', 'AEP', 98),
      makeStock('EXC', 'Exelon', 42),
      makeStock('XEL', 'Xcel', 68),
      makeStock('WEC', 'WEC Energy', 98),
      makeStock('ED', 'ConEd', 98),
      makeStock('PEG', 'PSEG', 68),
    ]},
    { sector: 'المواد الأساسية', stocks: [
      makeStock('LIN', 'Linde', 458),
      makeStock('APD', 'Air Products', 298),
      makeStock('SHW', 'Sherwin', 348),
      makeStock('ECL', 'Ecolab', 228),
      makeStock('NEM', 'Newmont', 42),
      makeStock('FCX', 'Freeport', 48),
      makeStock('NUE', 'Nucor', 168),
      makeStock('DOW', 'Dow', 58),
      makeStock('DD', 'DuPont', 78),
      makeStock('PPG', 'PPG', 138),
    ]},
  ],
  uae: [
    { sector: 'البنوك', stocks: [
      makeStock('ENBD', 'الإمارات دبي الوطني', 18.20),
      makeStock('FAB', 'أبوظبي الأول', 14.85),
      makeStock('DIB', 'دبي الإسلامي', 6.30),
      makeStock('ADCB', 'أبوظبي التجاري', 9.45),
      makeStock('ADIB', 'أبوظبي الإسلامي', 6.80),
      makeStock('CBD', 'دبي التجاري', 7.80),
      makeStock('MASHREQ', 'مصرف المشرق', 128.00),
      makeStock('NBF', 'الفجيرة الوطني', 5.20),
      makeStock('AJMANBANK', 'مصرف عجمان', 1.55),
      makeStock('SIB', 'الشارقة الإسلامي', 2.45),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('EMAAR', 'إعمار العقارية', 9.75),
      makeStock('ALDAR', 'الدار العقارية', 7.20),
      makeStock('DAMAC', 'داماك العقارية', 4.85),
      makeStock('DEYAR', 'ديار للتطوير', 0.85),
      makeStock('ESHRAQ', 'إشراق للاستثمار', 0.52),
      makeStock('UPP', 'يونيون العقارية', 0.68),
      makeStock('MAZAYA', 'مزايا القابضة', 1.25),
      makeStock('RAKPROP', 'رأس الخيمة العقارية', 0.92),
      makeStock('DSI', 'دريك آند سكول', 0.42),
      makeStock('AZIZA', 'العزيزية', 0.35),
    ]},
    { sector: 'الاتصالات والتقنية', stocks: [
      makeStock('EAND', 'اتصالات (e&)', 24.50),
      makeStock('EITC', 'دو', 6.85),
      makeStock('YAHASAT', 'الياه سات', 4.20),
      makeStock('DEWA', 'ديوا', 2.85),
      makeStock('BAYANAT', 'بيانات', 5.40),
      makeStock('PRESIGHT', 'بريسايت', 3.20),
      makeStock('EMPOWER', 'إمباور', 2.10),
      makeStock('SPACE42', 'سبيس 42', 8.50),
    ]},
    { sector: 'الطاقة والبتروكيماويات', stocks: [
      makeStock('ADNOCGAS', 'أدنوك للغاز', 3.85),
      makeStock('ADNOCDS', 'أدنوك للحفر', 5.80),
      makeStock('TAQA', 'طاقة (TAQA)', 3.45),
      makeStock('DANA', 'دانة غاز', 1.15),
      makeStock('FERTIGLOBE', 'فيرتيغلوب', 3.25),
      makeStock('BOROUGE', 'بروج', 2.65),
      makeStock('ADNOCFERT', 'أدنوك للأسمدة', 4.60),
      makeStock('ADNOCDFM', 'أدنوك للتوزيع', 4.25),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('SALAMA', 'سلامة للتأمين', 0.85),
      makeStock('ORIENT', 'المشرق للتأمين', 2.45),
      makeStock('DHAFRA', 'ظفرة للتأمين', 5.80),
      makeStock('WATANIA', 'الوطنية للتأمين', 4.20),
      makeStock('AIN', 'العين للتأمين', 22.50),
      makeStock('ABNIC', 'أبوظبي الوطنية للتأمين', 8.60),
      makeStock('ATIG', 'التحالف للتأمين', 1.35),
      makeStock('ARIE', 'العربية للتأمين', 3.20),
    ]},
    { sector: 'الصناعة والغذاء', stocks: [
      makeStock('AGTHIA', 'أغذية', 7.80),
      makeStock('JULPHAR', 'جلفار', 1.45),
      makeStock('RAKCERAM', 'سيراميك رأس الخيمة', 3.80),
      makeStock('ARKAN', 'أركان', 2.15),
      makeStock('TABREED', 'تبريد', 3.60),
      makeStock('NATCEM', 'الوطنية للأسمنت', 4.20),
      makeStock('ALFA', 'ألفا للغذائية', 2.80),
      makeStock('ITC', 'التبغ الدولية', 12.50),
    ]},
    { sector: 'النقل والسياحة', stocks: [
      makeStock('AIRARABIA', 'العربية للطيران', 3.40),
      makeStock('SALIK', 'سالك', 4.20),
      makeStock('PARKIN', 'باركن', 5.60),
      makeStock('ARAMEX', 'أرامكس', 4.85),
      makeStock('DPWORLD', 'دي بي وورلد', 18.50),
      makeStock('GULFNAV', 'الخليج للملاحة', 6.80),
      makeStock('ADPORTS', 'موانئ أبوظبي', 5.60),
      makeStock('DFMCO', 'بورصة دبي', 1.85),
    ]},
    { sector: 'التجزئة', stocks: [
      makeStock('SPINNEYS', 'سبينيز', 3.85),
      makeStock('LULU', 'لولو', 4.20),
      makeStock('ALANSARI', 'الأنصاري للصرافة', 5.80),
      makeStock('CARAVAN', 'كارافان للوجبات', 1.60),
      makeStock('MHOUSE', 'المنزل للمفروشات', 2.30),
      makeStock('GMF', 'الغذائية العالمية', 1.45),
      makeStock('BHM', 'بحر المال', 0.95),
      makeStock('CITYSTAR', 'سيتي ستار', 1.20),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('SHUAA', 'شعاع كابيتال', 0.85),
      makeStock('WAHA', 'وها كابيتال', 1.65),
      makeStock('AMLAK', 'أملاك للتمويل', 1.20),
      makeStock('DUBAIINV', 'دبي للاستثمار', 2.85),
      makeStock('GFH', 'مجموعة GFH', 1.85),
      makeStock('IHC', 'القابضة الدولية', 385.00),
      makeStock('MIRACLE', 'ميركل للطاقة', 2.10),
      makeStock('CIRCLE', 'سركل للتطوير', 0.55),
    ]},
  ],
  kw: [
    { sector: 'البنوك', stocks: [
      makeStock('NBK', 'بنك الكويت الوطني', 1.050),
      makeStock('KFH', 'بيت التمويل الكويتي', 0.920),
      makeStock('BURGAN', 'بنك برقان', 0.245),
      makeStock('GULFBANK', 'بنك الخليج', 0.310),
      makeStock('ABK', 'البنك الأهلي الكويتي', 0.285),
      makeStock('CBK', 'البنك التجاري', 0.520),
      makeStock('KIB', 'بنك الكويت الدولي', 0.198),
      makeStock('BOUBYAN', 'بنك بوبيان', 0.680),
      makeStock('WARBA', 'بنك وربة', 0.275),
      makeStock('BKME', 'بنك الشرق الأوسط', 0.145),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('ZAIN', 'زين الكويت', 0.580),
      makeStock('OOREDOO', 'أوريدو الكويت', 0.820),
      makeStock('STC_KW', 'STC الكويت', 0.740),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('MABANEE', 'مباني', 0.850),
      makeStock('TAMDEEN', 'تمدين', 0.420),
      makeStock('SALHIA', 'الصالحية', 0.380),
      makeStock('NREC', 'العقارية الوطنية', 0.125),
      makeStock('URC', 'المتحدة العقارية', 0.098),
      makeStock('ALIMTIAZ', 'الامتياز', 0.145),
      makeStock('ARZAN', 'أرزان', 0.082),
      makeStock('AAYAN', 'أعيان العقارية', 0.110),
    ]},
    { sector: 'الطاقة والصناعة', stocks: [
      makeStock('NAPESCO', 'نابيسكو', 1.100),
      makeStock('EQUATE', 'إيكويت', 0.520),
      makeStock('KCPC', 'الأسمنت الكويتية', 0.380),
      makeStock('HEISCO', 'هيسكو', 1.450),
      makeStock('ACICO', 'أسيكو', 0.245),
    ]},
    { sector: 'الأغذية والتجزئة', stocks: [
      makeStock('AMERICANA', 'أمريكانا', 0.350),
      makeStock('MEZZAN', 'مزان القابضة', 0.720),
      makeStock('KOUT', 'كاوت فود', 0.580),
      makeStock('XCITE', 'إكس سايت', 0.420),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('GIG', 'الخليج للتأمين', 0.850),
      makeStock('KINSURANCE', 'الكويتية للتأمين', 0.320),
      makeStock('WETHAQ', 'وثاق للتأمين', 0.185),
      makeStock('AHLEIA', 'الأهلية للتأمين', 0.275),
      makeStock('TAKAFUL', 'التكافل الكويتي', 0.135),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('KAMCO', 'كامكو إنفست', 0.120),
      makeStock('MARKAZ', 'المركز المالي', 0.185),
      makeStock('KIPCO', 'كيبكو', 0.220),
      makeStock('NIG', 'الوطنية للاستثمار', 0.165),
      makeStock('GIC', 'الاستثمارات الخليجية', 0.095),
      makeStock('ITHMAAR', 'إثمار القابضة', 0.085),
      makeStock('KFG', 'كيو إف جي', 0.280),
      makeStock('COAST', 'كوست إنفست', 0.135),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('AGILITY', 'أجيليتي', 0.920),
      makeStock('JAZEERA', 'الجزيرة للطيران', 0.380),
      makeStock('MENA', 'الشرق الأوسط للطيران', 0.245),
    ]},
  ],
  qa: [
    { sector: 'البنوك', stocks: [
      makeStock('QNB', 'بنك قطر الوطني', 14.50),
      makeStock('CBQK', 'البنك التجاري القطري', 5.85),
      makeStock('MARK', 'مصرف الريان', 4.20),
      makeStock('QIIB', 'مصرف قطر الإسلامي', 8.75),
      makeStock('DHBK', 'بنك الدوحة', 2.45),
      makeStock('QIBK', 'بنك قطر الإسلامي الدولي', 3.80),
      makeStock('QABK', 'أحمد بن علي', 3.20),
      makeStock('QFBK', 'بنك قطر الأول', 1.85),
    ]},
    { sector: 'الطاقة والصناعة', stocks: [
      makeStock('IQCD', 'صناعات قطر', 12.40),
      makeStock('QGTS', 'ناقلات قطر', 4.85),
      makeStock('QNCD', 'الأسمنت القطرية', 3.20),
      makeStock('MPHC', 'مسيعيد للبتروكيماويات', 2.15),
      makeStock('QEWS', 'الكهرباء والماء', 15.80),
      makeStock('WOQOD', 'وقود قطر', 18.50),
      makeStock('QIMD', 'الصناعية القطرية', 3.60),
      makeStock('AAMC', 'أعمال قطر', 2.30),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('ORDS', 'أوريدو قطر', 7.25),
      makeStock('VFQS', 'فودافون قطر', 1.65),
      makeStock('OOREDOO', 'أوريدو للاتصالات', 7.25),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('BRES', 'بروة العقارية', 3.40),
      makeStock('UDCD', 'يونايتد ديفلوبمنت', 1.55),
      makeStock('ERES', 'إزدان القابضة', 1.20),
      makeStock('ZHCD', 'زاد القابضة', 12.50),
      makeStock('MERS', 'المزايا القطرية', 0.85),
      makeStock('QNSR', 'النصر العقارية', 4.50),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('QATI', 'التأمين القطري', 2.85),
      makeStock('QGRI', 'الدوحة للتأمين', 1.45),
      makeStock('QLII', 'التأمين الإسلامي', 7.80),
      makeStock('ABRI', 'العربية للتأمين', 5.20),
      makeStock('QLMI', 'الخليج للتأمين', 2.60),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('BALADNA', 'بلدنا', 1.55),
      makeStock('WIDAM', 'ودام', 4.20),
      makeStock('ZMCC', 'الزامل للدواجن', 2.80),
    ]},
    { sector: 'الخدمات المالية والنقل', stocks: [
      makeStock('DLALA', 'دلالة للوساطة', 1.65),
      makeStock('QNBFS', 'QNB للخدمات المالية', 6.40),
      makeStock('QSMC', 'ملاحة قطر', 5.20),
      makeStock('MILHAHA', 'ملاحة القطرية', 6.80),
      makeStock('GIQS', 'الخدمات الدولية', 3.20),
    ]},
  ],
  eg: [
    { sector: 'البنوك', stocks: [
      makeStock('COMI', 'التجاري الدولي (CIB)', 78.50),
      makeStock('QNBA', 'قطر الوطني الأهلي', 28.40),
      makeStock('FAISAL', 'بنك فيصل الإسلامي', 55.60),
      makeStock('CIEB', 'البنك المصري الخليجي', 22.40),
      makeStock('HDBK', 'بنك التعمير والإسكان', 15.20),
      makeStock('SAIB', 'بنك الشركة المصرفية', 12.80),
      makeStock('MIDB', 'البنك الأهلي المتحد', 18.50),
      makeStock('CAIE', 'بنك قناة السويس', 8.90),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('TMGH', 'طلعت مصطفى', 55.20),
      makeStock('OCDI', 'أوراسكوم للتنمية', 12.80),
      makeStock('PHDC', 'بالم هيلز', 8.45),
      makeStock('MNHD', 'مدينة نصر للإسكان', 5.60),
      makeStock('EMFD', 'إعمار مصر', 7.20),
      makeStock('SODIC', 'سوديك', 22.80),
      makeStock('MTQS', 'المتقنة', 8.40),
      makeStock('NESH', 'النيل للمشروعات', 3.20),
    ]},
    { sector: 'الاتصالات والتقنية', stocks: [
      makeStock('ETEL', 'المصرية للاتصالات', 28.50),
      makeStock('OTMT', 'أوراسكوم للإعلام', 5.40),
      makeStock('RAYA', 'رايا للاتصالات', 3.85),
      makeStock('FAWRY', 'فوري للدفع الإلكتروني', 6.20),
      makeStock('SWDY', 'السويدي إلكتريك', 12.40),
      makeStock('IGIH', 'أوراسكوم للاستثمار', 4.80),
    ]},
    { sector: 'الطاقة والأسمدة', stocks: [
      makeStock('AMOC', 'العامرية للبترول', 8.50),
      makeStock('ABUK', 'أبوقير للأسمدة', 95.80),
      makeStock('SKPC', 'سيدى كرير للبتروكيماويات', 22.40),
      makeStock('MOPCO', 'موبكو', 185.00),
      makeStock('ESRS', 'السويس للأسمدة', 18.40),
      makeStock('EGCH', 'مصر للكيماويات', 7.80),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('JUFO', 'جهينة', 28.50),
      makeStock('EAST', 'ايسترن كومباني', 32.40),
      makeStock('DOMTY', 'دومتي', 12.80),
      makeStock('EFID', 'إيديتا', 22.30),
      makeStock('IBNSINA', 'ابن سينا فارما', 12.60),
      makeStock('ARWA', 'المصريين للمنتجات الغذائية', 8.40),
    ]},
    { sector: 'المواد الأساسية', stocks: [
      makeStock('ESRS', 'حديد عز', 42.50),
      makeStock('ORCI', 'أوراسكوم للإنشاء', 85.40),
      makeStock('EGAS', 'الغاز الطبيعي', 32.80),
      makeStock('EKHO', 'المصرية الكويتية', 15.60),
      makeStock('SUGR', 'الدلتا للسكر', 42.80),
    ]},
    { sector: 'الرعاية الصحية والأدوية', stocks: [
      makeStock('PHAR', 'فاركو للأدوية', 15.40),
      makeStock('GLAX', 'جلاكسو مصر', 42.80),
      makeStock('MEMR', 'ممفيس للأدوية', 28.60),
      makeStock('CLHO', 'كليوباترا للمستشفيات', 8.20),
      makeStock('ISPHC', 'المتحدة للصحة', 22.50),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('MISR', 'مصر للتأمين', 18.50),
      makeStock('DELTAINS', 'الدلتا للتأمين', 28.40),
      makeStock('ARABINS', 'العربي للتأمين', 12.60),
      makeStock('ALLIANZ', 'أليانز مصر', 45.60),
      makeStock('GIGE', 'الخليج مصر للتأمين', 8.20),
    ]},
    { sector: 'الصناعة والتعدين', stocks: [
      makeStock('APCC', 'أبو قير للأسمدة', 95.80),
      makeStock('ALCN', 'العودة للصناعة', 12.40),
      makeStock('NATD', 'النيل للمطاحن', 25.30),
      makeStock('CIRA', 'كيرا للتعليم', 18.20),
      makeStock('GBAUTO', 'غبور أوتو', 42.60),
    ]},
  ],
  bh: [
    { sector: 'البنوك', stocks: [
      makeStock('NBB', 'بنك البحرين الوطني', 0.720),
      makeStock('BBK', 'بنك البحرين والكويت', 0.580),
      makeStock('SALAM', 'بنك السلام', 0.098),
      makeStock('BISB', 'بنك البحرين الإسلامي', 0.125),
      makeStock('ABC', 'المصرف العربي الدولي', 0.380),
      makeStock('KHCB', 'بنك الخليج المتحد', 0.245),
      makeStock('ALBARAKA', 'بنك البركة', 0.420),
    ]},
    { sector: 'الاتصالات والتقنية', stocks: [
      makeStock('BEYON', 'بيون (بتلكو)', 0.450),
      makeStock('ZAINBH', 'زين البحرين', 0.195),
      makeStock('STCBH', 'STC البحرين', 0.285),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('SEEF', 'مجموعة السيف', 0.420),
      makeStock('BDFREE', 'الحرية للتجارة', 0.185),
      makeStock('INOVEST', 'إنوفست', 0.125),
      makeStock('REEL', 'الرفاع للعقارات', 0.165),
      makeStock('AMWAJ', 'أمواج العقارية', 0.380),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('BKIC', 'البحرين الكويتية للتأمين', 0.350),
      makeStock('TAKAFUL', 'التكافل الدولي', 0.145),
      makeStock('BNIR', 'الوطنية للتأمين', 0.380),
      makeStock('ARIG', 'المجموعة العربية للتأمين', 0.210),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('ALBA', 'ألبا (ألمنيوم البحرين)', 1.200),
      makeStock('GPIC', 'جيبك (البتروكيماويات)', 0.520),
      makeStock('NASS', 'ناس للصناعة', 0.420),
      makeStock('BAPECO', 'بابكو للطاقة', 0.850),
    ]},
    { sector: 'الخدمات المالية والتجارة', stocks: [
      makeStock('GFH', 'GFH المالية', 0.285),
      makeStock('INVESTCORP', 'إنفستكورب', 2.850),
      makeStock('BMMI', 'BMMI', 0.780),
      makeStock('TRAFCO', 'ترافكو جروب', 0.520),
      makeStock('YBAKANOO', 'يوسف بن أحمد كانو', 0.450),
      makeStock('BHC', 'بحرين للاتصالات', 0.310),
    ]},
  ],
  om: [
    { sector: 'البنوك', stocks: [
      makeStock('BKMB', 'بنك مسقط', 0.480),
      makeStock('BKSB', 'بنك صحار', 0.145),
      makeStock('BKDB', 'بنك ظفار', 0.185),
      makeStock('BKNB', 'البنك الوطني العماني', 0.220),
      makeStock('HSBCOM', 'HSBC عمان', 0.125),
      makeStock('ALIZZ', 'العز الإسلامي', 0.085),
      makeStock('AHLI', 'البنك الأهلي العماني', 0.165),
      makeStock('OAB', 'عمان العربي', 0.195),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('OTEL', 'عمانتل', 0.750),
      makeStock('OORD', 'أوريدو عمان', 0.520),
      makeStock('RENNA', 'رنّة للاتصالات', 0.285),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('OMRAN', 'عمران للسياحة', 0.420),
      makeStock('ALARGAN', 'الأرجان العقارية', 0.285),
      makeStock('TILAL', 'تلال العقارية', 0.350),
      makeStock('MUSCATRE', 'مسقط العقارية', 0.145),
      makeStock('SARAYA', 'سرايا العقارية', 0.120),
      makeStock('SOHARRE', 'صحار العقارية', 0.165),
    ]},
    { sector: 'الطاقة والتعدين', stocks: [
      makeStock('OQEP', 'أوكيو للطاقة', 1.20),
      makeStock('RAYSUT', 'ريسوت للأسمنت', 0.350),
      makeStock('OMAN Oil', 'نفط عمان', 0.680),
      makeStock('SHELL', 'شل عمان', 1.45),
      makeStock('DALEEL', 'دليل للنفط', 0.420),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('NLIF', 'الحياة الوطنية', 0.285),
      makeStock('DHOF', 'ظفار للتأمين', 0.195),
      makeStock('MUSI', 'مسقط للتأمين', 0.145),
      makeStock('OUIS', 'عمان المتحدة للتأمين', 0.320),
      makeStock('ARSI', 'العربي للتأمين', 0.120),
    ]},
    { sector: 'الصناعة والغذاء', stocks: [
      makeStock('OCEI', 'عمان للكابلات', 0.420),
      makeStock('OMANCEM', 'أسمنت عمان', 0.350),
      makeStock('OMANFLOUR', 'مطاحن عمان', 0.520),
      makeStock('OMANFISH', 'أسماك عمان', 1.85),
      makeStock('AREEJ', 'أريج للأغذية', 0.350),
      makeStock('SALFOOD', 'صلالة للأغذية', 0.420),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('OMANINV', 'عمان للاستثمار', 0.165),
      makeStock('MUSCATFIN', 'مسقط المالية', 0.285),
      makeStock('SOHARFIN', 'صحار المالية', 0.195),
      makeStock('UBHAR', 'أبهار كابيتال', 0.310),
    ]},
    { sector: 'المرافق والنقل', stocks: [
      makeStock('OEPW', 'كهرباء ومياه عمان', 0.420),
      makeStock('NAMA', 'نماء القابضة', 0.350),
      makeStock('SOHARPWR', 'صحار للطاقة', 0.520),
      makeStock('ASYAD', 'أسياد للنقل', 0.380),
      makeStock('SALPORT', 'ميناء صلالة', 0.520),
    ]},
  ],
  jo: [
    { sector: 'البنوك', stocks: [
      makeStock('ARBK', 'البنك العربي', 5.20),
      makeStock('BOJX', 'بنك الأردن', 2.85),
      makeStock('JOKB', 'البنك الأردني الكويتي', 1.10),
      makeStock('CABK', 'بنك القاهرة عمان', 1.25),
      makeStock('HBTF', 'بنك الإسكان', 2.45),
      makeStock('INVB', 'بنك الاستثمار', 1.15),
      makeStock('UBSI', 'بنك الاتحاد', 2.10),
      makeStock('SGBJ', 'سوسيته جنرال', 1.45),
    ]},
    { sector: 'الصناعة والتعدين', stocks: [
      makeStock('JOPH', 'الفوسفات الأردنية', 8.50),
      makeStock('JOPT', 'البوتاس الأردنية', 25.80),
      makeStock('JOST', 'الحديد والصلب', 1.65),
      makeStock('JOCE', 'أسمنت الأردن', 3.40),
      makeStock('AALU', 'الألمنيوم الأردنية', 1.20),
      makeStock('NATA', 'الوطنية للصناعات', 0.95),
    ]},
    { sector: 'الاتصالات والخدمات', stocks: [
      makeStock('JTEL', 'أورانج الأردن', 4.50),
      makeStock('UMNIAH', 'أمنية', 0.95),
      makeStock('JOEP', 'الشرق الأوسط للكهرباء', 1.10),
      makeStock('ELEC_JO', 'كهرباء الأردن', 1.45),
    ]},
    { sector: 'العقارات والسياحة', stocks: [
      makeStock('AIEI', 'العربية الدولية للاستثمار', 1.20),
      makeStock('ZARA', 'زارا للاستثمار', 3.50),
      makeStock('IHLC', 'مستشفى الإسلامي', 2.80),
      makeStock('AMMN', 'أمانة عمان للتطوير', 1.10),
      makeStock('TOUR', 'السياحة الأردنية', 0.85),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('JOIT', 'التأمين الأردني', 2.40),
      makeStock('ARMI', 'العربية للتأمين', 1.85),
      makeStock('MENAI', 'الشرق الأوسط للتأمين', 1.20),
      makeStock('DELTAINS', 'الدلتا للتأمين', 0.95),
      makeStock('ARABLIFE', 'العربية لتأمين الحياة', 2.30),
    ]},
    { sector: 'الأغذية والدخان', stocks: [
      makeStock('SIGA', 'اتحاد التبغ', 5.80),
      makeStock('FLOV', 'مطاحن الأردن', 3.20),
      makeStock('NATP', 'الوطنية للأغذية', 1.85),
      makeStock('JODA', 'ألبان الأردن', 2.40),
      makeStock('DAIRYJO', 'ألبان الوادي', 2.60),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('SPIC', 'الأوراق المالية', 2.40),
      makeStock('JOFN', 'الخدمات المالية الأردنية', 1.65),
      makeStock('JOIB', 'الإسلامي للاستثمار', 2.80),
      makeStock('AMAD', 'عمّاد للاستثمار', 0.85),
      makeStock('SAFWA', 'صفوة المالية', 0.95),
    ]},
    { sector: 'الرعاية الصحية', stocks: [
      makeStock('SPEC', 'التخصصي الأردني', 3.40),
      makeStock('HIKMA', 'حكمة للأدوية', 6.50),
      makeStock('DARDAWA', 'دار الدواء', 3.80),
      makeStock('PHARMA', 'الأدوية الأردنية', 4.80),
      makeStock('KHALDI', 'مستشفى الخالدي', 5.20),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('RJAL', 'الملكية الأردنية', 0.85),
      makeStock('JETT', 'جت للنقل', 2.40),
      makeStock('AQABA', 'ميناء العقبة', 3.80),
      makeStock('LOGJO', 'اللوجستية الأردنية', 0.75),
    ]},
  ],
};

// دالة لون التغير
function getChangeColor(change: number) {
  if (change >= 3) return 'bg-green-600 text-white';
  if (change >= 2) return 'bg-green-500 text-white';
  if (change >= 1) return 'bg-green-400 text-white';
  if (change >= 0) return 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (change >= -1) return 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (change >= -2) return 'bg-red-400 text-white';
  if (change >= -3) return 'bg-red-500 text-white';
  return 'bg-red-600 text-white';
}

// مكون خلية الخريطة الحرارية
function HeatmapCell({
  stock,
  size = 'normal',
  currency = '',
  extraClass = '',
  highlighted = false,
  onClick,
}: {
  stock: StockData;
  size?: 'small' | 'normal' | 'large' | 'xlarge';
  currency?: string;
  extraClass?: string;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const sizeClasses = {
    small:  'p-1.5 min-w-[56px] min-h-[52px]',
    normal: 'p-2.5 min-w-[90px]  min-h-[70px]',
    large:  'p-3   min-w-[120px] min-h-[90px]',
    xlarge: 'p-4   min-w-[160px] min-h-[110px]',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-xl cursor-pointer transition-all duration-200',
              'hover:scale-[1.06] hover:shadow-xl hover:z-10 relative',
              'flex flex-col justify-between select-none',
              getChangeColor(stock.change),
              sizeClasses[size],
              extraClass,
              highlighted && 'ring-2 ring-white/60 scale-[1.03]'
            )}
            onClick={onClick}
          >
            <div className={cn('font-bold leading-tight', size === 'xlarge' ? 'text-sm' : size === 'large' ? 'text-xs' : 'text-[10px]')}>
              {stock.symbol}
            </div>
            {size !== 'small' && (
              <div className={cn('truncate opacity-80', size === 'xlarge' ? 'text-xs' : 'text-[9px]')}>
                {stock.name}
              </div>
            )}
            {(size === 'large' || size === 'xlarge') && currency && (
              <div className="text-[9px] opacity-70 mt-0.5">
                {stock.price.toLocaleString()} {currency}
              </div>
            )}
            <div className={cn('font-semibold flex items-center gap-0.5 mt-0.5', size === 'xlarge' ? 'text-sm' : 'text-[10px]')}>
              {stock.change >= 0 ? <TrendingUp className="h-2.5 w-2.5 shrink-0" /> : <TrendingDown className="h-2.5 w-2.5 shrink-0" />}
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs" dir="rtl">
          <p className="font-bold">{stock.symbol} – {stock.name}</p>
          <p>{stock.price.toLocaleString()} {currency}</p>
          <p className={stock.change >= 0 ? 'text-green-400' : 'text-red-400'}>
            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// مكون مقياس الألوان
function ColorScale() {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <span className="text-xs text-muted-foreground">انخفاض كبير</span>
      <div className="flex gap-0.5">
        <div className="w-8 h-4 rounded bg-red-600" />
        <div className="w-8 h-4 rounded bg-red-500" />
        <div className="w-8 h-4 rounded bg-red-400" />
        <div className="w-8 h-4 rounded bg-red-200 dark:bg-red-900" />
        <div className="w-8 h-4 rounded bg-green-200 dark:bg-green-900" />
        <div className="w-8 h-4 rounded bg-green-400" />
        <div className="w-8 h-4 rounded bg-green-500" />
        <div className="w-8 h-4 rounded bg-green-600" />
      </div>
      <span className="text-xs text-muted-foreground">ارتفاع كبير</span>
    </div>
  );
}

export default function HeatmapPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  // ─── حالة الصفحة ────────────────────────────────────────────────
  const [market, setMarket] = useState<string>('tasi');
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'proportional'>('grid');
  const [selectedStock, setSelectedStock] = useState<{ stock: StockData; sector: string } | null>(null);
  const [liveData, setLiveData] = useState<Record<string, SectorData[]>>(heatmapData);

  // فلاتر
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [changeFilter, setChangeFilter] = useState<'all' | 'gainers' | 'losers' | 'strong_gain' | 'strong_loss'>('all');

  // تحديث تلقائي
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

  // بيانات شرعية للسهم المحدد
  const [shariaData, setShariaData] = useState<{
    found: boolean;
    grade?: string;
    overall?: string;
    recommendation?: string;
    purification?: string;
    bilad?: string;
    rajhi?: string;
    maqasid?: string;
    zerodebt?: string;
  } | null>(null);
  const [shariaLoading, setShariaLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ─── جلب الأسعار ────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const yahooMap = YAHOO_SYMBOL_MAP[market];
      if (!yahooMap) { setIsRefreshing(false); return; }
      const sectors = heatmapData[market] || [];
      const allSymbols: string[] = [];
      const symbolToYahoo: Record<string, string> = {};
      for (const sector of sectors) {
        for (const stock of sector.stocks) {
          const ySym = yahooMap[stock.symbol];
          if (ySym) {
            allSymbols.push(ySym);
            symbolToYahoo[stock.symbol] = ySym;
          }
        }
      }
      if (allSymbols.length === 0) { setIsRefreshing(false); return; }

      const res = await fetch(`/api/ticker?symbols=${encodeURIComponent(allSymbols.join(','))}`);
      if (!res.ok) { setIsRefreshing(false); return; }
      const json = await res.json();
      if (!json?.success || !json?.data) { setIsRefreshing(false); return; }
      const quotes: Record<string, { price?: number; change?: number; changePct?: number; volume?: number }> = json.data;

      const yahooToSymbol: Record<string, string> = {};
      for (const [sym, ySym] of Object.entries(symbolToYahoo)) {
        yahooToSymbol[ySym] = sym;
      }

      setLiveData((prev) => {
        const updated = { ...prev };
        updated[market] = sectors.map((sector) => ({
          ...sector,
          stocks: sector.stocks.map((stock) => {
            const ySym = symbolToYahoo[stock.symbol];
            if (!ySym) return stock;
            const q = quotes[ySym];
            if (!q) return stock;
            return {
              ...stock,
              price: q.price ?? stock.price,
              change: q.changePct ?? stock.change,
              volume: q.volume ?? 0,
            };
          }),
        }));
        return updated;
      });
    } catch { /* silent fallback */ }
    finally { setIsRefreshing(false); }
  }, [market]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  // ─── التحديث التلقائي ───────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh) { setCountdown(30); return; }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { fetchPrices(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchPrices]);

  // ─── اختصار لوحة المفاتيح: Ctrl+F يركّز البحث ─────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── جلب البيانات الشرعية عند فتح نافذة السهم ────────────────
  useEffect(() => {
    if (!selectedStock) { setShariaData(null); return; }
    let cancelled = false;
    setShariaLoading(true);
    setShariaData(null);
    const { symbol } = selectedStock.stock;
    fetch(`/api/sharia-lookup?symbol=${encodeURIComponent(symbol)}&market=${encodeURIComponent(market)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setShariaData(data); })
      .catch(() => { if (!cancelled) setShariaData({ found: false }); })
      .finally(() => { if (!cancelled) setShariaLoading(false); });
    return () => { cancelled = true; };
  }, [selectedStock, market]);

  const currentMarket = marketInfo[market];
  const allSectors = useMemo(() => (liveData[market] || []).map((s) => s.sector), [liveData, market]);

  // ─── البيانات المُصفَّاة ────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = liveData[market] || [];
    if (sectorFilter) data = data.filter((s) => s.sector === sectorFilter);
    const q = search.toLowerCase();
    return data
      .map((sector) => ({
        ...sector,
        stocks: sector.stocks.filter((stock) => {
          const matchSearch = !q || stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q);
          const matchChange =
            changeFilter === 'all'        ? true :
            changeFilter === 'gainers'    ? stock.change > 0 :
            changeFilter === 'losers'     ? stock.change < 0 :
            changeFilter === 'strong_gain'? stock.change >= 2 :
            changeFilter === 'strong_loss'? stock.change <= -2 : true;
          return matchSearch && matchChange;
        }),
      }))
      .filter((s) => s.stocks.length > 0);
  }, [liveData, market, sectorFilter, search, changeFilter]);

  // ─── إحصائيات السوق الكاملة (غير مُصفَّاة) ────────────────────
  const allStocks = useMemo(() => (liveData[market] || []).flatMap((s) => s.stocks), [liveData, market]);
  const gainers = allStocks.filter((s) => s.change > 0).length;
  const losers  = allStocks.filter((s) => s.change < 0).length;
  const neutral = allStocks.filter((s) => s.change === 0).length;
  const avgChange = allStocks.length ? (allStocks.reduce((a, s) => a + s.change, 0) / allStocks.length) : 0;

  // ─── أداء القطاعات ─────────────────────────────────────────────
  const sectorPerformance = useMemo(() =>
    (liveData[market] || []).map((s) => ({
      sector: s.sector,
      avg: s.stocks.reduce((a, st) => a + st.change, 0) / (s.stocks.length || 1),
    })).sort((a, b) => b.avg - a.avg),
  [liveData, market]);

  // ─── حجم خلية النسبية ──────────────────────────────────────────
  const getProportionalSize = useCallback((price: number, sectorStocks: StockData[]): 'small' | 'normal' | 'large' | 'xlarge' => {
    const max = Math.max(...sectorStocks.map((s) => s.price));
    const r = price / max;
    if (r > 0.6) return 'xlarge';
    if (r > 0.3) return 'large';
    if (r > 0.1) return 'normal';
    return 'small';
  }, []);

  // ─── إضافة لقائمة المتابعة ─────────────────────────────────────
  const handleAddToWatchlist = useCallback(async () => {
    if (!selectedStock) return;
    if (!token) {
      toast({ title: 'يجب تسجيل الدخول', description: 'سجّل دخولك أولاً لإضافة أسهم لقائمة المتابعة', variant: 'destructive' });
      return;
    }
    setIsAddingToWatchlist(true);
    try {
      // نحاول إنشاء قائمة مشاهدة جديدة بنفس اسم السهم
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: `${selectedStock.stock.symbol} – ${selectedStock.stock.name}` }),
      });
      if (res.ok) {
        toast({ title: 'تمت الإضافة ✓', description: `${selectedStock.stock.name} أُضيف لقائمة المتابعة` });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'فشلت الإضافة', description: err?.error ?? 'حدث خطأ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'فشلت الإضافة', description: 'تحقق من اتصالك بالشبكة', variant: 'destructive' });
    } finally { setIsAddingToWatchlist(false); }
  }, [selectedStock, token, toast]);

  // ─── بيانات تداول السهم المحدد ────────────────────────────────
  const selectedStockExtras = selectedStock ? {
    volume: selectedStock.stock.volume ?? 0,
    dayHigh: parseFloat((selectedStock.stock.price * 1.015).toFixed(2)),
    dayLow:  parseFloat((selectedStock.stock.price * 0.985).toFixed(2)),
    marketCap: estimateMarketCap(selectedStock.stock.price),
    pe: 0,
    dividend: 0,
  } : null;

  // ─── تصيير ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="🗺️ الخريطة الحرارية" />
        <main className="p-6 space-y-6">

          {/* ── شريط التحكم العلوي ── */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">الخريطة الحرارية للأسهم</h2>
                <p className="text-sm text-muted-foreground">
                  عرض مرئي لأداء الأسهم · انقر على أي سهم للتفاصيل والروابط
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* اختيار السوق */}
                <Select value={market} onValueChange={(v) => { setMarket(v); setSectorFilter(null); }}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="اختر السوق" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(marketInfo).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* التحديث التلقائي */}
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh((v) => !v)}
                  className="gap-1.5"
                >
                  <Clock className="h-4 w-4" />
                  {autoRefresh ? `${countdown}ث` : 'تحديث تلقائي'}
                </Button>

                {/* تحديث يدوي */}
                <Button variant="outline" size="sm" onClick={fetchPrices} disabled={isRefreshing} className="gap-1.5">
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  تحديث
                </Button>

                {/* أوضاع العرض */}
                <div className="flex items-center border rounded-lg overflow-hidden">
                  {([
                    { mode: 'grid',         icon: Grid3X3,   label: 'شبكة' },
                    { mode: 'compact',      icon: List,       label: 'مضغوط' },
                    { mode: 'proportional', icon: Maximize2,  label: 'نسبي' },
                  ] as const).map(({ mode, icon: Icon, label }) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode(mode)}
                      title={label}
                      className="rounded-none border-0 px-2.5"
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── بار الحالة (Breadth) ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <ColorScale />
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">اتساع السوق</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden bg-red-200 dark:bg-red-900/40">
                  <div
                    className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all"
                    style={{ width: allStocks.length ? `${(gainers / allStocks.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {gainers}↑ {losers}↓ {neutral}–
                </span>
                <Badge variant={avgChange >= 0 ? 'default' : 'destructive'} className="text-xs">
                  متوسط: {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* ── إحصائيات سريعة ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'أسهم مرتفعة', value: gainers,           color: 'green', Icon: TrendingUp },
              { label: 'أسهم منخفضة', value: losers,            color: 'red',   Icon: TrendingDown },
              { label: 'أسهم ثابتة',  value: neutral,           color: 'blue',  Icon: Minus },
              { label: 'إجمالي الأسهم', value: allStocks.length, color: 'amber', Icon: Thermometer },
            ].map(({ label, value, color, Icon }) => (
              <Card key={label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── أداء القطاعات ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                أداء القطاعات – {currentMarket?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sectorPerformance.map(({ sector, avg }) => (
                  <button
                    key={sector}
                    className={cn(
                      'w-full flex items-center gap-3 group rounded-lg px-2 py-1.5 transition-colors',
                      'hover:bg-muted/60',
                      sectorFilter === sector && 'bg-muted'
                    )}
                    onClick={() => setSectorFilter(sectorFilter === sector ? null : sector)}
                  >
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0 truncate">{sector}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className={cn('h-full rounded-full transition-all', avg >= 0 ? 'bg-green-500' : 'bg-red-500')}
                        style={{ width: `${Math.min(Math.abs(avg) * 15, 100)}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-semibold w-14 text-left shrink-0', avg >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {avg >= 0 ? '+' : ''}{avg.toFixed(2)}%
                    </span>
                    <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0', sectorFilter === sector && 'opacity-100 rotate-90')} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── شريط الفلاتر ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* بحث */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                className="pr-9"
                placeholder="بحث بالرمز أو الاسم… (Ctrl+F)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* فلاتر التغيير */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { id: 'all',         label: 'الكل',       variant: 'outline' },
                { id: 'gainers',     label: '↑ مرتفعة',   variant: 'outline' },
                { id: 'strong_gain', label: '↑↑ قوية',    variant: 'outline' },
                { id: 'losers',      label: '↓ منخفضة',   variant: 'outline' },
                { id: 'strong_loss', label: '↓↓ هبوط حاد',variant: 'outline' },
              ] as const).map(({ id, label }) => (
                <Button
                  key={id}
                  size="sm"
                  variant={changeFilter === id ? 'default' : 'outline'}
                  onClick={() => setChangeFilter(id)}
                  className="text-xs h-8"
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* مسح فلتر القطاع */}
            {sectorFilter && (
              <Button size="sm" variant="secondary" onClick={() => setSectorFilter(null)} className="gap-1.5 text-xs">
                <X className="h-3.5 w-3.5" />
                {sectorFilter}
              </Button>
            )}

            {/* عدد النتائج */}
            <span className="text-xs text-muted-foreground mr-auto">
              {filteredData.flatMap((s) => s.stocks).length} سهم
            </span>
          </div>

          {/* ── الخريطة الحرارية ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                توزيع الأداء حسب القطاعات – {currentMarket?.label}
                {viewMode === 'proportional' && (
                  <Badge variant="secondary" className="text-[10px]">حجم الخلية نسبي للسعر</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>لا توجد نتائج مطابقة للبحث</p>
                </div>
              ) : (
              <div className="space-y-6">
                {filteredData.map((sector) => {
                  const sectorAvg = sector.stocks.reduce((a, s) => a + s.change, 0) / sector.stocks.length;
                  return (
                  <div key={sector.sector}>
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        className="text-sm font-semibold hover:text-primary transition-colors"
                        onClick={() => setSectorFilter(sectorFilter === sector.sector ? null : sector.sector)}
                      >
                        {sector.sector}
                      </button>
                      <Badge variant="outline" className="text-[10px]">{sector.stocks.length} سهم</Badge>
                      <div className="flex-1 h-px bg-border" />
                      <span className={cn('text-sm font-semibold', sectorAvg >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {sectorAvg >= 0 ? '+' : ''}{sectorAvg.toFixed(2)}%
                      </span>
                    </div>
                    <div className={cn('flex flex-wrap', viewMode === 'compact' ? 'gap-1' : 'gap-2')}>
                      {sector.stocks.map((stock) => {
                        const size = viewMode === 'compact'      ? 'small'
                                   : viewMode === 'proportional' ? getProportionalSize(stock.price, sector.stocks)
                                   : 'normal';
                        return (
                          <HeatmapCell
                            key={stock.symbol}
                            stock={stock}
                            size={size}
                            currency={currentMarket?.currency}
                            highlighted={!!search && (
                              stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
                              stock.name.toLowerCase().includes(search.toLowerCase())
                            )}
                            onClick={() => setSelectedStock({ stock, sector: sector.sector })}
                          />
                        );
                      })}
                    </div>
                  </div>
                );})}
              </div>
              )}
            </CardContent>
          </Card>

          {/* ── أفضل وأسوأ الأسهم (قابلة للنقر) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* أعلى الارتفاعات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  أعلى الارتفاعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allStocks
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 7)
                    .map((stock, index) => {
                      const sectorName = (liveData[market] || []).find((s) => s.stocks.some((st) => st.symbol === stock.symbol))?.sector ?? '';
                      return (
                        <button
                          key={stock.symbol}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-right"
                          onClick={() => setSelectedStock({ stock, sector: sectorName })}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-[10px] font-bold text-green-700 shrink-0">
                              {index + 1}
                            </span>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{stock.symbol}</p>
                              <p className="text-[10px] text-muted-foreground">{stock.name}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-green-600 text-sm">+{stock.change.toFixed(2)}%</p>
                            <p className="text-[10px] text-muted-foreground">{stock.price.toLocaleString()} {currentMarket?.currency}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* أعلى الانخفاضات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  أعلى الانخفاضات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allStocks
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 7)
                    .map((stock, index) => {
                      const sectorName = (liveData[market] || []).find((s) => s.stocks.some((st) => st.symbol === stock.symbol))?.sector ?? '';
                      return (
                        <button
                          key={stock.symbol}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-right"
                          onClick={() => setSelectedStock({ stock, sector: sectorName })}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-[10px] font-bold text-red-700 shrink-0">
                              {index + 1}
                            </span>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{stock.symbol}</p>
                              <p className="text-[10px] text-muted-foreground">{stock.name}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-red-600 text-sm">{stock.change.toFixed(2)}%</p>
                            <p className="text-[10px] text-muted-foreground">{stock.price.toLocaleString()} {currentMarket?.currency}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── ملاحظات وروابط ── */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200">حول الخريطة الحرارية</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    اللون الأخضر = ارتفاع · الأحمر = انخفاض · كثافة اللون تعكس حجم التغيير.
                    انقر على أي خلية للاطلاع على التفاصيل وفتح الرسم البياني أو صفحة السوق.
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-[10px]">Ctrl+F</kbd>
                    للبحث السريع
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ── نافذة تفاصيل السهم (محسّنة بالروابط الحقيقية) ── */}
      <Dialog open={!!selectedStock} onOpenChange={(open) => { if (!open) setSelectedStock(null); }}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Thermometer className="h-5 w-5" />
              تفاصيل السهم
            </DialogTitle>
          </DialogHeader>
          {selectedStock && selectedStockExtras && (
            <div className="space-y-4 pt-1">

              {/* ── رأس السهم ── */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-14 w-14 rounded-xl flex flex-col items-center justify-center text-sm font-bold shrink-0',
                  getChangeColor(selectedStock.stock.change)
                )}>
                  {selectedStock.stock.change >= 0
                    ? <TrendingUp className="h-5 w-5" />
                    : <TrendingDown className="h-5 w-5" />}
                  <span className="text-[9px] mt-0.5">
                    {selectedStock.stock.change >= 0 ? '+' : ''}{selectedStock.stock.change.toFixed(2)}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold">{selectedStock.stock.symbol}</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedStock.stock.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{selectedStock.sector}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{currentMarket?.label}</Badge>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-2xl font-bold">{selectedStock.stock.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{currentMarket?.currency}</p>
                </div>
              </div>

              <Separator />

              {/* ── بيانات التداول ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" /> بيانات التداول
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'أعلى اليوم',   value: `${selectedStockExtras.dayHigh.toLocaleString()} ${currentMarket?.currency}`, cls: 'text-green-600' },
                    { label: 'أدنى اليوم',   value: `${selectedStockExtras.dayLow.toLocaleString()} ${currentMarket?.currency}`,  cls: 'text-red-600' },
                    { label: 'حجم التداول',  value: selectedStockExtras.volume.toLocaleString(),   cls: '' },
                    { label: 'القيمة السوقية', value: selectedStockExtras.marketCap,                cls: '' },
                    { label: 'مكرر الأرباح', value: `${selectedStockExtras.pe}x`,                  cls: '' },
                    { label: 'العائد الربحي', value: `${selectedStockExtras.dividend}%`,            cls: 'text-blue-600' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                      <p className={cn('text-xs font-semibold', cls)}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* ── المعايير الشرعية ── */}
              {shariaLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  جاري تحميل البيانات الشرعية…
                </div>
              ) : shariaData?.found ? (
                <div className="space-y-3">
                  {/* الحالة الإجمالية */}
                  <div className="flex items-center justify-between p-3 rounded-xl border-2
                    bg-gradient-to-l from-transparent
                    data-[status=halal]:border-green-400 data-[status=halal]:from-green-50/60
                    data-[status=haram]:border-red-400   data-[status=haram]:from-red-50/60
                    data-[status=mixed]:border-yellow-400 data-[status=mixed]:from-yellow-50/60
                    dark:data-[status=halal]:from-green-900/20
                    dark:data-[status=haram]:from-red-900/20
                    dark:data-[status=mixed]:from-yellow-900/20"
                    data-status={
                      shariaData.overall === '✅' ? 'halal' :
                      shariaData.overall === '❌' ? 'haram' : 'mixed'
                    }
                  >
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">التقييم الشرعي الإجمالي</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{shariaData.overall ?? '🟡'}</span>
                        <span className={cn(
                          'font-bold text-sm',
                          shariaData.overall === '✅' ? 'text-green-700 dark:text-green-400' :
                          shariaData.overall === '❌' ? 'text-red-700 dark:text-red-400' :
                          'text-yellow-700 dark:text-yellow-400'
                        )}>
                          {shariaData.overall === '✅' ? 'متوافق شرعياً' :
                           shariaData.overall === '❌' ? 'غير متوافق شرعياً' :
                           'يحتاج مراجعة'}
                        </span>
                      </div>
                    </div>
                    <div className="text-left space-y-0.5">
                      {shariaData.grade && (
                        <div>
                          <span className="text-[10px] text-muted-foreground">التقدير: </span>
                          <span className="font-bold text-sm">{shariaData.grade}</span>
                        </div>
                      )}
                      {shariaData.recommendation && shariaData.recommendation !== '—' && (
                        <div className="text-sm">{shariaData.recommendation}</div>
                      )}
                    </div>
                  </div>

                  {/* الأربعة معايير */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">المعايير الأربعة</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'بنك البلاد',      value: shariaData.bilad   },
                        { label: 'مصرف الراجحي',    value: shariaData.rajhi   },
                        { label: 'مكتب المقاصد',    value: shariaData.maqasid },
                        { label: 'معيار صفر ديون',  value: shariaData.zerodebt },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className={cn(
                            'flex items-center justify-between rounded-lg px-3 py-2 border',
                            value === '✅'
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                              : value === '❌'
                              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                              : 'bg-muted/50 border-border'
                          )}
                        >
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-base leading-none">{value ?? '🟡'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* نسبة التطهير */}
                  {shariaData.purification && shariaData.purification !== '—' && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">نسبة التطهير</span>
                      <span className="font-bold text-sm text-blue-700 dark:text-blue-300">
                        {shariaData.purification}
                      </span>
                    </div>
                  )}
                </div>
              ) : shariaData && !shariaData.found ? (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  لا توجد بيانات شرعية لهذا الرمز في قاعدة البيانات
                </div>
              ) : null}

              <Separator />

              {/* ── روابط (حقيقية) ── */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" /> روابط سريعة
                </p>

                {/* رابط TradingView مع البورصة الصحيحة */}
                <a
                  href={getTradingViewUrl(selectedStock.stock.symbol, market)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group"
                >
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">الرسم البياني – TradingView</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {MARKET_TV_PREFIX[market] ? `${MARKET_TV_PREFIX[market]}:${selectedStock.stock.symbol}` : selectedStock.stock.symbol}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                {/* رابط صفحة السوق الداخلية */}
                <Link
                  href={`/markets/${MARKET_INTERNAL_PATH[market] ?? market.toUpperCase()}`}
                  onClick={() => setSelectedStock(null)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group"
                >
                  <Layers className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">صفحة السوق – {currentMarket?.label}</p>
                    <p className="text-[10px] text-muted-foreground">عرض مؤشرات وبيانات السوق الكاملة</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                {/* رابط الفلتر بالقطاع في الخريطة */}
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group text-right"
                  onClick={() => {
                    setSectorFilter(selectedStock.sector);
                    setSelectedStock(null);
                  }}
                >
                  <Filter className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">عرض قطاع {selectedStock.sector} فقط</p>
                    <p className="text-[10px] text-muted-foreground">تصفية الخريطة بهذا القطاع</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                {/* رابط التنبيهات */}
                <Link
                  href="/profile?tab=alerts"
                  onClick={() => setSelectedStock(null)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group"
                >
                  <Bell className="h-5 w-5 text-violet-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">إضافة تنبيه سعري</p>
                    <p className="text-[10px] text-muted-foreground">ضبط تنبيه لـ {selectedStock.stock.symbol} في صفحة الملف الشخصي</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>

              {/* ── إضافة لقائمة المتابعة ── */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleAddToWatchlist}
                  disabled={isAddingToWatchlist}
                >
                  <Star className="h-4 w-4" />
                  {isAddingToWatchlist ? 'جاري الإضافة…' : 'إضافة لقائمة المتابعة'}
                </Button>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
