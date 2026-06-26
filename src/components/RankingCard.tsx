import React, { useState } from 'react';
import { Trophy, ChevronDown, Leaf, Award, Footprints } from 'lucide-react';
import { CO2_FACTOR, getGamificationBadge, getTreeEvolution } from '../types';
import { useLanguage } from './LanguageContext';

interface RankItemData {
  className: string;
  name?: string;
  studentID?: string;
  totalWeight: number;
  totalDeduction?: number;
  totalReward?: number;
  badge?: string;
  activeMonths?: number;
}

interface RankingCardProps {
  title: string;
  subTitle: string;
  data: RankItemData[];
  type: 'class' | 'individual' | 'student_no_class';
  isDarkMode: boolean;
}

const getRankBadgeStyles = (badge: string): string => {
  if (badge.includes('荣耀王者') || badge.includes('Agung')) {
    return 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white border-transparent shadow-md animate-pulse font-extrabold ring-1 ring-amber-400';
  }
  if (badge.includes('无双王者') || badge.includes('Johan')) {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450 border-rose-300 dark:border-rose-900/60 animate-pulse font-bold';
  }
  if (badge.includes('最强王者') || badge.includes('Jaguh')) {
    return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/60 font-black animate-pulse';
  }
  if (badge.includes('至尊星耀') || badge.includes('Wira Elit')) {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/60 font-bold';
  }
  if (badge.includes('永恒钻石') || badge.includes('Berlian')) {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 font-bold';
  }
  if (badge.includes('尊贵铂金') || badge.includes('Platinum')) {
    return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/60 font-bold';
  }
  if (badge.includes('尊贵黄金') || badge.includes('Emas')) {
    return 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-450 border-amber-200 dark:border-amber-900/50 font-bold';
  }
  if (badge.includes('秩序白银') || badge.includes('Perak')) {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-900/65 dark:text-slate-350 border-slate-200 dark:border-slate-800/50 font-medium';
  }
  // Default for Bronze
  return 'bg-stone-100 text-stone-600 dark:bg-stone-900/60 dark:text-stone-400 border-stone-200 dark:border-stone-800/50 font-medium';
};

