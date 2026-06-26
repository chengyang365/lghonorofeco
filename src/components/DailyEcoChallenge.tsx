import React, { useState, useMemo } from 'react';
import { Target, CheckCircle, Zap, Star, Award, ShieldCheck } from 'lucide-react';
import { playSound, triggerHaptic } from '../utils';
import { useLanguage } from './LanguageContext';

interface EcoChallenge {
  titleEn: string;
  titleZh: string;
  titleMs: string;
  descEn: string;
  descZh: string;
  descMs: string;
  points: number;
}

const CHALLENGES: EcoChallenge[] = [
  {
    titleEn: "No Plastic Straws Day",
    titleZh: "无塑料吸管日",
    titleMs: "Hari Tanpa Straw Plastik",
    descEn: "Say no to plastic straws for all your drinks today! Drink straight from the cup or use a reusable straw.",
    descZh: "今天所有的饮料都拒绝使用塑料吸管！直接饮用或使用环保可循环吸管。",
    descMs: "Katakan tidak kepada straw plastik untuk semua minuman anda hari ini! Minum terus dari cawan atau gunakan straw boleh guna semula.",
    points: 15
  },
  {
    titleEn: "Zero Food Waste",
    titleZh: "光盘行动 (零厨余)",
    titleMs: "Sifar Sisa Makanan",
    descEn: "Finish everything on your plate for breakfast, lunch, and dinner. No food left behind!",
    descZh: "吃光盘子里的每一粒粮食！早午晚餐都不产生任何厨余浪费。",
    descMs: "Habiskan semua makanan di dalam pinggan anda untuk sarapan, makan tengah hari, dan makan malam. Jangan tinggalkan sisa!",
    points: 20
  },
  {
    titleEn: "Unplug Idle Devices",
    titleZh: "拔除闲置插头",
    titleMs: "Cabut Palam Peranti Terbiar",
    descEn: "Find 2 devices at home that are turned off but still plugged in, and unplug them to save standby power.",
    descZh: "在家中找出2个已关机但仍插着插头的电器，拔掉插头以节省待机电能。",
    descMs: "Cari 2 peranti di rumah yang telah dimatikan tetapi palamnya masih terpasang, dan cabut untuk menjimatkan tenaga mod sedia.",
    points: 10
  },
  {
    titleEn: "Bring Your Own Container",
    titleZh: "自带环保便当盒",
    titleMs: "Bawa Bekas Makanan Sendiri",
    descEn: "Use your own reusable container for your lunch or snacks today instead of taking disposable packaging.",
    descZh: "今天带午餐或零食时，使用自带的环保便当盒，拒绝一次性饭盒包装。",
    descMs: "Gunakan bekas makanan guna semula anda sendiri untuk makan tengah hari atau snek hari ini dan elakkan pembungkusan pakai buang.",
    points: 25
  },
  {
    titleEn: "5-Minute Shower",
    titleZh: "五分钟战斗澡",
    titleMs: "Mandi 5 Minit",
    descEn: "Save water by keeping your shower time to exactly 5 minutes or less today.",
    descZh: "节约水资源，今天的洗澡时间控制在5分钟或更短。",
    descMs: "Jimatkan air dengan memastikan masa mandi anda terhad kepada 5 minit atau kurang hari ini.",
    points: 15
  }
];

