/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Recycle,
  Leaf,
  Activity,
  Lock,
  Unlock,
  Settings,
  X,
  Upload,
  Download,
  Trash2,
  Settings2,
  AlertTriangle,
  LogOut,
  Moon,
  Sun,
  Home,
  Clock,
  Trash,
  RefreshCw,
  Trophy,
  Search,
  Loader2,
  Award
} from 'lucide-react';

import {
  Student,
  Entry,
  UnsyncedTask,
  CLASS_OPTIONS,
  MONTH_OPTIONS,
  GOOGLE_SCRIPT_URL
} from './types';

import {
  playSound,
  getLocalDateString,
  generateTimestampStr,
  generateChecksum
} from './utils';

import { RecycleReminder } from './components/RecycleReminder';
import { SecurePasswordInput } from './components/SecurePasswordInput';
import { PosterModal } from './components/PosterModal';
import { DashboardView } from './components/DashboardView';
import { AdminEntryView } from './components/AdminEntryView';
import { useLanguage } from './components/LanguageContext';
import { StudentListManager } from './components/StudentListManager';
import { DailyEcoTrivia } from './components/DailyEcoTrivia';
import { DailyEcoChallenge } from './components/DailyEcoChallenge';
import { MicroTriviaQuiz } from './components/MicroTriviaQuiz';

// Dynamic database of eco-sustainable tips
const ECO_TIPS = [
  {
    title: "回收一吨废纸 / Kitar Semula 1 Ton Kertas",
    content: "可避免砍伐17棵大树，并节省3立方米的垃圾填埋空间，同时节省大量电力与水源！"
  },
  {
    title: "纸板盒先压扁 / Leperingkan Kotak Kadbod",
    content: "扔进回收桶前，请先将纸盒或纸箱压平压扁！这能节约超 70% 的存储与运输空间，减少碳足迹。"
  },
  {
    title: "洗净塑料瓶 / Bersihkan Botol Plastik",
    content: "残留油污或饮料的塑料瓶会污染整包回收物。回收前请务必用水简单冲洗一下哦！"
  },
  {
    title: "自备便当盒与水杯 / Bawa Bekas Makanan Sendiri",
    content: "少用一次性饭盒、塑料袋与吸管。自备可重用器皿，能大幅减少塑料微粒污染海洋。"
  },
  {
    title: "熄灭闲置电器 / Suis Off Elektrik",
    content: "电器处于待机（Standby）状态依然会消耗5%到15%电源。拔掉闲置插头，既安全又省电！"
  },
  {
    title: "空调理想温度 24°C - 26°C / Suhu Penyaman Udara Ideal",
    content: "冷气每调高一度，就能省电约7%到10%。搭配微风扇使用，制冷快且节能减排特别明显！"
  },
  {
    title: "珍惜饭菜光盘行动 / Elak Pembaziran Makanan",
    content: "厨余垃圾在埋场腐烂会大量形成温室气体甲烷（CH₄）。吃多少盛多少，节约粮食就是护航地球。"
  },
  {
    title: "衣物循环延寿命 / Kitar Semula Pakaian",
    content: "生产一件普通纯棉衣物需要数千升水。提倡以旧衣物分类处理和旧物置换，减少快时尚过度消费。"
  },
  {
    title: "塑料袋降解需要数百年 / Beg Plastik Lambat Reput",
    content: "一个塑料袋在泥土中需要达数百年才能降解。随身携带帆布包或大袋子，低碳又时尚！"
  },
  {
    title: "提倡绿色代步出行 / Kenderaan Rendah Karbon",
    content: "短途出行时多步行、骑共享自行车、搭公共交通。锻炼筋骨的同时，能让空气更清新！"
  }
];

