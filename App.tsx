import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bus, Ship, Settings, Clock, Check, Calendar, Sun, Briefcase, ChevronRight, Star, ArrowDownCircle, ArrowUpCircle, Moon, Sun as SunIcon, Monitor, Type, Info, MessageSquareWarning, AlertTriangle, Send, X, ChevronLeft, CloudSync, CloudOff, ExternalLink, MapPin } from 'lucide-react';
import { routes } from './data';
import { 
  getDayType,
  parseTimeToSeconds, 
  getSecondsSinceStartOfDay, 
  findNextDepartures,
  addMinutesToTime,
  DayType
} from './utils';
import { Route, TransportType, Direction, CountdownState, Language, ScheduleOverride, ThemeMode, FontSize } from './types';

// --- CONFIGURATION START ---
const SHEET_ID = '1FjL88rkpzKIGlrfyD9SLvyHv0ePjsGpF1b5ftqlw39g';
const GOOGLE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzG8_7V19QzMVozl2igG3cRulSdsxA-TaVRu4RM5rX8VrF1u5HdQ6_o4g-jNUWN2LY-/exec';
const EXTERNAL_REPORT_URL = 'https://forms.gle/6MdPfbQQsRhRFnrP9';

const FORM_VALUE_MAPPING = {
  issue: {
    jam: 'Traffic jam',
    accident: 'Traffic accident',
    breakdown: 'Vehicle breakdown',
    roadwork: 'Road works',
    other: 'Other'
  },
  delay: {
    short: '2',
    medium: '15',
    long: '35'
  }
};
// --- CONFIGURATION END ---

const translations = {
  en: {
    nextArrival: 'Time Remaining',
    laterDepartures: 'Later departures',
    onSchedule: 'Estimated',
    bus: 'Bus',
    ferry: 'Ferry',
    settings: 'Settings',
    noMoreService: 'No more service',
    serviceEnded: 'Service has ended for today.',
    scheduledAt: 'Departure time',
    language: 'Language',
    close: 'Close',
    min: 'MIN',
    sec: 'SEC',
    hr: 'HR',
    selectLanguage: 'Select Language',
    scheduleType: 'Schedule Type',
    auto: 'Auto',
    weekday: 'Weekday',
    saturday: 'Saturday',
    sunday: 'Holiday/Sunday',
    forceMode: 'Mode: ',
    fullSchedule: 'Full Schedule',
    switchFerryToCentral: 'Ferry (To Central)',
    switchFerryToPI: 'Ferry (To Park Island)',
    switchBusToCentral: 'Bus (To Central)',
    switchBusToPI: 'Bus (To Park Island)',
    switchFerryToTW: 'Ferry (To Tsuen Wan)',
    switchBusToTWWest: 'Bus (To TW West)',
    viaHZMB: 'via HZMB',
    normal: 'Normal',
    lastDeparture: 'Last Departure',
    show48h: 'Show 48h',
    show12h: "Show today's remaining departures",
    show24h: 'Show 24h',
    showFullDay: 'Show Full Day',
    kwaiFongOvernight: 'Kwai Fong Overnight Departures',
    viaKwaiFong: 'Via Kwai Fong',
    viaTsingYi: 'Via Tsing Yi',
    overnightWanChai: 'Overnight Departures (via Wan Chai)',
    overnightGeneric: 'Overnight Departures',
    theme: 'Theme Color',
    mode_auto: 'Auto (Time based)',
    mode_day: 'Day (Bright Blue)',
    mode_night: 'Night (Classic)',
    fontSize: 'Font Size',
    size_normal: 'Default',
    size_large: 'Larger',
    statusLabel: 'Status: ',
    statusNormal: 'Normal',
    statusAffected: 'Maybe Affected',
    statusSerious: 'Heavily Affected',
    trafficInfo: 'Traffic Status',
    trafficNormalContent: 'Traffic flow is likely normal. Estimated delay is 0-8 minutes.',
    featureUnavailable: 'This function is currently unavailable',
    noIncidents: 'No major incidents reported affecting this route.',
    chineseOnly: '(Content available in Chinese only)',
    reportTraffic: 'Report Traffic',
    back: 'Back',
    submitReport: 'Submit Report',
    reportSent: 'Report sent. Thank you!',
    issueType: 'Issue Type',
    location: 'Location (Optional)',
    estDelay: 'Est. Delay',
    type_jam: 'Traffic Jam',
    type_accident: 'Accident',
    type_breakdown: 'Vehicle Breakdown',
    type_roadwork: 'Road Works',
    type_other: 'Other',
    delay_short: '< 10 mins',
    delay_medium: '10 - 30 mins',
    delay_long: '> 30 mins',
    userReported: 'User Report',
    reportedAt: 'Reported at',
    syncSuccess: 'Cloud Sync Active',
    syncError: 'Cloud Offline',
    openForm: 'Open Report Form',
    referenceOnly: 'Data is for reference only',
    lastUpdateLabel: 'Last News Update: ',
    departFrom: 'Depart from:',
    realTimeETA: 'Real-time ETA',
    switchToSchedule: 'Switch to Schedule',
    noData: 'No Data',
    dataSource: 'Data from data.gov.hk, refreshes every 60s'
  },
  zh: {
    nextArrival: '開出時間剩餘',
    laterDepartures: '稍後班次',
    onSchedule: '預定班次',
    bus: '巴士',
    ferry: '渡輪',
    settings: '設定',
    noMoreService: '今日服務已經結束',
    serviceEnded: '今日班次已全部開出',
    scheduledAt: '開出時間',
    language: '語言',
    close: '關閉',
    min: '分鐘',
    sec: '秒',
    hr: '小時',
    selectLanguage: '選擇語言',
    scheduleType: '班次類型',
    auto: '自動',
    weekday: '平日',
    saturday: '星期六',
    sunday: '紅日/星期日',
    forceMode: '模式: ',
    fullSchedule: '全日班次',
    switchFerryToCentral: '渡輪 (往中環)',
    switchFerryToPI: '渡輪 (往珀麗灣)',
    switchBusToCentral: '巴士 (往中環)',
    switchBusToPI: '巴士 (往珀麗灣)',
    switchFerryToTW: '渡輪 (往荃灣)',
    switchBusToTWWest: '巴士 (往荃灣西)',
    viaHZMB: '經港珠澳',
    normal: '不經港珠澳',
    lastDeparture: '尾班',
    show48h: '顯示48小時',
    show12h: '顯示今日餘下班次',
    show24h: '顯示24小時',
    showFullDay: '顯示全日班次',
    kwaiFongOvernight: '葵芳通宵班次',
    viaKwaiFong: '經葵芳',
    viaTsingYi: '經青衣',
    overnightWanChai: '通宵班次（經灣仔）',
    overnightGeneric: '通宵班次',
    theme: '主題顏色',
    mode_auto: '自動 (按時間)',
    mode_day: '日間 (亮藍)',
    mode_night: '夜間 (經典)',
    fontSize: '字體大小',
    size_normal: '預設',
    size_large: '較大',
    statusLabel: '服務狀態: ',
    statusNormal: '正常',
    statusAffected: '可能會受阻',
    statusSerious: '嚴重受阻',
    trafficInfo: '交通狀況',
    trafficNormalContent: '交通大致暢順。預計延誤為 0-8 分鐘。',
    featureUnavailable: '此功能尚未啟用',
    noIncidents: '暫無影響此路線的即時交通事故報告。',
    chineseOnly: '',
    reportTraffic: '交通報料',
    back: '返回',
    submitReport: '提交報告',
    reportSent: '報告已發送，謝謝！',
    issueType: '事故類型',
    location: '位置 (選填)',
    estDelay: '預計延誤',
    type_jam: '一帶擠塞',
    type_accident: '交通意外',
    type_breakdown: '壞車',
    type_roadwork: '道路工程',
    type_other: '其他',
    delay_short: '少於 10 分鐘',
    delay_medium: '10 - 30 分鐘',
    delay_long: '超過 30 分鐘',
    userReported: '用戶報料',
    reportedAt: '報告時間',
    syncSuccess: '已同步雲端',
    syncError: '雲端連線失敗',
    openForm: '前往報料表單',
    referenceOnly: '資訊僅供參考',
    lastUpdateLabel: '路況資訊更新時間: ',
    departFrom: '出發地點:',
    realTimeETA: '實時班次',
    switchToSchedule: '切換至時間表',
    noData: '暫無數據',
    dataSource: '數據由資料一線通提供，每60秒更新'
  }
};

interface Badge {
  text: string;
  className: string;
}

interface ScheduleItem {
  time: string;
  timestamp: number;
  badges: Badge[];
  dateLabel?: string;
}

