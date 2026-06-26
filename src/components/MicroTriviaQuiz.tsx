import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Shield, Swords, Sparkles, Award, Zap, AlertTriangle, ArrowRight, User, Check, X, RefreshCw, Flame } from 'lucide-react';
import { playSound, triggerHaptic } from '../utils';

interface Question {
  id: number;
  category: 'Reduce' | 'Reuse' | 'Recycle' | 'Used Cooking Oil' | 'Sustainability';
  difficulty: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'LEGEND';
  questionZh: string;
  questionMs: string;
  questionEn: string;
  optionsZh: string[];
  optionsMs: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationZh: string;
  explanationMs: string;
  explanationEn: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'Reduce',
    difficulty: 'BRONZE',
    questionEn: "According to the Waste Hierarchy, what is the single most effective way to protect our environment?",
    questionZh: "根据废物管理层级（Waste Hierarchy），保护环境最有效的方法是什么？",
    questionMs: "Berdasarkan Hierarki Sisa, apakah cara tunggal yang paling berkesan untuk melindungi alam sekitar kita?",
    optionsEn: [
      "A. Landfill all waste safely",
      "B. Reduce the generation of waste at the source",
      "C. Burn everything to generate heat",
      "D. Buy single-use items but recycle them"
    ],
    optionsZh: [
      "A. 安全填埋所有垃圾",
      "B. 在源头减少垃圾的产生（Reduce）",
      "C. 焚烧所有物品来发电",
      "D. 购买一次性用品但将其回收"
    ],
    optionsMs: [
      "A. Menimbus semua sisa dengan selamat",
      "B. Mengurangkan penjanaan sisa di punca (Reduce)",
      "C. Membakar semua benda untuk menjana haba",
      "D. Membeli barangan pakai buang tetapi mengitar semulanya"
    ],
    correctIndex: 1,
    explanationEn: "Reducing waste at the source is the absolute highest tier in the Waste Hierarchy. Preventing waste beforehand is always better than handling it afterward!",
    explanationZh: "在源头减少垃圾（Reduce）是废物管理层级中最高、最有效的级别。事先预防垃圾的产生永远比事后处理它要好得多！",
    explanationMs: "Mengurangkan sisa di punca adalah tahap tertinggi dalam Hierarki Sisa. Mengelakkan sisa daripada dihasilkan adalah sentiasa lebih baik daripada menguruskannya kemudian!"
  },
  {
    id: 2,
    category: 'Reuse',
    difficulty: 'SILVER',
    questionEn: "Which of the following actions is a true example of 'Reuse' rather than 'Recycle'?",
    questionZh: "以下哪项操作是属于真正的“再利用”（Reuse）而不是“循环回收”（Recycle）？",
    questionMs: "Antara tindakan berikut, yang manakah merupakan contoh sebenar 'Guna Semula' (Reuse) dan bukannya 'Kitar Semula' (Recycle)?",
    optionsEn: [
      "A. Melting down glass bottles into new plates",
      "B. Bringing your own container to canteen to buy food",
      "C. Throwing paper files to a pulper machine",
      "D. Processing old steel bars into rebars"
    ],
    optionsZh: [
      "A. 将玻璃瓶融化并重新制作成新餐盘",
      "B. 自备便当盒/容器到食堂购买食物",
      "C. 将纸质文件夹投入打碎制浆机",
      "D. 将废旧钢筋融化再加工"
    ],
    optionsMs: [
      "A. Meleburkan botol kaca menjadi pinggan baharu",
      "B. Membawa bekas sendiri ke kantin untuk membeli makanan",
      "C. Membuang fail kertas ke dalam mesin pelebur kertas",
      "D. Memproses bar keluli lama menjadi bar kekuatan baharu"
    ],
    correctIndex: 1,
    explanationEn: "Reuse means using an item as-is without breaking it down chemically or physically. Bringing containers saves processing energy and carbon directly!",
    explanationZh: "再利用（Reuse）是指在不进行物理或化学分解的情况下直接再次使用物品。自备容器能直接省去加工能源与运输排碳！",
    explanationMs: "Guna Semula bermaksud menggunakan barangan dalam keadaan sedia ada tanpa memecahkannya secara kimia atau fizikal. Membawa bekas sendiri menjimatkan tenaga pemprosesan dan karbon secara langsung!"
  },
  {
    id: 3,
    category: 'Recycle',
    difficulty: 'GOLD',
    questionEn: "Before placing plastic bottles or metal cans in the school recycling bin, what is the best pre-treatment action?",
    questionZh: "在把塑料瓶或金属罐扔进学校回收桶之前，最好的前置处理步骤是什么？",
    questionMs: "Sebelum memasukkan botol plastik atau tin logam ke dalam tong kitar semula sekolah, apakah tindakan pra-rawatan terbaik?",
    optionsEn: [
      "A. Paint them to look clean and beautiful",
      "B. Shred them with scissors at home",
      "C. Empty, rinse out residue, and flatten them",
      "D. Freeze them in the refrigerator"
    ],
    optionsZh: [
      "A. 给它们涂上油漆让它们看起来干净漂亮",
      "B. 在家用剪刀把它们剪碎",
      "C. 清空、冲洗掉残留物并压扁它们",
      "D. 放进冰箱冷冻结冰"
    ],
    optionsMs: [
      "A. Mengecatnya supaya kelihatan bersih dan cantik",
      "B. Memotongnya menjadi serpihan kecil di rumah",
      "C. Mengosongkan, membilas sisa kotoran, dan memenyekkannya",
      "D. Membekukannya di dalam peti sejuk"
    ],
    correctIndex: 2,
    explanationEn: "Rinsing removes contaminants that ruin other recyclables, and flattening optimizes storage volume, making storage and transportation hyper-efficient!",
    explanationZh: "冲洗可除去污染并避免滋生细菌或损坏其它纸类物资，压扁则能缩减超70%的体积，使储存和运输极其高效！",
    explanationMs: "Membilas menghilangkan sisa yang boleh mengotorkan bahan lain, manakala memenyekkan mengoptimalkan ruang penyimpanan, menjadikan pengangkutan sangat cekap!"
  },
  {
    id: 4,
    category: 'Used Cooking Oil',
    difficulty: 'PLATINUM',
    questionEn: "Why should we collect and recycle Used Cooking Oil (UCO) instead of pouring it down our kitchen sinks?",
    questionZh: "为什么我们应该收集并回收废弃食用油（UCO），而不是直接倒入厨房洗碗盆？",
    questionMs: "Mengapakah kita perlu mengumpul dan mengitar semula Minyak Masak Terpakai (UCO) dan bukannya menuangkannya ke dalam singki dapur?",
    optionsEn: [
      "A. Oil will attract lightning strikes into the kitchen",
      "B. Oil hardens in sewer pipes, causing blockages (fatbergs) and heavily polluting river life",
      "C. It will evaporate and emit sweet greenhouse gases",
      "D. It dissolves clay sewers instantly"
    ],
    optionsZh: [
      "A. 废油会把天空的雷电吸引到厨房里",
      "B. 废油会在下水道管壁中凝固硬化引发严重堵塞（油脂山），且排向江河会极大污染水体生态",
      "C. 废油会蒸发并散发带有甜味的温室气体",
      "D. 废油会瞬间溶化陶土下水管道"
    ],
    optionsMs: [
      "A. Minyak akan menarik panahan kilat ke dalam dapur",
      "B. Minyak mengeras di dalam paip betung, menyebabkan penyumbatan parah (fatberg) dan mencemarkan kehidupan sungai",
      "C. Ia akan meruap dan membebaskan gas rumah hijau yang berbau manis",
      "D. Ia melarutkan paip kumbahan tanah liat dengan serta-merta"
    ],
    correctIndex: 1,
    explanationEn: "Pouring fats and oils down drains blends with mineral trash to freeze into huge concrete-like blockages called fatbergs. Recycling it protects our water pipes and saves rivers!",
    explanationZh: "废油跟矿物垃圾结合在水管会形成钢筋混凝土般的硬块（油脂山），堵死排水系统。回收废油是防阻堵塞、拯救河流水质的重要措施！",
    explanationMs: "Minyak yang dituang ke dalam singki akan bercampur dengan bahan lain membentuk gumpalan keras seperti pasir kuari (fatberg). Mengitar semulanya melindungi paip perparitan dan sungai kita!"
  },
  {
    id: 5,
    category: 'Sustainability',
    difficulty: 'LEGEND',
    questionEn: "When school students collect Used Cooking Oil (UCO) for recycling, it is processed scientifically into which eco-friendly bio-product?",
    questionZh: "当同学们收集废弃食用油（UCO）进行环保回收后，其在工厂里最常被转化为什么绿色环保产品？",
    questionMs: "Apabila murid sekolah mengumpul Minyak Masak Terpakai (UCO) untuk dikitar semula, ia diproses secara saintifik menjadi produk biologi mesra alam yang mana?",
    optionsEn: [
      "A. Renewable Bio-Diesel (low-carbon motor fuel)",
      "B. Edible margarine and cooking syrup",
      "C. Premium high-octane rocket fuel",
      "D. Scented hair styling wax"
    ],
    optionsZh: [
      "A. 可再生生物柴油（低碳绿色动力燃料）",
      "B. 食用人造黄油与烹饪糖浆",
      "C. 航天级高纯度火箭推进油",
      "D. 芬香发胶排版定型蜡"
    ],
    optionsMs: [
      "A. Bio-Diesel Boleh Diperbaharui (bahan api motor rendah karbon)",
      "B. Marjerin makanan dan sirap masakan",
      "C. Bahan api roket gred premium berkelajuan tinggi",
      "D. Lilin penggayaan rambut berbau harum"
    ],
    correctIndex: 0,
    explanationEn: "Every 1kg of Used Cooking Oil can be converted scientifically into green biodiesels, which reduce greenhouse gas emissions by up to 85% compared to petroleum diesel!",
    explanationZh: "回收的1公斤废食用油能高度转化为生物柴油，作为绿色可更新燃料，比起提炼石油柴油可直接削减高达85%的温室气体！",
    explanationMs: "Setiap 1kg Minyak Masak Terpakai boleh ditukarkan secara saintifik kepada biodiesel mesra alam, yang mengurangkan pelepasan gas rumah hijau sehingga 85% berbanding diesel petroleum!"
  }
];