export const DailyEcoChallenge: React.FC = () => {
  const { language } = useLanguage();

  // Compute date-seeded index
  const seedIndex = useMemo(() => {
    const today = new Date();
    const seedNum = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();
    return seedNum % CHALLENGES.length;
  }, []);

  const currentChallenge = CHALLENGES[seedIndex];

  // Load user status from localStorage
  const localStorageKey = `sjkc_eco_challenge_done_${new Date().toISOString().slice(0, 10)}`;
  const [hasCompleted, setHasCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(localStorageKey) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [animateReward, setAnimateReward] = useState(false);

  const handleCompleteTask = () => {
    if (hasCompleted) return;
    setHasCompleted(true);
    try {
      localStorage.setItem(localStorageKey, 'true');
    } catch (e) {}
    playSound('success');
    triggerHaptic(40);
    setAnimateReward(true);
    setTimeout(() => setAnimateReward(false), 2000);
  };

  const getTitle = () => {
    if (language === 'zh') return currentChallenge.titleZh;
    if (language === 'ms') return currentChallenge.titleMs;
    return currentChallenge.titleEn;
  };

  const getDesc = () => {
    if (language === 'zh') return currentChallenge.descZh;
    if (language === 'ms') return currentChallenge.descMs;
    return currentChallenge.descEn;
  };

  const widgetTitle = language === 'zh' ? "每日低碳挑战 / Daily Eco Challenge" : 
                      (language === 'ms' ? "Cabaran Harian / Daily Eco Challenge" : "Daily Eco Challenge");
                      
  const btnText = language === 'zh' ? "打卡完成任务" : 
                  (language === 'ms' ? "Sahkan Tugasan" : "Mark as Completed");

  const completedText = language === 'zh' ? "积分已领取" : 
                        (language === 'ms' ? "Mata Ganjaran Ditebus" : "Points Claimed");

  return (
    <div className="mt-5 bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-yellow-500/[0.03] dark:from-[#091526]/85 border-2 border-[#d4af37]/35 dark:border-[#d4af37]/50 rounded-3xl p-5.5 text-left shadow-[0_4px_25px_rgba(212,175,55,0.06)] dark:shadow-[0_0_20px_rgba(212,175,55,0.1)] relative overflow-hidden animate-fade-in select-none">
      
      {/* Background Icon */}
      <div 
        className={`absolute right-1 bottom-1 translate-x-2 translate-y-2 opacity-[0.05] dark:opacity-[0.12] text-7xl select-none transition-transform pointer-events-none duration-1000 ${
          animateReward ? 'scale-150 rotate-12 text-yellow-500 opacity-20' : ''
        }`}
      >
        <Target />
      </div>

      <div className="flex items-center justify-between gap-2.5 mb-3.5 flex-wrap">
        <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-stone-950 font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-2xl shadow-sm flex items-center gap-1.5">
          <Zap size={11} className="animate-pulse text-yellow-300 fill-yellow-300" /> 
          {widgetTitle}
        </span>
        
        {hasCompleted && (
          <span className="flex items-center gap-1 text-[9.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <ShieldCheck size={11} />
            + {currentChallenge.points} Virtual Points
          </span>
        )}
      </div>

      <div className="bg-white/80 dark:bg-[#071120]/80 p-4 rounded-2xl border border-amber-200 dark:border-[#d4af37]/30 shadow-xs relative z-10">
        <h5 className="font-extrabold text-[14px] text-amber-850 dark:text-amber-300 tracking-tight flex items-center gap-1.5 font-space">
          <Star size={15} className="text-yellow-500 shrink-0 fill-yellow-500 animate-pulse" />
          {getTitle()}
        </h5>
        
        <p className="mt-2 text-stone-700 dark:text-stone-300 font-bold text-[11.5px] leading-relaxed border-l-2 border-amber-500/50 pl-2.5">
          {getDesc()}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-yellow-500/10 dark:bg-yellow-500/20 px-2 py-1 rounded-lg border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-extrabold text-[10px]">
            <Award size={13} className="text-yellow-500" />
            奖励 {currentChallenge.points} 环保积分
          </div>

          <button
            onClick={handleCompleteTask}
            disabled={hasCompleted}
            className={`flex items-center gap-1.5 font-black px-4 py-2 rounded-xl transition-all text-xs active-press ${
              hasCompleted
                ? 'bg-amber-50/50 dark:bg-amber-955/20 text-amber-550/60 border border-amber-200/50 dark:border-amber-900/30 cursor-default'
                : 'btn-esports px-5 py-2.5 rounded-xl cursor-pointer shadow-md text-stone-950 font-black'
            }`}
          >
            {hasCompleted ? (
              <>
                <CheckCircle size={14} className="text-amber-600 dark:text-amber-400" /> {completedText}
              </>
            ) : (
              <>
                <Target size={14} className="animate-bounce" /> {btnText}
              </>
            )}
          </button>
        </div>
      </div>
      
    </div>
  );
};