type TrafficStatusType = 'normal' | 'affected' | 'serious';
interface TrafficNewsData {
  status: TrafficStatusType;
  details: {
    en: string[];
    zh: string[];
  };
}

interface UserReport {
  timestamp: number;
  route: string;
  issue: string;
  location: string;
  delay: string;
}

const INCIDENT_KEYWORDS = [
  '交通意外', '部份行車線封閉', '壞車', '壞車阻路', '一帶車多', 
  '全線封閉', '慢車', '交通繁忙', '車多', '車龍待散', 
  '一帶擠塞', '一帶交通擠塞', '擠塞', '龍尾', '一帶車多繁忙',
  '唯一行車線封閉', '行車線封閉'
];
const RECOVERY_KEYWORDS = ['交通復常', '交通回復正常'];

const unique = (arr: string[]) => Array.from(new Set(arr));

const ROUTE_KEYWORDS: Record<string, string[]> = {
  'NR330': unique(['青馬大橋', '青敬路', '担杆山交匯處', '青衣北岸公路', '青衣西北交匯處', '青嶼幹線', '青荃路', '荃青交匯處']),
  'NR332': unique(['青馬大橋', '青嶼幹線', '青衣西北交匯處', '青衣北岸公路', '青荃路', '荃青交匯處', '荃灣路', '興芳路', '葵福路', '葵仁路', '興寧路']),
  'NR331': unique(['青馬大橋', '青嶼幹線', '青衣西北交匯處', '青衣北岸公路', '青荃路', '德士古道', '德士古道北', '德士古道天橋', '城門道', '西樓角路', '大河道', '青山公路-荃灣段', '青山公路-葵涌段', '國瑞路']),
  'NR331S': unique(['青馬大橋', '青嶼幹線', '青衣西北交匯處', '青衣北岸公路', '青荃路', '德士古道', '德士古道北', '德士古道天橋', '荃錦交匯處', '大河道北', '大河道', '海貴路', '大河道', '大河道北']),
  'NR334': unique(['青馬大橋', '青衣西北交匯處', '青嶼幹線', '北大嶼山公路', '機場路', '駿運路交滙處', '觀景路', '國泰城通道路', '觀景路', '東岸路', '機場路', '暢航路', '暢連路', '暢達路', '機場北交滙處', '機場路', '航天城路', '航天城交匯處', '赤鱲角路', '順朗路']),
  'NR338': unique(['青馬大橋', '青嶼幹線', '青衣西北交匯處', '長青公路', '長青隧道', '青葵公路', '西九龍公路', '西區海底隧道', '干諾道西天橋', '干諾道中天橋', '中環及灣仔繞道', '民寶街', '金融街', '民祥街', '民耀街', '民光街', '民耀街', '民祥街', '干諾道中西行', '干諾道西']),
  '230R': unique(['雅翔道', '柯士甸道西', '廣東道', '梳士巴利道', '九龍公園徑', '佐敦道', '連翔道', '海輝道', '深旺道', '東京街西', '西九龍公路', '青葵公路', '長青隧道', '長青公路', '青衣西北交匯處', '青嶼幹線', '欽州街西', '青馬大橋'])
};