interface MicroTriviaQuizProps {
  students: any[];
  language?: 'zh' | 'ms' | 'en';
  onAwardBonusPoints?: (studentID: string, studentName: string, className: string, points: number) => void;
}

export const MicroTriviaQuiz: React.FC<MicroTriviaQuizProps> = ({
  students,
  language = 'zh',
  onAwardBonusPoints
}) => {
  const [selectedStudentID, setSelectedStudentID] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  
  // Game Play States
  const [gameState, setGameState] = useState<'lobby' | 'arena' | 'defeat_over' | 'victory_over'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerLocked, setAnswerLocked] = useState<boolean>(false);
  
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [isWrongAnswer, setIsWrongAnswer] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Accumulated Points Local State persistent
  const [localBonusPoints, setLocalBonusPoints] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('sjkc_eco_quiz_bonus');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentID);
  }, [students, selectedStudentID]);

  const currentQuestion = useMemo(() => {
    return QUESTIONS[currentQuestionIndex];
  }, [currentQuestionIndex]);

  // Multilingual helper texts
  const tText = (key: string) => {
    const translations: Record<string, { zh: string; ms: string; en: string }> = {
      title: {
        zh: "👑 荣耀之环 • 绿色环保微学习竞答",
        ms: "👑 BULATAN GLORI • Kuiz Mikro-Pembelajaran Lestari",
        en: "👑 HONOR OF ECO • Green Sustainability Trivia Quiz"
      },
      subtitle: {
        zh: "王者竞技场：测验分类环保常识与废油循环废弃物等级！",
        ms: "Arena Juara: Uji minda hierarki sisa dan kitar semula minyak masak!",
        en: "Challenger Arena: Test your knowledge on waste hierarchy & UCO recycling!"
      },
      heroSelect: {
        zh: "⚙️ 请锁定挑战者英雄档案",
        ms: "⚙️ Sila Pilih Profil Wira Cabaran",
        en: "⚙️ Lock In Challenger Hero Profile"
      },
      selectDefault: {
        zh: "-- 选择一名注册学生英雄 --",
        ms: "-- Pilih Hero Murid Berdaftar --",
        en: "-- Select a Registered Student Hero --"
      },
      guestPlay: {
        zh: "或者输入访客挑战者姓名：",
        ms: "Atau masukkan nama Wira Pelawat:",
        en: "Or enter Guest Challenger name:"
      },
      enterArena: {
        zh: "⚔️ 锁定出征！进入环保竞技场",
        ms: "⚔️ Kunci Masuk! Memasuki Arena Lestari",
        en: "⚔️ LOCK IN OUT! Enter Eco Arena"
      },
      level: {
        zh: "层级关卡",
        ms: "Aras",
        en: "Stage"
      },
      category: {
        zh: "考题模块:",
        ms: "Kategori:",
        en: "Category:"
      },
      difficulty: {
        zh: "段位级别:",
        ms: "Tahap:",
        en: "Rank:"
      },
      lockInBtn: {
        zh: "⚡ 锁定答案 / LOCK IN",
        ms: "⚡ KUNCI JAWAPAN",
        en: "⚡ LOCK IN ANSWER"
      },
      nextBtn: {
        zh: "前进到下一关 ➔",
        ms: "Maju ke Aras Seterusnya ➔",
        en: "Progress to Next Tier ➔"
      },
      tryAgain: {
        zh: "💔 环保盾牌被打破！请重新思考",
        ms: "💔 Perisai Lestari Pecah! Cubalah Lagi",
        en: "💔 Shield Broken! Think and Try Again"
      },
      victoryFlash: {
        zh: "👑 胜利 VICTORY!",
        ms: "👑 KEMENANGAN / VICTORY!",
        en: "👑 VICTORY!"
      },
      defeatFlash: {
        zh: "⚔️ 战败 DEFEAT",
        ms: "⚔️ TEWAS / DEFEAT",
        en: "⚔️ DEFEAT"
      },
      fullVictoryDesc: {
        zh: "五关全克！你完成了统治战局！获得 +5 环保功勋积分！",
        ms: "Hebat! Berjaya menembusi 5 aras! Anda mendapat +5 Mata Eco Bonus!",
        en: "Legendary! Cleared all 5 Tiers! You earned +5 Bonus Eco Points!"
      },
      quitArena: {
        zh: "⚙️ 重回出征大厅 (Lobby)",
        ms: "⚙️ Kembali ke Lobi Perlawanan",
        en: "⚙️ Return to Match Lobby"
      },
      totalGained: {
        zh: "当前战队累计积分：",
        ms: "Mata Terkumpul Hero:",
        en: "Total Gained Points:"
      },
      comboLabel: {
        zh: "连续答对 (Combo):",
        ms: "Kombo Rantaian:",
        en: "Streak Combo:"
      },
      questLeft: {
        zh: "战局考题进度:",
        ms: "Progress Tapak:",
        en: "Match Progress:"
      }
    };
    return translations[key]?.[language] || translations[key]?.['en'] || '';
  };

  const getQuestionText = (q: Question) => {
    if (language === 'zh') return q.questionZh;
    if (language === 'ms') return q.questionMs;
    return q.questionEn;
  };

  const getOptions = (q: Question) => {
    if (language === 'zh') return q.optionsZh;
    if (language === 'ms') return q.optionsMs;
    return q.optionsEn;
  };

  const getExplanation = (q: Question) => {
    if (language === 'zh') return q.explanationZh;
    if (language === 'ms') return q.explanationMs;
    return q.explanationEn;
  };

  const activePlayerName = useMemo(() => {
    if (selectedStudentID && selectedStudent) {
      const displayName = language === 'zh' ? selectedStudent.name : (selectedStudent.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || selectedStudent.name);
      return `${displayName} (${selectedStudent.className})`;
    }
    return guestName.trim() || (language === 'zh' ? "神秘低碳学者" : language === 'ms' ? "Perwira Lestari" : "Eco Hero");
  }, [selectedStudentID, selectedStudent, guestName, language]);

  const activePlayerKey = useMemo(() => {
    return selectedStudentID || `GUEST-${activePlayerName}`;
  }, [selectedStudentID, activePlayerName]);

  const handleStartArena = () => {
    triggerHaptic(25);
    playSound('success');
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setComboCount(0);
    setSelectedOption(null);
    setAnswerLocked(false);
    setIsWrongAnswer(false);
    setFeedbackText('');
    setGameState('arena');
  };

  const handleSelectOption = (index: number) => {
    if (answerLocked) return;
    setSelectedOption(index);
    triggerHaptic(10);
  };

  const handleLockIn = () => {
    if (selectedOption === null || answerLocked) return;
    setAnswerLocked(true);
    
    if (selectedOption === currentQuestion.correctIndex) {
      // Correct! Show big combo
      setCorrectCount(prev => prev + 1);
      setComboCount(prev => prev + 1);
      setIsWrongAnswer(false);
      playSound('success');
      triggerHaptic(30);

      // Random flashy combo text
      const combos = [
        language === 'zh' ? "⚡ 破军击杀! (PERFECT)" : "⚡ SERANGAN PADU! (PERFECT)",
        language === 'zh' ? "🔥 连击 COMBO!" : "🔥 KOMBO RANTAIAN!",
        language === 'zh' ? "💎 环保之魄! (ACED)" : "💎 PERISAI SAKTI! (ACED)",
        language === 'zh' ? "👑 绿色之王! (LEGENDARY)" : "👑 RAJA LESTARI! (LEGENDARY)"
      ];
      setFeedbackText(combos[Math.min(comboCount, combos.length - 1)]);
    } else {
      // Wrong! Show try again
      setIsWrongAnswer(true);
      setComboCount(0);
      playSound('error');
      triggerHaptic(40);
      setFeedbackText(tText('tryAgain'));
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setAnswerLocked(false);
    setIsWrongAnswer(false);
    setFeedbackText('');

    if (currentQuestionIndex + 1 < QUESTIONS.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      triggerHaptic(15);
    } else {
      // Finished all 5 questions
      if (correctCount >= 4) {
        // VICTORY!
        setGameState('victory_over');
        playSound('success');
        triggerHaptic(60);

        // Award +5 points in standard state if dynamic handler provided
        if (onAwardBonusPoints && selectedStudentID && selectedStudent) {
          onAwardBonusPoints(selectedStudentID, selectedStudent.name, selectedStudent.className, 5);
        }

        // Always update local persistent scoreboard points
        setLocalBonusPoints(prev => {
          const currentScore = prev[activePlayerKey] || 0;
          const updated = {
            ...prev,
            [activePlayerKey]: currentScore + 5
          };
          localStorage.setItem('sjkc_eco_quiz_bonus', JSON.stringify(updated));
          return updated;
        });

      } else {
        // DEFEAT (try again)
        setGameState('defeat_over');
        playSound('error');
        triggerHaptic(15);
      }
    }
  };

  const handleRestartLobby = () => {
    triggerHaptic(15);
    playSound('success');
    setGameState('lobby');
  };

  return (
    <div 
      className="bg-stone-50/95 dark:bg-[#050b14] border-2 border-[#d4af37]/40 dark:border-amber-500/30 rounded-3xl p-6 text-left shadow-[0_4px_25px_rgba(212,175,55,0.06)] dark:shadow-[0_0_25px_rgba(212,175,55,0.15)] relative overflow-hidden select-none text-stone-850 dark:text-stone-200"
      id="moba-mico-trivia-quiz"
    >
      {/* Absolute gold highlight header line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600"></div>
      
      {/* Background neon grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,24,42,0.6)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(13,24,42,0.6)_1.5px,transparent_1.5px)] bg-[size:30px_30px] opacity-[0.2] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>

      {/* MATCHMAKING LOBBY */}
      {gameState === 'lobby' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-6"
        >
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-250 dark:border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2 select-none">
                <span className="bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/45 text-[9px] font-black tracking-widest px-2.5 py-1 rounded uppercase">
                  RANKED ARENA
                </span>
                <span className="bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 text-[9px] font-black tracking-widest px-2.5 py-1 rounded uppercase">
                  OFFLINE-FIRST
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-amber-800 dark:text-amber-300 tracking-tight flex items-center gap-2 mt-2">
                <Swords className="text-[#D4AF37] animate-pulse" size={20} />
                {tText('title')}
              </h3>
              <p className="text-stone-550 dark:text-stone-400 font-medium text-xs mt-1">
                {tText('subtitle')}
              </p>
            </div>
            
            {/* Crowned current high-flyer local total */}
            <div className="bg-stone-100/80 dark:bg-[#0f192b] border border-amber-500/30 dark:border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-3 shadow-xs">
              <Trophy className="text-amber-500 dark:text-yellow-400" size={22} />
              <div>
                <span className="text-[10px] text-stone-500 dark:text-stone-450 font-black block uppercase tracking-wider">HERO SCORE</span>
                <span className="font-mono text-base font-black text-amber-700 dark:text-amber-300">
                  {localBonusPoints[activePlayerKey] || 0} <span className="text-[10px] text-amber-600 dark:text-[#D4AF37]">PTS</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* HERO PROFILE CONFIGURATION */}
            <div className="bg-white/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <label className="text-xs font-black text-amber-400/90 tracking-wide uppercase flex items-center gap-1.5">
                  <User size={13} className="text-[#D4AF37]" />
                  {language === 'zh' ? '输入英雄ID' : 'Masukkan ID Wira'}
                </label>
                
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGuestName(val);
                    const isRegistered = students.some(s => s.id === val);
                    if (isRegistered) {
                      setSelectedStudentID(val);
                    } else {
                      setSelectedStudentID('');
                    }
                  }}
                  placeholder={language === 'zh' ? "在此输入您的英雄ID..." : "Masukkan ID Wira anda..."}
                  className="w-full bg-white dark:bg-[#030914] text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-850 hover:border-amber-500/40 rounded-xl px-4 py-3.5 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 transition-colors text-center shadow-inner"
                />
              </div>

              {/* Enter match Button */}
              <button
                type="button"
                onClick={handleStartArena}
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-black py-4.5 rounded-xl text-xs uppercase tracking-widest shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_30px_rgba(215,180,55,0.45)] hover:bg-yellow-400 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Swords size={16} />
                <span>{tText('enterArena')}</span>
              </button>
            </div>

            {/* LEAGUE BANNER AND RULES */}
            <div className="bg-stone-50/70 dark:bg-[#040810] border border-stone-250 dark:border-stone-850/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden shadow-xs">
              <div className="absolute top-2 right-2 opacity-[0.06] text-7xl select-none pointer-events-none">
                🏅
              </div>
              
              <div className="space-y-3.5">
                <h4 className="font-black text-amber-800 dark:text-amber-300 text-xs tracking-wider uppercase flex items-center gap-1.5">
                  <Award size={14} className="text-[#D4AF37]" />
                  ARENA RULES & TREADS • 比赛规程
                </h4>
                
                <ul className="space-y-2.5 text-xs font-semibold text-stone-600 dark:text-stone-400 leading-relaxed list-inside">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] shrink-0 mt-0.5">●</span>
                    <span>{language === 'zh' ? '您将面临 5 个段位不断攀升的绿色回收和废油纯化竞答考题' : language === 'ms' ? 'Anda dikehendaki menjawab 5 soalan kitar semula dan biodisel minyak masak' : 'Face 5 ascending tier questions measuring recycling expertise and UCO recovery.'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] shrink-0 mt-0.5">●</span>
                    <span>{language === 'zh' ? '每次答对都会激发炫酷连斩，最终大捷（全对或错 1 题）即可封神' : language === 'ms' ? 'Setiap jawapan betul mencetuskan Rentetan Kombo permainan.' : 'Correct answers trigger active Combo multipliers.'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37] shrink-0 mt-0.5">●</span>
                    <span>{language === 'zh' ? '通关即可永久解锁 +5 点 Bonus 环保功勋，实时赋予名下档案记录中' : language === 'ms' ? 'Kelepasan akhir menjamin ganjaran +5 Mata Eco Bonus kepada wira berdaftar.' : 'Securing victory awards +5 Eco Points to selected hero permanently!'}</span>
                  </li>
                </ul>
              </div>

              {/* Little stats block */}
              <div className="bg-stone-150/60 dark:bg-[#0a0f1d] border border-stone-250 dark:border-stone-850 py-2.5 px-3.5 rounded-xl flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-orange-500 animate-pulse animate-bounce" />
                  <span className="text-stone-500">Challenger:</span>
                  <span className="text-amber-805 dark:text-amber-300 font-extrabold max-w-[130px] truncate">{activePlayerName}</span>
                </div>
                <div className="text-stone-605 dark:text-stone-400">
                  {tText('totalGained')} <span className="font-mono text-cyan-600 dark:text-cyan-400 font-extrabold">{localBonusPoints[activePlayerKey] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ECO ARENA RUN */}
      {gameState === 'arena' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 space-y-5"
        >
          {/* Level Tracker & Info Header */}
          <div className="flex items-center justify-between bg-stone-900/60 border border-stone-800 rounded-2xl px-4 py-3 select-none flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-lg">
                <Shield size={14} className="animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] text-stone-500 font-black block uppercase tracking-wider">{tText('questLeft')}</span>
                <span className="text-xs font-black text-stone-200">
                  {tText('level')} {currentQuestionIndex + 1} / 5
                </span>
              </div>
            </div>

            {/* Progress indicators dot chain */}
            <div className="hidden sm:flex items-center gap-1.5">
              {QUESTIONS.map((_, i) => {
                const isActive = i === currentQuestionIndex;
                const isPast = i < currentQuestionIndex;
                return (
                  <React.Fragment key={i}>
                    <div 
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-mono text-[9px] font-black transition-all border duration-500 ${
                        isActive 
                          ? 'bg-amber-500 border-yellow-300 text-stone-950 scale-125 shadow-[0_0_10px_#f59e0b]' 
                          : isPast 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                            : 'bg-stone-950 border-stone-800 text-stone-600'
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < QUESTIONS.length - 1 && (
                      <div className={`w-4 h-[1.5px] ${isPast ? 'bg-emerald-500/40' : 'bg-stone-850'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <Flame size={14} className="text-orange-500 fill-orange-500" />
                <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">{tText('comboLabel')}</span>
                <span className="font-mono font-black text-orange-400 animate-pulse">{comboCount}x</span>
              </div>
            </div>
          </div>

          {/* Active Question Box Frame */}
          <div className="bg-[#050b14] border-2 border-stone-800 rounded-3xl p-5 md:p-6 shadow-inner relative">
            <div className="absolute top-2 left-3 flex items-center gap-2 select-none">
              <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                {tText('category')} {currentQuestion.category}
              </span>
              <span className="bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] text-[8.5px] font-bold px-2 py-0.5 rounded tracking-wide">
                {tText('difficulty')} {currentQuestion.difficulty}
              </span>
            </div>

            <div className="mt-5 space-y-5">
              <h4 className="text-sm md:text-base font-extrabold text-stone-100 leading-relaxed tracking-tight">
                {getQuestionText(currentQuestion)}
              </h4>

              {/* Option List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {getOptions(currentQuestion).map((option, idx) => {
                  const isOptSelected = selectedOption === idx;
                  const showSolution = answerLocked;
                  const isCorrectAnswer = idx === currentQuestion.correctIndex;

                  let optStyle = "bg-stone-950/70 border-stone-850 text-stone-300 hover:border-[#D4AF37]/40 hover:bg-stone-900/40";
                  let badgeNode = null;

                  if (showSolution) {
                    if (isCorrectAnswer) {
                      optStyle = "bg-emerald-950/40 border-emerald-500/75 text-emerald-400 outline-none ring-1 ring-emerald-500/20";
                      badgeNode = <Check size={14} className="text-emerald-400 shrink-0" />;
                    } else if (isOptSelected) {
                      optStyle = "bg-rose-950/40 border-rose-500/75 text-rose-400";
                      badgeNode = <X size={14} className="text-rose-400 shrink-0" />;
                    } else {
                      optStyle = "opacity-30 bg-stone-950 text-stone-600 border-stone-950";
                    }
                  } else if (isOptSelected) {
                    optStyle = "bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/20";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={answerLocked}
                      onClick={() => handleSelectOption(idx)}
                      className={`px-4 py-3.5 rounded-2xl border text-left text-xs font-bold transition-all duration-300 flex items-center justify-between gap-3 select-none ${
                        !answerLocked ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'
                      } ${optStyle}`}
                    >
                      <span>{option}</span>
                      {badgeNode}
                    </button>
                  );
                })}
              </div>

              {/* Answer Explanations / Combustion Box */}
              <AnimatePresence mode="wait">
                {answerLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mt-4 p-4.5 rounded-2xl border ${
                      isWrongAnswer 
                        ? 'bg-rose-950/20 border-rose-500/20 text-rose-350' 
                        : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-350'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 select-none font-black text-xs">
                      {isWrongAnswer ? <AlertTriangle size={15} className="text-rose-400" /> : <Sparkles size={15} className="text-emerald-400" />}
                      <span>{feedbackText}</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed font-semibold text-stone-300">
                      {getExplanation(currentQuestion)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action row */}
              <div className="pt-2 border-t border-stone-900 flex justify-between items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={handleRestartLobby}
                  className="px-4 py-2.5 rounded-xl border border-stone-850 hover:bg-stone-900 transition-colors text-xs font-black text-stone-400 cursor-pointer"
                >
                  {tText('quitArena')}
                </button>

                {!answerLocked ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleLockIn}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider select-none transition-all cursor-pointer ${
                      selectedOption !== null 
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.65)] hover:from-cyan-500 hover:to-teal-400' 
                        : 'bg-stone-900 text-stone-600 border border-stone-850 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {tText('lockInBtn')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.65)] hover:from-amber-400 hover:to-yellow-300 animate-pulse cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{tText('nextBtn')}</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* GRAND VICTORY MODAL OVERLAY */}
      {gameState === 'victory_over' && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center py-8 space-y-6 flex flex-col items-center"
        >
          {/* Symmetrical glowing stars decoration */}
          <div className="flex items-center gap-2 text-yellow-400 text-2xl drop-shadow-[0_0_10px_rgba(250,204,21,1)] select-none">
            <Sparkles size={20} className="animate-spin" />
            <Sparkles size={26} className="animate-bounce" />
            <Sparkles size={20} className="animate-spin" />
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-widest text-[#D4AF37] select-none text-glow italic font-space">
            {tText('victoryFlash')}
          </h2>

          <div className="bg-[#0f192b]/80 border-2 border-[#D4AF37] p-6.5 rounded-3xl max-w-md w-full relative overflow-hidden shadow-[0_0_35px_rgba(212,175,55,0.4)]">
            {/* Visual shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] animate-shine"></div>

            <span className="text-[10px] bg-[#D4AF37]/15 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20 uppercase font-black tracking-wider block w-max mx-auto mb-3">
              LEGENDARY MVP DEFEATED
            </span>

            <h4 className="font-black text-stone-100 text-[15px] max-w-full truncate">
              {activePlayerName}
            </h4>
            <p className="mt-2.5 text-xs text-stone-400 font-bold leading-normal">
              {tText('fullVictoryDesc')}
            </p>

            {/* Glowing Points banner */}
            <div className="bg-[#040914] border border-amber-500/20 py-3 px-4 rounded-2xl flex justify-between items-center mt-5">
              <span className="text-stone-500 text-xs font-black uppercase">REWARD CREDITED</span>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-mono font-black text-[#D4AF37] animate-pulse">+5</span>
                <span className="text-xs text-[#D4AF37] font-black uppercase tracking-wider">ECO PTS</span>
              </div>
            </div>
          </div>

          {/* SJKC Honor sound claim instructions */}
          <button
            type="button"
            onClick={handleRestartLobby}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_#f59e0b/30] hover:shadow-[0_0_25px_#f59e0b/50] hover:from-[#e5bf47] active:scale-[0.97] transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw size={13.5} />
            <span>CLAIM REWARDS & RE-ENTER LOBBY</span>
          </button>
        </motion.div>
      )}

      {/* DEFEAT MODAL OVERLAY */}
      {gameState === 'defeat_over' && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center py-8 space-y-6 flex flex-col items-center"
        >
          <div className="text-stone-700 text-5xl animate-pulse select-none">
            💀
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-widest text-stone-500 select-none uppercase italic font-space">
            {tText('defeatFlash')}
          </h2>

          <div className="bg-[#1c0c11]/80 border-2 border-stone-800 p-6.5 rounded-3xl max-w-md w-full shadow-[0_0_25px_rgba(239,68,68,0.15)]">
            <span className="text-[10px] bg-stone-950/40 text-stone-550 px-3 py-1 rounded-full border border-stone-850 uppercase font-black tracking-wider block w-max mx-auto mb-3">
              ECO DEFENSE BREACHED
            </span>

            <p className="text-sm font-extrabold text-stone-300">
              {activePlayerName}
            </p>
            <p className="mt-2.5 text-xs text-stone-500 font-bold leading-normal">
              {language === 'zh' ? '不要丧气，你的环保盾牌成功阻挡了严重损耗！多加阅读环保文章，升级你的装备，重新征战沙场！' : language === 'ms' ? 'Jangan bimbang, pelindung kita menyerap impak karbon. Latih semula strategi lestari anda untuk menakluki semula!' : 'Dont discourage! Your environment shield blocked heavy impacts. Review the guidelines, upgrade your gear, and challenge again!'}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleStartArena}
              className="px-6 py-3.5 rounded-2xl bg-stone-900 border border-stone-850 text-stone-300 text-xs font-black uppercase tracking-wider hover:bg-stone-800 cursor-pointer"
            >
              RE-ATTACK ARENA
            </button>
            <button
              type="button"
              onClick={handleRestartLobby}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-stone-800 to-stone-700 text-stone-350 text-xs font-black uppercase tracking-wider hover:from-stone-750 cursor-pointer"
            >
              LOBBY
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
