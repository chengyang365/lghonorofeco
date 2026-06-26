/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string; // ID / 学号 (e.g., 26001)
  name: string; // 姓名
  className: string; // 班级
  createdAt?: number;
}

export interface Entry {
  id: string; // UUID
  type: 'recycle' | 'deduction';
  teacherName: string;
  name: string; // Student Name
  studentID: string; // Student ID
  className: string;
  weight: number; // Positive for recycle, negative for penalty (deduction)
  month: string; // "一月 / Jan", "二月 / Feb", etc.
  calendarYear: number;
  year: number; // System grade (1-6)
  createdAt: string; // Timestamp
  displayTime: string; // Short logging display time
  status?: 'deleted'; // Status indicator
  reason?: string; // e.g. "Food Waste", "Electricity", "Others"
  originalClassName?: string;
  originalName?: string;
}

export interface UnsyncedTask {
  action: string;
  data: any;
  uuid: string;
  checksum: string;
  retryCount?: number;
  success?: boolean;
}

// Low Carbon Cities Framework Standard Factor (IMELC-UTM Malaysia)
export const CO2_FACTOR = 2.87;

/**
 * Custom Class List Generator based on standard primary class layouts.
 */
export const CLASS_OPTIONS: string[] = (() => {
  const rules = [
    { year: 1, max: 'E' },
    { year: 2, max: 'E' },
    { year: 3, max: 'E' },
    { year: 4, max: 'D' },
    { year: 5, max: 'E' },
    { year: 6, max: 'C' }
  ];
  const options: string[] = [];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  rules.forEach(r => {
    const maxIndex = letters.indexOf(r.max);
    for (let i = 0; i <= maxIndex; i++) {
      options.push(`${r.year}${letters[i]}`);
    }
  });
  return options;
})();

export const MONTH_OPTIONS = [
  "一月 / Jan",
  "二月 / Feb",
  "三月 / Mar",
  "四月 / Apr",
  "五月 / May",
  "六月 / Jun",
  "七月 / Jul",
  "八月 / Aug",
  "九月 / Sep",
  "十月 / Oct",
  "十一月 / Nov",
  "十二月 / Dec"
];

export interface QuarterConfig {
  label: string;
  months: number[];
}

export const QUARTERS: Record<string, QuarterConfig> = {
  'Q1': { label: '第一季度 (1-3月)', months: [0, 1, 2] },
  'Q2': { label: '第二季度 (4-6月)', months: [3, 4, 5] },
  'Q3': { label: '第三季度 (7-9月)', months: [6, 7, 8] },
  'Q4': { label: '第四季度 (10-11月)', months: [9, 10] }
};

export const YEAR_OPTIONS = [2026, 2027, 2028, 2029];

// Gamification Systems
export const getGamificationBadge = (totalWeight: number, lang: 'ms' | 'zh' = 'ms'): string => {
  if (lang === 'zh') {
    if (totalWeight >= 800) return '🔥 荣耀王者';
    if (totalWeight >= 500) return '🌟 无双王者';
    if (totalWeight >= 350) return '🔴 最强王者';
    if (totalWeight >= 200) return '🌪️ 至尊星耀';
    if (totalWeight >= 100) return '👑 永恒钻石';
    if (totalWeight >= 50) return '💎 尊贵铂金';
    if (totalWeight >= 25) return '⚔️ 尊贵黄金';
    if (totalWeight >= 10) return '🛡️ 秩序白银';
    return '🆕 青铜骑士';
  } else {
    if (totalWeight >= 800) return '🔥 Satria Agung Lestari';
    if (totalWeight >= 500) return '🌟 Johan Lestari Sejati';
    if (totalWeight >= 350) return '🔴 Jaguh Lestari Utama';
    if (totalWeight >= 200) return '🌪️ Wira Elit Gemilang2';
    if (totalWeight >= 100) return '👑 Satria Berlian Abadi';
    if (totalWeight >= 50) return '💎 Pejuang Platinum Jaguh';
    if (totalWeight >= 25) return '⚔️ Wira Emas Cemerlang';
    if (totalWeight >= 10) return '🛡️ Sukarelawan Perak Harapan';
    return '🆕 Perintis Gangsa Lestari';
  }
};

export interface TreeEvolution {
  icon: string;
  label: string;
}

export const getTreeEvolution = (totalWeight: number, lang: 'ms' | 'zh' = 'ms'): TreeEvolution => {
  if (lang === 'zh') {
    if (totalWeight >= 1200) return { icon: '🍎', label: '丰收树 (Berbuah)' };
    if (totalWeight >= 600) return { icon: '🌳', label: '参天大树 (Besar)' };
    if (totalWeight >= 300) return { icon: '🌿', label: '茂盛小树 (Rimbun)' };
    if (totalWeight >= 150) return { icon: '🌱', label: '初苗 (Anak Pokok)' };
    return { icon: '🌰', label: '新种子 (Benih)' };
  } else {
    if (totalWeight >= 1200) return { icon: '🍎', label: 'Pokok Berbuah Ranum' };
    if (totalWeight >= 600) return { icon: '🌳', label: 'Pokok Rimbun Tua' };
    if (totalWeight >= 300) return { icon: '🌿', label: 'Pokok Subur Hijau' };
    if (totalWeight >= 150) return { icon: '🌱', label: 'Anak Pokok Lestari' };
    return { icon: '🌰', label: 'Biji Benih Lestari' };
  }
};
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbysmaPGB68EXT-9PSXtk-PuPVZjNWLJhpLb28uLpfKItzo4k453qtA4OFgwMMMnHEE-/exec";