const CurrentTimeBar: React.FC<{ now: Date; lang: Language; displayType: DayType; themeColor: string; fontSize: FontSize }> = ({ now, lang, displayType, themeColor, fontSize }) => {
  const t = translations[lang];
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-HK' : 'en-GB', options);
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  const dateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const dayStr = getPart('weekday');
  const timeStr = `${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  const typeLabel = t[displayType as keyof typeof t];
  const labelSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const timeSize = fontSize === 'large' ? 'text-4xl' : 'text-3xl';
  const bgClass = themeColor === 'dayblue' ? `bg-dayblue-500` : `bg-indigo-950`;
  const labelColorClass = themeColor === 'dayblue' ? `text-white/80` : `text-indigo-300`;
  const badgeBgClass = themeColor === 'dayblue' ? `bg-white/20` : `bg-indigo-600`;

  return (
    <div className={`${bgClass} text-white pt-8 pb-3 px-4 flex flex-col items-center justify-center border-b border-white/10 shadow-xl transition-all duration-500`}>
      <div className={`flex items-center space-x-2 ${labelColorClass} font-bold tracking-widest ${labelSize} uppercase mb-1`}>
        <span>{dateStr}</span>
        <span className={`w-1 h-1 bg-white/40 rounded-full`}></span>
        <span>{dayStr}</span>
        <span className={`w-1 h-1 bg-white/40 rounded-full`}></span>
        <span className={`text-white ${badgeBgClass} px-2 py-0.5 rounded-full backdrop-blur-sm`}>{typeLabel as string}</span>
      </div>
      <div className={`mono ${timeSize} font-black text-white tracking-tighter tabular-nums drop-shadow-lg`}>
        {timeStr}
      </div>
    </div>
  );
};

const Header: React.FC<{
  selectedRoute: Route;
  onSelectRoute: (route: Route) => void;
  filteredRoutes: Route[];
  lang: Language;
  scheduleOverride: ScheduleOverride;
  onToggleOverride: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  themeColor: string;
  fontSize: FontSize;
}> = ({ selectedRoute, onSelectRoute, filteredRoutes, lang, scheduleOverride, onToggleOverride, favorites, onToggleFavorite, themeColor, fontSize }) => {
  const t = translations[lang];
  const scrollRef = useRef<HTMLDivElement>(null);
  const getIcon = () => {
    switch(scheduleOverride) {
      case 'auto': return <span className="font-black text-sm">A</span>;
      case 'weekday': return <Briefcase size={14} />;
      case 'saturday': return <Sun size={14} className="text-amber-400" />;
      case 'sunday': return <Sun size={14} className="text-rose-400" />;
      default: return <span className="font-black text-sm">A</span>;
    }
  };
  useEffect(() => {
    const activeBtn = scrollRef.current?.querySelector('[data-active="true"]');
    if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedRoute.id]);
  const textSize = fontSize === 'large' ? 'text-sm' : 'text-xs';
  const buttonTextSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';

  return (
    <div className="bg-white pb-1 shadow-sm sticky top-0 z-30 border-b border-gray-100">
      <div className="flex items-center py-2 space-x-2">
        <div className="relative flex-1 overflow-hidden px-4">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div ref={scrollRef} className="flex overflow-x-auto custom-scrollbar space-x-3 pb-3 scroll-smooth touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
            {filteredRoutes.map((route) => {
              const isFav = favorites.includes(route.id);
              const isSelected = selectedRoute.id === route.id;
              return (
                <button key={route.id} data-active={isSelected} onClick={() => onSelectRoute(route)} className={`pl-4 pr-3 py-1.5 rounded-2xl ${textSize} font-black transition-all duration-300 flex-shrink-0 whitespace-nowrap flex items-center gap-3 ${isSelected ? `bg-${themeColor}-600 text-white shadow-xl shadow-${themeColor}-100 scale-105` : 'bg-slate-50 text-slate-500 hover:bg-slate-100 active:scale-95'}`}>
                  <span>{route.name[lang]}</span>
                  <div onClick={(e) => { e.stopPropagation(); onToggleFavorite(route.id); }} className="p-1 -mr-2 rounded-full hover:bg-white/20 transition-colors">
                    <Star size={14} className={`transition-colors ${isFav ? isSelected ? 'fill-yellow-300 text-yellow-300' : 'fill-amber-500 text-amber-500' : isSelected ? `text-${themeColor}-300 hover:text-white` : 'text-slate-300 hover:text-slate-400'}`} />
                  </div>
                </button>
              );
            })}
            <div className="flex-shrink-0 w-8" />
          </div>
        </div>
        <button onClick={onToggleOverride} className={`flex-shrink-0 flex items-center space-x-2 mr-4 px-3 py-1.5 bg-slate-900 rounded-2xl ${buttonTextSize} font-bold text-white active:scale-90 transition-all shadow-lg shadow-slate-200`}>
          {getIcon()}
          <span className="hidden xs:inline">{t[scheduleOverride as keyof typeof t] as string}</span>
        </button>
      </div>
    </div>
  );
};

const SegmentedControl: React.FC<{ directions: Direction[]; selectedIndex: number; onSelect: (index: number) => void; lang: Language; themeColor: string; fontSize: FontSize; }> = ({ directions, selectedIndex, onSelect, lang, themeColor, fontSize }) => {
  const textSize = fontSize === 'large' ? 'text-sm' : 'text-xs';
  return (
    <div className="mx-4 mt-2 bg-slate-100 p-1 rounded-2xl flex relative border border-slate-200/50">
      <div className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ width: 'calc(50% - 4px)', left: selectedIndex === 0 ? '4px' : 'calc(50%)' }} />
      {directions.map((dir, idx) => (
        <button key={idx} onClick={() => onSelect(idx)} className={`flex-1 py-2 ${textSize} font-extrabold z-10 transition-colors duration-300 ${selectedIndex === idx ? `text-${themeColor}-700` : 'text-slate-400'}`}>
          {dir.label[lang]}
        </button>
      ))}
    </div>
  );
};

const HeroCountdown: React.FC<{ minutes: number; seconds: number; departureTime: string; isAvailable: boolean; lang: Language; badges: Badge[]; themeColor: string; fontSize: FontSize; transportType: TransportType; onShowTraffic: () => void; trafficStatus: TrafficStatusType; }> = ({ minutes, seconds, departureTime, isAvailable, lang, badges, themeColor, fontSize, transportType, onShowTraffic, trafficStatus }) => {
  const t = translations[lang];
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const labelSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const badgeSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const timePillSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const bigDigitSize = fontSize === 'large' ? 'text-7xl' : 'text-6xl';
  const unitSize = fontSize === 'large' ? 'text-base' : 'text-sm';
  const noServiceSize = fontSize === 'large' ? 'text-2xl' : 'text-xl';
  const footerSize = fontSize === 'large' ? 'text-sm' : 'text-xs';
  const statusTextSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const getColorClass = () => { if (!isAvailable) return 'text-slate-300'; if (minutes < 1) return 'text-rose-500 animate-pulse'; if (minutes < 5) return 'text-amber-500'; return 'text-emerald-500'; };
  const getBgClass = () => { if (!isAvailable) return 'bg-white'; if (minutes < 1) return 'bg-rose-50/50 border-rose-100'; return 'bg-white border-gray-100'; };
  const getStatusStyles = () => { switch (trafficStatus) { case 'serious': return 'bg-rose-50 border-rose-100 text-rose-600'; case 'affected': return 'bg-amber-50 border-amber-100 text-amber-600'; default: return 'bg-emerald-50 border-emerald-100 text-emerald-600'; } };
  const getStatusLabel = () => { switch (trafficStatus) { case 'serious': return t.statusSerious; case 'affected': return t.statusAffected; default: return t.statusNormal; } };
  const labelColor = 'text-slate-400';
  const pillClass = `bg-${themeColor}-50 text-${themeColor}-700 border-${themeColor}-100/50`;

  return (
    <div className={`mx-4 mt-2 rounded-[24px] p-5 shadow-2xl shadow-${themeColor}-100/50 border transition-all duration-500 relative overflow-hidden ${getBgClass()}`}>
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <Clock size={120} strokeWidth={1} />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className={`${labelSize} font-black ${labelColor} uppercase tracking-[0.2em]`}>{t.nextArrival}</span>
          <div className="flex items-center gap-2">
             {badges.map((badge, idx) => ( <div key={idx} className={`px-2 py-1 rounded-lg ${badgeSize} font-black uppercase tracking-widest ${badge.className}`}>{badge.text}</div> ))}
             <div className={`px-3 py-1 rounded-full font-black ${timePillSize} border backdrop-blur-sm ${pillClass}`}>{departureTime}</div>
          </div>
        </div>
        <div className={`mono ${bigDigitSize} font-black flex items-baseline leading-none tracking-tighter ${getColorClass()}`}>
          {isAvailable ? (
            minutes >= 60 ? ( <> {Math.floor(minutes / 60)} <span className="text-2xl mx-1 opacity-50">:</span> <span className="text-4xl opacity-80">{(minutes % 60).toString().padStart(2, '0')}</span> <span className={`${unitSize} font-black ml-3 text-slate-300 tracking-normal`}>{t.hr}</span> </> ) 
            : minutes >= 1 ? ( <> {minutes} <span className="text-2xl mx-1 opacity-50">:</span> <span className="text-4xl opacity-80">{formattedSeconds}</span> <span className={`${unitSize} font-black ml-3 text-slate-300 tracking-normal`}>{t.min}</span> </> ) 
            : ( <> {seconds} <span className={`${unitSize} font-black ml-3 text-slate-300 tracking-normal`}>{t.sec}</span> </> )
          ) : ( <span className={`${noServiceSize} uppercase leading-tight tracking-tight`}>{t.noMoreService}</span> )}
        </div>
        <div className="mt-3 flex items-end justify-between">
            <p className={`${footerSize} text-slate-500 font-bold flex items-center`}> <Clock size={12} className="mr-2 opacity-30" /> {isAvailable ? `${t.scheduledAt} ${departureTime}` : t.serviceEnded} </p>
            {transportType === TransportType.BUS && (
               <button onClick={onShowTraffic} className={`flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full border active:scale-95 transition-transform ${getStatusStyles()}`}>
                 <span className={`${statusTextSize} font-bold`}> <span className="opacity-70">{t.statusLabel}</span> {getStatusLabel()} </span>
                 {trafficStatus === 'normal' ? <Info size={14} strokeWidth={2.5} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
               </button>
            )}
        </div>
      </div>
    </div>
  );
};

interface CrossRouteButtonProps { label: string; onAction: () => void; Icon: React.ElementType; }

const UpcomingSchedule: React.FC<{ items: ScheduleItem[]; lang: Language; isFullList: boolean; crossRoute?: CrossRouteButtonProps | null; routeId: string; directionIndex: number; canExtend: boolean; isExtendedView: boolean; onToggleView: () => void; collapseLabel: string; expandLabel: string; themeColor: string; fontSize: FontSize; currentTimeSeconds: number; activeType: TransportType; showRealTimeButton?: boolean; isRealTime?: boolean; onToggleRealTime?: () => void; }> = ({ items, lang, isFullList, crossRoute, routeId, directionIndex, canExtend, isExtendedView, onToggleView, collapseLabel, expandLabel, themeColor, fontSize, currentTimeSeconds, activeType, showRealTimeButton, isRealTime, onToggleRealTime }) => {
  const t = translations[lang];
  if (items.length === 0 && !showRealTimeButton) return null;
  const headerSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const buttonTextSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const stickyHeaderSize = fontSize === 'large' ? 'text-sm' : 'text-xs';
  const timeSize = fontSize === 'large' ? 'text-2xl' : 'text-xl';
  const badgeSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  const countdownTextSize = fontSize === 'large' ? 'text-xl' : 'text-sm';
  const getTimeDiffLabel = (timestamp: number, nowSecs: number, currentLang: Language) => {
    const diff = timestamp - nowSecs;
    if (diff <= 0) return null;
    const totalMins = Math.floor(diff / 60);
    const minLabel = currentLang === 'zh' ? '分鐘' : 'mins';
    const hrLabel = currentLang === 'zh' ? '小時' : 'hr';
    let value = totalMins < 60 ? `${totalMins}${minLabel}` : `${(totalMins / 60).toFixed(1)}${hrLabel}`;
    return `(${value})`;
  };

  return (
    <div className="mx-4 mt-4 mb-32">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          <h3 className={`${headerSize} font-black text-slate-400 uppercase tracking-[0.2em]`}> {isFullList ? t.fullSchedule : t.laterDepartures} </h3>
          {canExtend && ( <button onClick={onToggleView} className={`px-2 py-1 rounded-md bg-slate-100 ${buttonTextSize} font-bold text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1`}> {isExtendedView ? <> <ArrowUpCircle size={10} /> {collapseLabel} </> : <> <ArrowDownCircle size={10} /> {expandLabel} </> } </button> )}
          {showRealTimeButton && ( <button onClick={onToggleRealTime} className={`ml-2 px-2 py-1 rounded-md bg-slate-100 ${buttonTextSize} font-bold text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1`}> {isRealTime ? t.switchToSchedule : t.realTimeETA} </button> )}
        </div>
        {crossRoute && ( <button onClick={crossRoute.onAction} className="flex items-center space-x-2 bg-slate-200/60 hover:bg-slate-200 active:bg-slate-300 px-3 py-1.5 rounded-xl transition-all"> <crossRoute.Icon size={14} className="text-slate-600" /> <span className={`${buttonTextSize} font-bold text-slate-600`}>{crossRoute.label}</span> <ChevronRight size={12} className="text-slate-400" /> </button> )}
      </div>
      <div className="bg-white rounded-[24px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
        {items.length === 0 && isRealTime ? (
             <div className="p-8 text-center text-slate-400 font-bold text-sm">{t.noData}</div>
        ) : (
        items.map((item, idx) => {
          const showDateHeader = idx === 0 || item.dateLabel !== items[idx - 1].dateLabel;
          return (
            <React.Fragment key={`${item.timestamp}-${idx}`}>
              {isExtendedView && showDateHeader && item.dateLabel && ( <div className={`px-6 py-2 bg-slate-50 border-y border-slate-100 ${stickyHeaderSize} font-bold text-slate-500 sticky top-0`}> {item.dateLabel} </div> )}
              <div className={`flex items-center justify-between p-4 active:bg-slate-50 transition-colors ${ idx !== items.length - 1 ? 'border-b border-slate-50' : '' }`} >
                <div className="flex items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-4 shadow-sm bg-slate-50 text-${themeColor}-600`}> <Clock size={16} strokeWidth={2.5} /> </div>
                  <span className={`mono ${timeSize} font-black tracking-tighter tabular-nums text-slate-800`}>{item.time}</span>
                </div>
                <div className="flex items-center gap-3">
                    {idx === 0 && !isFullList && (activeType === TransportType.BUS || isRealTime) && ( <span className={`${countdownTextSize} font-bold text-slate-400 tabular-nums whitespace-nowrap`}> {getTimeDiffLabel(item.timestamp, currentTimeSeconds, lang)} </span> )}
                    <div className="flex flex-col items-end gap-1"> {item.badges.map((badge, bIdx) => ( <span key={bIdx} className={`${badgeSize} font-black px-3 py-1 rounded-full uppercase tracking-widest ${badge.className}`}> {badge.text} </span> ))} </div>
                </div>
              </div>
            </React.Fragment>
          );
        })
        )}
      </div>
    </div>
  );
};

