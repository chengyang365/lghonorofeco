import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ms' | 'zh';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isMs: boolean;
  isZh: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Natural, high-quality, school-context idiomatic translations dictionary
export const translations: Record<Language, Record<string, string>> = {
  ms: {
    // Header & App Branding
    app_title: "Honor of Eco",
    school_sub_header: "Dewan Kawalan Jejak Karbon & Program Kitar Semula Sekolah",
    eco_league_header: "LIGA PERINTIS LESTARI • SJKC LADANG GRISEK",
    online_status: "Dalam Talian",
    offline_status: "Mod Luar Talian (Tempatan)",
    offline_alert_bar: "⚠️ Mod Rakaman Luar Talian Aktif (Data disimpan dalam storan tempatan)",
    unsynced_btn: "Tunggulah Segerak",
    theme_toggle_tip: "Tukar Mod Malam/Cerah",
    nav_home: "Dewan Utama",
    nav_record: "Ganjaran & Rekod",
    nav_leaderboard: "Papan Pendahulu",
    nav_control: "Bilik Kawalan",
    nav_logout: "Log Keluar Sesi",

    // Lobby / Landing page widgets & statistics
    lobby_badge: "PUSAT LESTARI SJKC LADANG GRISEK",
    lobby_headline: "Honor of Eco",
    school_sub: "SJK (C) Ladang Grisek",
    eco_league: "Wira-wira SJK (C) Ladang Grisek ke arah ekosistem gemilang dan sifar karbon",
    lobby_total_recycled: "Jumlah Kitar Semula Terkumpul",
    lobby_total_recycled_desc: "Jumlah berat barangan kitar semula yang berjaya dikumpulkan oleh warga sekolah semester ini.",
    lobby_co2_offset: "Jumlah Pengurangan Karbon (CO₂e)",
    lobby_co2_offset_desc: "Jumlah anggaran pelepasan gas rumah hijau (CO₂) yang berjaya dicegah.",
    lobby_total_practices: "Jumlah Aktiviti Kitar Semula",
    lobby_total_submissions: "Jumlah Penghantaran Rekod",
    lobby_total_submissions_desc: "Bilangan rekod penghantaran kitar semula murid yang berjaya disegerakkan.",
    bottom_disclaimer: "Kumpulan Projek Kelestarian Ekologi SJKC Ladang Grisek • Menjadikan amalan hijau satu penghormatan, membina sekolah sifar karbon bersama-sama.",
    lobby_view_rank: "Lihat Papan Pendahulu Sekolah ↓",
    lobby_admin_login: "Log Masuk Pentadbir",
    lobby_arena_title: "🏆 GELANGGANG ELEKTRIK REAL-TIME LESTARI SEKOLAH",
    simulated_challengers_count: "Hari ini, sebanyak {count} ahli lestari selesai menjawab kuiz dengan betul!",
    countdown_days: "Baki {days} hari",
    countdown_expired: "Tarikh pengumpulan kitar semula telah berlalu. Sila maklumkan Pentadbir untuk menetapkan tarikh baharu dalam Bilik Kawalan.",
    countdown_today: "Hari Ini Adalah Hari Kitar Semula!",
    countdown_tomorrow: "Esok Adalah Hari Kitar Semula!",
    countdown_today_text: "Sila hantar barangan kitar semula anda ke pusat pengumpulan kelas masing-masing sekarang.",
    countdown_tomorrow_text: "Sila sediakan barangan kitar semula anda di rumah untuk dibawa ke sekolah esok pagi.",

    // Daily Trivia section
    trivia_widget_title: "Kuiz Cabaran Lestari Harian",
    trivia_theme: "💡 Tema Lestari Hari Ini:",
    trivia_challenge: "⚔️ Soalan Cabaran:",
    trivia_correct: "🎉 Tahniah, jawapan anda adalah BETUL!",
    trivia_incorrect: "❌ Jawapan kurang tepat, sila cuba lagi...",
    trivia_reset: "Jawab Semula",
    trivia_promise_done: "👍 Ikrar Amalan Hijau Hari Ini Selesai!",
    trivia_promise_btn: "Ikrar Mengamalkannya Hari Ini ✨",

    // Dashboard navigation tabs
    db_tab_overall: "Statistik Keseluruhan",
    db_tab_class: "Kedudukan Kelas",
    db_tab_individual: "Kedudukan Individu",
    db_tab_history: "Log Transaksi Semasa",
    db_tab_search: "Carian Murid",

    // Dashboard Search murid interface
    db_search_class_filter: "Pilih Kelas",
    db_search_month_filter: "Pilih Bulan",
    db_search_placeholder: "Masukkan ID Murid atau nama untuk membuat carian cepat...",
    db_search_syncing: "Sedang memuat turun data rekod murid berkaitan dari storan awan...",
    db_search_prompt: "Sila masukkan nama atau ID Sekolah untuk memulakan penapisan data carian",
    db_search_not_found: "Rekod murid tiada dalam pangkalan data. Sila sahkan ID atau nama sekali lagi.",
    db_search_lbl_id: "ID SJKC ID",
    db_search_lbl_name: "Nama Murid",
    db_search_lbl_total: "Jumlah Sumbangan Kitar Semula",
    db_search_lbl_co2: "Pencegahan Jejak Karbon",
    db_search_lbl_history: "Sejarah Ganjaran & Aktiviti Murid",
    db_search_lbl_date: "Tarikh",
    db_search_lbl_category: "Jenis Aktiviti",
    db_search_lbl_weight: "Kitar Semula (KG)",
    db_search_lbl_deduct: "Ditolak/Denda (KG)",
    db_search_lbl_net: "Berat Bersih (KG)",
    db_search_lbl_verifier: "Guru Penyelia",
    db_search_lbl_empty_history: "Murid ini tiada rekod sumbangan kitar semula setakat ini. Teruskan usaha lestari!",

    // Dashboard Overall Carbon reduction impact factors
    db_carbon_title: "Manfaat Pengurangan Pelepasan Karbon SJKC Ladang Grisek",
    db_carbon_trees: "Zon Pertumbuhan Pokok Hijau",
    db_carbon_trees_unit: "batang pokok",
    db_carbon_energy: "Penjimatan Kuasa Elektrik Domestik",
    db_carbon_energy_unit: "kWh",
    db_carbon_mileage: "Jarak Penjimatan Kereta Petrol",
    db_carbon_mileage_unit: "KM",
    db_carbon_bottles: "Pengurangan Pembuangan Botol Plastik",
    db_carbon_bottles_unit: "unit",
    db_carbon_recycled_total: "Jumlah Berat Kitar Semula Keseluruhan",
    db_carbon_points: "Mata Keseluruhan Kitar Semula",

    // Admin & Recoder views
    admin_title: "Kemasukan Rekod Lestari",
    admin_tab_single: "Kemasukan Kilat Individu",
    admin_tab_batch: "Kemasukan Pantas Berkumpulan",
    admin_tab_violation: "Rekod Pelanggaran Karbon",
    admin_search_student: "Cari & Pilih SJKC ID Murid",
    admin_select_month: "Pilih Sesi Pengumpulan Bulan",
    admin_input_weight: "Sukat Berat Kitar Semula (KG)",
    admin_signature: "Nama Guru Pembimbing / Hakim Bertugas",
    admin_submit_btn: "Daftar Rekod Pelupusan Ini",
    admin_rule_hint: "Sila pilih murid bersesuaian, berat kitar semula sah mestilah melebihi 0.05 KG.",
    admin_weight_placeholder: "0.00",
    admin_teacher_placeholder: "Masukkan nama guru penyelia...",
    admin_violation_category: "Pilih Jenis Pelanggaran Karbon",
    admin_violation_deduct: "Berat Denda Pelepasan Karbon (KG)",
    admin_violation_reason: "Sebab Pelanggaran (Ulasan Ringkas)",
    admin_success_msg: "Rekod berjaya didaftarkan ke dalam sistem!",
    admin_deleted_msg: "Rekod kitar semula berjaya dipadamkan.",
    
    // Classroom & Individual Ranking titles
    rank_title_class: "Siri Liga Kitar Semula Kelas SJKC",
    rank_sub_class: "KEDUDUKAN MATA SUMBANGAN KITAR SEMULA MENGIKUT BANTUAN KELAS",
    rank_title_individual: "Kedudukan Atlet Hijau Individu (Top 50)",
    rank_sub_individual: "SIRI KEDUDUKAN KUTIPAN KESELURUHAN INDIVIDU MURID",
    rank_no_data: "Tiada data direkodkan setakat ini",

    // Certificate and Poster Creators
    poster_gen_title: "Menjana Sijil & Poster Pencapaian",
    poster_monthly_leader: "Juara Kitar Semula Bulanan",
    poster_year: "Tahun",
    poster_month: "Bulan",
    poster_download_jpeg: "Muat Turun Format JPEG",
    poster_download_pdf: "Muat Turun Format PDF",
    poster_btn_close: "Tutup Paparan Sijil",

    // Login Verification modal overlay
    login_title: "Verifikasi Pengesahan Sesi Pentadbir",
    login_sub: "KAWALAN SENSITIF BILIK KAWALAN UTAMA",
    login_lbl_pw: "MASUKKAN PIN KATA LALUAN ADIKARAM",
    login_btn_submit: "Sahkan & Masuk Bilik Kawalan",
    login_loading: "Membandingkan kata laluan keselamatan...",
    login_tip: "Nota: Sila masukkan kata laluan keselamatan rasmi kelestarian sekolah yang telah ditetapkan.",

    // Ultimate control chamber (management tab)
    mgt_title: "Terminal Bilik Kawalan Utama SJKC",
    mgt_sub: "PENTADBIRAN SISTEM & GERBANG KAWALAN SYNC AWAN",
    mgt_card_date_title: "Kemaskini Sesi Pengumpulan Seterusnya",
    mgt_card_date_desc: "Menukar tarikh pemberitahuan kitar semula yang dipaparkan pada dewan utama murid.",
    mgt_btn_save_date: "Simpan Tarikh Baharu",
    mgt_card_db_title: "Integrasi Pelayan Segerak Awan",
    mgt_card_db_desc: "Eksport, muat turun, import pangkalan data atau segerak semula semua pergerakan data kitar semula sekolah dengan pelayan Google Sheets.",
    mgt_btn_sync_now: "Segerakkan Segera Dengan Google Sheets",
    mgt_btn_export: "Muat Turun Sandaran Berbentuk JSON",
    mgt_btn_import: "Semak & Bersihkan Semua Data Tempatan (Padam Semua)",
    mgt_card_reward_title: "Sistem Pentadbiran Insentif Wang Tunai Kelas (Kadar Ganjaran)",
    mgt_card_reward_desc: "Wang diberikan kepada kelas mengikut sumbangan kitar semula terkumpul. Contoh: RM 0.10 setiap kilogram.",
    mgt_lbl_rate: "Kadar Ganjaran Semasa (RM sekilogram)",
    mgt_btn_save_reward: "Simpan Kadar Ganjaran Baharu",
    mgt_card_roster_title: "Aplikasi Urus Roster Murid Sekolah SJKC",
    mgt_card_roster_desc: "Tambat, padam atau import nama murid terus mengikut kelas di SJKC Ladang Grisek.",
    mgt_btn_manage_roster: "Buka Pengurus Nama Roster Murid",
    mgt_btn_close_roster: "Tutup Panel Pengurus Roster",

    // General terms
    student_id_lbl: "ID Murid",
    class_lbl: "Kelas",
    date_lbl: "Tarikh",
    weight_lbl: "Berat (KG)",
    action_lbl: "Tindakan",
    delete_lbl: "Padam",
    add_student_lbl: "Tambah Murid Baharu",
    edit_student_lbl: "Kemaskini Rekod Murid",
    input_student_id_lbl: "Masukkan ID Murid (cth: 26001)",
    input_student_name_lbl: "Masukkan Nama Murid Lengkap",
    input_student_class_lbl: "Masukkan Kelas Terkait",
    save_btn_lbl: "Simpan Rekod",
    cancel_btn_lbl: "Batal Tindakan",
    import_excel_lbl: "Muat Naik Fail Senarai Nama (CSV/Excel)",
    export_excel_lbl: "Muat Turun Senarai Murid"
  },
  zh: {
    // Header & App Branding
    app_title: "新廊华小生态永续系统",
    school_sub_header: "校园环保回收计划与碳足迹控制大厅",
    eco_league_header: "LEAGUE OF ECO-VALOR • SJKC LADANG GRISEK",
    online_status: "在线同步中",
    offline_status: "离线单机模式",
    offline_alert_bar: "⚠️ 本地离线录入模式已激活（数据临时储存在本机浏览器缓存内）",
    unsynced_btn: "等待同步",
    theme_toggle_tip: "转换夜光模式",
    nav_home: "大厅",
    nav_record: "战绩录入",
    nav_leaderboard: "荣誉大榜",
    nav_control: "终极控制室",
    nav_logout: "登出大厅",

    // Lobby / Landing page widgets & statistics
    lobby_badge: "新廊华小生态永续项目",
    lobby_headline: "新廊华小生态永续系统",
    school_sub: "SISTEM KELESTARIAN HONOR OF ECO",
    eco_league: "荣耀生态 · 零碳未来",
    lobby_total_recycled: "累计回收总量",
    lobby_total_recycled_desc: "师生和社区本学期累计回收环保资源的累计总重量。",
    lobby_co2_offset: "抵消碳排总量 (KG)",
    lobby_co2_offset_desc: "通过分类循环回收，由科学换算抵消之校园温室气体减排排碳总量。",
    lobby_total_practices: "参与环保实践 (次)",
    lobby_total_submissions: "累计净化提交记录",
    lobby_total_submissions_desc: "自平台建立以来，云端服务器实时登记并已生效的数据条目。",
    bottom_disclaimer: "新廊华小生态永续科技项目组 • 让绿色回收变成光荣，共同筑牢零碳校园",
    lobby_view_rank: "查看全校排位大榜 ↓",
    lobby_admin_login: "管理进入端 / Log Masuk Admin",
    lobby_arena_title: "🏆 校园实时绿色环保竞技场 / SECARA LANGSUNG",
    simulated_challengers_count: "今日已有 {count} 位先锋挑战成功！",
    countdown_days: "剩 {days} 天",
    countdown_expired: "环保回收日期已过，请提醒管理员在“终极控制室”中设置下一次的回收日期日程。",
    countdown_today: "今天就是环保回收日！",
    countdown_tomorrow: "明天是环保回收日！",
    countdown_today_text: "请尽快带上您的分类回收物品并送往班级指定收集点。",
    countdown_tomorrow_text: "请在今晚准备整理好回收物品并于明日一早带到学校。",

    // Daily Trivia section
    trivia_widget_title: "每日环保知识排位战",
    trivia_theme: "💡 每日环保主题 / Tema Hari Ini:",
    trivia_challenge: "⚔️ 竞技题：",
    trivia_correct: "🎉 恭喜，回答正确！ / Syabas, Betul!",
    trivia_incorrect: "❌ 很遗憾答错了... / Maaf, Kurang Tepat!",
    trivia_reset: "重新答题",
    trivia_promise_done: "👍 我今天已承诺践行！",
    trivia_promise_btn: "承诺做个环保星 ✨",

    // Dashboard navigation tabs
    db_tab_overall: "全校总览",
    db_tab_class: "班级龙虎榜",
    db_tab_individual: "个人排位赛",
    db_tab_history: "实时环保战报",
    db_tab_search: "检索个人战绩",

    // Dashboard Search murid interface
    db_search_class_filter: "班级过滤",
    db_search_month_filter: "月份过滤",
    db_search_placeholder: "输入学号、姓名或首字母拼音进行模糊检索...",
    db_search_syncing: "正在实时云端同步所有学生最新功勋...",
    db_search_prompt: "请输入学生姓名、学号或班级，开始检索其全校荣誉与回收记录",
    db_search_not_found: "没有在系统数据库中检索到该学生记录，请重新确认输入学号或姓名",
    db_search_lbl_id: "学号 / SJKC ID",
    db_search_lbl_name: "学生姓名 / Nama",
    db_search_lbl_total: "累计环保贡献总量",
    db_search_lbl_co2: "抵消碳足迹价值",
    db_search_lbl_history: "近期参与之历史明细 / Sejarah Rekod",
    db_search_lbl_date: "日期",
    db_search_lbl_category: "事项/分类描述",
    db_search_lbl_weight: "回收量 (KG)",
    db_search_lbl_deduct: "扣除重量 (KG)",
    db_search_lbl_net: "环保功勋重量 (KG)",
    db_search_lbl_verifier: "登记教师 / 评委签名",
    db_search_lbl_empty_history: "该学生目前未有环保回收战绩登记。继续加油吧！",

    // Dashboard Overall Carbon reduction impact factors
    db_carbon_title: "新廊绿色低碳先锋减排效益",
    db_carbon_trees: "相当于种植绿树",
    db_carbon_trees_unit: "棵大树",
    db_carbon_energy: "减少家用电器能耗",
    db_carbon_energy_unit: "度电 (kWh)",
    db_carbon_mileage: "相当于减少燃油车行驶里程",
    db_carbon_mileage_unit: "公里 (KM)",
    db_carbon_bottles: "相当于少消耗一次性塑料瓶",
    db_carbon_bottles_unit: "只塑料瓶",
    db_carbon_recycled_total: "全校累计回收总重量",
    db_carbon_points: "全校碳排抵消大功勋",

    // Admin & Recoder views
    admin_title: "战绩录入",
    admin_tab_single: "单生闪电录入",
    admin_tab_batch: "批量快速采集法",
    admin_tab_violation: "碳排放违规记录",
    admin_search_student: "查找并选择学生学号",
    admin_select_month: "选择回收登记月份",
    admin_input_weight: "输入实测毛重 (KG)",
    admin_signature: "登记员/教师签名证明",
    admin_submit_btn: "极速登记此战绩 / Daftarkan",
    admin_rule_hint: "提示：请查找匹配学生；系统单次最少需输入实测回收毛重 0.05 KG 始有效。",
    admin_weight_placeholder: "0.00",
    admin_teacher_placeholder: "登记教师全名或工号签名...",
    admin_violation_category: "惩罚扣分项目选择",
    admin_violation_deduct: "扣除重量 (KG)",
    admin_violation_reason: "违规原因描述 (例：违规把厨余丢进环保桶)",
    admin_success_msg: "恭喜！战绩记录成功同步，已载入学生荣誉档案！",
    admin_deleted_msg: "战绩已经成功移除并失效。",

    // Classroom & Individual Ranking titles
    rank_title_class: "班级龙虎榜 / Kedudukan Kelas",
    rank_sub_class: "全校班级累计环保回收总重量金牌排位",
    rank_title_individual: "个人排位赛 / Kedudukan Individu (前50名)",
    rank_sub_individual: "全校学生回收总量金牌荣誉大排位龙虎榜",
    rank_no_data: "暂无数据 / Tiada Data",

    // Certificate and Poster Creators
    poster_gen_title: "生成荣誉奖状与宣传海报",
    poster_monthly_leader: "月度低碳环保明星奖",
    poster_year: "年",
    poster_month: "月",
    poster_download_jpeg: "导出高清晰 JPEG 图片",
    poster_download_pdf: "导出官方 A4 PDF 文件",
    poster_btn_close: "关闭海报奖状查看端",

    // Login Verification modal overlay
    login_title: "召唤师身份验证 / Verifikasi Sesi",
    login_sub: "Authorized Terminal Access Only",
    login_lbl_pw: "数字身份密匙 / INPUT KATA LALUAN",
    login_btn_submit: "验证并开启控制室 / Masuk System",
    login_loading: "密码实时比对验证中...",
    login_tip: "提示：请输入预设默认为当前校园管理员授权密码",

    // Ultimate control chamber (management tab)
    mgt_title: "终极控制室 / Terminal Kawalan",
    mgt_sub: "校园低碳环保项目数据控制中枢与宏观管理系统",
    mgt_card_date_title: "更新校园下一次回收日日程",
    mgt_card_date_desc: "变更将在大厅倒计时小组件中向全体学生展示，提醒提早整理回收材料。",
    mgt_btn_save_date: "保存并更新回收日",
    mgt_card_db_title: "云端数据双向同步中枢",
    mgt_card_db_desc: "一键从 Google Sheets 模板双向刷新、备份或恢复整套本地及离线缓存系统。",
    mgt_btn_sync_now: "立即强制刷新并同步 Google Sheets",
    mgt_btn_export: "下载离线数据库 JSON 副本备份",
    mgt_btn_import: "彻底格式化清除系统数据（重置系统）",
    mgt_card_reward_title: "环保荣誉基金班级班币比例系数 (Ganjaran Wang)",
    mgt_card_reward_desc: "班级在获得指定回收量后可取得班级专属低碳津贴基金。当前单价：",
    mgt_lbl_rate: "当前环保返还津贴单价（RM 每公斤）",
    mgt_btn_save_reward: "更新班币津贴单价",
    mgt_card_roster_title: "全校学生注册学籍与班级花名册管理器",
    mgt_card_roster_desc: "支持单名增删修改，或通过批量 CSV 表格导入全校学生学籍，建立环保排位卡。",
    mgt_btn_manage_roster: "启动学籍花名册管理面板",
    mgt_btn_close_roster: "收起花名册管理面板",

    // General terms
    student_id_lbl: "学生学号",
    class_lbl: "就读班级",
    date_lbl: "登记日期",
    weight_lbl: "贡献净重",
    action_lbl: "操作动作",
    delete_lbl: "删除",
    add_student_lbl: "单名录取新学生",
    edit_student_lbl: "修定学生学籍",
    input_student_id_lbl: "请输入学号 (例：26001)",
    input_student_name_lbl: "请输入学生官方全名 (华文 + 英文)",
    input_student_class_lbl: "请指派就读班级",
    save_btn_lbl: "保存名册数据",
    cancel_btn_lbl: "取消修改",
    import_excel_lbl: "批量 CSV 学籍表格映射上传",
    export_excel_lbl: "导出全校学籍名册 CSV"
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('sjkc_eco_lang');
    if (saved === 'zh' || saved === 'ms') {
      return saved as Language;
    }
    return 'ms'; // Malay by default
  });

  useEffect(() => {
    localStorage.setItem('sjkc_eco_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const section = translations[language];
    if (section && section[key] !== undefined) {
      return section[key];
    }
    // Fallback to ms, then to key
    return translations['ms'][key] ?? key;
  };

  const isMs = language === 'ms';
  const isZh = language === 'zh';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isMs, isZh }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
