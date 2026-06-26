import React, { useMemo, useState, useEffect } from 'react';
import { Leaf, Award, Filter, RefreshCw, Activity, Users, Inbox, Search, FileSpreadsheet, Trophy, Sparkles, Share2, Camera, Crown, Medal, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend, ReferenceLine, CartesianGrid, PieChart, Pie } from 'recharts';
import { CLASS_OPTIONS, MONTH_OPTIONS, YEAR_OPTIONS, CO2_FACTOR, getGamificationBadge, getTreeEvolution } from '../types';
import { RankingCard } from './RankingCard';
import html2canvas from 'html2canvas';
import { useLanguage } from './LanguageContext';

interface DashboardViewProps {
  entries: any[];
  students: any[];
  isAdmin: boolean;
  onGenerateReport: (config: { monthIndex: number; year: number }) => void;
  onGenerateQuarterly: (config: { quarter: string; year: number }) => void;
  onGeneratePoster: (type: 'class' | 'individual' | 'individual_upper') => void;
  nextRecycleDate: string;
  isDarkMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  entries,
  students,
  isAdmin,
  onGenerateReport,
  onGenerateQuarterly,
  onGeneratePoster,
  nextRecycleDate,
  isDarkMode = false
}) => {
  const { language, t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonthStart, setFilterMonthStart] = useState(0);
  const [filterMonthEnd, setFilterMonthEnd] = useState(11);
  const [dashboardViewMode, setDashboardViewMode] = useState<'overall' | 'class'>('overall');
  const [selectedDashboardClass, setSelectedDashboardClass] = useState('');
  const [showMobaRanksExp, setShowMobaRanksExp] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const [animatedCarbon, setAnimatedCarbon] = useState(0);

  const [localEntries, setLocalEntries] = useState<any[]>(() => entries || []);
  const [localStudents, setLocalStudents] = useState<any[]>(() => students || []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRealtimeData = async () => {
    setIsRefreshing(true);
    try {
      const scriptUrl = "/api/gsheet";
      const [entriesRes, studentsRes] = await Promise.all([
        fetch(scriptUrl + '?action=getEntries'),
        fetch(scriptUrl + '?action=getStudents')
      ]);

      if (!entriesRes.ok || !studentsRes.ok) {
        throw new Error(`HTTP ${entriesRes.status}/${studentsRes.status}`);
      }

      const contentTypeEntries = entriesRes.headers.get("content-type") || "";
      const contentTypeStudents = studentsRes.headers.get("content-type") || "";
      if (!contentTypeEntries.includes("application/json") || !contentTypeStudents.includes("application/json")) {
        throw new Error("Received non-JSON content");
      }

      const entriesJson = await entriesRes.json();
      const studentsJson = await studentsRes.json();

      if (entriesJson && entriesJson.status === "success" && Array.isArray(entriesJson.data)) {
        setLocalEntries(entriesJson.data.map((e: any) => ({ ...e, weight: Number(e.weight) || 0 })));
      }
      if (studentsJson && studentsJson.status === "success" && Array.isArray(studentsJson.data)) {
        setLocalStudents(studentsJson.data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch real-time data in DashboardView:", err.message || err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (entries && entries.length > 0) {
      setLocalEntries(entries);
    }
  }, [entries]);

  useEffect(() => {
    if (students && students.length > 0) {
      setLocalStudents(students);
    }
  }, [students]);

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 35000);
    return () => clearInterval(interval);
  }, []);

  const handleShareBriefing = async () => {
    const el = document.getElementById('monthly-briefing-infographic-card');
    if (!el) {
      alert("没有找到战报模板元素！");
      return;
    }
    setIsGeneratingBriefing(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050b14'
      });
      const imgDataUrl = canvas.toDataURL('image/png');

      if (navigator.share) {
        try {
          const blob = await (await fetch(imgDataUrl)).blob();
          const file = new File([blob], `SJKC_Recycle_Briefing_${filterYear}_${filterMonthStart + 1}.png`, { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: '新廊华小月度环保回收战报',
            text: `⭐ 这是 ${filterYear} 赛季最新的净化环保战报！全校本期共回收物资 ${stats.grandTotal.toFixed(1)} KG，减排二氧化碳约 ${(stats.grandTotal * CO2_FACTOR).toFixed(1)} kg CO₂e。大家太棒了，快来看看吧！`
          });
          setIsGeneratingBriefing(false);
          return;
        } catch (shareErr) {
          console.warn("Native share skipped/failed, falling back to direct download.", shareErr);
        }
      }

      // Direct download fallback
      const link = document.createElement('a');
      link.download = `SJKC_Recycle_Briefing_${filterYear}_${filterMonthStart + 1}.png`;
      link.href = imgDataUrl;
      link.click();
      alert("🎉 战报合成完毕！已为您自动开始下载。由于当前浏览器环境安全规则限制，您可以直接把下载下来的战报图片发到班级微信/WhatsApp通讯群中分享！");
    } catch (e) {
      console.error(e);
      alert("生成战报失败，请稍后刷新重试！");
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  // 1. Normalized entries to patch mismatches automatically on the fly
  const normalizedEntries = useMemo(() => {
    const studentMap: Record<string, { className: string; name: string }> = {};
    localStudents.forEach(s => {
      studentMap[s.id] = { className: s.className, name: s.name };
    });

    return localEntries.map(entry => {
      if (entry.type === 'recycle' && entry.studentID) {
        const realInfo = studentMap[entry.studentID];
        if (realInfo) {
          const newEntry = { ...entry };
          let updated = false;
          if (realInfo.className && realInfo.className !== entry.className) {
            newEntry.className = realInfo.className;
            newEntry.originalClassName = entry.className;
            updated = true;
          }
          if (realInfo.name && realInfo.name !== entry.name) {
            newEntry.name = realInfo.name;
            newEntry.originalName = entry.name;
            updated = true;
          }
          if (updated) return newEntry;
        }
      }
      return entry;
    });
  }, [localEntries, localStudents]);

  // 2. Filter records based on selected date parameters
  const filteredEntries = useMemo(() => {
    return normalizedEntries.filter(entry => {
      const entryYear = entry.calendarYear || new Date(entry.createdAt).getFullYear();
      if (entryYear !== filterYear) return false;

      let entryMonthIndex = 0;
      if (typeof entry.month === 'string' && entry.month) {
        const parts = entry.month.split('/');
        const part = parts.length > 1 ? parts[1]?.trim() : entry.month;
        entryMonthIndex = MONTH_OPTIONS.findIndex(m => m && m.includes(part));
        if (entryMonthIndex === -1) {
          entryMonthIndex = new Date(entry.createdAt).getMonth();
        }
      } else {
        entryMonthIndex = new Date(entry.createdAt).getMonth();
      }

      if (entryMonthIndex < filterMonthStart || entryMonthIndex > filterMonthEnd) return false;
      return true;
    });
  }, [normalizedEntries, filterYear, filterMonthStart, filterMonthEnd]);

  // 3. Dynamic aggregations
  const stats = useMemo(() => {
    const classTotals: Record<string, { className: string; totalWeight: number; grade: number; totalDeduction: number; monthlyWeights: Record<string, number>; totalReward?: number }> = {};
    const individualTotals: Record<string, { name: string; studentID: string; className: string; totalWeight: number; grade: number; activeMonthsSet: Set<string>; activeMonths?: number; badge?: string }> = {};
    let grandTotal = 0;

    filteredEntries.forEach(entry => {
      if (entry.status === 'deleted') return;
      const w = Number(entry.weight) || 0;
      grandTotal += w;

      let grade = parseInt(entry.year);
      if (isNaN(grade) || grade === 0) {
        grade = entry.className ? parseInt(entry.className.charAt(0)) : 0;
      }
      if (isNaN(grade)) grade = 0;

      // Class Calculations
      if (!classTotals[entry.className]) {
        classTotals[entry.className] = {
          className: entry.className,
          totalWeight: 0,
          grade: grade,
          totalDeduction: 0,
          monthlyWeights: {}
        };
      }
      classTotals[entry.className].totalWeight += w;
      if (entry.type === 'deduction') {
        classTotals[entry.className].totalDeduction += Math.abs(w);
      }
      const monthKey = entry.month || 'Unknown';
      if (!classTotals[entry.className].monthlyWeights[monthKey]) {
        classTotals[entry.className].monthlyWeights[monthKey] = 0;
      }
      classTotals[entry.className].monthlyWeights[monthKey] += w;

      // Student Calculations
      if (entry.type === 'recycle' && (entry.name || entry.studentID)) {
        const uniqueKey = entry.studentID ? `ID-${entry.studentID}` : `NAME-${entry.className}-${entry.name}`;
        const displayName = entry.name || (entry.studentID ? `ID: ${entry.studentID}` : 'Unknown');

        if (!individualTotals[uniqueKey]) {
          individualTotals[uniqueKey] = {
            name: displayName,
            studentID: entry.studentID || '',
            className: entry.className,
            totalWeight: 0,
            grade: grade,
            activeMonthsSet: new Set()
          };
        } else if (entry.name && individualTotals[uniqueKey].name.startsWith('ID:')) {
          individualTotals[uniqueKey].name = entry.name;
        }

        individualTotals[uniqueKey].totalWeight += w;
        individualTotals[uniqueKey].activeMonthsSet.add(entry.calendarYear + '-' + monthKey);
        individualTotals[uniqueKey].badge = getGamificationBadge(individualTotals[uniqueKey].totalWeight);
      }
    });

    Object.values(classTotals).forEach(c => {
      let reward = 0;
      Object.values(c.monthlyWeights).forEach(monthWeight => {
        if (monthWeight >= 50) {
          reward += Math.floor(monthWeight / 50) * 10;
        }
      });
      c.totalReward = reward;
    });

    const sortedClasses = Object.values(classTotals).sort((a, b) => b.totalWeight - a.totalWeight);
    const sortedIndividuals = Object.values(individualTotals).map(i => {
      i.activeMonths = i.activeMonthsSet.size;
      return i;
    }).sort((a, b) => b.totalWeight - a.totalWeight);

    return {
      grandTotal,
      allClasses: sortedClasses,
      allIndividuals: sortedIndividuals,
      classLower: sortedClasses.filter(c => c.grade >= 1 && c.grade <= 3),
      classUpper: sortedClasses.filter(c => c.grade >= 4 && c.grade <= 6),
      indivLower: sortedIndividuals.filter(i => i.grade >= 1 && i.grade <= 3),
      indivUpper: sortedIndividuals.filter(i => i.grade >= 4 && i.grade <= 6)
    };
  }, [filteredEntries]);

  // Special Class Specific view metrics
  const classStats = useMemo(() => {
    if (!selectedDashboardClass) return [];
    const classEntries = filteredEntries.filter(e => e.className === selectedDashboardClass && e.type === 'recycle');
    const studentTotals: Record<string, { name: string; totalWeight: number; activeMonthsSet: Set<string>; activeMonths?: number }> = {};
    
    classEntries.forEach(entry => {
      const uniqueKey = entry.studentID ? entry.studentID : entry.name;
      if (!uniqueKey) return;
      if (!studentTotals[uniqueKey]) {
        studentTotals[uniqueKey] = {
          name: entry.name || 'Unknown',
          totalWeight: 0,
          activeMonthsSet: new Set()
        };
      }
      studentTotals[uniqueKey].totalWeight += Number(entry.weight);
      studentTotals[uniqueKey].activeMonthsSet.add((entry.calendarYear || '') + '-' + (entry.month || ''));
    });

    return Object.values(studentTotals).map(i => {
      i.activeMonths = i.activeMonthsSet.size;
      return i;
    }).sort((a, b) => b.totalWeight - a.totalWeight);
  }, [filteredEntries, selectedDashboardClass]);

  const currentDisplayTotal = useMemo(() => {
    if (selectedDashboardClass) {
      return filteredEntries
        .filter(e => e.className === selectedDashboardClass && e.status !== 'deleted')
        .reduce((acc, e) => acc + (Number(e.weight) || 0), 0);
    }
    return stats.grandTotal;
  }, [selectedDashboardClass, filteredEntries, stats.grandTotal]);

  useEffect(() => {
    const target = stats.grandTotal * 2.87;
    const duration = 1205; // 1.2s smooth animation
    const startTime = performance.now();
    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // Quad ease out
      setAnimatedCarbon(easeProgress * target);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [stats.grandTotal]);

  // 30-Day Recycle Points Trend Calculation
  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Map of DateString -> recycle contribution weight
    const dailyMap: Record<string, number> = {};
    
    normalizedEntries.forEach(entry => {
      if (entry.status === 'deleted') return;
      if (entry.type !== 'recycle') return;
      
      let dateObj: Date;
      try {
        dateObj = new Date(entry.createdAt);
        if (isNaN(dateObj.getTime())) return;
      } catch {
        return;
      }
      
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + (Number(entry.weight) || 0);
    });
    
    // Sum of points earned before the 30-day window
    let cumulativeSum = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    normalizedEntries.forEach(entry => {
      if (entry.status === 'deleted') return;
      if (entry.type !== 'recycle') return;
      
      try {
        const dateObj = new Date(entry.createdAt);
        if (isNaN(dateObj.getTime())) return;
        if (dateObj < thirtyDaysAgo) {
          cumulativeSum += (Number(entry.weight) || 0);
        }
      } catch {}
    });
    
    // Generate the last 30 calendar days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      const key = `${yStr}-${mStr}-${dStr}`;
      
      const dailyPoints = dailyMap[key] || 0;
      cumulativeSum += dailyPoints;
      
      const label = `${dStr}/${mStr}`;
      
      data.push({
        date: key,
        label,
        "每日回收": Number(dailyPoints.toFixed(1)),
        "累计积分": Number(cumulativeSum.toFixed(1))
      });
    }
    
    return data;
  }, [normalizedEntries]);

  const carbonChartData = useMemo(() => {
    if (!stats.allClasses || stats.allClasses.length === 0) return [];
    
    return stats.allClasses.map(c => {
      const carbon = c.totalWeight * CO2_FACTOR;
      const target = 150.0; // 150 kg CO2e monthly target per class
      const pct = parseFloat(((carbon / target) * 100).toFixed(1));
      
      // Determine the division rank
      let rankName = '倔强青铜 V';
      let rankColor = '#b57a53'; // Bronze
      if (pct >= 100) {
        rankName = '最强王者 👑';
        rankColor = '#ef4444'; // King Red
      } else if (pct >= 75) {
        rankName = '至尊星耀 💎';
        rankColor = '#a855f7'; // Star Purple
      } else if (pct >= 50) {
        rankName = '永恒钻石 💎';
        rankColor = '#3b82f6'; // Diamond Blue
      } else if (pct >= 25) {
        rankName = '尊贵黄金 ⚔️';
        rankColor = '#d97706'; // Gold
      } else if (pct >= 10) {
        rankName = '秩序白银 🛡️';
        rankColor = '#94a3b8'; // Silver
      }

      return {
        className: c.className,
        carbonContribution: parseFloat(carbon.toFixed(1)),
        percentage: pct,
        rankName,
        rankColor,
        rawWeight: parseFloat(c.totalWeight.toFixed(1))
      };
    });
  }, [stats.allClasses]);

  const gradeStats = useMemo(() => {
    const gradesMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    stats.allClasses.forEach(c => {
      if (c.grade >= 1 && c.grade <= 6) {
        gradesMap[c.grade] += c.totalWeight;
      }
    });
    return Object.keys(gradesMap).map(g => ({
      gradeLabel: language === 'zh' ? `${g}年级` : `Darjah ${g}`,
      weight: Number(gradesMap[parseInt(g)].toFixed(1))
    }));
  }, [stats.allClasses, language]);

  const schoolNextGoal = Math.max(5000, Math.ceil((stats.grandTotal + 0.1) / 5000) * 5000);
  const schoolProgressPercent = Math.min(100, (stats.grandTotal / schoolNextGoal) * 100);

  return (
    <div className="space-y-6 animate-fade-in" id="public-dashboard-viewport">
      {/* 1. Goal Progress Panel */}
      {dashboardViewMode === 'overall' && (
        <div className="bg-white dark:bg-[#091526]/85 rounded-3xl p-6.5 shadow-md border border-[#d4af37]/20 dark:border-[#d4af37]/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-3 relative z-10">
            <div>
              <h3 className="font-bold text-stone-850 dark:text-[#f39c12] text-base md:text-lg flex items-center gap-2 font-space">
                <Sparkles size={18} className="text-amber-500 animate-pulse" />
                {language === 'zh' ? '全区绿色拯救行动 • 召唤师合作目标' : 'Misi Penyelamat Hijau • Matlamat Kolaborasi Wira'}
              </h3>
              <p className="text-xs text-stone-450 dark:text-amber-100/60 mt-1">
                {language === 'zh' ? '低碳排位守卫战共同里程碑！拯救绿色地球' : 'Pencapaian Bersama Misi Sifar Karbon! Selamatkan Bumi Hijau'}
              </p>
            </div>
            <div className="text-left md:text-right">
              <span className="text-3xl font-black text-amber-650 dark:text-amber-400 font-mono tracking-tight">
                {stats.grandTotal.toFixed(1)}
              </span>
              <span className="text-xs font-black text-stone-400 dark:text-amber-200/50"> / {schoolNextGoal} KG</span>
            </div>
          </div>

          <div className="w-full h-7 bg-stone-100 dark:bg-stone-950 rounded-full overflow-hidden relative border border-[#d4af37]/25 dark:border-[#d4af37]/35 shadow-inner z-10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 transition-all duration-1000 ease-out relative"
              style={{ width: `${schoolProgressPercent}%` }}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white tracking-widest uppercase">
              {language === 'zh' ? `战区净化进度: ${schoolProgressPercent.toFixed(1)}%` : `Kemajuan Pemurnian Zon: ${schoolProgressPercent.toFixed(1)}% Selesai`}
            </div>
          </div>

          <div className="mt-3.5 flex justify-between text-[11px] font-bold relative z-10">
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Leaf size={14} /> {language === 'zh' ? `主宰绿色能量，已减排二氧化碳约 ${(stats.grandTotal * CO2_FACTOR).toFixed(1)} kg CO₂e` : `Menguasai Tenaga Hijau, pelepasan CO₂ telah dikurangkan sebanyak ${(stats.grandTotal * CO2_FACTOR).toFixed(1)} kg CO₂e`}
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {language === 'zh' ? `下一个关卡解锁: ${schoolNextGoal} KG` : `Sasaran Seterusnya: ${schoolNextGoal} KG`}
            </span>
          </div>
        </div>
      )}

      {/* 2. Top Banner Statistics Bento cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-4 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden border border-amber-400/30">
          <div className="absolute top-0 right-0 p-5 opacity-10 text-8xl pointer-events-none">
            <Leaf />
          </div>
          <div>
            <p className="text-amber-100/90 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              👑 {selectedDashboardClass ? `${selectedDashboardClass} ${language === 'zh' ? '净化能量' : 'Tenaga Kitar'}` : (language === 'zh' ? '总净化量' : 'Jumlah Kitar')}
            </p>
            <div className="text-3xl md:text-4xl font-black mt-1.5 leading-none font-mono tracking-tight text-yellow-300">
              {currentDisplayTotal.toFixed(1)}{' '}
              <span className="text-sm font-semibold opacity-90 text-white">KG</span>
            </div>
          </div>
          <p className="text-[10px] text-amber-200/90 mt-5 font-black uppercase tracking-wider">
            {parseInt(filterMonthStart as any) === 0 && parseInt(filterMonthEnd as any) === 11
              ? (language === 'zh' ? `${filterYear}赛季 全年战绩` : `Rekod Sepanjang Tahun ${filterYear}`)
              : `${filterYear} ${language === 'zh' ? '赛季' : 'Musim'} ${(MONTH_OPTIONS[filterMonthStart] || '').split('/')[language === 'zh' ? 0 : 1]?.trim() || ''} ${language === 'zh' ? '至' : 'Hingga'} ${(MONTH_OPTIONS[filterMonthEnd] || '').split('/')[language === 'zh' ? 0 : 1]?.trim() || ''}`}
          </p>
        </div>

        <div className="md:col-span-4 bg-gradient-to-br from-[#122846] via-[#1a385f] to-[#040e1e] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden border border-[#d4af37]/35">
          <div className="absolute top-0 right-0 p-5 opacity-10 text-8xl pointer-events-none">
            <Activity />
          </div>
          <div>
            <p className="text-indigo-100/90 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              ⚡ {selectedDashboardClass ? `${selectedDashboardClass} ${language === 'zh' ? '庇护能量' : 'Karbon Dihindari'}` : (language === 'zh' ? '避二氧化碳量' : 'Karbon Dihindari')}
            </p>
            <div className="text-3xl md:text-4xl font-black mt-1.5 leading-none font-mono tracking-tight text-[#f39c12]">
              {(currentDisplayTotal * CO2_FACTOR).toFixed(1)}{' '}
              <span className="text-sm font-semibold opacity-90 text-white">kg CO₂e</span>
            </div>
          </div>
          <p className="text-[10px] text-stone-300/80 mt-5 font-bold">
            {language === 'zh' ? '碳中和算力估算' : 'Kiraan Neutral Karbon'} × {CO2_FACTOR}
          </p>
        </div>

        {/* 3. Filters and report trigger menu items */}
        <div className="md:col-span-4 bg-white/95 dark:bg-[#091526]/85 rounded-3xl p-6 shadow-sm border border-stone-200/60 dark:border-[#d4af37]/40 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
              <Filter size={16} />
              <h4 className="font-bold text-xs uppercase tracking-wide">{language === 'zh' ? '选项过滤' : 'Saringan'}</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-3.5 select-none">
            <div>
              <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase block mb-1">
                {language === 'zh' ? '学年' : 'Tahun'}
              </label>
              <select
                value={filterYear}
                onChange={e => setFilterYear(parseInt(e.target.value))}
                className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-350 outline-none"
              >
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase block mb-1">
                {language === 'zh' ? '选择班级' : 'Kelas'}
              </label>
              <select
                value={selectedDashboardClass}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedDashboardClass(val);
                  setDashboardViewMode(val ? 'class' : 'overall');
                }}
                className="w-full p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/45 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-400 outline-none"
              >
                <option value="">{language === 'zh' ? '- 全校 -' : '- Semua -'}</option>
                {CLASS_OPTIONS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex-1">
              <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 block mb-1">
                {language === 'zh' ? '起始' : 'Dari'}
              </label>
              <select
                value={filterMonthStart}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setFilterMonthStart(val);
                  if (val > filterMonthEnd) setFilterMonthEnd(val);
                }}
                className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-350 outline-none"
              >
                {MONTH_OPTIONS.map((m, i) => (
                  <option key={i} value={i}>
                    {m.split('/')[language === 'zh' ? 0 : 1].trim()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-black text-stone-400 dark:text-stone-500 block mb-1">
                {language === 'zh' ? '结束' : 'Hingga'}
              </label>
              <select
                value={filterMonthEnd}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setFilterMonthEnd(val);
                  if (val < filterMonthStart) setFilterMonthStart(val);
                }}
                className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-350 outline-none"
              >
                {MONTH_OPTIONS.map((m, i) => (
                  <option key={i} value={i}>
                    {m.split('/')[language === 'zh' ? 0 : 1].trim()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid for Carbon Benefit Panel & Grade Distribution Chart */}
      {dashboardViewMode === 'overall' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 items-stretch">
          {(() => {
            const schoolTotalCarbon = stats.grandTotal * 2.87;

            return (
              <div className="bg-white dark:bg-[#091526]/85 rounded-3xl p-5 shadow-md border border-stone-200/60 dark:border-[#d4af37]/35 flex flex-col justify-between animate-fade-in" id="realtime-carbon-benefit-panel">
                <div className="flex flex-col gap-4">
                  {/* Header section with live counter */}
                  <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/20 p-4 rounded-2xl border border-emerald-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="p-0.5 px-1.5 rounded-md bg-emerald-150 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-black text-[9px] uppercase tracking-wider">
                          Live / Real-time
                        </span>
                        <h4 className="font-extrabold text-[#059669] dark:text-[#34d399] text-sm uppercase tracking-tight">
                          {language === 'zh' ? '新廊华小绿色碳减排实时量' : 'Pengurangan Karbon SJKC Ladang Grisek'}
                        </h4>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold mt-0.5">
                        {language === 'zh' ? '每回收 1 KG 废弃物折合减少约 2.87 KG 碳排放' : 'Setiap 1 KG dikitar semula mengurangkan 2.87 KG pelepasan karbon'}
                      </p>
                    </div>
                    {/* Animated Real-time running tick up */}
                    <div className="flex items-baseline gap-1 select-none font-sans shrink-0 bg-white dark:bg-stone-950 px-3 py-1.5 border border-stone-200/40 dark:border-stone-850 rounded-xl shadow-inner">
                      <span className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-450 animate-pulse">
                        {animatedCarbon.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-black text-stone-550 dark:text-stone-350">kg CO₂e</span>
                    </div>
                  </div>

                  {/* Educational Ecoliteracy conversions */}
                  <div className="space-y-3 text-left">
                    <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 tracking-wider uppercase flex items-center gap-1.5 select-none">
                      <Activity size={12} className="text-emerald-500" />
                      <span>{language === 'zh' ? '💡 碳足迹换算为直观环保绿意效益' : '💡 Tafsiran Faedah Kelestarian Positif'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Tree carbon sequestration equivalent */}
                      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-150 dark:border-stone-850 p-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.01] transition-transform">
                        <span className="text-2xl shrink-0">🌲</span>
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold text-stone-400 leading-none">
                            {language === 'zh' ? '相当于种植绿树' : 'Pokok Ditanam'}
                          </div>
                          <div className="text-sm font-black text-stone-800 dark:text-stone-150 font-mono mt-1 leading-none">
                            {(schoolTotalCarbon / 22).toFixed(1)}{' '}
                            <span className="text-[10px] font-bold text-stone-450">{language === 'zh' ? '棵' : 'batang'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Auto miles avoided */}
                      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-150 dark:border-stone-850 p-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.01] transition-transform">
                        <span className="text-2xl shrink-0">🚗</span>
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold text-stone-400 leading-none">
                            {language === 'zh' ? '减少乘车公里' : 'KM Dikurangkan'}
                          </div>
                          <div className="text-sm font-black text-stone-800 dark:text-stone-150 font-mono mt-1 leading-none">
                            {(schoolTotalCarbon / 0.12).toFixed(0)}{' '}
                            <span className="text-[10px] font-bold text-stone-450">KM</span>
                          </div>
                        </div>
                      </div>

                      {/* KWh energy savings */}
                      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-150 dark:border-stone-850 p-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.01] transition-transform">
                        <span className="text-2xl shrink-0">💡</span>
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold text-stone-400 leading-none">
                            {language === 'zh' ? '节省家庭电量' : 'Tenaga Dijimat'}
                          </div>
                          <div className="text-sm font-black text-stone-800 dark:text-stone-150 font-mono mt-1 leading-none">
                            {(schoolTotalCarbon / 0.52).toFixed(0)}{' '}
                            <span className="text-[10px] font-bold text-stone-450">{language === 'zh' ? '度' : 'kWh'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Water bottle saver */}
                      <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-150 dark:border-stone-850 p-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.01] transition-transform">
                        <span className="text-2xl shrink-0">🥤</span>
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold text-stone-400 leading-none">
                            {language === 'zh' ? '塑料直饮水瓶' : 'Botol Plastik'}
                          </div>
                          <div className="text-sm font-black text-stone-800 dark:text-stone-150 font-mono mt-1 leading-none">
                            {(stats.grandTotal * 12.5).toFixed(0)}{' '}
                            <span className="text-[10px] font-bold text-stone-450">{language === 'zh' ? '个' : 'botol'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold italic bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 text-center uppercase tracking-wide">
                    {language === 'zh' ? '🍀 低碳在于生活中点滴小事的汇溪成海，低碳未来由我们做主！' : '🍀 Amalan sifar karbon bermula dengan langkah kecil. Kita menyelamatkan masa depan bumi!'}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Grade Level Distribution Bar Chart alongside carbon benefit */}
          <div className="bg-white dark:bg-[#091526]/85 rounded-3xl p-5 shadow-md border border-stone-200/60 dark:border-[#d4af37]/35 flex flex-col justify-between animate-fade-in">
            <div className="flex flex-col gap-2.5 h-full justify-between">
              <div className="text-left">
                <h4 className="font-extrabold text-stone-850 dark:text-[#f39c12] text-sm uppercase tracking-tight flex items-center gap-2">
                  <Users size={16} className="text-amber-500" />
                  {language === 'zh' ? '各年级回收量分布' : 'Taburan Kitar Semula Mengikut Darjah'}
                </h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold mt-0.5">
                  {language === 'zh' ? '实时对比各年级的回收贡献' : 'Perbandingan sumbangan kitar semula antara darjah.'}
                </p>
              </div>

              <div className="h-[185px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gradeStats}
                    margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.15} />
                    <XAxis 
                      dataKey="gradeLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#aaa' : '#666' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 'bold', fill: isDarkMode ? '#aaa' : '#666' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '11px' }}
                      formatter={(value: number) => [`${value} KG`, language === 'zh' ? '总回收量' : 'Jumlah Kitar']}
                    />
                    <Bar dataKey="weight" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {gradeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 荣誉殿堂 (Hall of Fame) Block */}
      {dashboardViewMode === 'overall' && (
        <div className="bg-gradient-to-b from-stone-50 to-stone-100/40 dark:from-[#071120] dark:to-[#040e1a] border border-amber-500/20 dark:border-amber-500/40 p-6 rounded-3xl shadow-lg animate-fade-in select-none w-full mb-6" id="hall-of-fame-panel">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl animate-bounce">🏆</span>
              <div>
                <h3 className="font-extrabold text-stone-900 dark:text-yellow-300 text-base md:text-lg tracking-tight font-space">
                  {language === 'zh' ? '荣誉殿堂' : 'Dewan Kehormatan Wira Lestari'}
                </h3>
                <p className="text-[10px] text-stone-550 dark:text-amber-400/80 font-bold uppercase tracking-wider mt-0.5">
                  {language === 'zh' ? '学生回收排行榜' : 'Kedudukan Wira Lestari Individu'}
                </p>
              </div>
            </div>
            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] uppercase px-3 py-1.5 rounded-2xl font-black border border-amber-500/20">
              {language === 'zh' ? '殿堂常驻席' : 'Zon Elit'}
            </span>
          </div>

          {stats.allIndividuals.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-stone-500 font-bold text-xs">
              {language === 'zh' ? '🍃 当前没有回收记录产生，等待各班先锋解锁席位...' : '🍃 Tiada Pengguna Kitar Semula.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Podium (3 Columns) representing Top 3 Students */}
              <div className="lg:col-span-7 flex flex-col justify-between bg-stone-100/30 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-850/80 p-5 rounded-2xl">
                <p className="text-[10px] font-black text-center text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6">
                  {language === 'zh' ? '✨ 赛季前三甲荣誉召唤师 ✨' : '✨ Podium 3 Wira Terbaik ✨'}
                </p>
                
                <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4">
                  {/* 2nd Place Podium */}
                  <div className="flex flex-col items-center w-28 sm:w-36 text-center">
                    {stats.allIndividuals[1] ? (
                      <>
                        <div className="mb-2 flex flex-col items-center">
                          <span className="text-2xl">🥈</span>
                          <span className="font-extrabold text-xs text-stone-850 dark:text-stone-200 truncate max-w-[120px]">
                            {language === 'zh' ? stats.allIndividuals[1].name : (stats.allIndividuals[1].name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || stats.allIndividuals[1].name)}
                          </span>
                          <span className="text-[9px] font-bold text-stone-400">
                            {stats.allIndividuals[1].className} {language === 'zh' ? '班' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-gradient-to-t from-slate-400/30 to-slate-400/10 dark:from-slate-800/40 dark:to-slate-900/10 border-t-2 border-slate-300 dark:border-slate-600 h-28 rounded-t-xl flex flex-col justify-end pb-3 relative shadow-sm">
                          <span className="absolute top-2 left-0 right-0 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                            {language === 'zh' ? 'No.2 银牌' : 'Tempat Ke-2'}
                          </span>
                          <div className="font-mono font-black text-sm text-slate-605 dark:text-slate-350 leading-none">
                            {stats.allIndividuals[1].totalWeight.toFixed(1)}
                          </div>
                          <span className="text-[8px] text-stone-450 uppercase tracking-wider mt-1 block">{language === 'zh' ? 'KG 重量' : 'KG'}</span>
                          <span className="text-[9px] mt-2 block font-extrabold text-slate-600 dark:text-slate-400 truncate max-w-full px-1">
                            {stats.allIndividuals[1].badge}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="opacity-30 h-28 w-full border border-dashed border-stone-300 dark:border-stone-800 rounded-xl flex items-center justify-center text-xs text-stone-400">
                        {language === 'zh' ? '虚位以待' : 'Kosong'}
                      </div>
                    )}
                  </div>

                  {/* 1st Place Podium (Tallest & Center) */}
                  <div className="flex flex-col items-center w-32 sm:w-44 text-center z-10 relative -top-3">
                    {stats.allIndividuals[0] ? (
                      <>
                        <div className="mb-2 flex flex-col items-center relative">
                          <Crown size={22} className="text-yellow-400 fill-yellow-400 animate-bounce mb-1" />
                          <span className="text-3xl absolute -top-5">🥇</span>
                          <span className="font-black text-sm text-amber-850 dark:text-amber-300 truncate max-w-[150px] mt-1">
                            {language === 'zh' ? stats.allIndividuals[0].name : (stats.allIndividuals[0].name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || stats.allIndividuals[0].name)}
                          </span>
                          <span className="text-[9px] font-bold text-stone-405 dark:text-stone-400">
                            {stats.allIndividuals[0].className} {language === 'zh' ? '班' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-gradient-to-t from-yellow-500/20 to-amber-500/5 dark:from-amber-600/20 dark:to-amber-900/5 border-t-4 border-amber-500 h-36 rounded-t-xl flex flex-col justify-end pb-4 relative shadow-lg">
                          <span className="absolute top-2 left-0 right-0 text-[11px] font-black uppercase tracking-wider text-amber-655 dark:text-yellow-405">
                            {language === 'zh' ? '🏆 环保之尊' : '🏆 Juara'}
                          </span>
                          <div className="font-mono font-black text-lg text-amber-655 dark:text-yellow-300 leading-none">
                            {stats.allIndividuals[0].totalWeight.toFixed(1)}
                          </div>
                          <span className="text-[9px] text-stone-450 uppercase tracking-wider mt-1 block">{language === 'zh' ? 'KG 重量' : 'KG'}</span>
                          <span className="text-[9.5px] mt-2 bg-yellow-400 dark:bg-amber-600 text-stone-950 dark:text-white font-black px-2 py-0.5 rounded-full select-none shadow-sm leading-none truncate max-w-[95%]">
                            {stats.allIndividuals[0].badge}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="opacity-30 h-36 w-full border border-dashed border-stone-300 dark:border-stone-800 rounded-xl flex items-center justify-center text-xs text-stone-400">
                        {language === 'zh' ? '虚位以待' : 'Kosong'}
                      </div>
                    )}
                  </div>

                  {/* 3rd Place Podium */}
                  <div className="flex flex-col items-center w-28 sm:w-36 text-center">
                    {stats.allIndividuals[2] ? (
                      <>
                        <div className="mb-2 flex flex-col items-center">
                          <span className="text-2xl">🥉</span>
                          <span className="font-extrabold text-xs text-stone-850 dark:text-stone-300 truncate max-w-[120px]">
                            {language === 'zh' ? stats.allIndividuals[2].name : (stats.allIndividuals[2].name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || stats.allIndividuals[2].name)}
                          </span>
                          <span className="text-[9px] font-bold text-stone-400">
                            {stats.allIndividuals[2].className} {language === 'zh' ? '班' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-gradient-to-t from-amber-800/20 to-orange-850/5 dark:from-amber-900/10 dark:to-stone-900/5 border-t-2 border-amber-700 dark:border-amber-900 h-24 rounded-t-xl flex flex-col justify-end pb-3 relative shadow-sm">
                          <span className="absolute top-2 left-0 right-0 text-[10px] font-black uppercase text-amber-750 dark:text-amber-500">
                            {language === 'zh' ? 'No.3 铜牌' : 'Tempat Ke-3'}
                          </span>
                          <div className="font-mono font-black text-sm text-amber-800 dark:text-amber-500 leading-none">
                            {stats.allIndividuals[2].totalWeight.toFixed(1)}
                          </div>
                          <span className="text-[8px] text-stone-450 uppercase tracking-wider mt-1 block">{language === 'zh' ? 'KG 重量' : 'KG'}</span>
                          <span className="text-[9px] mt-2 block font-extrabold text-[#cd7f32] truncate max-w-full px-1">
                            {stats.allIndividuals[2].badge}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="opacity-30 h-24 w-full border border-dashed border-stone-300 dark:border-stone-800 rounded-xl flex items-center justify-center text-xs text-stone-400">
                        {language === 'zh' ? '虚位以待' : 'Kosong'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Leaderboard List (Top 4 to 10) */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-stone-100/30 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-850 p-4.5 rounded-2xl">
                <div>
                  <p className="text-[10px] font-black text-stone-450 dark:text-stone-400 uppercase tracking-widest mb-4">
                    {language === 'zh' ? '⚡ 殿堂候选席 (第四至第十名)' : '⚡ Kedudukan Ke-4 hingga Ke-10'}
                  </p>
                  
                  {stats.allIndividuals.length <= 3 ? (
                    <div className="py-8 text-center text-xs text-stone-400 font-bold">
                      {language === 'zh' ? '🏆 正在等待更多环保先锋登上殿堂...' : '🏆 Menunggu lebih banyak pahlawan hijau...'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                      {stats.allIndividuals.slice(3, 10).map((indiv, index) => (
                        <div 
                          key={indiv.studentID || index}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/40 dark:border-stone-850/60 bg-white/60 dark:bg-stone-900/30 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-all font-sans"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5.5 h-5.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-black text-[11px] rounded-full flex items-center justify-center shrink-0">
                              {index + 4}
                            </span>
                            <div className="min-w-0">
                              <div className="font-extrabold text-stone-800 dark:text-stone-200 text-xs truncate">
                                {language === 'zh' ? indiv.name : (indiv.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || indiv.name)}
                              </div>
                              <div className="text-[9px] text-stone-450 font-bold flex items-center gap-1.5 mt-0.5">
                                <span>{indiv.className} {language === 'zh' ? '班' : ''}</span>
                                <span className="opacity-40">•</span>
                                <span className="text-amber-605 dark:text-amber-400 truncate max-w-[100px]">{indiv.badge}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-450">
                              {indiv.totalWeight.toFixed(1)}
                            </span>
                            <span className="text-[8px] font-bold text-stone-400 ml-0.5">KG</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-stone-200 dark:border-stone-850 flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 font-extrabold uppercase">
                  <span>{language === 'zh' ? `总计校内排名学生: ${stats.allIndividuals.length} 人` : `Jumlah Pelajar Tersenarai: ${stats.allIndividuals.length}`}</span>
                  <span>{language === 'zh' ? '绿色积分聚合制' : 'Sistem Bersepadu Kelestarian'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Action triggers for PDF monthly summations */}
      {isAdmin && (
        <div className="flex flex-wrap gap-3.5 bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-850 p-4 rounded-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            <h5 className="text-xs font-bold text-stone-700 dark:text-stone-350">
              {language === 'zh' ? '打印总结与荣耀布告看板:' : 'Cetak Sijil & Laporan:'}
            </h5>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onGenerateReport({ monthIndex: filterMonthStart, year: filterYear })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 active-press"
            >
              <FileSpreadsheet size={14} /> {language === 'zh' ? '生成月度总结成绩单' : 'Jana Laporan Bulanan'} ({(MONTH_OPTIONS[filterMonthStart] || '').split('/')[language === 'zh' ? 0 : 1]?.trim() || ''})
            </button>
            <button
              onClick={() => onGenerateQuarterly({ quarter: 'Q1', year: filterYear })}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 active-press"
            >
              <Trophy size={14} /> {language === 'zh' ? '季度回收排行榜' : 'Kedudukan Suku Tahun'}
            </button>
          </div>
        </div>
      )}

      {/* MOBA Gamified Rank Explainer */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-blue-500/10 dark:from-amber-950/20 dark:via-emerald-950/10 dark:to-blue-950/20 border border-amber-200/50 dark:border-amber-900/30 p-4 rounded-3xl animate-fade-in select-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer gap-3" onClick={() => setShowMobaRanksExp(!showMobaRanksExp)}>
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🎮</span>
            <div>
              <h4 className="font-extrabold text-[13.5px] text-stone-800 dark:text-stone-100 flex items-center gap-2 flex-wrap">
                {language === 'zh' ? '王者荣耀环保赛季 —— 个人绿色段位挑战' : 'Sistem Pangkat Lestari (MOBA-inspired)'}
                <span className="bg-rose-500 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full animate-pulse tracking-widest shrink-0 shadow-sm leading-none flex items-center">{language === 'zh' ? '全新赛季 SEASON 1' : 'MUSIM BAHARU 1'}</span>
              </h4>
              <p className="text-[10px] text-stone-550 dark:text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                {language === 'zh' ? '收集回收重量 (KG) 晋级最高段位 (新廊华小)' : 'Kumpulkan berat kitar semula (KG) untuk naik ke Pangkat Tertinggi (SJKC Ladang Grisek)'}
              </p>
            </div>
          </div>
          <button className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 px-3.5 py-1.5 rounded-2xl border border-amber-300/40 dark:border-amber-800/40 transition-all flex items-center gap-1 shrink-0 self-end sm:self-auto">
            {showMobaRanksExp ? (language === 'zh' ? '收起段位说明' : 'Tutup') : (language === 'zh' ? '展开段位秘籍' : 'Rujuk Pangkat')}
          </button>
        </div>

        {showMobaRanksExp && (
          <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-stone-800/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 animate-fade-in text-center">
            {[
              { rank: language === 'zh' ? "🔥 荣耀王者" : "🔥 Glorious King", limit: "≥ 800 kg", tag: "Glorious King", style: "border-amber-400 dark:border-amber-700 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent", text: "text-amber-600 dark:text-amber-400" },
              { rank: language === 'zh' ? "🌟 无双王者" : "🌟 Matchless King", limit: "500 - 800", tag: "Matchless King", style: "border-rose-400 dark:border-rose-800 bg-rose-500/5", text: "text-rose-600 dark:text-rose-400" },
              { rank: language === 'zh' ? "🔴 最强王者" : "🔴 Mighty King", limit: "350 - 500", tag: "Mighty King", style: "border-red-400 dark:border-red-800 bg-red-500/5", text: "text-red-600 dark:text-red-400" },
              { rank: language === 'zh' ? "🌪️ 至尊星耀" : "🌪️ Supreme Star", limit: "200 - 350", tag: "Supreme Star", style: "border-purple-300 dark:border-purple-800 bg-purple-500/5", text: "text-purple-600 dark:text-purple-400" },
              { rank: language === 'zh' ? "👑 永恒钻石" : "👑 Eternal Diamond", limit: "100 - 200", tag: "Eternal Diamond", style: "border-blue-300 dark:border-blue-800 bg-blue-500/5", text: "text-blue-600 dark:text-blue-400" },
              { rank: language === 'zh' ? "💎 尊贵铂金" : "💎 Glorious Plat", limit: "50 - 100", tag: "Glorious Plat", style: "border-cyan-300 dark:border-cyan-800 bg-cyan-500/5", text: "text-cyan-600 dark:text-cyan-400" },
              { rank: language === 'zh' ? "⚔️ 尊贵黄金" : "⚔️ Noble Gold", limit: "25 - 50", tag: "Noble Gold", style: "border-amber-300 dark:border-amber-800 bg-amber-500/5", text: "text-amber-605 dark:text-amber-400" },
              { rank: language === 'zh' ? "🛡️ 秩序白银" : "🛡️ Orderly Silver", limit: "10 - 25", tag: "Orderly Silver", style: "border-slate-300 dark:border-slate-800 bg-slate-500/5", text: "text-slate-600 dark:text-slate-400" },
              { rank: language === 'zh' ? "🆕 青铜骑士" : "🆕 Rust Bronze", limit: "< 10 kg", tag: "Rust Bronze", style: "border-stone-300 dark:border-stone-800 bg-stone-500/5", text: "text-stone-550 dark:text-stone-400" }
            ].map((p, idx) => (
              <div key={idx} className={`p-3 rounded-2xl border flex flex-col justify-between items-center transition-all ${p.style} hover:shadow-sm`}>
                <span className={`text-[11px] font-black tracking-tight leading-tight shrink-0 ${p.text}`}>{p.rank}</span>
                <span className="text-[9.5px] font-black text-stone-705 dark:text-stone-200 mt-2.5 bg-white/70 dark:bg-stone-950/80 border border-stone-200/50 dark:border-stone-800/80 px-1.5 py-0.5 rounded-full shadow-inner">{p.limit}</span>
                <span className="text-[8px] text-stone-400 dark:text-stone-500 font-extrabold uppercase mt-1.5 leading-none shrink-0">{p.tag}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Rankings bento container */}
      {dashboardViewMode === 'overall' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none animate-fade-in">
          <RankingCard
            title={language === 'zh' ? "班级榜 (低年级)" : "Kelas (Tahap 1)"}
            subTitle="Best Class (Tahap 1)"
            data={stats.classLower as any}
            type="class"
            isDarkMode={isDarkMode}
          />
          <RankingCard
            title={language === 'zh' ? "班级榜 (高年级)" : "Kelas (Tahap 2)"}
            subTitle="Best Class (Tahap 2)"
            data={stats.classUpper as any}
            type="class"
            isDarkMode={isDarkMode}
          />
          <RankingCard
            title={language === 'zh' ? "回收王 (低年级)" : "Individu (Tahap 1)"}
            subTitle="Best Pupil (Tahap 1)"
            data={stats.indivLower as any}
            type="individual"
            isDarkMode={isDarkMode}
          />
          <RankingCard
            title={language === 'zh' ? "回收王 (高年级)" : "Individu (Tahap 2)"}
            subTitle="Best Pupil (Tahap 2)"
            data={stats.indivUpper as any}
            type="individual"
            isDarkMode={isDarkMode}
          />
        </div>
      ) : (
        <div className="animate-fade-in select-none">
          <div className="bg-white/95 dark:bg-[#091526]/85 rounded-2xl shadow-sm border border-stone-200/60 dark:border-[#d4af37]/40 overflow-hidden min-h-[460px] flex flex-col">
            <div className="px-5 py-4 border-b border-stone-100 dark:border-[#d4af37]/25 bg-stone-50/50 dark:bg-[#0a182c]/90 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 font-space">
                  <Users size={18} className="text-emerald-500" />
                  {selectedDashboardClass ? `${selectedDashboardClass} ${language === 'zh' ? '班级光荣榜' : 'Prestasi Kelas'}` : (language === 'zh' ? '请选择班级' : 'Sila pilih kelas')}
                </h3>
                <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500 mt-0.5">
                  Prestasi Kelas {selectedDashboardClass}
                </p>
              </div>
              {selectedDashboardClass && (
                <div className="text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-100/50 dark:border-emerald-900/20">
                  {language === 'zh' ? `参与学生: ${classStats.length} 名` : `Pelajar: ${classStats.length}`}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {!selectedDashboardClass ? (
                <div className="h-full py-12 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700 gap-2 font-semibold text-xs">
                  <Filter size={32} /> {language === 'zh' ? '请在右上方选择栏目筛选班级。' : 'Sila pilih kelas di bahagian atas kanan.'}
                </div>
              ) : classStats.length === 0 ? (
                <div className="h-full py-12 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700 gap-2 font-semibold text-xs">
                  <Inbox size={32} /> {language === 'zh' ? '发现该班级在本周期内暂无提交物。' : 'Tiada rekod ditemui untuk kelas ini.'}
                </div>
              ) : (
                <ul className="space-y-2">
                  {classStats.map((item, index) => {
                    const pctVal = classStats[0]?.totalWeight ? (item.totalWeight / classStats[0].totalWeight) * 100 : 0;
                    return (
                      <li key={index} className="relative transition-all rounded-xl overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/5 transition-all duration-1000" style={{ width: `${pctVal}%` }}></div>
                        <div className="relative flex items-center justify-between p-3.5 rounded-xl border border-stone-100 dark:border-[#d4af37]/25 bg-white/50 dark:bg-[#071120]/40">
                          <div className="flex items-center gap-3">
                            <span className="text-stone-400 font-bold font-mono">{index + 1}</span>
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-stone-800 dark:text-stone-200 text-sm md:text-base">
                                {language === 'zh' ? item.name : (item.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || item.name)}
                              </span>
                              {language === 'zh' && item.name.match(/[\u4e00-\u9fa5]+/g) && (
                                <span className="text-xs text-stone-400 dark:text-stone-500 font-bold">
                                  {item.name.match(/[\u4e00-\u9fa5]+/g)!.join(' ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-sm md:text-base text-emerald-700 dark:text-emerald-400 font-mono">
                            {item.totalWeight.toFixed(1)} <span className="text-[10px] text-stone-400 uppercase">kg</span>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Briefing Modal */}
      {isBriefingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 font-sans animate-fade-in">
          <div className="bg-white/95 dark:bg-[#091526]/95 border-2 border-[#d4af37]/40 p-6 rounded-3xl max-w-2xl w-full relative flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(212,175,55,0.15)]">
            
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-3.5 mb-4">
              <div>
                <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm md:text-base">
                  {language === 'zh' ? '月度环保回收战报预览' : 'Pratinjau Laporan Imej'}
                </h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                  The infographic of current period's total class milestones
                </p>
              </div>
              <button 
                onClick={() => setIsBriefingModalOpen(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 rounded-full transition-all active-press"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable area for previewing the report card */}
            <div className="flex-1 overflow-y-auto p-2 bg-stone-50 dark:bg-stone-950 rounded-2xl flex justify-center border border-stone-200/50 dark:border-stone-850">
              <div 
                id="monthly-briefing-infographic-card"
                className="w-[500px] bg-[#030914] text-[#ebf2ff] p-7 border-2 border-amber-500/50 rounded-2xl flex flex-col justify-between shadow-2xl relative select-none"
                style={{ fontFamily: 'sans-serif' }}
              >
                {/* Visual Watermark background element */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/15 via-transparent to-transparent pointer-events-none rounded-2xl"></div>
                <div className="absolute bottom-4 right-4 text-9xl opacity-[0.02] pointer-events-none">👑</div>

                {/* Banner Header */}
                <div className="border-b-2 border-emerald-500/20 pb-3 mb-5 flex justify-between items-center relative z-10">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-amber-400 tracking-widest uppercase leading-none">
                      {language === 'zh' ? '🏆 王者绿色荣誉排位赛季 / SEASON 1' : '🏆 SISTEM PANGKAT LESTARI / MUSIM 1'}
                    </p>
                    <h2 className="text-base font-black tracking-tight mt-1 text-white uppercase">
                      {language === 'zh' ? '新廊华小 • 绿色环保月度战报' : 'Laporan Bulanan Kitar Semula'}
                    </h2>
                    <p className="text-[8px] text-stone-400 uppercase tracking-wider font-extrabold mt-0.5">
                      {language === 'zh' ? 'Laporan Bulanan Kitar Semula SJKC Ladang Grisek' : 'SJKC Ladang Grisek'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-black">
                      {filterYear}{language === 'zh' ? '赛季' : ' Musim'}
                    </span>
                  </div>
                </div>

                {/* Subtitle describing showing months */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 mb-5 flex justify-between items-center relative z-10 text-[10.5px]">
                  <span className="font-extrabold text-stone-300">
                    {language === 'zh' ? '统计周期:' : 'Tempoh Statistik:'}
                  </span>
                  <span className="font-black tracking-wide text-yellow-300">
                    {(MONTH_OPTIONS[filterMonthStart] || '').split('/')[language === 'zh' ? 0 : 1]?.trim() || ''} {language === 'zh' ? '至' : 'hingga'} {(MONTH_OPTIONS[filterMonthEnd] || '').split('/')[language === 'zh' ? 0 : 1]?.trim() || ''}
                  </span>
                </div>

                {/* Master summary metric cards (Bento layout) */}
                <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
                  <div className="bg-stone-900/70 border border-stone-800 p-3 rounded-xl text-center">
                    <p className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest leading-none">
                      {language === 'zh' ? '物料净量' : 'BERAT'}
                    </p>
                    <p className="text-base font-black text-emerald-400 font-mono tracking-tight mt-1.5">
                      {stats.grandTotal.toFixed(1)} <span className="text-[8px] font-bold">KG</span>
                    </p>
                  </div>
                  <div className="bg-stone-900/70 border border-stone-800 p-3 rounded-xl text-center">
                    <p className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest leading-none">
                      {language === 'zh' ? 'CO₂减阻' : 'KARBON'}
                    </p>
                    <p className="text-base font-black text-yellow-400 font-mono tracking-tight mt-1.5">
                      {(stats.grandTotal * CO2_FACTOR).toFixed(1)} <span className="text-[8px] font-bold">KG</span>
                    </p>
                  </div>
                  <div className="bg-stone-900/70 border border-stone-800 p-3 rounded-xl text-center">
                    <p className="text-[8px] font-extrabold text-stone-500 uppercase tracking-widest leading-none">
                      {language === 'zh' ? '拯救绿植' : 'POKOK'}
                    </p>
                    <p className="text-base font-black text-cyan-400 font-mono tracking-tight mt-1.5">
                      {((stats.grandTotal * CO2_FACTOR) / 100).toFixed(1)} <span className="text-[8px] font-bold">{language === 'zh' ? '棵' : 'Btg'}</span>
                    </p>
                  </div>
                </div>

                {/* Top 5 Classes section */}
                <div className="bg-stone-900/40 border border-stone-800/60 rounded-xl p-3.5 mb-5 space-y-3 relative z-10">
                  <p className="text-[9.5px] font-black text-stone-300 tracking-wider flex items-center gap-1 uppercase">
                    {language === 'zh' ? '👑 班级回收拯救先锋榜 (TOP 5)' : '👑 Kelas Terbaik (TOP 5)'}
                  </p>
                  
                  {stats.allClasses.length === 0 ? (
                    <p className="text-[10px] text-stone-500 font-bold py-4 text-center">{language === 'zh' ? '暂无班级排名数据' : 'Tiada data kelas'}</p>
                  ) : (
                    <div className="space-y-2.5">
                      {stats.allClasses.slice(0, 5).map((cl, i) => {
                        const maxVal = stats.allClasses[0]?.totalWeight || 1;
                        const pct = Math.min(100, (cl.totalWeight / maxVal) * 100);
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center text-[10.5px] font-bold text-stone-200">
                              <span className="flex items-center gap-2">
                                <span className={`w-4.5 h-4.5 font-mono text-[9px] font-bold rounded-full flex items-center justify-center ${
                                  i === 0 ? 'bg-yellow-400 text-stone-950 font-black' : 
                                  i === 1 ? 'bg-slate-350 text-stone-950 font-black' : 
                                  i === 2 ? 'bg-[#cd7f32] text-white font-black' : 'bg-stone-800 text-stone-400'
                                }`}>
                                  {i + 1}
                                </span>
                                <span>{cl.className} {language === 'zh' ? '班' : ''}</span>
                              </span>
                              <span className="font-mono font-black text-emerald-400 text-xs">
                                {cl.totalWeight.toFixed(1)} KG
                              </span>
                            </div>
                            <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden select-none">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top 3 Individuals section */}
                <div className="bg-stone-900/40 border border-stone-800/60 rounded-xl p-3.5 space-y-3 relative z-10 w-full text-left">
                  <p className="text-[9.5px] font-black text-stone-300 tracking-wider flex items-center gap-1 uppercase">
                    {language === 'zh' ? '🌟 守护地球低碳先锋明星 (TOP 3)' : '🌟 Wira Lestari Terbaik (TOP 3)'}
                  </p>
                  
                  {stats.allIndividuals.length === 0 ? (
                    <p className="text-[10px] text-stone-500 font-bold py-4 text-center">{language === 'zh' ? '暂无学生排名数据' : 'Tiada data individu'}</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center w-full">
                      {stats.allIndividuals.slice(0, 3).map((ind, i) => (
                        <div key={i} className="bg-stone-950/50 p-2 rounded-xl border border-stone-850 relative text-left">
                          <span className="absolute top-1 right-1 text-xs">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                          </span>
                          <span className="text-[8px] font-black block text-stone-400 truncate leading-none pt-0.5">
                            {ind.className} {language === 'zh' ? '班' : ''}
                          </span>
                          <span className="text-[10px] font-black text-yellow-300 tracking-wide block truncate mt-1">
                            {language === 'zh' ? ind.name : (ind.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || ind.name)}
                          </span>
                          <span className="text-[10.5px] font-black text-emerald-400 font-mono block mt-1 leading-none">
                            {ind.totalWeight.toFixed(1)}<span className="text-[7.5px] font-bold text-stone-500 ml-0.5">KG</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer and Certificate Stamp */}
                <div className="mt-6 pt-3 border-t border-stone-850 flex justify-between items-center text-[8px] text-stone-500 font-bold relative z-10">
                  <div className="text-left leading-relaxed">
                    <p>SJKC Ladang Grisek Lestari Eco-Recycle Engine v2.0</p>
                    <p className="mt-0.5">{language === 'zh' ? '本战报通过智能绿色排位审计机制自动结算' : 'Laporan dijana secara automatik'}</p>
                  </div>
                  <div className="text-right font-mono text-[7px] text-stone-600">
                    GEN-TIME: {new Date().toLocaleDateString()}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal footers */}
            <div className="mt-5 pt-3 border-t border-stone-150 dark:border-stone-850 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBriefingModalOpen(false)}
                className="px-4 py-2 bg-stone-105 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl transition-all active-press"
              >
                {language === 'zh' ? '关闭' : 'Tutup'}
              </button>
              <button
                type="button"
                onClick={handleShareBriefing}
                disabled={isGeneratingBriefing}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 active-press transition-all disabled:opacity-40"
              >
                {isGeneratingBriefing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    {language === 'zh' ? '正在生成中...' : 'Sedang Dijana...'}
                  </>
                ) : (
                  <>
                    <Share2 size={13} />
                    {language === 'zh' ? '确认生成并分享' : 'Kongsi & Simpan'}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardView;