const TrafficModal: React.FC<{ isOpen: boolean; onClose: () => void; lang: Language; themeColor: string; trafficNews: TrafficNewsData; lastUpdate: Date | null; selectedRoute: Route; syncStatus: 'success' | 'error' | 'syncing'; }> = ({ isOpen, onClose, lang, themeColor, trafficNews, lastUpdate, selectedRoute, syncStatus }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const newsItems = trafficNews.details[lang];
  const hasNews = newsItems.length > 0;
  const getStatusColorClass = () => { if (trafficNews.status === 'serious') return 'bg-rose-50 border-rose-100 text-rose-800'; if (trafficNews.status === 'affected') return 'bg-amber-50 border-amber-100 text-amber-800'; return 'bg-emerald-50 border-emerald-100 text-emerald-800'; };
  const getStatusIconColor = () => { if (trafficNews.status === 'serious') return 'text-rose-600 bg-rose-200/50'; if (trafficNews.status === 'affected') return 'text-amber-600 bg-amber-200/50'; return 'text-emerald-600 bg-emerald-200/50'; };
  const getStatusLabel = () => { if (trafficNews.status === 'serious') return t.statusSerious; if (trafficNews.status === 'affected') return t.statusAffected; return t.statusNormal; };
  
  const formattedTime = lastUpdate ? new Intl.DateTimeFormat(lang === 'zh' ? 'zh-HK' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(lastUpdate) : '--:--';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className={`absolute inset-0 bg-${themeColor}-950/40 backdrop-blur-md`} onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom duration-500 ease-out">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden"></div>
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col"> 
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.trafficInfo}</h2> 
            <div className="flex items-center gap-1.5 mt-1">
                {syncStatus === 'success' ? <CloudSync size={12} className="text-emerald-500" /> : syncStatus === 'syncing' ? <CloudSync size={12} className="text-amber-500 animate-spin" /> : <CloudOff size={12} className="text-rose-500" />}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{syncStatus === 'success' ? t.syncSuccess : syncStatus === 'syncing' ? '...' : t.syncError}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end text-right">
              <span className="text-[10px] text-slate-400 font-bold leading-tight mb-0.5">{t.referenceOnly}</span>
              <span className="text-[10px] text-slate-400 font-bold leading-tight">{t.lastUpdateLabel}{formattedTime}</span>
          </div>
        </div>
        
        {/* Main traffic information container (the rectangle) */}
        <div className={`rounded-3xl border mb-6 flex flex-col overflow-hidden ${getStatusColorClass()}`}>
            {/* Rectangle Header (Fixed Row) */}
            <div className="p-6 pb-2 border-b border-black/5 flex justify-between items-start">
                <div className="flex items-center gap-3"> 
                  <div className={`p-2 rounded-full ${getStatusIconColor()}`}> {trafficNews.status === 'normal' ? <Info size={24} /> : <AlertTriangle size={24} />} </div> 
                  <span className="font-black text-lg leading-tight">{getStatusLabel()}</span> 
                </div>
            </div>

            {/* Rectangle Content Area (Scrollable News/Reports) */}
            <div className="p-6 pt-4 max-h-[35vh] overflow-y-auto custom-scrollbar">
                {hasNews ? ( 
                  <div className="space-y-4"> 
                    {lang === 'en' && <p className="text-xs font-bold uppercase opacity-60 tracking-wider mb-2">{t.chineseOnly}</p>} 
                    {newsItems.map((item, idx) => ( 
                      <div key={idx} className="pb-3 border-b border-black/5 last:border-0 last:pb-0"> 
                        <p className="font-bold leading-relaxed text-sm opacity-90">{item}</p> 
                      </div> 
                    ))} 
                  </div> 
                ) : ( 
                  <p className="font-bold leading-relaxed text-sm opacity-80"> 
                    {trafficNews.status === 'normal' ? t.trafficNormalContent : t.noIncidents} 
                  </p> 
                )}
            </div>
        </div>

        <div className="space-y-3">
          <a href={EXTERNAL_REPORT_URL} target="_blank" rel="noopener noreferrer" className={`w-full py-4 bg-${themeColor}-600 text-white font-black text-lg rounded-3xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2`}>
            <ExternalLink size={20} />
            {t.reportTraffic}
          </a>
          <button onClick={onClose} className={`w-full py-4 bg-slate-900 text-white font-black text-lg rounded-3xl shadow-xl active:scale-95 transition-all`}> 
            {t.close} 
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; lang: Language; onLangChange: (lang: Language) => void; scheduleOverride: ScheduleOverride; onScheduleOverrideChange: (mode: ScheduleOverride) => void; themeMode: ThemeMode; onThemeModeChange: (mode: ThemeMode) => void; themeColor: string; fontSize: FontSize; onFontSizeChange: (size: FontSize) => void; }> = ({ isOpen, onClose, lang, onLangChange, scheduleOverride, onScheduleOverrideChange, themeMode, onThemeModeChange, themeColor, fontSize, onFontSizeChange }) => {
  if (!isOpen) return null;
  const t = translations[lang];
  const updateLabel = lang === 'zh' ? "最後更新日期" : "Last update";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className={`absolute inset-0 bg-${themeColor}-950/40 backdrop-blur-md`} onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom duration-500 ease-out max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden"></div>
        <div className="flex justify-between items-center mb-8"> <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.settings}</h2> <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"> <Check size={24} strokeWidth={3} /> </button> </div>
        <div className="space-y-8">
           <div> <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-5">{t.fontSize}</label> <div className="grid grid-cols-2 gap-3"> {(['normal', 'large'] as FontSize[]).map((size) => ( <button key={size} onClick={() => onFontSizeChange(size)} className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${ fontSize === size ? `border-${themeColor}-600 bg-${themeColor}-50/50 text-${themeColor}-700 shadow-lg shadow-${themeColor}-100` : 'border-slate-100 text-slate-400' }`} > <div className="flex items-center gap-2"> {size === 'normal' ? <Type size={14} /> : <Type size={18} />} <span className="font-black text-sm">{t[`size_${size}` as keyof typeof t] as string}</span> </div> {fontSize === size && <Check size={16} strokeWidth={3} />} </button> ))} </div> </div>
           <div> <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-5">{t.theme}</label> <div className="grid grid-cols-1 gap-3"> {(['auto', 'day', 'night'] as ThemeMode[]).map((mode) => ( <button key={mode} onClick={() => onThemeModeChange(mode)} className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${ themeMode === mode ? `border-${themeColor}-600 bg-${themeColor}-50/50 text-${themeColor}-700 shadow-lg shadow-${themeColor}-100` : 'border-slate-100 text-slate-400' }`} > <div className="flex items-center gap-3"> {mode === 'auto' && <Monitor size={18} />} {mode === 'day' && <SunIcon size={18} />} {mode === 'night' && <Moon size={18} />} <span className="font-black text-sm">{t[`mode_${mode}` as keyof typeof t] as string}</span> </div> {themeMode === mode && <Check size={16} strokeWidth={3} />} </button> ))} </div> </div>
           <div> <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-5">{t.selectLanguage}</label> <div className="grid grid-cols-2 gap-4"> {(['en', 'zh'] as Language[]).map((l) => ( <button key={l} onClick={() => onLangChange(l)} className={`p-5 rounded-3xl border-2 transition-all text-left ${ lang === l ? `border-${themeColor}-600 bg-${themeColor}-50/50 text-${themeColor}-700 shadow-lg shadow-${themeColor}-100` : 'border-slate-100 text-slate-400' }`} > <div className="font-black text-lg leading-none mb-2">{l === 'en' ? 'English' : '繁體中文'}</div> <div className="text-[10px] uppercase font-bold opacity-60">{l === 'en' ? 'Default' : 'Traditional'}</div> </button> ))} </div> </div>
           <div> <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-5">{t.scheduleType}</label> <div className="grid grid-cols-2 gap-3"> {(['auto', 'weekday', 'saturday', 'sunday'] as ScheduleOverride[]).map((mode) => ( <button key={mode} onClick={() => onScheduleOverrideChange(mode)} className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all ${ scheduleOverride === mode ? `border-${themeColor}-600 bg-${themeColor}-50/50 text-${themeColor}-700 shadow-lg shadow-${themeColor}-100` : 'border-slate-100 text-slate-400' }`} > <span className="font-black text-sm">{t[mode as keyof typeof t] as string}</span> {scheduleOverride === mode && <Check size={16} strokeWidth={3} />} </button> ))} </div> </div>
        </div>
        <div className="mt-12 pb-6 sm:pb-0"> <div className="text-center text-[10px] text-slate-300 font-bold mb-2 uppercase tracking-widest"> Version: 2.0 &bull; {updateLabel}: 2026/2/22 </div> <button onClick={onClose} className={`w-full py-5 bg-${themeColor}-600 text-white font-black text-lg rounded-3xl shadow-2xl shadow-${themeColor}-200 active:scale-95 transition-all`}> {t.close} </button> </div>
      </div>
    </div>
  );
};

