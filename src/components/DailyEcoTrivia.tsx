import React, { useState, useMemo } from 'react';
import { Leaf, Check, X, HelpCircle, Trophy, RefreshCw, Zap, Award } from 'lucide-react';
import { playSound, triggerHaptic } from '../utils';
import { useLanguage } from './LanguageContext';

interface TriviaItem {
  title: string;
  content: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_DATABASE_ZH: TriviaItem[] = [
  {
    title: "回收一吨废纸",
    content: "可避免砍伐17棵大树，并节省3立方米的垃圾填埋空间，同时节省大量电力与水源！",
    question: "回收 1 吨废纸，可以少砍伐大约多少棵大树？",
    options: [
      "A) 5 棵",
      "B) 17 棵",
      "C) 50 棵"
    ],
    correctIndex: 1,
    explanation: "正确！回收 1 吨废纸能挽救 17 棵大树，并节约大量的电力与水资源！"
  },
  {
    title: "纸板盒先压扁",
    content: "扔进回收桶前，请先将纸盒或纸箱压平压扁！这能节约超 70% 的存储与运输空间，减少碳足迹。",
    question: "为什么要把收纳用的废纸盒、纸箱先压扁再投入回收？",
    options: [
      "A) 节省超过 70% 的存储运输空间",
      "B) 容易在风中飞走",
      "C) 增加纸箱的使用重量"
    ],
    correctIndex: 0,
    explanation: "正确！废纸箱压平可以省去多余空气体积，大幅度提升回收车的运输效率，极大地节省能源与碳足迹！"
  },
  {
    title: "洗净塑料瓶",
    content: "残留油污或饮料的塑料瓶会污染整包回收物。回收前请务必用水简单冲洗一下哦！",
    question: "对于沾有剩余饮料或油渍的塑料瓶，最好的回收前置处理是？",
    options: [
      "A) 直接丢进回收箱",
      "B) 简单冲洗并控干水分",
      "C) 剪碎后再扔掉"
    ],
    correctIndex: 1,
    explanation: "正确！未清洗的瓶子会滋生细菌甚至污染整箱可回收物。只需简单盛水摇晃冲洗，就能变成高质量原料！"
  },
  {
    title: "自备便当盒与水杯",
    content: "少用一次性饭盒、塑料袋与吸管。自备可重用器皿，能大幅减少塑料微粒污染海洋。",
    question: "减少使用一次性外卖饭盒，最大的直接环保贡献是？",
    options: [
      "A) 便于携带食物",
      "B) 减少塑料微粒污染土地与海洋",
      "C) 缩短午餐排队时间"
    ],
    correctIndex: 1,
    explanation: "正确！一次性塑料垃圾在自然中不易降解，最终碎裂成海洋微塑料，危害生态。自备餐具是根治塑源！"
  },
  {
    title: "熄灭闲置电器",
    content: "电器处于待机（Standby）状态依然会消耗5%到15%电源。拔掉闲置插头，既安全又省电！",
    question: "电器常年处于“待机闲置模式”(Standby)是否会产生耗电？",
    options: [
      "A) 完全不会耗任何电量",
      "B) 依然会默默消耗 5% 至 15% 的电量",
      "C) 空调不会，其他电器会"
    ],
    correctIndex: 1,
    explanation: "正确！即使关闭了电源开关，插头未拔依然会产生微弱待机电量损耗。随手拔除或关闭排插总开关能省下不少电费款！"
  },
  {
    title: "空调理想温度 24°C - 26°C",
    content: "冷气每调高一度，就能省电约7%到10%。搭配微风扇使用，制冷快且节能减排特别明显！",
    question: "空调温度设定每高 1°C，通常可以省下多少电力开销？",
    options: [
      "A) 仅有约 1% 能耗",
      "B) 省电约 7% 至 10%",
      "C) 完全不节省电力"
    ],
    correctIndex: 1,
    explanation: "正确！将冷气调至 24°C - 26°C 最佳舒适度，搭配省电风扇可以获得极佳的体感。调高 1 度可以显著省电 7% 左右！"
  },
  {
    title: "珍惜饭菜光盘行动",
    content: "厨余垃圾在埋场腐烂会大量形成温室气体甲烷（CH₄）。吃多少盛多少，节约粮食就是护航地球。",
    question: "厨余剩饭等垃圾在掩埋场中腐烂分解，会产生哪种强效温室气体？",
    options: [
      "A) 甲烷 (CH₄)",
      "B) 氧气 (O₂)",
      "C) 氮气 (N₂)"
    ],
    correctIndex: 0,
    explanation: "正确！厨余腐化释放的甲烷气体，温室效能高出二氧化碳 25 倍。爱惜食物，推行光盘，能极好减缓气候变暖！"
  },
  {
    title: "衣物循环延寿命",
    content: "生产一件普通纯棉 T恤衫需要消耗数千升水。提倡以旧衣物分类处理和旧物置换，减少快时尚过度消费。",
    question: "制造一件全新的普通纯棉 T恤，估算大约需要耗用多少淡水资源？",
    options: [
      "A) 约 2 升",
      "B) 约 2500 至 2700 升",
      "C) 不需要水源"
    ],
    correctIndex: 1,
    explanation: "正确！从棉花的种植、制造到染色加工，消耗水量巨大。每一件衣服都来之不易，请物尽其用并分类回收！"
  },
  {
    title: "塑料袋降解需要数百年",
    content: "一个塑料袋在泥土中需要达数百年才能降解。随身携带帆布包或大袋子，低碳又时尚！",
    question: "掩埋在土地深陷的一只普通塑料袋，大约需要多久才能降解消失？",
    options: [
      "A) 大约 7 天",
      "B) 100 年至 500 年",
      "C) 永远不会降解"
    ],
    correctIndex: 1,
    explanation: "正确！塑料在自然界通常需要长达数百年的漫长自然崩解，因此随身携带时尚又环保的帆布袋，是现代极佳的绿色风潮！"
  },
  {
    title: "提倡绿色代步出行",
    content: "短途出行时多步行、骑共享自行车、搭公共交通。锻炼筋骨的同时，能让空气更清新！",
    question: "在短途移动出行中，下面哪项才是真正的最强‘零排碳量’出行方式？",
    options: [
      "A) 步行或踩自行车",
      "B) 乘坐大马力柴油货车",
      "C) 乘坐开着高冷度的燃油巴士"
    ],
    correctIndex: 0,
    explanation: "正确！步行和骑自行车不耗费任何燃油，不制造尾气碳足迹，是绝佳的绿色零碳出行，也是全方位锻炼筋骨最好的健康方式！"
  }
];

const TRIVIA_DATABASE_MS: TriviaItem[] = [
  {
    title: "Kitar Semula 1 Tan Kertas",
    content: "Mampu mengelakkan penebangan 17 batang pokok matang, menjatuhkan 3 meter padu pengisian sisa kambus tanah serta menjimatkan sumber air dan elektrik yang besar!",
    question: "Kitar semula 1 tan kertas dapat mengelakkan penebangan berapa batang pokok?",
    options: [
      "A) 5 batang pokok",
      "B) 17 batang pokok",
      "C) 50 batang pokok"
    ],
    correctIndex: 1,
    explanation: "Betul! Kitar semula 1 tan kertas menyelamatkan 17 pokok besar dan memelihara alam sekitar!"
  },
  {
    title: "Penyekkan Kotak Kadbod Dahulu",
    content: "Sila leperkan atau penyekkan kotak kadbod sebelum dibuang ke dalam tong kitar semula! Ini menjimatkan lebih 70% ruang simpanan lori serta mengurangkan jejak karbon.",
    question: "Mengapakah kotak kadbod perlu dipenyekkan sebelum dikitar semula?",
    options: [
      "A) Menjimatkan lebih 70% ruang penyimpanan dan pengangkutan",
      "B) Mudah ditiup angin kencang",
      "C) Meningkatkan berat timbangan kotak tersebut"
    ],
    correctIndex: 0,
    explanation: "Betul! Kotak yang dipenyekkan menjimatkan ruang penyimpanan serta memaksimumkan kapasiti lori pengangkutan kitar semula!"
  },
  {
    title: "Bersihkan Botol Plastik",
    content: "Sisa kotoran makanan atau minyak di dalam botol boleh menjejaskan kualiti kitar semula. Sila bilas ringkas dengan air sebelum membuangnya!",
    question: "Apakah tindakan awal yang paling wajar sebelum mengitar semula botol plastik yang kotor?",
    options: [
      "A) Terus buang ke dalam tong kitar semula tanpa dibasuh",
      "B) Bilas ringkas dengan kuantiti air kecil lalu keringkannya",
      "C) Gunting botol plastik sehingga lumat sebelum dibuang"
    ],
    correctIndex: 1,
    explanation: "Betul! Sisa kotoran yang dibiarkan pada botol akan menjejaskan mutu bahan plastik kitar semula. Membilas ringkas adalah amalan terbaik!"
  },
  {
    title: "Bawa Bekas Makanan Sendiri",
    content: "Kurangkan penggunaan bekas makanan pakai buang, bag plastik dan penyedut plastik. Amalan membawa bekas sendiri menghalang pencemaran mikroplastik di lautan.",
    question: "Apakah sumbangan utama mengurangkan penggunaan bekas makanan plastik pakai buang?",
    options: [
      "A) Lebih mudah memegang atau menjinjing makanan",
      "B) Mengurangkan pencemaran mikroplastik yang merosakkan ekosistem darat dan laut",
      "C) Mempercepatkan giliran beratur mengambil makanan di kantin"
    ],
    correctIndex: 1,
    explanation: "Betul! Plastik pakai buang mengambil ratusan tahun untuk terurai. Amalan membawa bekas makanan sendiri mengekang punca pencemaran ini!"
  },
  {
    title: "Tutup Suis Peralatan Elektrik Berlebihan",
    content: "Peralatan elektrik dalam mod bersedia (Standby) masih menggunakan 5% hingga 15% kuasa elektrik. Cabut palam elektrik untuk keselamatan dan penjimatan!",
    question: "Adakah perkakas elektrik dalam mod bersedia (Standby) masih menggunakan arus tenaga elektrik?",
    options: [
      "A) Tidak menggunakan sebarang elektrik langsung",
      "B) Ya, senyap-senyap menggunakan sekitar 5% hingga 15% tenaga elektrik",
      "C) Hanya penghawa dingin sahaja yang menggunakan tenaga elektrik"
    ],
    correctIndex: 1,
    explanation: "Betul! Mod bersedia masih membazirkan tenaga elektrik elektrik. Sila cabut palam soket soket utama apabila tidak digunakan!"
  },
  {
    title: "Suhu Penyaman Udara Ideal 24°C - 26°C",
    content: "Setiap peningkatan 1°C suhu penyaman udara mengurangkan penggunaan elektrik sebanyak 7% ke 10%. Gabungkan dengan kipas angin untuk penyejukan optimum!",
    question: "Setiap kenaikan 1°C suhu penyaman udara kebiasaannya dapat menjimatkan tenaga sebanyak mana?",
    options: [
      "A) Sekadar 1% sahaja",
      "B) Sekitar 7% hingga 10% penggunaan tenaga elektrik harian",
      "C) Tiada sebarang perbezaan keselamatan"
    ],
    correctIndex: 1,
    explanation: "Betul! Mengekalkan suhu pada paras 24°C - 26°C adalah selesa dan mesra alam, menjimatkan sehingga 10% bil elektrik!"
  },
  {
    title: "Kempen Habiskan Makanan",
    content: "Reputan sisa makanan di tapak pelupusan menghasilkan gas metana (CH₄) yang kuat. Elakkan pembaziran makanan untuk melindungi iklim bumi.",
    question: "Reputan sisa organik makanan di tapak pelupusan menghasilkan gas rumah hijau yang mana?",
    options: [
      "A) Gas Metana (CH₄)",
      "B) Gas Oksigen (O₂)",
      "C) Gas Nitrogen (N₂)"
    ],
    correctIndex: 0,
    explanation: "Betul! Pereputan makanan menghasilkan gas metana yang menyumbang kepada pemanasan global. Hargailah makanan anda!"
  },
  {
    title: "Kitar Semula Pakaian Lama",
    content: "Penghasilan sehelai kemeja-t kapas baharu menggunakan ribuan liter air bersih. Kitar semula pakaian anda untuk mengurangkan pembaziran sumber tekstil.",
    question: "Berapakah anggaran penggunaan air untuk menghasilkan sehelai kemeja-t kapas yang baharu?",
    options: [
      "A) Anggaran 2 liter sahaja",
      "B) Sekitar 2500 hingga 2700 liter air bersih",
      "C) Langsung tidak memerlukan air bersih"
    ],
    correctIndex: 1,
    explanation: "Betul! Penanaman kapas dan dye tekstil memakan kuantiti air yang amat mengejutkan. Jagalah pakaian anda dengan baik!"
  },
  {
    title: "Beg Plastik Mengambil Ratusan Tahun untuk Reput",
    content: "Sebiji beg plastik mengambil masa beratus-ratus tahun untuk mereput di dalam tanah. Bawa beg guna semula sendiri untuk kehidupan lestari bermutu tinggi!",
    question: "Berapa lamakah masa yang diambil oleh beg plastik biasa untuk mereput di dalam lapisan tanah?",
    options: [
      "A) Lebih kurang 7 hari sahaja",
      "B) Sekitar 100 tahun hingga 500 tahun",
      "C) Beg plastik akan reput dalam masa sebulan"
    ],
    correctIndex: 1,
    explanation: "Betul! Beg plastik tidak terurai secara biologi dengan mudah. Gunakan beg kain kitar semula semasa membeli-belah!"
  },
  {
    title: "Galakkan Penggunaan Kenderaan Rendah Karbon",
    content: "Gunakan pengangkutan awam, kayuh basikal atau berjalan kaki untuk perjalanan jarak dekat. Udara lebih segar dan menyihatkan tubuh badan!",
    question: "Antara berikut, yang manakah kaedah pengangkutan jarak dekat yang mematuhi pelepasan 'Sifar Karbon'?",
    options: [
      "A) Berjalan kaki atau berbasikal santai",
      "B) Memandu kenderaan pacuan empat roda berdiesel",
      "C) Menaiki bas transit berbahan api petrol biasa"
    ],
    correctIndex: 0,
    explanation: "Betul! Berjalan kaki dan berbasikal menyihatkan fizikal serta sifar pelepasan karbon untuk bumi kita!"
  }
];

export const DailyEcoTrivia: React.FC = () => {
  const { language, t } = useLanguage();

  const TRIVIA_DATABASE = useMemo(() => {
    return language === 'zh' ? TRIVIA_DATABASE_ZH : TRIVIA_DATABASE_MS;
  }, [language]);

  // Compute date-seeded index
  const seedIndex = useMemo(() => {
    const today = new Date();
    const seedNum = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();
    return seedNum % TRIVIA_DATABASE.length;
  }, [TRIVIA_DATABASE.length]);

  const currentTrivia = TRIVIA_DATABASE[seedIndex];

  // Load user answers status from localStorage
  const localStorageKey = `sjkc_trivia_answered_${new Date().toISOString().slice(0, 10)}`;
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(() => {
    try {
      const val = localStorage.getItem(localStorageKey);
      return val !== null ? parseInt(val) : null;
    } catch {
      return null;
    }
  });

  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(() => {
    try {
      const checked = localStorage.getItem(`${localStorageKey}_checkedin`);
      return checked === 'true';
    } catch {
      return false;
    }
  });

  // A simulated daily participant counter for realistic social engagement before validation
  const simulatedParticipants = useMemo(() => {
    const dateNum = new Date().getDate();
    const mockOffset = (dateNum * 13) % 21 + 45; // Generates a stable daily target between 45 - 66
    return mockOffset + (selectedAnswer !== null ? 1 : 0);
  }, [selectedAnswer]);

  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'incorrect'>(() => {
    if (selectedAnswer === null) return 'idle';
    return selectedAnswer === currentTrivia.correctIndex ? 'correct' : 'incorrect';
  });

  const [animateLeaf, setAnimateLeaf] = useState(false);

  const handleSelectOption = (index: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple attempts unless reset

    setSelectedAnswer(index);
    try {
      localStorage.setItem(localStorageKey, index.toString());
    } catch {}
    triggerHaptic(20);

    if (index === currentTrivia.correctIndex) {
      setFeedbackState('correct');
      playSound('success');
      setAnimateLeaf(true);
      setTimeout(() => setAnimateLeaf(false), 1205);
    } else {
      setFeedbackState('incorrect');
      playSound('error');
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setFeedbackState('idle');
    try {
      localStorage.removeItem(localStorageKey);
    } catch {}
    triggerHaptic(10);
  };

  const handleCommitToPractice = () => {
    if (hasCheckedIn) return;
    setHasCheckedIn(true);
    try {
      localStorage.setItem(`${localStorageKey}_checkedin`, 'true');
    } catch {}
    playSound('success');
    triggerHaptic(30);
    setAnimateLeaf(true);
    setTimeout(() => setAnimateLeaf(false), 1000);
  };

  return (
    <div 
      className="mt-5 bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-yellow-500/[0.03] dark:from-[#091526]/85 border-2 border-[#d4af37]/35 dark:border-[#d4af37]/50 rounded-3xl p-5.5 text-left shadow-[0_4px_25px_rgba(212,175,55,0.06)] dark:shadow-[0_0_20px_rgba(212,175,55,0.1)] relative overflow-hidden animate-fade-in select-none" 
      id="daily-eco-trivia-widget"
    >
      {/* Decorative leaf watermarks */}
      <div 
        className={`absolute right-0.5 bottom-0.5 translate-x-1 translate-y-3 opacity-[0.08] dark:opacity-[0.12] text-7xl select-none transition-transform pointer-events-none duration-700 ${
          animateLeaf ? 'scale-125 rotate-45 text-amber-500' : ''
        }`}
      >
        🍃
      </div>

      <div className="flex items-center justify-between gap-2.5 mb-3.5 flex-wrap">
        <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-stone-950 font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-2xl shadow-sm flex items-center gap-1">
          <Leaf size={10} className={`${animateLeaf ? 'animate-spin text-stone-950' : 'animate-pulse text-stone-950'}`} /> 
          {t('trivia_widget_title')}
        </span>
        <div className="flex items-center gap-1 text-[9.5px] font-bold text-amber-700 dark:text-[#D4AF37]/90">
          <Zap size={11} className="text-yellow-500 fill-yellow-500 animate-pulse" />
          <span>{t('simulated_challengers_count').replace('{count}', String(simulatedParticipants))}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Tip statement */}
        <div className="bg-white/80 dark:bg-[#071120]/80 p-3.5 rounded-2xl border border-amber-200 dark:border-[#d4af37]/30 shadow-xs">
          <h5 className="font-extrabold text-[12.5px] text-amber-850 dark:text-amber-300 tracking-tight flex items-center gap-1.5 font-space">
            <Award size={13.5} className="text-amber-500 shrink-0" />
            {t('trivia_theme')}
          </h5>
          <p className="mt-1.5 text-stone-700 dark:text-stone-300 font-bold text-xs leading-relaxed">
            {currentTrivia.title}
          </p>
          <p className="mt-1 text-[11px] text-stone-550 dark:text-stone-400 leading-relaxed italic border-l-2 border-amber-500/50 pl-2">
            “ {currentTrivia.content} ”
          </p>
        </div>

        {/* Dynamic Trivia Question */}
        <div className="space-y-2.5 mt-4">
          <div className="flex items-start gap-1.5">
            <HelpCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-stone-850 dark:text-amber-300/90 leading-snug tracking-tight">
                {t('trivia_challenge')} {currentTrivia.question}
              </p>
            </div>
          </div>

          {/* Options list */}
          <div className="grid grid-cols-1 gap-2 mt-1">
            {currentTrivia.options.map((opt, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === currentTrivia.correctIndex;
              
              let btnClass = "bg-white hover:bg-stone-50 dark:bg-[#081222] dark:hover:bg-[#0d1e36] text-stone-750 dark:text-stone-300 border-stone-200 dark:border-stone-800";
              let iconNode = null;

              if (selectedAnswer !== null) {
                if (isSelected) {
                  if (isCorrect) {
                     btnClass = "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-extrabold";
                     iconNode = <Check size={12.5} className="text-emerald-655 shrink-0" />;
                  } else {
                     btnClass = "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-400 font-extrabold";
                     iconNode = <X size={12.5} className="text-rose-655 shrink-0" />;
                  }
                } else if (isCorrect) {
                  btnClass = "bg-emerald-500/5 dark:bg-emerald-500/[0.03] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold opacity-80";
                  iconNode = <Check size={12.5} className="text-emerald-500/70 shrink-0" />;
                } else {
                  btnClass = "opacity-40 bg-stone-50/50 dark:bg-stone-900/10 text-stone-400 dark:text-stone-600 border-transparent pointer-events-none";
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={selectedAnswer !== null}
                  onClick={() => handleSelectOption(i)}
                  className={`px-3.5 py-2.5 rounded-xl border text-left text-[11px] font-semibold flex items-center justify-between gap-2.5 transition-all text-xs select-none ${
                    selectedAnswer === null ? 'active-press cursor-pointer' : 'cursor-default'
                  } ${btnClass}`}
                >
                  <span className="leading-tight">{opt}</span>
                  {iconNode}
                </button>
              );
            })}
          </div>

          {/* Feedback & Trivia Explanation */}
          {selectedAnswer !== null && (
            <div className="p-3.5 mt-3.5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-505/10 bg-white/40 dark:bg-stone-950/40 border-stone-150 dark:border-emerald-500/10 text-left space-y-1.5 shadow-inner scale-100 transition-all">
              <p className={`text-[11.5px] font-black flex items-center gap-1.5 ${
                feedbackState === 'correct' ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'
              }`}>
                {feedbackState === 'correct' ? t('trivia_correct') : t('trivia_incorrect')}
              </p>
              <p className="text-[10.5px] text-stone-600 dark:text-stone-350 leading-relaxed font-bold">
                {currentTrivia.explanation}
              </p>
              
              <div className="pt-2.5 border-t border-stone-200/50 dark:border-stone-850/60 mt-2.5 flex items-center justify-between text-[10px] gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-stone-450 dark:text-stone-500 hover:text-emerald-605 dark:hover:text-amber-400 font-extrabold flex items-center gap-1 active-press"
                  title="重新挑战趣味测试"
                >
                  <RefreshCw size={11} /> {t('trivia_reset')}
                </button>

                {feedbackState === 'correct' && (
                  <button
                    type="button"
                    onClick={handleCommitToPractice}
                    className={`flex items-center gap-1 font-black px-2.5 py-1 rounded-lg border transition-all text-[10px] ${
                      hasCheckedIn
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:from-amber-400 hover:to-orange-400 border-amber-300 active-press'
                    }`}
                  >
                    <Trophy size={11.5} className={hasCheckedIn ? 'text-emerald-500' : 'animate-bounce'} />
                    {hasCheckedIn ? t('trivia_promise_done') : t('trivia_promise_btn')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