export default function App() {
  const { language, setLanguage, t, isMs, isZh } = useLanguage();
  const currentYear = new Date().getFullYear();

  // Selected date-seeded eco tip (changes daily)
  const dailyEcoTip = React.useMemo(() => {
    const date = new Date();
    const seed = date.getFullYear() * 1000 + (date.getMonth() + 1) * 100 + date.getDate();
    return ECO_TIPS[seed % ECO_TIPS.length];
  }, []);

  // Primary persistent core state
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const saved = localStorage.getItem('sjkc_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('sjkc_students');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pendingDeletions, setPendingDeletions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sjkc_pending_deletions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unsyncedQueue, setUnsyncedQueue] = useState<UnsyncedTask[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sjkc_unsynced_queue') || '[]');
    } catch {
      return [];
    }
  });

  const [nextRecycleDate, setNextRecycleDate] = useState(() => {
    try { return localStorage.getItem('sjkc_next_recycle_date') || ''; } catch { return ''; }
  });
  const isDarkMode = false;
  const setIsDarkMode = () => {};
  const [isPublicDashboardOpen, setIsPublicDashboardOpen] = useState(() => {
    try { return localStorage.getItem('sjkc_public_dashboard') !== 'false'; } catch { return true; }
  });

  // Loader & Connections State
  const [loading, setLoading] = useState(true);
  const [cloudError, setCloudError] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setCloudError(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isCloudEnabled] = useState(!!GOOGLE_SCRIPT_URL);
  const isSyncingRef = useRef(false);

  // View States
  const [viewMode, setViewMode] = useState<'landing' | 'admin' | 'dashboard' | 'management'>('landing');
  const [manageTab, setManageTab] = useState<'audit' | 'students' | 'backup' | 'settings'>('audit');
  
  // Custom Auths & Overlays
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isSystemUnlocked, setIsSystemUnlocked] = useState(false);
  const [systemUnlockPass, setSystemUnlockPass] = useState('');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [wipeConfirmModalOpen, setWipeConfirmModalOpen] = useState(false);
  const [wipeConfirmInput, setWipeConfirmInput] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('sjkc_reminder_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // deletion, prompt modals
  const [deleteRequestModal, setDeleteRequestModal] = useState<{ show: boolean; entryId: string | null; reason: string }>({
    show: false,
    entryId: null,
    reason: ''
  });

  // Poster generator states
  const [posterModal, setPosterModal] = useState<{ isOpen: boolean; type: 'monthly' | 'quarterly'; config: any; data: any }>({
    isOpen: false,
    type: 'monthly',
    config: { monthIndex: new Date().getMonth(), year: currentYear },
    data: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Virtual logs windowing states
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 80;
  const VISIBLE_HEIGHT = 520;
  const BUFFER = 6;

  // Sync to database triggers
  const executeSync = useCallback(async (isSilent = false) => {
    if (isSyncingRef.current) return;
    const queueToSync: UnsyncedTask[] = JSON.parse(localStorage.getItem('sjkc_unsynced_queue') || '[]');
    if (queueToSync.length === 0) return;

    isSyncingRef.current = true;
    if (!isSilent) setLoading(true);

    let successCount = 0;
    const remainingQueue = [...queueToSync];
    let hasError = false;

    // Concurrency limit - processes up to 4 synchronizations in parallel chunks
    const CONCURRENCY_LIMIT = 4;
    for (let i = 0; i < remainingQueue.length; i += CONCURRENCY_LIMIT) {
      const chunk = remainingQueue.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.all(
        chunk.map(async (task) => {
          if ((task.retryCount || 0) >= 4) {
            hasError = true;
            return;
          }

          try {
            const controller = new AbortController();
            const tId = setTimeout(() => controller.abort(), 7000);

            const res = await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(task),
              signal: controller.signal
            });
            clearTimeout(tId);

            if (!res.ok) throw new Error("HTTP " + res.status);
            const resJson = await res.json();

            if (resJson && (resJson.status === 'success' || resJson.status === true)) {
              task.success = true;
              successCount++;
            } else {
              throw new Error(resJson.message || "Rejected");
            }
          } catch (err) {
            console.warn(`Background post sync failed for UUID: ${task.uuid}`, err);
            task.retryCount = (task.retryCount || 0) + 1;
            hasError = true;
          }
        })
      );
    }

    const nextQueue = remainingQueue.filter(t => !t.success);
    setUnsyncedQueue(nextQueue);
    localStorage.setItem('sjkc_unsynced_queue', JSON.stringify(nextQueue));

    if (!isSilent) setLoading(false);
    if (successCount > 0 && !isSilent) {
      showNotification(`成功同步 ${successCount} 项安全操作！`, 'success');
    }

    if (hasError) {
      setCloudError(true);
    } else {
      setCloudError(false);
    }

    isSyncingRef.current = false;
  }, []);

  const safeSendToSheet = async (action: string, data: any = null) => {
    const uuid = data && data.id ? data.id : crypto.randomUUID();
    const checksum = await generateChecksum(data);
    const task: UnsyncedTask = { action, data, uuid, checksum, retryCount: 0 };

    setUnsyncedQueue(prev => {
      const nextQ = [...prev, task];
      localStorage.setItem('sjkc_unsynced_queue', JSON.stringify(nextQ));
      return nextQ;
    });

    if (navigator.onLine && isCloudEnabled) {
      setTimeout(() => executeSync(true), 150);
    } else {
      setCloudError(true);
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleCloudError = useCallback(() => {
    setCloudError(true);
    setLoading(false);
    showNotification("网速缓慢，已转换至本端离线模式", "error");
  }, []);

  // Fetch entries from Google sheet database
  const fetchEntries = useCallback(async () => {
    if (!isCloudEnabled) return;
    try {
      if (entries.length === 0) setLoading(true);
      const res = await fetch(GOOGLE_SCRIPT_URL + '?action=getEntries');
      if (!res.ok) throw new Error("Fetch failed");
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error("Not JSON");
      const json = await res.json();
      if (!Array.isArray(json.data)) return;

      const currentQueue = JSON.parse(localStorage.getItem('sjkc_unsynced_queue') || '[]');
      const localUnsynced = currentQueue.flatMap((t: any) => {
        if (t.action === 'addEntry') return [t.data];
        return [];
      });

      const merged = [...localUnsynced, ...json.data];
      const uniq = Array.from(new Map(merged.map((e: any) => [e.id, e])).values());
      uniq.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // separating older entries to keep interface smooth
      const pruned = uniq.slice(0, 1600);
      setEntries(pruned.map((e: any) => ({ ...e, weight: Number(e.weight) || 0 })));
      setCloudError(false);
    } catch {
      handleCloudError();
    } finally {
      setLoading(false);
    }
  }, [isCloudEnabled, entries.length, handleCloudError]);

  // Fetch student roster database
  const fetchStudents = useCallback(async () => {
    if (!isCloudEnabled) return;
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL + '?action=getStudents');
      if (!res.ok) throw new Error("Fetch failed");
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error("Not JSON");
      const json = await res.json();
      if (!Array.isArray(json.data)) return;

      const uniq = Array.from(new Map(json.data.map((s: any) => [s.id, s])).values());
      setStudents(uniq);
      setCloudError(false);
    } catch {
      if (entries.length === 0) handleCloudError();
    }
  }, [isCloudEnabled, entries.length, handleCloudError]);

  // Fetch settings from server
  const fetchSettings = useCallback(async () => {
    if (!isCloudEnabled) return;
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL + '?action=getSettings');
      if (!res.ok) throw new Error("Fetch failed");
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error("Not JSON");
      const json = await res.json();
      if (json.data && json.data.nextRecycleDate !== undefined) {
        setNextRecycleDate(json.data.nextRecycleDate);
        localStorage.setItem('sjkc_next_recycle_date', json.data.nextRecycleDate);
      }
    } catch {
      console.warn("Fetch recycle date settings failed offline.");
    }
  }, [isCloudEnabled]);

  // Heartbeat background sync loops
  useEffect(() => {
    const loop = setInterval(() => {
      if (navigator.onLine && unsyncedQueue.length > 0 && !loading) {
        executeSync(true);
      }
    }, 9005);
    return () => clearInterval(loop);
  }, [unsyncedQueue.length, loading, executeSync]);

  useEffect(() => {
    if (isCloudEnabled && !cloudError) {
      fetchEntries();
      fetchStudents();
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isCloudEnabled, cloudError, fetchEntries, fetchStudents, fetchSettings]);

  // Caching states persistency triggers
  useEffect(() => {
    localStorage.setItem('sjkc_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('sjkc_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('sjkc_pending_deletions', JSON.stringify(pendingDeletions));
  }, [pendingDeletions]);

  // Toggle Dark theme elements
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Touch Haptic feedback on buttons, select filters, checkmarks and anchors for snappy mobile feel
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.closest('select') ||
          target.closest('input[type="submit"]') ||
          target.closest('input[type="checkbox"]'))
      ) {
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12); // subtle 12ms quick click feedback
          }
        } catch {
          // Keep silent in sandbox iframe environments
        }
      }
    };
    document.addEventListener('click', handleGlobalClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Toggle visitor public dashboards
  const handleToggleVisitorDashboard = () => {
    const val = !isPublicDashboardOpen;
    setIsPublicDashboardOpen(val);
    localStorage.setItem('sjkc_public_dashboard', String(val));
    showNotification(val ? "访客仪表板权限开启" : "已拦截仪表板匿名访问", "success");
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=verifyAdmin&password=${encodeURIComponent(passwordInput)}`);
      const ans = await res.json();
      if (ans.status === 'success') {
        setIsAdmin(true);
        setViewMode('admin');
        setPasswordInput('');
        setIsLoginModalOpen(false);
        playSound('success');
        showNotification("登入成功，欢迎进入管理后台", "success");
      } else {
        playSound('error');
        showNotification("录入密码凭证错误 / Password salah", "error");
      }
    } catch {
      showNotification("安全凭据握手失败，核实网络", "error");
    } finally {
      setLoading(false);
    }
  };

  // Perform secure system locks before adjustments
  const handleSystemUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=verifySecurity&password=${encodeURIComponent(systemUnlockPass)}`);
      const ans = await res.json();
      if (ans.status === 'success') {
        setIsSystemUnlocked(true);
        setSystemUnlockPass('');
        playSound('success');
        showNotification("系统控制控制权限解锁", "success");
      } else {
        playSound('error');
        showNotification("系统授权密码校验错误", "error");
      }
    } catch {
      showNotification("网络超时，无法解锁安全核准", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyPasswordForPenalties = async (pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=verifySecurity&password=${encodeURIComponent(pass)}`);
      const ans = await res.json();
      return ans.status === 'success';
    } catch {
      return false;
    }
  };

  // Add Entries wrapper
  const handleAddWeightEntry = async (item: any) => {
    setEntries(prev => [item, ...prev]);
    await safeSendToSheet('addEntry', item);
  };

  const handleAwardQuizPoints = async (studentID: string, studentName: string, className: string, points: number) => {
    const newEntry: Entry = {
      id: 'quiz-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      type: 'recycle',
      teacherName: '💎 Quiz Master',
      name: studentName,
      studentID: studentID,
      className: className,
      weight: 1.74, // Represents standard carbon equivalent of trivia engagement
      month: MONTH_OPTIONS[new Date().getMonth()],
      calendarYear: currentYear,
      year: parseInt(className[0]) || 1,
      createdAt: generateTimestampStr(),
      displayTime: new Date().toLocaleTimeString().substring(0, 10),
      reason: `Honor of Eco Quiz Victory (+${points} Bonus Pts)`
    };
    await handleAddWeightEntry(newEntry);
  };

  // Student list creations
  const handleAddStudentsChunk = async (cohort: Student[]) => {
    setStudents(prev => [...cohort, ...prev]);
    await safeSendToSheet('addStudentsBatch', cohort);
  };

  const handleUpdateStudentDetail = async (student: Student) => {
    setStudents(prev => prev.map(s => (s.id === student.id ? student : s)));
    await safeSendToSheet('updateStudent', student);
  };

  const handleDeleteStudentCard = async (targetId: string) => {
    setStudents(prev => prev.filter(s => s.id !== targetId));
    await safeSendToSheet('deleteStudent', { id: targetId });
  };

  // Logging Deletions request management
  const handleRequestDeletionLaunch = (id: string) => {
    setDeleteRequestModal({ show: true, entryId: id, reason: '' });
  };

  const confirmRequestDeletionSubmit = () => {
    const { entryId, reason } = deleteRequestModal;
    if (!entryId || !reason.trim()) {
      return showNotification("请输入申请清除的充分依据", "error");
    }
    const matchingLog = entries.find(e => e.id === entryId);
    if (!matchingLog) return;

    if (pendingDeletions.some(p => p.id === entryId)) {
      setDeleteRequestModal({ show: false, entryId: null, reason: '' });
      return showNotification("本条记录已经在管理审核名单中", "error");
    }

    const request = {
      ...matchingLog,
      reason: reason.trim(),
      requestTime: new Date().toLocaleString('zh-CN')
    };

    setPendingDeletions(prev => [request, ...prev]);
    setDeleteRequestModal({ show: false, entryId: null, reason: '' });
    showNotification("清除申报提交成果，静待审核", "success");
  };

  const handleApproveEntryErasure = async (auditId: string) => {
    setEntries(prev => prev.map(e => (e.id === auditId ? { ...e, status: 'deleted' } : e)));
    setPendingDeletions(prev => prev.filter(p => p.id !== auditId));
    await safeSendToSheet('deleteEntry', { id: auditId });
    showNotification("清除成功！对应环保贡献减项已落实扣除", "success");
  };

  const handleRejectEntryErasure = (auditId: string) => {
    setPendingDeletions(prev => prev.filter(p => p.id !== auditId));
    showNotification("已撤销并驳回回收清除申请", "error");
  };

  const handleWipeOutAllLogs = () => {
    if (wipeConfirmInput !== 'CONFIRM') {
      showNotification("关键词输入错误，操作已取消", "error");
      return;
    }
    setWipeConfirmModalOpen(false);
    setWipeConfirmInput('');
    setEntries([]);
    setPendingDeletions([]);
    showNotification("日志流缓存已安全重置", "success");
    safeSendToSheet('clearAllEntries');
  };

  const handleImportRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = val => {
      try {
        const bodyObj = JSON.parse(val.target?.result as string);
        if (bodyObj.entries && bodyObj.students) {
          setEntries(bodyObj.entries);
          setStudents(bodyObj.students);
          showNotification("名录以及录入库完美恢复，建议重启", "success");
        } else {
          showNotification("备份配置解析属性格式缺失", "error");
        }
      } catch {
        showNotification("无效的文件格式，非标准JSON属性", "error");
      }
    };
    r.readAsText(f);
  };

  const handleDownloadBackup = () => {
    const outData = { entries, students, timestamp: new Date().toISOString() };
    const b = new Blob([JSON.stringify(outData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(b);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SJKC_Recycle_System_Backup_${currentYear}_${new Date().getMonth() + 1}.json`;
    link.click();
    showNotification("系统备份包导出成功，请妥善保管", "success");
  };

  // Exit/Change functions
  const handleUserSignOut = () => {
    setIsAdmin(false);
    setIsSystemUnlocked(false);
    setViewMode('landing');
    showNotification("已安全登出系统配置", "success");
  };

  // Generate dynamic aggregate layouts in the visual poster
  const launchMonthlyPoster = (overrideConfig: { monthIndex: number; year: number }) => {
    const monthlyRecords = entries.filter(e => {
      const eYear = e.calendarYear || new Date(e.createdAt).getFullYear();
      let eMonthIdx = 0;
      if (typeof e.month === 'string' && e.month) {
        const parts = e.month.split('/');
        const part = parts.length > 1 ? parts[1]?.trim() : e.month;
        eMonthIdx = MONTH_OPTIONS.findIndex(m => m && m.includes(part));
        if (eMonthIdx === -1) {
          eMonthIdx = new Date(e.createdAt).getMonth();
        }
      } else {
        eMonthIdx = new Date(e.createdAt).getMonth();
      }
      return eYear === overrideConfig.year && eMonthIdx === overrideConfig.monthIndex && e.status !== 'deleted';
    });

    const classTotals: Record<string, any> = {};
    CLASS_OPTIONS.forEach(c => {
      classTotals[c] = { className: c, totalWeight: 0, grade: parseInt(c.charAt(0)) || 0, totalDeduction: 0, monthlyWeights: {} };
    });

    const indivTotals: Record<string, any> = {};

    monthlyRecords.forEach(e => {
      const w = Number(e.weight) || 0;
      const grade = parseInt(e.className?.charAt(0)) || 0;

      if (!classTotals[e.className]) {
        classTotals[e.className] = { className: e.className, totalWeight: 0, grade, totalDeduction: 0, monthlyWeights: {} };
      }
      classTotals[e.className].totalWeight += w;
      if (e.type === 'deduction') {
        classTotals[e.className].totalDeduction += Math.abs(w);
      }

      if (e.type === 'recycle' && (e.name || e.studentID)) {
        const uId = e.studentID || e.name;
        if (!indivTotals[uId]) {
          indivTotals[uId] = { name: e.name, className: e.className, totalWeight: 0, grade };
        }
        indivTotals[uId].totalWeight += w;
      }
    });

    const allClasses = Object.values(classTotals).sort((a: any, b: any) => b.totalWeight - a.totalWeight);
    const allIndiv = Object.values(indivTotals).sort((a: any, b: any) => b.totalWeight - a.totalWeight);

    const dataObj = {
      lower: {
        classes: allClasses.filter((c: any) => c.grade >= 1 && c.grade <= 3),
        individuals: allIndiv.filter((i: any) => i.grade >= 1 && i.grade <= 3)
      },
      upper: {
        classes: allClasses.filter((c: any) => c.grade >= 4 && c.grade <= 6),
        individuals: allIndiv.filter((i: any) => i.grade >= 4 && i.grade <= 6)
      }
    };

    setPosterModal({
      isOpen: true,
      type: 'monthly',
      config: overrideConfig,
      data: dataObj
    });
  };

  const launchQuarterlyPoster = (overrideConfig: { quarter: string; year: number }) => {
    // Determine bounds
    let targetMonths: number[] = [0, 1, 2];
    if (overrideConfig.quarter === 'Q2') targetMonths = [3, 4, 5];
    if (overrideConfig.quarter === 'Q3') targetMonths = [6, 7, 8];
    if (overrideConfig.quarter === 'Q4') targetMonths = [9, 10];

    const qRecords = entries.filter(e => {
      const eYear = e.calendarYear || new Date(e.createdAt).getFullYear();
      let eMonthIdx = 0;
      if (typeof e.month === 'string' && e.month) {
        const parts = e.month.split('/');
        const part = parts.length > 1 ? parts[1]?.trim() : e.month;
        eMonthIdx = MONTH_OPTIONS.findIndex(m => m && m.includes(part));
        if (eMonthIdx === -1) {
          eMonthIdx = new Date(e.createdAt).getMonth();
        }
      } else {
        eMonthIdx = new Date(e.createdAt).getMonth();
      }
      return eYear === overrideConfig.year && targetMonths.includes(eMonthIdx) && e.status !== 'deleted' && e.type === 'recycle';
    });

    const qIndivTotals: Record<string, any> = {};

    qRecords.forEach(e => {
      const w = Number(e.weight) || 0;
      const grade = parseInt(e.className?.charAt(0)) || 0;
      if (e.name || e.studentID) {
        const uId = e.studentID || e.name;
        if (!qIndivTotals[uId]) {
          qIndivTotals[uId] = { name: e.name, className: e.className, totalWeight: 0, grade };
        }
        qIndivTotals[uId].totalWeight += w;
      }
    });

    const allIndivSorted = Object.values(qIndivTotals).sort((a: any, b: any) => b.totalWeight - a.totalWeight);

    const qDataObj = {
      lower: allIndivSorted.filter((i: any) => i.grade >= 1 && i.grade <= 3),
      upper: allIndivSorted.filter((i: any) => i.grade >= 4 && i.grade <= 6)
    };

    setPosterModal({
      isOpen: true,
      type: 'quarterly',
      config: overrideConfig,
      data: qDataObj
    });
  };

  const displayedEntries = logSearchQuery 
    ? entries.filter(e => e.name?.toLowerCase().includes(logSearchQuery.toLowerCase()) || e.className?.toLowerCase().includes(logSearchQuery.toLowerCase()) || e.reason?.toLowerCase().includes(logSearchQuery.toLowerCase()))
    : entries;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIndex = Math.min(displayedEntries.length - 1, Math.floor((scrollTop + VISIBLE_HEIGHT) / ROW_HEIGHT) + BUFFER);
  const visibleEntries = displayedEntries.map((entry, index) => ({ entry, globalIndex: index })).slice(startIndex, endIndex + 1);

  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, (displayedEntries.length - 1 - endIndex) * ROW_HEIGHT);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F5] via-[#EFECE4] to-[#E5DFC9] dark:from-[#01040a] dark:via-[#030a16] dark:to-[#010204] text-stone-900 dark:text-[#ebf2ff] flex flex-col font-sans transition-all selection:bg-amber-500/35 relative overflow-hidden">
      {/* Immersive background mystical/celestial radiant glowing particles only visible in dark mode */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-amber-500/5 dark:bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none select-none"></div>
      <div className="absolute bottom-1/4 right-10 w-[600px] h-[600px] bg-cyan-500/5 dark:bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none select-none"></div>
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none select-none"></div>
      {/* 1. Header Toolbar */}
      {viewMode !== 'landing' && (
        <header className="bg-[#FAF9F5]/95 dark:bg-[#050c18]/95 border-b-2 border-amber-500/40 sticky top-0 z-40 shadow-[0_4px_30px_rgba(212,175,55,0.12)] backdrop-blur-md transition-all">
          <div className="max-w-7xl mx-auto px-4.5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Emblem-style badge aligned with Honor of Kings theme */}
              <div className="relative w-11 h-11 bg-gradient-to-b from-[#FFF0A5] via-[#D4AF37] to-[#AA7C11] p-[1.5px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] select-none shrink-0">
                <div className="w-full h-full bg-white dark:bg-[#071329] rounded-[6px] flex items-center justify-center relative overflow-hidden border border-[#D4AF37]/40">
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent"></div>
                  <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] hover:scale-110 transition-transform">👑</span>
                </div>
                {/* Bottom diamond jewel accent */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#D4AF37] rotate-45 border border-[#FFF0A5] shadow-xs"></div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                  <h1 className="text-sm sm:text-base font-black tracking-widest font-space bg-gradient-to-r from-[#D4AF37] via-[#FFF0A5] to-[#AA7C11] dark:from-[#FFE58F] dark:via-[#F3E5AB] dark:to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm uppercase">
                    {t('app_title')}
                  </h1>
                  
                  {/* Gaming Live Latency/Ping Status Style Indicator */}
                  {isOnline && !cloudError ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 select-none shrink-0" title="Koneksi Status">
                      <div className="flex items-end gap-0.5 h-2.5">
                        <div className="w-[2px] h-1 bg-emerald-500 rounded-xs"></div>
                        <div className="w-[2px] h-1.5 bg-emerald-500 rounded-xs"></div>
                        <div className="w-[2px] h-2 bg-emerald-500 rounded-xs animate-pulse"></div>
                      </div>
                      <span className="text-[8px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {t('online_status')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 select-none shrink-0" title="Koneksi Status">
                      <div className="flex items-end gap-0.5 h-2.5 animate-pulse">
                        <div className="w-[2px] h-1 bg-amber-500 rounded-xs"></div>
                        <div className="w-[2px] h-1 bg-stone-400 dark:bg-stone-750 rounded-xs"></div>
                        <div className="w-[2px] h-1 bg-stone-400 dark:bg-stone-750 rounded-xs"></div>
                      </div>
                      <span className="text-[8px] font-mono font-extrabold text-amber-500 tracking-tight">
                        {t('offline_status')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 max-w-full overflow-hidden">
                  <p className="text-[9px] text-[#A85F14] dark:text-[#E8C07D] font-extrabold tracking-[0.15em] uppercase leading-none shrink-0">
                    {t('eco_league')}
                  </p>
                  {(!isOnline || cloudError) && (
                    <span className="text-[8.5px] bg-amber-500 text-stone-950 px-1 py-0.5 rounded font-black animate-pulse leading-none truncate max-w-xs">
                      ⚠️ {t('offline_alert_bar')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Connection logs sync warnings */}
              {unsyncedQueue.length > 0 && (
                <button
                  onClick={() => executeSync()}
                  disabled={loading}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black p-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-400/50 cursor-pointer"
                  title="未同步到云端"
                >
                  <Activity size={13} />
                  <span className="hidden sm:inline">{t('unsynced_btn')}</span> ({unsyncedQueue.length})
                </button>
              )}

              {/* Language switcher button */}
              <button
                onClick={() => setLanguage(language === 'ms' ? 'zh' : 'ms')}
                className="p-2 px-3 bg-white hover:bg-stone-100 dark:bg-[#0a1426] text-stone-750 dark:text-amber-444 dark:hover:bg-[#12223a] border border-stone-200 dark:border-amber-500/20 rounded-xl transition-all active-press font-black text-xs shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
                title={language === 'ms' ? 'Tukar ke Bahasa Cina' : 'Tukar ke Bahasa Melayu'}
              >
                🌐 <span className="font-extrabold">{language === 'ms' ? '中文' : 'Melayu'}</span>
              </button>

              {!isAdmin && (
                <>
                  <button
                    onClick={() => setViewMode('landing')}
                    className="p-2 sm:px-3 text-stone-700 hover:text-amber-600 font-bold text-xs flex items-center gap-1.5 rounded-xl border border-stone-250 bg-white active-press transition-all cursor-pointer shadow-xs"
                  >
                    <Home size={15} /> <span className="hidden sm:inline">{t('nav_home')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      playSound('success');
                    }}
                    className="p-2 sm:px-4 text-amber-800 hover:text-amber-900 font-black text-xs flex items-center gap-1.5 rounded-xl border-2 border-amber-500/40 hover:border-amber-500 bg-amber-50 hover:bg-amber-100 active-press transition-all cursor-pointer shadow-sm"
                    title={language === 'ms' ? 'Log Masuk Pentadbir' : '管理员登录'}
                  >
                    <Lock size={14} className="text-amber-600 fill-amber-500/20" /> <span>{language === 'ms' ? 'Masuk Admin' : '管理员登录'}</span>
                  </button>
                </>
              )}

              {isAdmin && (
                <div className="flex bg-stone-105 dark:bg-[#081223] p-1 rounded-xl gap-0.5 border border-stone-250 dark:border-amber-500/20">
                  <button
                    onClick={() => {
                      setViewMode('admin');
                      playSound('success');
                    }}
                    className={`px-3 py-1.5 font-extrabold text-xs rounded-lg transition-all cursor-pointer ${
                      viewMode === 'admin' 
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-stone-950 font-black shadow-[0_0_10px_rgba(212,175,55,0.4)] border-t border-white/20' 
                        : 'text-stone-400 hover:text-stone-350 hover:bg-stone-50/50 dark:hover:bg-white/5'
                    }`}
                  >
                    {t('nav_record')}
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('dashboard');
                      playSound('success');
                    }}
                    className={`px-3 py-1.5 font-extrabold text-xs rounded-lg transition-all cursor-pointer ${
                      viewMode === 'dashboard' 
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-stone-950 font-black shadow-[0_0_10px_rgba(212,175,55,0.4)] border-t border-white/20' 
                        : 'text-stone-400 hover:text-stone-350 hover:bg-stone-50/50 dark:hover:bg-white/5'
                    }`}
                  >
                    {t('nav_leaderboard')}
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('management');
                      playSound('success');
                    }}
                    className={`px-3 py-1.5 font-extrabold text-xs rounded-lg transition-all cursor-pointer ${
                      viewMode === 'management' 
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-stone-950 font-black shadow-[0_0_10px_rgba(212,175,55,0.4)] border-t border-white/20' 
                        : 'text-stone-400 hover:text-stone-350 hover:bg-stone-50/50 dark:hover:bg-white/5'
                    }`}
                  >
                    {t('nav_control')}
                  </button>
                  <button
                    onClick={handleUserSignOut}
                    className="p-2 text-rose-500 hover:bg-rose-100/10 rounded-lg active-press transition-colors cursor-pointer"
                    title={t('nav_logout')}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Landing Page Action Bar (Language / Theme) */}
      {viewMode === 'landing' && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'ms' ? 'zh' : 'ms')}
            className="p-2 px-3 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl transition-all active-press font-black text-xs shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
            title={language === 'ms' ? 'Tukar ke Bahasa Cina' : 'Tukar ke Bahasa Melayu'}
          >
            🌐 <span className="font-extrabold">{language === 'ms' ? '中文' : 'Melayu'}</span>
          </button>
          
          <button
            onClick={() => {
              setIsLoginModalOpen(true);
              playSound('success');
            }}
            className="p-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-805 border-2 border-amber-500/40 hover:border-amber-500 rounded-xl transition-all active-press font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            title={language === 'ms' ? 'Log Masuk Pentadbir' : '管理员登录'}
          >
            <Lock size={13} className="text-amber-600 fill-amber-500/20" />
            <span>{language === 'ms' ? 'Masuk Admin' : '管理员登录'}</span>
          </button>
        </div>
      )}

      {/* 2. Main Workspace Display panels */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 w-full flex-1">
        {/* Landing/Welcome Screen */}
        {viewMode === 'landing' && (() => {
          // compute live totals for landing display
          const activeEntries = entries.filter(e => e.status !== 'deleted');
          const grandTotal = activeEntries.reduce((acc, e) => {
            if (e.type === 'recycle') return acc + (Number(e.weight) || 0);
            if (e.type === 'deduction') return acc - (Number(e.weight) || 0);
            return acc;
          }, 0);
          const co2Avoided = grandTotal * 2.87;
          const totalSubmissions = activeEntries.length;

          return (
            <div className="max-w-7xl mx-auto pb-12 animate-fade-in text-center flex flex-col gap-8" id="gamified-landing-view">
              {isReminderEnabled && (
                <div className="max-w-4xl mx-auto w-full">
                  <RecycleReminder dateStr={nextRecycleDate} />
                </div>
              )}

              {/* Epic Lobby Header Card inspired by Honor of Kings */}
              <div className="text-center py-8 md:py-12 mb-5 rounded-[2rem] relative overflow-hidden bg-gradient-to-b from-[#11203d] to-[#040c1a] border-2 border-[#D4AF37]/50 shadow-[0_12px_40px_rgba(212,175,55,0.18)] max-w-6xl mx-auto w-full">
                {/* Background magical radiant glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15)_0%,transparent_75%)] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent"></div>
                
                {/* Honor Crest Emblem Container */}
                <div className="relative inline-flex items-center justify-center mb-4 select-none">
                  <div className="absolute inset-0 bg-[#FFD700] blur-2xl opacity-25 rounded-full animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-b from-[#FFF0A5] via-[#D4AF37] to-[#8A640F] p-[2px] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                    <div className="w-full h-full bg-[#030a16] rounded-[10px] flex items-center justify-center border border-[#D4AF37]/40">
                      <span className="text-3xl filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)] transform hover:scale-115 transition-transform cursor-pointer leading-none">👑</span>
                    </div>
                  </div>
                  {/* Surrounding star ornaments */}
                  <div className="absolute -left-5 text-[#FFD700] text-xs animate-pulse">★</div>
                  <div className="absolute -right-5 text-[#FFD700] text-xs animate-pulse animate-duration-1000">★</div>
                </div>

                {/* Shimmering Metallic Title */}
                <h1 className="flex justify-center items-center gap-2 text-2xl md:text-4xl font-black mb-3 tracking-[0.15em] uppercase font-space">
                  <span className="bg-gradient-to-b from-white via-[#FFEAA5] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                    {t('lobby_headline')}
                  </span>
                </h1>
                
                {/* Decorative sub-banner with lines */}
                <div className="inline-flex items-center justify-center gap-3 py-1.5 px-8 bg-gradient-to-r from-transparent via-amber-500/15 to-transparent border-y border-amber-500/25 max-w-xl mx-auto mb-6">
                  <span className="text-amber-500 font-bold tracking-widest text-xs">✦</span>
                  <p className="text-xs font-black text-[#E8C07D] tracking-[0.2em] uppercase font-space">{t('eco_league')}</p>
                  <span className="text-amber-500 font-bold tracking-widest text-xs">✦</span>
                </div>

                {/* 2-Column Grid */}
                <div className="w-full max-w-4xl mx-auto mb-3 text-center">
                  <h3 className="text-lg md:text-xl font-black text-white tracking-widest uppercase flex items-center justify-center gap-2 mb-4">
                    <Award className="text-[#16C784]" /> {language === 'zh' ? '学校荣誉' : 'KEBANGGAAN SEKOLAH'}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full px-4">
                  <div className="neon-card p-4 rounded-2xl flex flex-col items-center justify-center text-center h-full relative overflow-hidden bg-[#071329]/40 border border-amber-500/20 shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none"></div>
                    <div className="bg-white dark:bg-[#071329] p-3 rounded-lg mb-3 shadow-sm border border-slate-150 dark:border-amber-500/20 transition-all"><img src="https://www.imelc.my/images/logos/imelc-landing-header.png" alt="IMELC" className="h-10 object-contain" /></div>
                    <h3 className="gold-gradient-text font-black text-lg mb-1 tracking-wide font-space">Penghargaan IMELC</h3>
                    <p className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-1.5">Finalis Kategori Sekolah Terbaik (2025)</p>
                    <p className="text-[10px] text-stone-300 font-medium">Kategori Sekolah Terbaik Kitar Semula</p>
                    <div className="flex gap-3 mt-2 text-[10px] font-mono font-black"><span className="text-amber-400">🏅 Ke-4 (2025)</span><span className="text-slate-300">🏅 Ke-6 (2024)</span></div>
                  </div>
                  <div className="neon-card p-4 rounded-2xl flex flex-col items-center justify-center text-center h-full relative overflow-hidden bg-[#071329]/40 border border-amber-500/20 shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent pointer-events-none"></div>
                    <div className="bg-white dark:bg-[#071329] p-2 rounded-lg mb-3 shadow-sm border border-slate-150 dark:border-amber-500/20 transition-all"><img src="https://elestari.pendidikankelestarianjohor.edu.my/assets/logo/H.png" alt="JPNJ" className="h-12 object-contain" /></div>
                    <h3 className="text-sky-400 font-black text-lg mb-1 tracking-wide font-space">Sekolah Showcase JPNJ</h3>
                    <p className="text-sm font-bold text-stone-300 bg-[#0c1b35] px-3 py-0.5 rounded-full border border-[#1e3a66]/40 mb-1.5">Pendidikan Kelestarian</p>
                    <p className="text-[10px] font-black text-emerald-400 font-mono tracking-wider">🏅 2024 & 2025</p>
                  </div>
                </div>
              </div>

              {/* Embedding the interactive school-wide elements dashboard directly inside the lobby */}
              {isPublicDashboardOpen && (
                <div className="w-full text-left mt-4 border-t pt-8 border-stone-200/50 dark:border-stone-850" id="public-dashboard-viewport">
                  <div className="mb-4 text-center">
                    <span className="text-[10px] tracking-widest uppercase font-black text-amber-500 dark:text-[#f39c12] bg-[#f39c12]/5 dark:bg-[#f39c12]/10 border border-[#f39c12]/20 px-4 py-1.5 rounded-full select-none">
                      {t('lobby_arena_title')}
                    </span>
                  </div>
                  <DashboardView
                    entries={entries}
                    students={students}
                    isAdmin={isAdmin}
                    onGenerateReport={launchMonthlyPoster}
                    onGenerateQuarterly={launchQuarterlyPoster}
                    onGeneratePoster={() => {}}
                    nextRecycleDate={nextRecycleDate}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Trivia Section Below */}
              <div className="max-w-5xl mx-auto w-full space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DailyEcoChallenge />
                  <DailyEcoTrivia />
                </div>
                
                {/* MOBA Gamified Quiz Block */}
                <MicroTriviaQuiz 
                  students={students} 
                  language={language} 
                  onAwardBonusPoints={handleAwardQuizPoints} 
                />
              </div>
            </div>
          );
        })()}

        {/* Admin entries layout (Single entry, Batch entry, penalty tab) */}
        {viewMode === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="admin-workspace-grid">
            <div className="lg:col-span-7">
              <AdminEntryView
                students={students}
                entries={entries}
                onAddEntry={handleAddWeightEntry}
                loading={loading}
                onShowMessage={showNotification}
                verifyPassword={verifyPasswordForPenalties}
              />
            </div>

            {/* Recents logs and deletion requests (Right) */}
            <div className="lg:col-span-5 flex flex-col bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-850 rounded-3xl p-5.5 h-[620px]">
              <div className="flex justify-between items-center mb-4 select-none">
                <div>
                  <h4 className="font-extrabold text-stone-805 text-stone-800 dark:text-stone-150 text-sm">本次录入实时日志 / Log</h4>
                  <p className="text-[10px] text-stone-400 uppercase font-black tracking-wide mt-0.5">Live database synchronization stream</p>
                </div>
                <button
                  onClick={() => setWipeConfirmModalOpen(true)}
                  className="px-2.5 py-1 text-[10px] font-black border border-rose-250 text-rose-500 hover:bg-rose-50/20 rounded-lg active-press transition-colors"
                >
                  整机重置
                </button>
              </div>

              {/* Log Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-stone-400" />
                  </div>
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="按姓名、班级或原因搜索..."
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Logs display node with windowed virtualization */}
              <div 
                ref={containerRef}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative"
              >
                {displayedEntries.length > 0 ? (
                  <div style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}>
                    {visibleEntries.map(({ entry }) => {
                      const isDeleted = entry.status === 'deleted';
                      const isAuditPending = pendingDeletions.some(p => p.id === entry.id);
                      const isUnsynced = unsyncedQueue.some(q => q.uuid === entry.id || (q.action === 'addEntriesBatch' && Array.isArray(q.data) && q.data.some(d => d.id === entry.id)));

                      let tooltipMsg = '';
                      if (entry.originalClassName || entry.originalName) {
                        tooltipMsg = `已启动云同步纠偏技术。\n登记原始信息为: ${entry.originalClassName || entry.className} - ${entry.originalName || entry.name}`;
                      }

                      return (
                        <div
                          key={entry.id}
                          className={`p-3 rounded-xl border select-none transition-all mb-2 ${
                            isDeleted
                              ? 'opacity-30 line-through scale-[0.98] border-stone-200 dark:border-stone-800 bg-stone-105'
                              : isAuditPending
                              ? 'border-amber-200 bg-amber-50/15 animate-pulse'
                              : entry.type === 'deduction'
                              ? 'border-rose-100 dark:border-rose-950 bg-rose-500/[0.02]'
                              : 'border-stone-150 border-stone-200/50 dark:border-stone-800 dark:bg-stone-950/20'
                          }`}
                          style={{ height: `${ROW_HEIGHT - 8}px` }} // slightly smaller than row height to allow margins
                        >
                          <div className="flex justify-between items-start gap-1 h-full overflow-hidden">
                            <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {entry.type === 'deduction' && (
                                  <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black">
                                    CONSHP
                                  </span>
                                )}
                                {isAuditPending && (
                                  <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black">
                                    AUDIT
                                  </span>
                                )}
                                {isUnsynced ? (
                                  <span className="bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 px-1.5 py-0.5 rounded text-[8px] border border-orange-200 dark:border-orange-900/30 font-black animate-pulse animate-duration-1000">
                                    OFFLINE
                                  </span>
                                ) : (
                                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[8px] border border-emerald-100/50 dark:border-emerald-900/20 font-black">
                                    CLOUD
                                  </span>
                                )}
                                <span
                                  className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-help"
                                  title={tooltipMsg}
                                >
                                  {entry.className}
                                  {(entry.originalClassName || entry.originalName) && <span className="text-red-500 ml-0.5">*</span>}
                                </span>
                                <span className="font-extrabold text-xs text-stone-800 dark:text-stone-200 truncate max-w-[140px] cursor-help" title={tooltipMsg}>
                                  {entry.type === 'deduction' 
                                    ? entry.reason 
                                    : (entry.name 
                                        ? (language === 'zh' 
                                            ? entry.name 
                                            : (entry.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || entry.name)) 
                                        : (language === 'zh' ? '班级贡献' : 'Kelas'))}
                                </span>
                              </div>
                              <div className="flex gap-2 text-[9px] text-stone-400 font-bold">
                                <span>{entry.createdAt}</span>
                                {entry.teacherName && <span className="text-stone-500">• Guru: {entry.teacherName}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-center">
                              <span className={`font-mono font-black text-sm ${entry.type === 'deduction' ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                {entry.weight > 0 ? `+${entry.weight}` : entry.weight}
                              </span>
                              {!isDeleted && !isAuditPending && (
                                <button
                                  onClick={() => handleRequestDeletionLaunch(entry.id)}
                                  className="text-stone-400 hover:text-rose-500 transition-colors"
                                  title="向管理员申批清除该记录 / Padam"
                                >
                                  <Trash size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full py-20 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700 text-xs">
                    <Recycle size={32} /> 暂无今日记录提交 / Tiada Data
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Visitor Dynamic Dashboard display */}
        {viewMode === 'dashboard' && (
          <DashboardView
            entries={entries}
            students={students}
            isAdmin={isAdmin}
            onGenerateReport={launchMonthlyPoster}
            onGenerateQuarterly={launchQuarterlyPoster}
            onGeneratePoster={() => {}}
            nextRecycleDate={nextRecycleDate}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Global Administrative Setup and locked console panel */}
        {viewMode === 'management' && (
          <div className="max-w-4xl mx-auto animate-fade-in" id="management-card-segment">
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6.5 shadow-sm border border-stone-200/60 dark:border-stone-850">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-150 dark:border-stone-850 pb-4 mb-5 gap-3">
                <div className="select-none">
                  <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm sm:text-base">
                    系统高级行政中心 / Console
                  </h3>
                  <p className="text-[10px] text-stone-400 uppercase font-black tracking-wide mt-0.5">
                    Authorized Administrator Center Only
                  </p>
                </div>
                <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl w-full sm:w-auto overflow-x-auto border border-stone-250 border-stone-200/40 dark:border-stone-850 gap-0.5">
                  <button
                    onClick={() => setManageTab('audit')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all ${
                      manageTab === 'audit' ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-sm' : 'text-stone-400'
                    }`}
                  >
                    审核清除 ({pendingDeletions.length})
                  </button>
                  <button
                    onClick={() => setManageTab('students')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all ${
                      manageTab === 'students' ? 'bg-white dark:bg-stone-900 text-blue-600 shadow-sm' : 'text-stone-400'
                    }`}
                  >
                    学籍名册
                  </button>
                  <button
                    onClick={() => setManageTab('backup')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all ${
                      manageTab === 'backup' ? 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 shadow-sm' : 'text-stone-400'
                    }`}
                  >
                    数据防毁
                  </button>
                  <button
                    onClick={() => setManageTab('settings')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all ${
                      manageTab === 'settings' ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-400 shadow-sm' : 'text-stone-400'
                    }`}
                  >
                    系统配置
                  </button>
                </div>
              </div>

              {!isSystemUnlocked ? (
                <div className="py-16 flex flex-col items-center justify-center max-w-sm mx-auto select-none">
                  <div className="w-14 h-14 bg-stone-100 dark:bg-stone-850 text-stone-400 dark:text-stone-600 rounded-full flex items-center justify-center mb-3">
                    <Lock size={26} />
                  </div>
                  <h4 className="font-bold text-stone-800 dark:text-stone-200 text-base mb-1">
                    高级访问锁 / Akses Terhad
                  </h4>
                  <p className="text-[11px] text-stone-400 text-center mb-5">
                    访问注册学生名库或者更变核心倒计时间需要8位系统管理员授权密码验证。
                  </p>
                  <form onSubmit={handleSystemUnlock} className="w-full space-y-4">
                    <SecurePasswordInput
                      value={systemUnlockPass}
                      onChange={setSystemUnlockPass}
                      placeholder="••••••••"
                      theme="rose"
                    />
                    <button
                      type="submit"
                      disabled={loading || systemUnlockPass.length < 8}
                      className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-[#1a211d] text-white font-bold text-xs rounded-xl shadow-md transition-all active-press"
                    >
                      系统验证解锁 / Unlock Panel
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {manageTab === 'audit' && (
                    <div className="space-y-4 animate-fade-in text-left">
                      <h4 className="font-bold text-stone-700 dark:text-stone-350 text-xs flex items-center gap-1.5 border-b border-stone-150 dark:border-stone-850 pb-2 mb-3">
                        <Clock size={16} /> 删除申请核准审计 / Pengesahan Padam
                      </h4>
                      {pendingDeletions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700 text-xs font-semibold gap-2">
                          <Unlock size={24} className="text-emerald-500/40" />
                          暂无申报删除事项 / Tiada permohonan pending
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingDeletions.map(audit => (
                            <div
                              key={audit.id}
                              className="border border-stone-200 dark:border-stone-800 hover:border-amber-400 p-4.5 rounded-2xl bg-white dark:bg-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30">
                                    申报清除
                                  </span>
                                  <span className="text-[9px] text-stone-400 font-bold">{audit.requestTime}</span>
                                </div>
                                <h5 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">
                                  {audit.className} • {audit.name || '全班共同'} (ID: {audit.studentID || '-'})
                                </h5>
                                <div className="text-[11px] text-stone-400 font-bold mt-1.5 flex gap-4 flex-wrap">
                                  <span>⚖️ 重量值: {audit.weight} KG</span>
                                  <span>👤 核定师: {audit.teacherName}</span>
                                  <span>📅 学籍期: {audit.calendarYear} - {audit.month}</span>
                                </div>
                                <div className="p-2 gap-2 border border-stone-150 border-stone-200/50 dark:border-stone-850 bg-stone-50 dark:bg-stone-950 text-[11px] font-bold text-rose-600 dark:text-rose-450 mt-3 rounded-lg flex items-start">
                                  <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                                  <span>清除原因 / Sebab: {audit.reason}</span>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full sm:w-auto shrink-0 select-none">
                                <button
                                  onClick={() => handleRejectEntryErasure(audit.id)}
                                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 bg-white hover:bg-stone-50 hover:text-stone-700"
                                >
                                  不同意 / Tolak
                                </button>
                                <button
                                  onClick={() => handleApproveEntryErasure(audit.id)}
                                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                  准予清除 / Lulus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {manageTab === 'students' && (
                    <StudentListManager
                      students={students}
                      onAddStudentsBatch={handleAddStudentsChunk}
                      onUpdateStudent={handleUpdateStudentDetail}
                      onDeleteStudent={handleDeleteStudentCard}
                      onShowMessage={showNotification}
                      loading={loading}
                    />
                  )}

                  {manageTab === 'backup' && (
                    <div className="space-y-6 animate-fade-in text-left select-none">
                      <div className="bg-stone-50 dark:bg-stone-950/20 border border-stone-205 border-stone-200/60 dark:border-stone-850 p-4 rounded-2xl">
                        <div className="flex justify-between items-center text-xs font-bold text-stone-500 mb-2">
                          <span>本端存储性能健康度: {entries.length} / 1600 条</span>
                          <span className={entries.length > 1200 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}>
                            {entries.length > 1200 ? '缓存过载警告 / Sarankan Backup' : '极其良好 / Sihat'}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${entries.length > 1200 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (entries.length / 1600) * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2.5">
                          由于单页浏览器加载限制，本地缓存超过 1200
                          条记录时可能有负荷延时。随时支持在下方安全下载数据备份，并在上面一键整项重置该页。这不会损坏远端
                          Google 电子数据底表档案。
                        </p>
                      </div>

                      <div className="border border-stone-200 dark:border-stone-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <h5 className="font-extrabold text-sm text-stone-805 text-stone-800 dark:text-stone-200">备份本地总数 / Backup</h5>
                          <p className="text-[10.5px] text-stone-450 text-stone-400">一键安全打包下载整套名册和回收纪录 JSON 文件</p>
                        </div>
                        <button
                          onClick={handleDownloadBackup}
                          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 active-press"
                        >
                          <Download size={14} /> 备份下载
                        </button>
                      </div>

                      <div className="border border-stone-200 dark:border-stone-800 p-4 rounded-2xl">
                        <h5 className="font-extrabold text-sm text-stone-805 text-stone-850 dark:text-stone-200">数据还原 / Restore Backup</h5>
                        <p className="text-[10.5px] text-stone-450 text-stone-400 mb-3.5">
                          危险警示：上传备份文件进行全线恢复。这会一键覆盖本机的对应数据！
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            className="text-xs text-stone-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 font-bold"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-emerald-600 hover:bg-emerald-705 text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold rounded-xl shadow active-press"
                          >
                            <Upload size={14} className="inline mr-1" /> 恢复上传
                          </button>
                          <input
                            type="file"
                            id="restore-inner-invisible-input"
                            accept=".json"
                            onChange={handleImportRestoreFile}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {manageTab === 'settings' && (
                    <div className="space-y-6 animate-fade-in text-left select-none">
                      <div className="border border-stone-200 dark:border-stone-800 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h5 className="font-extrabold text-sm text-stone-805 text-stone-800 dark:text-stone-200">设置下次回收倒计时</h5>
                          <p className="text-xs text-stone-450 text-stone-400 mt-0.5">
                            设置下一个开展校园环保的预定日期，首屏幕中进行倒数时钟。
                          </p>
                        </div>
                        <input
                          type="date"
                          value={nextRecycleDate}
                          onChange={async e => {
                            const dateVal = e.target.value;
                            setNextRecycleDate(dateVal);
                            localStorage.setItem('sjkc_next_recycle_date', dateVal);
                            showNotification("同步中...", "success");
                            await safeSendToSheet('setRecycleDate', { date: dateVal });
                            showNotification("校务回收提醒预告日期全局更新", "success");
                          }}
                          className="p-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl font-bold text-xs outline-none text-stone-700 dark:text-stone-300"
                        />
                      </div>

                      <div className="border border-stone-200 dark:border-stone-800 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h5 className="font-extrabold text-sm text-stone-800 dark:text-stone-200">启用首屏回收倒计时提醒</h5>
                          <p className="text-xs text-stone-400 mt-0.5">
                            开启或关闭首屏显示的环保回收倒计时组件。
                          </p>
                        </div>
                        <div
                          onClick={() => {
                            const val = !isReminderEnabled;
                            setIsReminderEnabled(val);
                            localStorage.setItem('sjkc_reminder_enabled', JSON.stringify(val));
                          }}
                          className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                            isReminderEnabled ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-800'
                          }`}
                        >
                          <div
                            className={`bg-white h-4.5 w-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                              isReminderEnabled ? 'translate-x-5.5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="border border-stone-200 dark:border-stone-800 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h5 className="font-extrabold text-sm text-stone-805 text-stone-800 dark:text-stone-200">公开荣誉排行榜 / Visitor Board</h5>
                          <p className="text-xs text-stone-450 text-stone-400 mt-0.5">开闭时，允许非认证访客在密码主屏进入荣誉排行榜面数据大屏。</p>
                        </div>
                        <div
                          onClick={handleToggleVisitorDashboard}
                          className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                            isPublicDashboardOpen ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-800'
                          }`}
                        >
                          <div
                            className={`bg-white w-4.5 h-4.5 h-4 w-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              isPublicDashboardOpen ? 'translate-x-5.5' : 'translate-x-0'
                            }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="text-center py-8 pb-12 text-stone-400 dark:text-stone-600 text-xs mt-auto border-t border-stone-200/40 dark:border-stone-850 transition-colors select-none no-print">
        <p className="font-bold text-stone-500 dark:text-stone-500">
          © {new Date().getFullYear()} 新廊华小生态永续教育小组
        </p>
        <p className="opacity-75 mt-1">
          Jawatankuasa Pendidikan Kelestarian SJK (C) Ladang Grisek
        </p>
      </footer>

      {/* Wipe Confirmation Modal */}
      {wipeConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-stone-200 dark:border-stone-800">
            <h3 className="text-lg font-black text-rose-600 mb-2">⚠️ 警告：系统整机重置</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-bold mb-4 leading-relaxed">
              您确定要清空本地所有回收和扣分日志缓存吗？这不会删除学生名库。<br/><br/>
              为了防止误操作，请输入关键词 <span className="text-rose-500 font-black">CONFIRM</span> 以确认操作。
            </p>
            <input 
              type="text" 
              value={wipeConfirmInput}
              onChange={(e) => setWipeConfirmInput(e.target.value.toUpperCase())}
              placeholder="输入 CONFIRM"
              className="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 rounded-xl font-bold text-sm outline-none focus:border-rose-500 transition-colors mb-5"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setWipeConfirmModalOpen(false);
                  setWipeConfirmInput('');
                }}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleWipeOutAllLogs}
                disabled={wipeConfirmInput !== 'CONFIRM'}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
                  wipeConfirmInput === 'CONFIRM' 
                    ? 'bg-rose-500 text-white hover:bg-rose-600 cursor-pointer' 
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                }`}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Overlays elements */}
      {notification && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold z-[100] animate-fade-in ${
            notification.type === 'success'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
              : 'bg-gradient-to-r from-rose-600 to-red-700 text-white'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span className="text-xs">{notification.msg}</span>
        </div>
      )}

      {/* Request deletion logs reason popup */}
      {deleteRequestModal.show && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 animate-fade-in select-none">
            <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-sm mb-3">申请清除该笔记录？ / Kemusnahan Log</h3>
            <p className="text-[11px] text-stone-400 mb-4 leading-normal">
              请输入撤销依据，该原因将提交给学校管理老师进行核准校编。
            </p>
            <input
              type="text"
              value={deleteRequestModal.reason}
              onChange={e => setDeleteRequestModal({ ...deleteRequestModal, reason: e.target.value })}
              placeholder="例如: 重量不当 / Mismatch KG"
              className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 outline-none"
            />
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setDeleteRequestModal({ show: false, entryId: null, reason: '' })}
                className="flex-1 py-1.5 bg-stone-100 border border-stone-200 dark:bg-stone-850 dark:border-stone-800 text-stone-500 rounded-lg text-xs font-bold transition-all active-press"
              >
                取消 / Batal
              </button>
              <button
                onClick={confirmRequestDeletionSubmit}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg text-xs font-bold shadow active-press transition-colors"
              >
                提交申请 / Hantar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Administrative Security Login Modal Overlay */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-white dark:bg-[#091526]/95 border-2 border-[#d4af37]/35 dark:border-[#d4af37]/55 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 animate-pulse"></div>
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsLoginModalOpen(false);
                setPasswordInput('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-400 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            <div className="w-14 h-14 bg-amber-50/80 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl shadow-inner border border-amber-200/40 dark:border-amber-950/40 font-bold select-none">
              <Lock size={22} className="animate-pulse" />
            </div>
            
            <h3 className="text-lg font-black text-center text-stone-850 dark:text-amber-300 uppercase tracking-tight font-space">
              {t('login_title')}
            </h3>
            <p className="text-[10px] text-center text-stone-400 dark:text-stone-500 uppercase tracking-widest font-extrabold mt-1 mb-6">
              {t('login_sub')}
            </p>

            <form
              onSubmit={handleAdminVerify} 
              className="space-y-4 text-left"
            >
              <div>
                <label className="text-[9px] font-black text-stone-550 dark:text-amber-400 uppercase tracking-widest ml-1 mb-1.5 block">
                  {t('login_lbl_pw')}
                </label>
                <SecurePasswordInput
                  value={passwordInput}
                  onChange={setPasswordInput}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-3 text-stone-400 dark:text-stone-500 text-xs font-extrabold gap-2">
                  <RefreshCw className="animate-spin text-amber-500" size={16} /> {t('login_loading')}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={passwordInput.length < 4}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-550 hover:to-amber-655 text-white font-black py-3.5 rounded-xl font-bold text-xs shadow-md transition-all active-press flex items-center justify-center gap-2 select-none disabled:opacity-40 cursor-pointer"
                >
                  <Unlock size={14} className="shrink-0 text-white/95" />
                  <span>{t('login_btn_submit')}</span>
                </button>
              )}
            </form>

            <div className="mt-6 text-center select-none text-[10px] text-stone-400 dark:text-stone-550 font-bold leading-normal">
              {t('login_tip')}
            </div>
          </div>
        </div>
      )}

      {/* Heavy rendering pdf creators poster modals */}
      <PosterModal
        isOpen={posterModal.isOpen}
        onClose={() => setPosterModal({ ...posterModal, isOpen: false })}
        type={posterModal.type}
        config={posterModal.config}
        data={posterModal.data}
      />
    </div>
  );
}