const Footer: React.FC<{ currentType: TransportType; onTypeChange: (type: TransportType) => void; lang: Language; onOpenSettings: () => void; themeColor: string; fontSize: FontSize; }> = ({ currentType, onTypeChange, lang, onOpenSettings, themeColor, fontSize }) => {
  const t = translations[lang];
  const textSize = fontSize === 'large' ? 'text-xs' : 'text-[10px]';
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center pt-5 pb-10 px-6 z-40">
      <button onClick={() => onTypeChange(TransportType.BUS)} className={`flex flex-col items-center space-y-2 transition-all ${ currentType === TransportType.BUS ? `text-${themeColor}-600 scale-110` : 'text-slate-300 hover:text-slate-400' }`}> <Bus size={28} fill={currentType === TransportType.BUS ? "currentColor" : "none"} strokeWidth={2.5} /> <span className={`${textSize} font-black uppercase tracking-[0.1em]`}>{t.bus}</span> </button>
      <button onClick={() => onTypeChange(TransportType.FERRY)} className={`flex flex-col items-center space-y-2 transition-all ${ currentType === TransportType.FERRY ? `text-${themeColor}-600 scale-110` : 'text-slate-300 hover:text-slate-400' }`}> <Ship size={28} fill={currentType === TransportType.FERRY ? "currentColor" : "none"} strokeWidth={2.5} /> <span className={`${textSize} font-black uppercase tracking-[0.1em]`}>{t.ferry}</span> </button>
      <button onClick={onOpenSettings} className="flex flex-col items-center space-y-2 text-slate-300 hover:text-slate-400 transition-all"> <Settings size={28} strokeWidth={2.5} /> <span className={`${textSize} font-black uppercase tracking-[0.1em]`}>{t.settings}</span> </button>
    </div>
  );
};

