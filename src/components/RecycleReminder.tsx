import React from 'react';
import { Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface RecycleReminderProps {
  dateStr: string;
}

export const RecycleReminder: React.FC<RecycleReminderProps> = ({ dateStr }) => {
  const { language, t } = useLanguage();
  
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const targetDate = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <div className="bg-stone-100 dark:bg-stone-800/40 text-stone-500 dark:text-stone-400 rounded-2xl p-3.5 text-xs text-center border border-stone-200/60 dark:border-stone-800 mb-5 animate-fade-in">
        {t('countdown_expired')}
      </div>
    );
  }

  const formattedDate = targetDate.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'ms-MY', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  if (diffDays === 0 || diffDays === 1) {
    const isToday = diffDays === 0;
    return (
      <div
        id="recycle-reminder"
        className={`relative overflow-hidden rounded-2xl p-5 shadow-xl border animate-fade-in mb-6 ${
          isToday
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500'
            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400'
        }`}
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-3 rounded-full shrink-0 animate-bounce">
            {isToday ? <RefreshCw size={24} className="text-white animate-spin" /> : <AlertTriangle size={24} className="text-white" />}
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold tracking-tight">
              {isToday ? t('countdown_today') : t('countdown_tomorrow')}
            </h3>
            <p className="text-xs font-semibold text-white/90 leading-normal mt-1">
              {isToday ? t('countdown_today_text') : t('countdown_tomorrow_text')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50/50 to-stone-100/50 dark:from-emerald-950/20 dark:to-stone-900/30 rounded-2xl p-4.5 animate-fade-in flex items-center gap-4 mb-6 border border-stone-200/50 dark:border-stone-800">
      <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-full text-emerald-700 dark:text-emerald-400 shrink-0">
        <Calendar size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm md:text-base font-bold text-stone-800 dark:text-stone-200 truncate">
          {language === 'zh' ? '下次环保回收日' : 'Hari Pengumpulan Kitar Semula Seterusnya'}
        </h3>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
          {language === 'zh' ? 'Sesi Kitar Semula Seterusnya' : 'Sesi Pengumpulan Seterusnya'}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base md:text-lg font-bold text-emerald-700 dark:text-emerald-400">
          {formattedDate}
        </div>
        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mt-1 border border-emerald-100/50 dark:border-emerald-900/30 inline-block">
          {language === 'zh' ? `剩 ${diffDays} 天` : `Baki ${diffDays} hari`}
        </div>
      </div>
    </div>
  );
};