export const RankingCard: React.FC<RankingCardProps> = ({ title, subTitle, data, type }) => {
  const { language, t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const maxValue = data.length > 0 ? data[0].totalWeight || 1 : 1;

  const Medal: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 1) return <span className="text-2xl drop-shadow-[0_2px_8px_rgba(212,175,55,0.7)] animate-bounce" title={language === 'zh' ? '冠军 / Johan' : 'Juara 1'}>🥇</span>;
    if (rank === 2) return <span className="text-2xl drop-shadow-[0_2px_8px_rgba(148,163,184,0.6)]" title={language === 'zh' ? '亚军 / Naib Johan' : 'Naib Juara'}>🥈</span>;
    if (rank === 3) return <span className="text-2xl drop-shadow-[0_2px_8px_rgba(249,115,22,0.6)]" title={language === 'zh' ? '季军 / Ketiga' : 'Tempat Ketiga'}>🥉</span>;
    return (
      <span className="w-6 h-6 flex items-center justify-center bg-stone-100 dark:bg-[#12243d] text-stone-500 dark:text-amber-400/90 rounded-full text-xs font-black leading-none border border-stone-200 dark:border-amber-500/25 shadow-sm">
        {rank}
      </span>
    );
  };


  const renderName = (name: string) => {
    if (!name) return '';
    const chineseMatches = name.match(/[\u4e00-\u9fa5]+/g);
    if (chineseMatches) {
      const cn = chineseMatches.join(' ');
      const my = name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim();
      return (
        <span className="flex flex-col items-start text-left leading-tight min-w-0">
          {language === 'zh' && (
            <span className="text-sm md:text-base font-semibold text-stone-800 dark:text-stone-200 w-full break-words">
              {cn}
            </span>
          )}
          {(my || language !== 'zh') && (
            <span className={language === 'zh' ? "text-[11px] text-stone-400 dark:text-stone-500 font-normal w-full break-words mt-0.5" : "text-sm md:text-base font-semibold text-stone-800 dark:text-stone-200 w-full break-words"}>
              {my || name}
            </span>
          )}
        </span>
      );
    }
    return <span className="w-full block break-words text-stone-800 dark:text-stone-200">{name}</span>;
  };

  return (
    <div
      className={`bg-stone-50/90 dark:bg-[#091526]/85 rounded-2xl border-2 border-[#d4af37]/35 dark:border-[#d4af37]/50 overflow-hidden flex flex-col shadow-[0_4px_25px_rgba(212,175,55,0.06)] dark:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all duration-300 ${
        isExpanded ? 'max-h-[500px] h-[500px]' : 'max-h-14 md:max-h-[480px] md:h-[480px] h-auto'
      }`}
    >
      <div
        className="px-4 py-2.5 border-b border-[#d4af37]/25 dark:border-[#d4af37]/45 bg-stone-100/60 dark:bg-[#0a182c]/90 flex justify-between items-center cursor-pointer md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
        id={`rank-header-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg">
            <Trophy size={15} />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-850 dark:text-stone-200 text-sm md:text-base font-space">
              {title}
            </h3>
            <p className="text-[9.5px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500 mt-0.5">
              {subTitle}
            </p>
          </div>
        </div>
        <div className={`md:hidden text-stone-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-2.5 custom-scrollbar select-none ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {data.length === 0 ? (
          <div className="h-full py-10 flex flex-col items-center justify-center text-stone-300 dark:text-stone-705 gap-1.5">
            <div className="w-10 h-10 bg-stone-50 dark:bg-stone-850 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-600">
              <Leaf size={20} />
            </div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
              {t('rank_no_data')}
            </span>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {data.map((item, index) => {
              const rank = index + 1;
              const weightVal = Number(item.totalWeight) || 0;
              const pct = maxValue > 0 ? (weightVal / maxValue) * 100 : 0;
              const isFirst = rank === 1;

              // class based Virtual Tree Evolving system
              const classTree = type === 'class' ? getTreeEvolution(weightVal, language) : null;
              // individual badges
              const indBadge = type === 'individual' ? getGamificationBadge(weightVal, language) : null;
              const co2eSaved = (weightVal * CO2_FACTOR).toFixed(1);

              return (
                <li key={index} className="relative group transition-all rounded-xl overflow-hidden" id={`rank-item-${type}-${rank}`}>
                  {/* Earthy background depth visual bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 opacity-[0.06] dark:opacity-[0.09] transition-all duration-1000 ease-out ${
                      rank === 1
                        ? 'bg-amber-500'
                        : rank === 2
                        ? 'bg-stone-400'
                        : rank === 3
                        ? 'bg-orange-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>

                  <div className="relative flex items-center justify-between p-2 rounded-xl border border-stone-200/50 dark:border-[#d4af37]/25 hover:border-amber-400 dark:hover:border-amber-400/60 bg-white/60 dark:bg-[#071120]/40 transition-all shadow-xs">
                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1.5">
                      <div className="w-7 flex justify-center relative flex-shrink-0">
                        <Medal rank={rank} />
                        {isFirst && (
                          <div className="absolute -top-3 -right-1.5 text-amber-500 animate-bounce">
                            <Award size={10} className="fill-amber-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black text-sm md:text-[14.5px] tracking-tight ${isFirst ? 'text-amber-800 dark:text-amber-400' : 'text-stone-850 dark:text-stone-200'}`}>
                            {type === 'class' ? item.className : renderName(item.name || '')}
                          </span>

                          {/* Class Tree */}
                          {classTree && (
                            <span
                              className="text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 px-1 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/20 flex items-center gap-0.5 shrink-0 cursor-help"
                              title={classTree.label}
                            >
                              <span className="text-xs">{classTree.icon}</span>
                              {classTree.label}
                            </span>
                          )}

                          {/* Individual Star level */}
                          {indBadge && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border border-stone-200/20 shrink-0 uppercase tracking-wide flex items-center gap-0.5 transition-all ${getRankBadgeStyles(indBadge)}`}>
                              {indBadge}
                            </span>
                          )}

                          {/* Safe months combo fire indicator */}
                          {type === 'individual' && item.activeMonths && item.activeMonths >= 2 && (
                            <span
                              className="text-[8.5px] font-bold bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 px-1 py-0.5 rounded border border-orange-100 dark:border-orange-900/20 flex items-center gap-0.5 shrink-0"
                              title={language === 'zh' ? `连续参与了 ${item.activeMonths} 个不同月份的环保回收活动` : `Menyertai ${item.activeMonths} bulan berturut-turut`}
                            >
                              🔥 x{item.activeMonths}
                            </span>
                          )}

                          {type === 'class' && item.totalReward && item.totalReward > 0 && (
                            <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/20 shrink-0">
                              RM {item.totalReward}
                            </div>
                          )}

                          {type === 'class' && item.totalDeduction && item.totalDeduction > 0 && (
                             <div className="flex items-center gap-0.5 text-[8.5px] font-bold text-rose-600 dark:text-rose-450 bg-rose-50/50 dark:bg-rose-950/20 px-1 py-0.5 rounded border border-rose-100 dark:border-rose-900/40 shrink-0" title={language === 'zh' ? "因为校内碳足迹产生的扣减重量" : "Potongan berat kerana jejak karbon"}>
                               <Footprints size={9} /> -{item.totalDeduction.toFixed(0)}kg
                             </div>
                          )}
                        </div>

                        {type === 'individual' && (
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 font-extrabold mt-0.5">
                            {item.className}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col justify-center items-end relative z-10">
                      <span className={`font-black text-sm md:text-base leading-none font-space ${isFirst ? 'text-amber-605 dark:text-amber-400 drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]' : 'text-emerald-650 dark:text-emerald-450'}`}>
                        {weightVal.toFixed(1)}
                        <span className="text-[8.5px] text-stone-400 dark:text-stone-500 uppercase font-bold tracking-widest ml-0.5">
                          kg
                        </span>
                      </span>
                      {weightVal > 0 && (
                        <div className="text-[8.5px] font-bold text-sky-600 dark:text-sky-400 mt-0.5" title="Avoided Carbon Dioxide Equivalent">
                          - {co2eSaved} CO₂e
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