export default function App() {
  const [activeType, setActiveType] = useState<TransportType>(TransportType.BUS);
  const [lang, setLang] = useState<Language>('zh');
  const [scheduleOverride, setScheduleOverride] = useState<ScheduleOverride>('auto');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route>(routes.find(r => r.type === TransportType.BUS) || routes[0]);
  const [directionIndex, setDirectionIndex] = useState(0);
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);
  const [now, setNow] = useState(new Date());
  const [rawTrafficNews, setRawTrafficNews] = useState<string[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>(() => {
    try {
      const saved = localStorage.getItem('localReports');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [trafficLastUpdate, setTrafficLastUpdate] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'syncing'>('syncing');
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [realTimeLoading, setRealTimeLoading] = useState(false);
  const [realTimeLastUpdate, setRealTimeLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true; 
    
    const fetchUserReports = async () => {
        setSyncStatus('syncing');
        const timestamp = Date.now();

        if (GOOGLE_WEB_APP_URL) {
            try {
                const res = await fetch(GOOGLE_WEB_APP_URL);
                if (res.ok) {
                    const data = await res.json();
                    const rows = data.slice(1); 
                    const parsed = rows.map((cols: any[]) => ({
                        timestamp: new Date(cols[0]).getTime(),
                        route: String(cols[1]),
                        issue: String(cols[2]),
                        location: String(cols[3]),
                        delay: String(cols[4])
                    })).filter((r: any) => !isNaN(r.timestamp));
                    
                    if (isMounted) {
                        setUserReports(prev => mergeAndClean(prev, parsed));
                        setSyncStatus('success');
                        setTrafficLastUpdate(new Date());
                        return;
                    }
                }
            } catch (e) { console.warn("Apps Script fetch failed", e); }
        }

        const csvExportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&cachebust=${timestamp}`;
        const strategies = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(csvExportUrl)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(csvExportUrl)}`
        ];

        let csvData = "";
        for (const proxy of strategies) {
            try {
                const res = await fetch(proxy);
                if (!res.ok) continue;
                csvData = proxy.includes('allorigins') ? (await res.json()).contents : await res.text();
                if (csvData && csvData.length > 30) break;
            } catch (e) {}
        }

        if (csvData && csvData.length > 30) {
            const allLines = csvData.split(/\r?\n/).filter(line => line.trim().length > 0);
            const dataLines = allLines[0].toLowerCase().includes('timestamp') ? allLines.slice(1) : allLines;
            const parsed = dataLines.map((row: string) => {
                const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
                if (cols.length < 4) return null;
                let ts = Date.parse(cols[0]);
                if (isNaN(ts)) {
                    const parts = cols[0].split(/[/\s:]/);
                    if (parts.length >= 3) {
                        let d, m, y;
                        if (parts[0].length === 4) { y = parseInt(parts[0]); m = parseInt(parts[1]) - 1; d = parseInt(parts[2]); } 
                        else { d = parseInt(parts[0]); m = parseInt(parts[1]) - 1; y = parseInt(parts[2]); }
                        ts = new Date(y, m, d, parseInt(parts[3] || '0'), parseInt(parts[4] || '0')).getTime();
                    }
                }
                return { timestamp: ts, route: cols[1], issue: cols[2], location: cols[3] || '-', delay: cols[4] || 'short' };
            }).filter((r: any): r is UserReport => r !== null && !isNaN(r.timestamp));

            if (isMounted) {
                setUserReports(prev => mergeAndClean(prev, parsed));
                setSyncStatus('success');
                setTrafficLastUpdate(new Date());
            }
        } else {
            if (isMounted) setSyncStatus('error');
        }
    };

    const mergeAndClean = (local: UserReport[], remote: UserReport[]) => {
        const nowMs = Date.now();
        const combined = [...local, ...remote];
        const unique = combined.filter((v,i,a)=>a.findIndex(t=>(t.timestamp === v.timestamp && t.route === v.route))===i);
        const active = unique.filter(r => (nowMs - r.timestamp) < 43200000);
        localStorage.setItem('localReports', JSON.stringify(active.slice(0, 50)));
        return active.sort((a,b) => b.timestamp - a.timestamp);
    };

    const fetchRTHK = async () => {
        const TARGET_URL = 'https://programme.rthk.hk/channel/radio/trafficnews/index.php';
        const timestamp = Date.now();
        
        const strategies = [
            { 
                url: `https://api.allorigins.win/get?url=${encodeURIComponent(TARGET_URL + '?t=' + timestamp)}&cachebust=${timestamp}`,
                type: 'json'
            },
            {
                url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(TARGET_URL + '?t=' + timestamp)}`,
                type: 'text'
            }
        ];

        for (const strategy of strategies) {
            try {
                const res = await fetch(strategy.url);
                if (!res.ok) continue;

                let html = '';
                if (strategy.type === 'json') {
                    const data = await res.json();
                    html = data.contents;
                } else {
                    html = await res.text();
                }

                if (!html || html.length < 100) continue;

                const doc = new DOMParser().parseFromString(html, "text/html");
                const bodyText = doc.body.innerText || "";
                
                // RTHK traffic news parsing - relaxed check for date existence anywhere in line
                const lines = bodyText.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 15 && /\d{4}-\d{2}-\d{2}/.test(line));

                if (lines.length > 0) {
                    if (isMounted) {
                        setRawTrafficNews(lines);
                        setTrafficLastUpdate(new Date()); // Update the last update time on successful RTHK fetch
                    }
                    return; // Success, stop trying other strategies
                }
            } catch (e) {
                // console.warn("RTHK Fetch strategy failed", e);
            }
        }
    };

    const fetchAll = () => { fetchRTHK(); fetchUserReports(); };
    fetchAll();
    const interval = setInterval(fetchAll, 60000); 
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (isRealTimeMode && selectedRoute.id === '230R') {
      const fetchRealTimeETA = async () => {
        setRealTimeLoading(true);
        try {
          let stopId = '';
          let destEn = '';
          if (directionIndex === 0) {
             stopId = 'E37FAF099C26C878';
             destEn = 'KOWLOON STATION';
          } else {
             const stopIds = [
                 '68A0FA3CC69206CC',
                 '576538E1395C8508',
                 '450A96AF1DA8E41C',
                 '83B921ED81BE55A9'
             ];
             stopId = stopIds[selectedStopIndex] || stopIds[0];
             destEn = 'MA WAN (PAK YAN ROAD)';
          }

          const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/230R/1`);
          const data = await res.json();
          if (data && data.data) {
             const validEtas = data.data.filter((item: any) =>
                 item.dest_en === destEn && item.eta
             ).map((item: any) => ({
                 time: new Date(item.eta).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
                 timestamp: new Date(item.eta).getTime() / 1000,
                 eta: item.eta
             })).sort((a: any, b: any) => a.timestamp - b.timestamp);
             setRealTimeData(validEtas);
             setRealTimeLastUpdate(new Date());
          }
        } catch (e) {
          console.error("ETA fetch failed", e);
        } finally {
          setRealTimeLoading(false);
        }
      };
      
      fetchRealTimeETA();
      const interval = setInterval(fetchRealTimeETA, 60000);
      return () => clearInterval(interval);
    }
  }, [isRealTimeMode, selectedRoute.id, directionIndex, selectedStopIndex]);

  const trafficNews = useMemo<TrafficNewsData>(() => {
     if (activeType === TransportType.FERRY) return { status: 'normal', details: { en: [], zh: [] } };
     const routeId = selectedRoute.id;
     const routeNameEn = selectedRoute.name.en.toLowerCase();
     const routeNameZh = selectedRoute.name.zh.toLowerCase();
     const nowTime = now.getTime();
     const THREE_HOURS = 3 * 60 * 60 * 1000;
     
     const validUserReports = userReports.filter(r => {
         const reportRoute = r.route.toLowerCase();
         const isRouteNR331 = routeId === 'NR331' || routeNameEn === 'tsuen wan' || routeNameZh === '荃灣';
         const isRouteNR331S = routeId === 'NR331S' || routeNameEn === 'tw west' || routeNameZh === '荃灣西';
         
         let matchesRoute = false;
         if (isRouteNR331) {
             matchesRoute = (reportRoute === 'nr331' || reportRoute === 'tsuen wan' || reportRoute === '荃灣') ||
                            (reportRoute.includes('tsuen wan') && !reportRoute.includes('west') && !reportRoute.includes('西')) ||
                            (reportRoute.includes('荃灣') && !reportRoute.includes('西'));
         } else if (isRouteNR331S) {
             matchesRoute = (reportRoute === 'nr331s' || reportRoute === 'tw west' || reportRoute === 'tsuen wan west' || reportRoute === '荃灣西') ||
                            (reportRoute.includes('west')) || (reportRoute.includes('荃灣西'));
         } else {
             matchesRoute = reportRoute.includes(routeId.toLowerCase()) || 
                            reportRoute.includes(routeNameEn) || 
                            reportRoute.includes(routeNameZh);
         }
         
         const isRecent = (nowTime - r.timestamp < THREE_HOURS) && (nowTime - r.timestamp > -300000);
         return matchesRoute && isRecent;
     }).sort((a, b) => b.timestamp - a.timestamp);

     let rthkLines: { time: number, text: string, type: 'incident' | 'recovery' }[] = [];
     const routeRoads = ROUTE_KEYWORDS[routeId] || [];
     if (routeRoads.length > 0) {
        rawTrafficNews.forEach(line => {
            // Updated regex: Find date pattern anywhere, optional HKT
            const match = line.match(/(\d{4}-\d{2}-\d{2}\s+(?:HKT\s+)?\d{2}:\d{2})/);
            if (!match) return;
            const dateStr = match[1].replace('HKT ', '').replace(/-/g, '/');
            const lineDate = new Date(dateStr); 
            if (isNaN(lineDate.getTime())) return;
            if (nowTime - lineDate.getTime() > THREE_HOURS) return;
            const hasRoad = routeRoads.some(k => line.includes(k));
            if (!hasRoad) return;
            if (RECOVERY_KEYWORDS.some(k => line.includes(k))) {
                rthkLines.push({ time: lineDate.getTime(), text: line, type: 'recovery' });
            } else {
                rthkLines.push({ time: lineDate.getTime(), text: line, type: 'incident' });
            }
        });
     }
     
     let status: TrafficStatusType = 'normal';
     let displayLinesEn: string[] = [];
     let displayLinesZh: string[] = [];

     if (rthkLines.length > 0 && rthkLines[0].type === 'incident') {
         status = 'affected';
         const uniqueTexts = Array.from(new Set(rthkLines.filter(l => l.type === 'incident').map(l => l.text)));
         displayLinesEn.push(...uniqueTexts); displayLinesZh.push(...uniqueTexts);
     }

     if (validUserReports.length > 0) {
         status = 'affected'; 
         validUserReports.forEach(r => {
             const t = translations; 
             const matchedIssue = Object.entries(FORM_VALUE_MAPPING.issue).find(([k, v]) => 
                 v.toLowerCase() === r.issue.toLowerCase() || k.toLowerCase() === r.issue.toLowerCase()
             );
             
             const issueKey = matchedIssue ? matchedIssue[0] : null;
             let issueTextZh = r.issue;
             let issueTextEn = r.issue;

             if (issueKey && issueKey !== 'other') {
                 issueTextZh = t.zh[`type_${issueKey}` as keyof typeof t.zh] || r.issue;
                 issueTextEn = t.en[`type_${issueKey}` as keyof typeof t.en] || r.issue;
             }
             
             const timeStr = new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
             const locStr = r.location && r.location !== '-' ? ` @ ${r.location}` : '';
             displayLinesZh.push(`[${t.zh.userReported} ${timeStr}] ${issueTextZh}${locStr}`);
             displayLinesEn.push(`[${t.en.userReported} ${timeStr}] ${issueTextEn}${locStr}`);
         });
     }
     
     return { status, details: { en: displayLinesEn, zh: displayLinesZh } };
  }, [rawTrafficNews, userReports, selectedRoute, activeType, now]);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => { try { return (localStorage.getItem('themeMode') as ThemeMode) || 'auto'; } catch { return 'auto'; } });
  const [fontSize, setFontSize] = useState<FontSize>(() => { try { return (localStorage.getItem('fontSize') as FontSize) || 'normal'; } catch { return 'normal'; } });
  useEffect(() => { localStorage.setItem('themeMode', themeMode); }, [themeMode]);
  useEffect(() => { localStorage.setItem('fontSize', fontSize); }, [fontSize]);
  const themeColor = useMemo(() => { if (themeMode === 'day') return 'dayblue'; if (themeMode === 'night') return 'indigo'; const hour = now.getHours(); return (hour >= 6 && hour < 18) ? 'dayblue' : 'indigo'; }, [themeMode, now]);
  const [isExtendedView, setIsExtendedView] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => { try { const saved = localStorage.getItem('favorites'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
  const toggleFavorite = (id: string) => { setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]); };
  const filteredRoutes = useMemo(() => { const typeRoutes = routes.filter(r => r.type === activeType); return typeRoutes.sort((a, b) => { const aFav = favorites.includes(a.id); const bFav = favorites.includes(b.id); if (aFav === bFav) return 0; return aFav ? -1 : 1; }); }, [activeType, favorites]);
  const handleTypeChange = (newType: TransportType) => { if (newType === activeType) return; setActiveType(newType); const typeRoutes = routes.filter(r => r.type === newType); const sorted = [...typeRoutes].sort((a, b) => { const aFav = favorites.includes(a.id); const bFav = favorites.includes(b.id); if (aFav === bFav) return 0; return aFav ? -1 : 1; }); if (sorted.length > 0) { setSelectedRoute(sorted[0]); setDirectionIndex(0); setIsExtendedView(false); } };
  const handleSelectRoute = (route: Route) => { setSelectedRoute(route); setDirectionIndex(0); setIsExtendedView(false); };
  const handleSwitchRoute = (routeId: string, dirIndex: number = 0) => { const target = routes.find(r => r.id === routeId); if (target) { setActiveType(target.type); setSelectedRoute(target); setDirectionIndex(dirIndex); setIsExtendedView(false); } };
  
  useEffect(() => {
    const currentDirection = selectedRoute.directions[directionIndex];
    if (currentDirection?.stops && currentDirection.stops.length > 0) {
      const defaultIndex = currentDirection.stops.findIndex(s => s.isDefault);
      setSelectedStopIndex(defaultIndex >= 0 ? defaultIndex : 0);
    } else {
      setSelectedStopIndex(0);
    }
  }, [selectedRoute, directionIndex]);

  useEffect(() => { const timer = setInterval(() => { setNow(new Date()); }, 1000); return () => clearInterval(timer); }, []);
  const handleToggleOverride = () => { const modes: ScheduleOverride[] = ['auto', 'weekday', 'saturday', 'sunday']; const nextIdx = (modes.indexOf(scheduleOverride) + 1) % modes.length; setScheduleOverride(modes[nextIdx]); };
  const detectedDayType = useMemo(() => getDayType(now), [now]);
  const effectiveDayType = scheduleOverride === 'auto' ? detectedDayType : (scheduleOverride as DayType);
  const GROUP_A = ['NR331', 'NR331S', 'NR334', 'Ferry-Central', '230R']; 
  const GROUP_B = ['NR330', 'NR332', 'NR338'];
  const EXTENDED_VIEW_ROUTES = [...GROUP_A, ...GROUP_B];
  const canExtend = EXTENDED_VIEW_ROUTES.includes(selectedRoute.id);
  const { currentCountdown, nextDepartures, showFullSchedule, collapseLabel, expandLabel } = useMemo(() => {
    const t = translations[lang];
    const direction = selectedRoute.directions[directionIndex];
    
    const stopOffset = direction.stops && direction.stops.length > 0 
      ? (direction.stops[selectedStopIndex]?.offsetMinutes || 0) 
      : 0;
    const applyOffset = (times: string[]) => times.map(tStr => addMinutesToTime(tStr, stopOffset));

    let currentServiceDayType = effectiveDayType;
    let shouldUseAdjustedDate = false;
    if (scheduleOverride === 'auto') { const adjustedDate = new Date(now); if (adjustedDate.getHours() < 6) adjustedDate.setDate(adjustedDate.getDate() - 1); currentServiceDayType = getDayType(adjustedDate); shouldUseAdjustedDate = adjustedDate.getDate() !== now.getDate(); }
    const departures = applyOffset(direction.departures[currentServiceDayType] || []);
    const currentTimeSeconds = getSecondsSinceStartOfDay(now);
    const nextTime = departures.find(tStr => parseTimeToSeconds(tStr) > currentTimeSeconds);
    const getServiceDayDepartures = (dayOffset: number) => {
         if (scheduleOverride === 'auto') {
             const baseDate = shouldUseAdjustedDate ? (() => { const d = new Date(now); if (d.getHours() < 6) d.setDate(d.getDate() - 1); return d; })() : new Date(now);
             const targetDate = new Date(baseDate); targetDate.setDate(targetDate.getDate() + dayOffset);
             const type = getDayType(targetDate);
             const formatter = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-HK' : 'en-GB', { weekday: 'short', month: 'numeric', day: 'numeric' });
             return { times: applyOffset(direction.departures[type] || []), dateLabel: formatter.format(targetDate), targetDate, formatter };
        }
        return { times: departures, dateLabel: `Day +${dayOffset}`, targetDate: null, formatter: null }; 
    };
    let countdown: CountdownState = { minutes: 0, seconds: 0, departureTime: '--:--', isAvailable: false };
    let countdownTimestamp = -1;
    if (nextTime) { const nextSeconds = parseTimeToSeconds(nextTime); const diff = nextSeconds - currentTimeSeconds; countdown = { minutes: Math.floor(diff / 60), seconds: diff % 60, departureTime: nextTime, isAvailable: true }; countdownTimestamp = nextSeconds; } 
    else { const nextDayData = getServiceDayDepartures(1); const nextDayDeps = nextDayData.times; if (nextDayDeps.length > 0) { const firstNextDay = nextDayDeps[0]; const firstNextSeconds = parseTimeToSeconds(firstNextDay); const diff = (24 * 3600 + firstNextSeconds) - currentTimeSeconds; countdown = { minutes: Math.floor(diff / 60), seconds: diff % 60, departureTime: firstNextDay, isAvailable: true }; countdownTimestamp = 24 * 3600 + firstNextSeconds; } }
    const filterThreshold = countdown.isAvailable ? countdownTimestamp : currentTimeSeconds;
    const getBadges = (timeStr: string, isLastItem: boolean) => {
        const badges: Badge[] = []; let specialBadge: Badge | null = null; let isLast = isLastItem;
        if (selectedRoute.id === 'NR330') {
           if (directionIndex === 0 && ['01:00', '01:45', '02:30', '03:15', '04:00', '04:45', '05:30'].includes(timeStr)) specialBadge = { text: t.kwaiFongOvernight, className: "text-purple-600 bg-purple-100 border border-purple-200" };
           else if (directionIndex === 1 && ['01:15', '02:00', '02:45', '03:30', '04:15', '05:00', '05:45'].includes(timeStr)) specialBadge = { text: t.viaKwaiFong, className: "text-purple-600 bg-purple-100 border border-purple-200" };
        }
        if (selectedRoute.id === 'NR332' && directionIndex === 0 && ['01:00', '01:45', '02:30', '03:15', '04:00', '04:45', '05:30'].includes(timeStr)) specialBadge = { text: t.viaTsingYi, className: "text-purple-600 bg-purple-100 border border-purple-200" };
        if (selectedRoute.id === 'NR338') {
            if (directionIndex === 0) isLast = (timeStr === '06:00'); else if (directionIndex === 1) isLast = (timeStr === '06:35');
            if (['23:50', '01:05', '02:20', '03:30', '04:45', '06:00'].includes(timeStr) || ['00:30', '01:40', '02:55', '04:05', '05:20', '06:35'].includes(timeStr)) specialBadge = { text: t.overnightWanChai, className: "text-purple-600 bg-purple-100 border border-purple-200" };
        }
        if (selectedRoute.id === 'NR334') {
             const minute = timeStr.split(':')[1];
             if (isLast) { badges.push({ text: t.lastDeparture, className: "text-red-600 bg-red-100 border border-red-200" }); if ((directionIndex === 0 && timeStr === '00:00') || (directionIndex === 1 && timeStr === '00:30')) badges.push({ text: t.viaHZMB, className: "text-orange-600 bg-orange-100" }); } 
             else { if ((directionIndex === 0 && minute === '00') || (directionIndex === 1 && minute === '30')) badges.push({ text: t.viaHZMB, className: "text-orange-600 bg-orange-100" }); else if ((directionIndex === 0 && minute === '30') || (directionIndex === 1 && minute === '00')) badges.push({ text: t.normal, className: "text-slate-500 bg-slate-100" }); else badges.push({ text: t.onSchedule, className: "text-slate-500 bg-slate-100" }); }
        } else {
            if (isLast) badges.push({ text: t.lastDeparture, className: "text-red-600 bg-red-100 border border-red-200" });
            if (specialBadge) badges.push(specialBadge); else if (!isLast) badges.push({ text: t.onSchedule, className: "text-slate-500 bg-slate-100" });
        }
        return badges;
    };
    let upcoming: ScheduleItem[] = []; let isFullList = false;
    if (selectedRoute.id === 'Ferry-Tsuen-Wan') {
        let displayDayType = currentServiceDayType;
        if (scheduleOverride === 'auto') { const currentDeps = direction.departures[currentServiceDayType] || []; const lastDep = currentDeps.length > 0 ? currentDeps[currentDeps.length - 1] : null; if (lastDep && getSecondsSinceStartOfDay(now) > parseTimeToSeconds(lastDep)) { let targetDate = new Date(now); if (!shouldUseAdjustedDate) targetDate.setDate(targetDate.getDate() + 1); displayDayType = getDayType(targetDate); } }
        const displayDepartures = direction.departures[displayDayType] || []; upcoming = displayDepartures.map((tStr, idx) => ({ time: tStr, timestamp: parseTimeToSeconds(tStr), badges: getBadges(tStr, idx === displayDepartures.length - 1) })); isFullList = true;
    } else if (canExtend) {
        let allCandidates: ScheduleItem[] = [];
        for (let i = 0; i <= 2; i++) {
            const { times, dateLabel, targetDate, formatter } = getServiceDayDepartures(i);
            const daySecondsOffset = i * 24 * 3600;
            const dayItems = times.map((tStr, idx) => {
                let itemDateLabel = dateLabel; if (scheduleOverride === 'auto' && targetDate && formatter && parseTimeToSeconds(tStr) >= 24 * 3600) { const nextDay = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1); itemDateLabel = formatter.format(nextDay); }
                return { time: tStr, timestamp: parseTimeToSeconds(tStr) + daySecondsOffset, badges: getBadges(tStr, idx === times.length - 1), dateLabel: itemDateLabel };
            });
            allCandidates = [...allCandidates, ...dayItems];
        }
        if (GROUP_A.includes(selectedRoute.id)) { if (isExtendedView) { const windowEnd = currentTimeSeconds + (48 * 3600); upcoming = allCandidates.filter(item => item.timestamp > filterThreshold && item.timestamp <= windowEnd); } else { const day0Data = getServiceDayDepartures(0); const day0Items = day0Data.times.map((tStr, idx) => ({ time: tStr, timestamp: parseTimeToSeconds(tStr), badges: getBadges(tStr, idx === day0Data.times.length - 1), dateLabel: day0Data.dateLabel })).filter(item => item.timestamp > filterThreshold); if (day0Items.length > 0) upcoming = day0Items; else { const day1Data = getServiceDayDepartures(1); upcoming = day1Data.times.map((tStr, idx) => ({ time: tStr, timestamp: parseTimeToSeconds(tStr) + 86400, badges: getBadges(tStr, idx === day1Data.times.length - 1), dateLabel: day1Data.dateLabel })).filter(item => item.timestamp > filterThreshold); } } } 
        else if (GROUP_B.includes(selectedRoute.id)) { const hours = isExtendedView ? 48 : 24; const windowEnd = currentTimeSeconds + (hours * 3600); upcoming = allCandidates.filter(item => item.timestamp > filterThreshold && item.timestamp <= windowEnd); }
        isFullList = false;
    }
    let countdownBadges: Badge[] = [];
    if (countdown.isAvailable && countdown.departureTime !== '--:--') {
        let isLastForCountdown = false;
        if (nextTime) isLastForCountdown = (nextTime === departures[departures.length - 1]);
        else { const nextDayData = getServiceDayDepartures(1); const nextDayDeps = nextDayData.times; if (nextDayDeps.length > 0 && countdown.departureTime === nextDayDeps[0]) isLastForCountdown = (nextDayDeps.length === 1); }
        countdownBadges = getBadges(countdown.departureTime, isLastForCountdown);
    }
    let collapseLabel = t.show12h; let expandLabel = t.show48h; if (GROUP_B.includes(selectedRoute.id)) collapseLabel = t.show24h;

    if (isRealTimeMode && selectedRoute.id === '230R') {
        let rtCountdown: CountdownState = { minutes: 0, seconds: 0, departureTime: '--:--', isAvailable: false };
        let rtUpcoming: ScheduleItem[] = [];
        
        if (realTimeData.length > 0) {
            const first = realTimeData[0];
            // Use epoch seconds for accurate countdown difference
            const nowEpoch = Math.floor(now.getTime() / 1000);
            const diff = first.timestamp - nowEpoch;
            const safeDiff = Math.max(0, diff);
            
            rtCountdown = {
                minutes: Math.floor(safeDiff / 60),
                seconds: Math.floor(safeDiff % 60),
                departureTime: first.time,
                isAvailable: true
            };
            
            rtUpcoming = realTimeData.slice(1).map((item, idx) => ({
                time: item.time,
                // Convert to service seconds for consistency with UpcomingSchedule
                timestamp: getSecondsSinceStartOfDay(new Date(item.eta)),
                badges: []
            }));
        } else {
             rtCountdown = { minutes: 0, seconds: 0, departureTime: t.noData, isAvailable: false };
        }
        
        return { currentCountdown: { ...rtCountdown, badges: [] }, nextDepartures: rtUpcoming, showFullSchedule: false, collapseLabel, expandLabel };
    }

    return { currentCountdown: { ...countdown, badges: countdownBadges }, nextDepartures: upcoming, showFullSchedule: isFullList, collapseLabel, expandLabel };
  }, [now, selectedRoute, directionIndex, effectiveDayType, scheduleOverride, isExtendedView, canExtend, lang, themeColor, fontSize, selectedStopIndex, isRealTimeMode, realTimeData]);

  const crossRouteData = useMemo(() => {
      const t = translations[lang];
      if (selectedRoute.id === 'NR338') return { label: directionIndex === 0 ? t.switchFerryToCentral : t.switchFerryToPI, onAction: () => handleSwitchRoute('Ferry-Central', directionIndex), Icon: Ship };
      if (selectedRoute.id === 'Ferry-Central') return { label: directionIndex === 0 ? t.switchBusToCentral : t.switchBusToPI, onAction: () => handleSwitchRoute('NR338', directionIndex), Icon: Bus };
      if (selectedRoute.id === 'NR331S') return { label: directionIndex === 0 ? t.switchFerryToTW : t.switchFerryToPI, onAction: () => handleSwitchRoute('Ferry-Tsuen-Wan', directionIndex), Icon: Ship };
      if (selectedRoute.id === 'Ferry-Tsuen-Wan') return { label: directionIndex === 0 ? t.switchBusToTWWest : t.switchBusToPI, onAction: () => handleSwitchRoute('NR331S', directionIndex), Icon: Bus };
      return null;
  }, [selectedRoute.id, directionIndex, lang]);

  const currentTimeSeconds = getSecondsSinceStartOfDay(now);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-20 select-none bg-slate-50 transition-colors duration-500">
      <CurrentTimeBar now={now} lang={lang} displayType={effectiveDayType} themeColor={themeColor} fontSize={fontSize} />
      <Header selectedRoute={selectedRoute} onSelectRoute={handleSelectRoute} filteredRoutes={filteredRoutes} lang={lang} scheduleOverride={scheduleOverride} onToggleOverride={handleToggleOverride} favorites={favorites} onToggleFavorite={toggleFavorite} themeColor={themeColor} fontSize={fontSize} />
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <SegmentedControl directions={selectedRoute.directions} selectedIndex={directionIndex} onSelect={setDirectionIndex} lang={lang} themeColor={themeColor} fontSize={fontSize} />
        {selectedRoute.directions[directionIndex].stops && selectedRoute.directions[directionIndex].stops.length > 0 && (
          <div className="mx-4 mt-2 overflow-x-auto custom-scrollbar pb-2">
            <div className="flex items-center gap-1 mb-1.5 px-1">
               <MapPin size={12} className="text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{translations[lang].departFrom}</span>
            </div>
            <div className="flex space-x-2">
              {selectedRoute.directions[directionIndex].stops.map((stop, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedStopIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl ${fontSize === 'large' ? 'text-sm' : 'text-xs'} font-bold whitespace-nowrap transition-all ${
                    selectedStopIndex === idx
                      ? `bg-${themeColor}-100 text-${themeColor}-700 border border-${themeColor}-200 shadow-sm`
                      : 'bg-white text-slate-500 border border-slate-100'
                  }`}
                >
                  {stop.name[lang]}
                </button>
              ))}
            </div>
          </div>
        )}
        <HeroCountdown {...currentCountdown} badges={currentCountdown.badges || []} lang={lang} themeColor={themeColor} fontSize={fontSize} transportType={activeType} onShowTraffic={() => setIsTrafficModalOpen(true)} trafficStatus={trafficNews.status} />
        <UpcomingSchedule items={nextDepartures} lang={lang} isFullList={showFullSchedule} crossRoute={crossRouteData} routeId={selectedRoute.id} directionIndex={directionIndex} canExtend={canExtend} isExtendedView={isExtendedView} onToggleView={() => setIsExtendedView(!isExtendedView)} collapseLabel={collapseLabel} expandLabel={expandLabel} themeColor={themeColor} fontSize={fontSize} currentTimeSeconds={currentTimeSeconds} activeType={activeType} showRealTimeButton={selectedRoute.id === '230R'} isRealTime={isRealTimeMode} onToggleRealTime={() => setIsRealTimeMode(!isRealTimeMode)} />
        {isRealTimeMode && selectedRoute.id === '230R' && (
          <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 mb-8">
            {translations[lang].dataSource}
          </div>
        )}
      </main>
      <Footer currentType={activeType} onTypeChange={handleTypeChange} lang={lang} onOpenSettings={() => setIsSettingsOpen(true)} themeColor={themeColor} fontSize={fontSize} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} lang={lang} onLangChange={setLang} scheduleOverride={scheduleOverride} onScheduleOverrideChange={setScheduleOverride} themeMode={themeMode} onThemeModeChange={setThemeMode} themeColor={themeColor} fontSize={fontSize} onFontSizeChange={setFontSize} />
      <TrafficModal isOpen={isTrafficModalOpen} onClose={() => setIsTrafficModalOpen(false)} lang={lang} themeColor={themeColor} trafficNews={trafficNews} lastUpdate={trafficLastUpdate} selectedRoute={selectedRoute} syncStatus={syncStatus} />
    </div>
  );
}
