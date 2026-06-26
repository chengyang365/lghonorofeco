import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, User, Info, Plus, Minus, X, Trash2, Check, RefreshCw, Lock, Unlock, AlertTriangle, ShieldCheck, Trophy, Flame, ChevronRight, Play } from 'lucide-react';
import { CLASS_OPTIONS, MONTH_OPTIONS, YEAR_OPTIONS, getGamificationBadge, getTreeEvolution } from '../types';
import { SecurePasswordInput } from './SecurePasswordInput';
import { playSound, getLocalDateString, generateTimestampStr } from '../utils';
import { useLanguage } from './LanguageContext';

interface AdminEntryViewProps {
  students: any[];
  entries: any[];
  onAddEntry: (entry: any) => Promise<any>;
  loading: boolean;
  onShowMessage: (msg: string, type: 'success' | 'error') => void;
  verifyPassword: (password: string) => Promise<boolean>;
}

export const AdminEntryView: React.FC<AdminEntryViewProps> = ({
  students,
  entries,
  onAddEntry,
  loading,
  onShowMessage,
  verifyPassword
}) => {
  const { language } = useLanguage();
  const [entryTab, setEntryTab] = useState<'recycle' | 'penalty'>('recycle');
  const [entryMode, setEntryMode] = useState<'single' | 'batch'>('single');

  // Single recycle inputs
  const [singleDate, setSingleDate] = useState(getLocalDateString());
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('sjkc_teacher_name') || '');
  const [selectedClass, setSelectedClass] = useState('');
  const [studentID, setStudentID] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentFound, setStudentFound] = useState(false);
  const [weightRows, setWeightRows] = useState<string[]>(['']);
  const studentIdRef = useRef<HTMLInputElement>(null);

  // Batch recycle inputs
  const [batchClass, setBatchClass] = useState(() => localStorage.getItem('sjkc_batch_class_draft') || '');
  const [batchInputs, setBatchInputs] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('sjkc_batch_draft') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Carbon penalty inputs
  const [penaltyTeacher, setPenaltyTeacher] = useState(() => localStorage.getItem('sjkc_teacher_name') || '');
  const [penaltyYear, setPenaltyYear] = useState(new Date().getFullYear());
  const [penaltyMonthIdx, setPenaltyMonthIdx] = useState(new Date().getMonth());
  const [penaltyClass, setPenaltyClass] = useState('');
  const [penaltyUnlocked, setPenaltyUnlocked] = useState(false);
  const [penaltyInputPass, setPenaltyInputPass] = useState('');
  const [penaltyInputs, setPenaltyInputs] = useState<Record<string, string>>({
    'Food Waste': '',
    'Electricity': '',
    'Others': ''
  });
  const [isVerifyingPenalty, setIsVerifyingPenalty] = useState(false);

  // 1. Calculate student session info for single entry gamification card
  const studentGamifyInfo = useMemo(() => {
    let matchedStudent = null;
    if (studentID) {
      matchedStudent = students.find(s => s.id === studentID);
    } else if (studentName && selectedClass) {
      matchedStudent = students.find(s => s.name === studentName && s.className === selectedClass);
    }

    if (!matchedStudent) return null;

    const sId = matchedStudent.id;
    const sName = matchedStudent.name;
    const sClass = matchedStudent.className;

    // Filter student's existing recycle entries
    const historicRecycleWeight = entries
      .filter(e => {
        if (e.status === 'deleted') return false;
        if (e.type !== 'recycle') return false;
        if (sId && e.studentID === sId) return true;
        return (!e.studentID && e.name === sName && e.className === sClass);
      })
      .reduce((sum, e) => sum + (Number(e.weight) || 0), 0);

    const currentEntered = weightRows.reduce((sum, r) => sum + (parseFloat(r) || 0), 0);
    const projectedWeight = historicRecycleWeight + currentEntered;

    const currentBadge = getGamificationBadge(historicRecycleWeight);
    const projectedBadge = getGamificationBadge(projectedWeight);

    const currentTree = getTreeEvolution(historicRecycleWeight);
    const projectedTree = getTreeEvolution(projectedWeight);

    const isLevelUp = currentBadge !== projectedBadge;
    const isTreeEvolving = currentTree.label !== projectedTree.label;

    return {
      studentName: sName,
      className: sClass,
      historicRecycleWeight,
      currentEntered,
      projectedWeight,
      currentBadge,
      projectedBadge,
      currentTree,
      projectedTree,
      isLevelUp,
      isTreeEvolving
    };
  }, [students, entries, studentID, studentName, selectedClass, weightRows]);

  // Persist drafts
  useEffect(() => {
    localStorage.setItem('sjkc_teacher_name', teacherName);
  }, [teacherName]);

  useEffect(() => {
    localStorage.setItem('sjkc_batch_class_draft', batchClass);
  }, [batchClass]);

  useEffect(() => {
    localStorage.setItem('sjkc_batch_draft', JSON.stringify(batchInputs));
  }, [batchInputs]);

  // Handle single ID change
  const handleIDChange = (idVal: string) => {
    const cleanID = idVal.trim();
    setStudentID(cleanID);
    const match = students.find(s => s.id === cleanID);
    if (match) {
      setStudentFound(true);
      setStudentName(match.name);
      setSelectedClass(match.className);
    } else {
      setStudentFound(false);
      setStudentName('');
    }
  };

  // Handle single Name change
  const handleNameChange = (nameVal: string) => {
    setStudentName(nameVal);
    const cleanNameVal = nameVal.toLowerCase().trim();
    const match = students.find(s => {
      const sNameZh = s.name.toLowerCase().trim();
      const sNameMs = s.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim().toLowerCase();
      return sNameZh === cleanNameVal || sNameMs === cleanNameVal;
    });
    if (match) {
      setStudentFound(true);
      setStudentID(match.id);
      setSelectedClass(match.className);
    } else {
      setStudentFound(false);
    }
  };

  const clearIDAndName = () => {
    setStudentID('');
    setStudentName('');
    setStudentFound(false);
    if (studentIdRef.current) studentIdRef.current.focus();
  };

  const handleResetForm = () => {
    clearIDAndName();
    setSelectedClass('');
    setWeightRows(['']);
  };

  // Weight row inputs
  const handleWeightRowChange = (index: number, val: string) => {
    let raw = val.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    if (/^(\d+(\.\d{0,2})?)?$/.test(raw) || raw === '') {
      const copy = [...weightRows];
      copy[index] = raw;
      setWeightRows(copy);
    }
  };

  const currentTotalWeight = weightRows.reduce((a, b) => a + (parseFloat(b) || 0), 0);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      playSound('error');
      return onShowMessage("请输入录入老师姓名！/ Sila isi nama guru.", "error");
    }
    if (!selectedClass) {
      playSound('error');
      return onShowMessage("请选择核实班级！/ Sila pilih kelas.", "error");
    }
    if (currentTotalWeight <= 0) {
      playSound('error');
      return onShowMessage("回收重量必须大于零！/ Berat mesti > 0kg.", "error");
    }

    const dateObj = new Date(singleDate);
    const finalGrade = selectedClass ? parseInt(selectedClass.charAt(0)) || 0 : 0;
    const dispTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const createdAtStr = generateTimestampStr(singleDate);

    const payload = {
      id: crypto.randomUUID(),
      type: 'recycle',
      teacherName: teacherName.trim(),
      name: studentName.trim() || '班级贡献',
      studentID: studentID.trim() || '',
      className: selectedClass,
      weight: parseFloat(currentTotalWeight.toFixed(2)),
      month: MONTH_OPTIONS[dateObj.getMonth()],
      calendarYear: dateObj.getFullYear(),
      year: finalGrade,
      createdAt: createdAtStr,
      displayTime: dispTime
    };

    onAddEntry(payload);
    handleResetForm();
  };

  // Batch class submissions
  const handleBatchClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cls = e.target.value;
    if (Object.keys(batchInputs).length > 0) {
      if (!confirm("是否切换班级？未提交的数值草稿将会被清空。\nAdakah anda mahu beralih kelas? Draf berat akan dikosongkan.")) return;
    }
    setBatchClass(cls);
    setBatchInputs({});
  };

  const handleBatchWeightChange = (studentId: string, val: string) => {
    let clean = val.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
    setBatchInputs(prev => ({ ...prev, [studentId]: clean }));
  };

  const handleBatchSubmit = async () => {
    if (!teacherName.trim()) {
      playSound('error');
      return onShowMessage("请在上方输入录入老师姓名！/ Sila isi nama guru.", "error");
    }
    if (!batchClass) return onShowMessage("没有选定班级。 / Tiada kelas dipilih.", "error");

    const activeEntries: any[] = [];
    const dateObj = new Date(singleDate);
    const finalGrade = batchClass ? parseInt(batchClass.charAt(0)) || 0 : 0;
    const dispTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const createdAtStr = generateTimestampStr(singleDate);

    Object.keys(batchInputs).forEach(studId => {
      const weightVal = parseFloat(batchInputs[studId]);
      if (weightVal > 0) {
        const student = students.find(s => s.id === studId);
        activeEntries.push({
          id: crypto.randomUUID(),
          type: 'recycle',
          teacherName: teacherName.trim(),
          name: student ? student.name : 'Unknown',
          studentID: studId,
          className: batchClass,
          weight: parseFloat(weightVal.toFixed(2)),
          month: MONTH_OPTIONS[dateObj.getMonth()],
          calendarYear: dateObj.getFullYear(),
          year: finalGrade,
          createdAt: createdAtStr,
          displayTime: dispTime
        });
      }
    });

    if (activeEntries.length === 0) {
      playSound('error');
      return onShowMessage("没有输入任何有效的重量值！/ Tiada nilai dimasukkan.", "error");
    }

    for (const ent of activeEntries) {
      await onAddEntry(ent);
    }

    setBatchInputs({});
    onShowMessage(`成功提交 ${activeEntries.length} 人的回收数据！`, "success");
  };

  // Penalty unlocks
  const handlePenaltyUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (penaltyInputPass.length < 8) return;
    setIsVerifyingPenalty(true);
    const pass = await verifyPassword(penaltyInputPass);
    setIsVerifyingPenalty(false);
    if (pass) {
      setPenaltyUnlocked(true);
      setPenaltyInputPass('');
      playSound('success');
      onShowMessage("扣减权限已解锁", "success");
    } else {
      playSound('error');
      onShowMessage("安全验证密码不正确 / Password salah", "error");
    }
  };

  const handlePenaltySubmit = async () => {
    const hasActiveValues = Object.values(penaltyInputs).some(v => parseFloat(v as string) > 0);
    if (!hasActiveValues) return onShowMessage("请输入至少一个扣分项目！", "error");
    if (!penaltyTeacher.trim()) return onShowMessage("请先填写老师姓名！", "error");
    if (!penaltyClass) return onShowMessage("请输入需要扣减的班级！", "error");

    const finalGrade = penaltyClass ? parseInt(penaltyClass.charAt(0)) || 0 : 0;
    const dispTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const createdAtStr = generateTimestampStr();

    const createdLogs: any[] = [];
    Object.entries(penaltyInputs).forEach(([reason, value]) => {
      const numericVal = parseFloat(value as string);
      if (numericVal > 0) {
        createdLogs.push({
          id: crypto.randomUUID(),
          type: 'deduction',
          teacherName: penaltyTeacher.trim(),
          name: '',
          studentID: '',
          className: penaltyClass,
          reason,
          weight: -Math.abs(numericVal),
          month: MONTH_OPTIONS[penaltyMonthIdx],
          calendarYear: penaltyYear,
          year: finalGrade,
          createdAt: createdAtStr,
          displayTime: dispTime
        });
      }
    });

    for (const item of createdLogs) {
      await onAddEntry(item);
    }

    setPenaltyInputs({ 'Food Waste': '', 'Electricity': '', 'Others': '' });
    onShowMessage("校园消耗扣分指标记录成功", "success");
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200/60 dark:border-stone-850 p-6.5 select-none" id="entry-form-panel">
      {/* Tab Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-100 dark:border-stone-850 pb-4 mb-5 gap-3">
        <div>
          <h3 className="font-extrabold text-stone-800 dark:text-stone-100 text-base md:text-lg">
            {entryTab === 'recycle' ? '回收活动录入' : '碳足迹消极扣分'}
          </h3>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 font-bold mt-0.5">
            LOG GRADING AND OUTCOMES ENTRY
          </p>
        </div>
        <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl w-full sm:w-auto gap-0.5 border border-stone-200/40 dark:border-stone-850">
          <button
            onClick={() => setEntryTab('recycle')}
            className={`flex-1 sm:flex-none px-4 py-2 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              entryTab === 'recycle'
                ? 'bg-white dark:bg-stone-900 text-emerald-805 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            回收贡献
          </button>
          <button
            onClick={() => setEntryTab('penalty')}
            className={`flex-1 sm:flex-none px-4 py-2 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              entryTab === 'penalty'
                ? 'bg-white dark:bg-stone-900 text-rose-600 dark:text-rose-450 shadow-sm'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            足迹加扣
          </button>
        </div>
      </div>

      {entryTab === 'recycle' && (
        <div className="space-y-4">
          {/* Sub entry togglers */}
          <div className="flex justify-end select-none">
            <div className="flex bg-stone-50 dark:bg-stone-950 px-1 py-1 rounded-xl gap-0.5 border border-stone-200/40 dark:border-stone-850">
              <button
                onClick={() => setEntryMode('single')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  entryMode === 'single' ? 'bg-white dark:bg-stone-900 text-emerald-600 shadow-sm font-black' : 'text-stone-400'
                }`}
              >
                单人输入 / Individu
              </button>
              <button
                onClick={() => setEntryMode('batch')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  entryMode === 'batch' ? 'bg-white dark:bg-stone-900 text-emerald-600 shadow-sm font-black' : 'text-stone-400'
                }`}
              >
                整班批量 / Pukal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                <Calendar size={14} /> 日期选择 / Tarikh Sesi
              </label>
              <input
                type="date"
                value={singleDate}
                max={getLocalDateString()}
                onChange={e => setSingleDate(e.target.value)}
                className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-300 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                <User size={14} /> 经手老师姓名 / Nama Guru
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                placeholder="Guru Penyelaras"
                className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-300 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {entryMode === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 flex items-center gap-2">
                    学号输入 / ID
                    {studentFound && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100/55 flex items-center gap-1 font-black">
                        <ShieldCheck size={11} /> 关联匹配成功
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      ref={studentIdRef}
                      value={studentID}
                      onChange={e => handleIDChange(e.target.value)}
                      placeholder="26001 (非必填)"
                      className={`w-full p-2.5 bg-stone-50 dark:bg-stone-950 border rounded-xl font-bold text-sm outline-none transition-all ${
                        studentFound
                          ? 'border-emerald-500 ring-2 ring-emerald-50/50 dark:ring-emerald-950/50 text-emerald-700'
                          : 'border-stone-200 dark:border-stone-800 text-stone-700'
                      }`}
                    />
                    {studentID && (
                      <button
                        type="button"
                        onClick={clearIDAndName}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500">{language === 'zh' ? '姓名匹配 / Pelajar' : 'Cari Nama Pelajar'}</label>
                  <input
                    type="text"
                    value={studentName}
                    list="student-single-selector-suggestions"
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder={language === 'zh' ? "阿里 / (不写默认全班共同组)" : "Ali / (Kosong = Kelas)"}
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-300 outline-none"
                    autoComplete="off"
                  />
                  <datalist id="student-single-selector-suggestions">
                    {students
                      .filter(s => !selectedClass || s.className === selectedClass)
                      .map(s => {
                        const displayName = language === 'zh' ? s.name : (s.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || s.name);
                        return (
                          <option key={s.id} value={displayName}>
                            {s.id} • {s.className}
                          </option>
                        );
                      })}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-500">
                  班级所属 / Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  disabled={studentFound}
                  className={`w-full p-2.5 border rounded-xl font-bold text-sm outline-none ${
                    studentFound
                      ? 'bg-emerald-55/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 border-emerald-500/20 cursor-not-allowed'
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-850 text-stone-700 dark:text-stone-350 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  required
                >
                  <option value="">- 请选择班级 -</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Gamification & Level Up Preview Card */}
              {studentGamifyInfo && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-stone-900 dark:to-[#0c1a2e] border border-amber-200/50 dark:border-amber-900/30 rounded-2xl shadow-sm space-y-3.5 animate-fade-in text-left">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider flex items-center gap-1">
                      <Trophy size={14} className="text-amber-500 animate-pulse shrink-0" />
                      当前组员环保段位实况 & 实时成长树 / PENGALAMAN LESTARI
                    </span>
                    {studentGamifyInfo.isLevelUp && (
                      <span className="bg-amber-500 text-stone-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                        ⭐ 即将进阶 Rank Up!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Rank Badge Column */}
                    <div className="bg-white/80 dark:bg-stone-950/40 p-3 rounded-xl border border-stone-150/40 dark:border-stone-850 flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-stone-400">登峰排位荣誉 / Pangkat Lencana</span>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-extrabold text-stone-700 dark:text-stone-300">
                          {studentGamifyInfo.currentBadge}
                        </span>
                        {studentGamifyInfo.isLevelUp && (
                          <>
                            <ChevronRight size={12} className="text-amber-500" />
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                              {studentGamifyInfo.projectedBadge}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tree Evolution Level Column */}
                    <div className="bg-white/80 dark:bg-stone-950/40 p-3 rounded-xl border border-stone-150/40 dark:border-stone-850 flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-stone-400">生命成长树 / Tahap Pokok</span>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-extrabold text-stone-700 dark:text-stone-300">
                          {studentGamifyInfo.currentTree.icon} {studentGamifyInfo.currentTree.label}
                        </span>
                        {studentGamifyInfo.isTreeEvolving && (
                          <>
                            <ChevronRight size={12} className="text-emerald-500" />
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded animate-bounce">
                              {studentGamifyInfo.projectedTree.label}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weight Progression Slider Track */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-stone-500">
                      <span>已累计回收: {studentGamifyInfo.historicRecycleWeight.toFixed(2)} KG</span>
                      {studentGamifyInfo.currentEntered > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-black animate-pulse">
                          预计加成: +{studentGamifyInfo.currentEntered.toFixed(2)} KG
                        </span>
                      )}
                      <span>项目总累计: {studentGamifyInfo.projectedWeight.toFixed(2)} KG</span>
                    </div>

                    {/* Progress feedback bar */}
                    <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-850 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-stone-450 dark:bg-stone-750 transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min(100, (studentGamifyInfo.historicRecycleWeight / 150) * 100)}%`
                        }}
                      ></div>
                      {studentGamifyInfo.currentEntered > 0 && (
                        <div
                          className="absolute h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 animate-pulse"
                          style={{
                            left: `${Math.min(100, (studentGamifyInfo.historicRecycleWeight / 150) * 100)}%`,
                            width: `${Math.min(100 - (studentGamifyInfo.historicRecycleWeight / 150) * 100, (studentGamifyInfo.currentEntered / 150) * 100)}%`
                          }}
                        ></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple weight fields additions */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-500">
                  重量值 / Berat (KG) <span className="text-rose-500">*</span>
                </label>
                {weightRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        inputMode="decimal"
                        value={row}
                        onChange={e => handleWeightRowChange(index, e.target.value)}
                        placeholder="0.00"
                        className="w-full p-3 pl-12 pr-10 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/35 text-emerald-800 dark:text-emerald-400 rounded-xl font-mono text-xl font-black text-right outline-none"
                        required={index === 0}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-500">
                        KG
                      </span>
                      {row && (
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...weightRows];
                            copy[index] = '';
                            setWeightRows(copy);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {index === weightRows.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setWeightRows([...weightRows, ''])}
                        className="p-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-all font-bold active-press h-[50px] w-[50px] flex items-center justify-center"
                      >
                        <Plus size={20} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setWeightRows(weightRows.filter((_, i) => i !== index))}
                        className="p-3.5 bg-stone-100 hover:bg-stone-200 text-stone-500 dark:text-stone-400 dark:bg-stone-850 rounded-xl transition-all font-bold active-press h-[50px] w-[50px] flex items-center justify-center"
                      >
                        <Minus size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center text-[11px] font-bold text-emerald-600 mt-1">
                  <span className="text-stone-400 font-normal">多重累加法（适合多个袋子）</span>
                  <span>总计 / Jumlah: {currentTotalWeight.toFixed(2)} KG</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 select-none">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 p-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active-press"
                >
                  确认提交录入 / Hantar
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-12 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-500 rounded-xl flex items-center justify-center active-press"
                  title="重置 / Reset"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4.5 select-none animate-fade-in">
              <div className="flex items-center gap-2">
                <select
                  value={batchClass}
                  onChange={handleBatchClassChange}
                  className="flex-1 p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-350 outline-none"
                >
                  <option value="">- 请选择管理班级 / Pilih Kelas -</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {Object.keys(batchInputs).length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("是否清空本班级暂存的所有重量草稿？")) {
                        setBatchInputs({});
                      }
                    }}
                    className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {batchClass && (
                <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar relative">
                  <table className="w-full text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-950 sticky top-0 z-10 shadow-sm border-b border-stone-200 dark:border-stone-800">
                      <tr className="text-stone-500 text-left font-bold select-none">
                        <th className="p-3">姓名 / Nama</th>
                        <th className="p-3 w-32 text-center">输入重量 (KG)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students
                        .filter(s => s.className === batchClass)
                        .map(s => (
                          <tr key={s.id} className="border-b border-stone-100 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-950/20">
                            <td className="p-3">
                              {language === 'zh' ? (
                                <span className="font-bold text-stone-700 dark:text-stone-300">{s.name}</span>
                              ) : (
                                <span className="font-bold text-stone-700 dark:text-stone-300">
                                  {s.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || s.name}
                                </span>
                              )}
                              <span className="text-[10px] text-stone-400 block mt-0.5">{s.id}</span>
                            </td>
                            <td className="p-2">
                              <input
                                type="tel"
                                inputMode="decimal"
                                value={batchInputs[s.id] || ''}
                                onChange={e => handleBatchWeightChange(s.id, e.target.value)}
                                className="w-full p-2 border border-stone-200 dark:border-stone-800 rounded-lg text-center font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/25 outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ))}
                      {students.filter(s => s.className === batchClass).length === 0 && (
                        <tr>
                          <td colSpan={2} className="p-8 text-center text-stone-400 dark:text-stone-600 font-semibold">
                            该班级下没有在册学生名单，请转到学生面板导入名单。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {batchClass && students.filter(s => s.className === batchClass).length > 0 && (
                <button
                  onClick={handleBatchSubmit}
                  disabled={loading}
                  className="w-full p-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active-press"
                >
                  批量保存本班名单重量 (Hantar Pukal)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {entryTab === 'penalty' && (
        <div className="relative min-h-[350px]">
          {!penaltyUnlocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm rounded-3xl animate-fade-in select-none">
              <div className="bg-white dark:bg-stone-950 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-rose-100 dark:border-rose-950 flex flex-col items-center">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mb-3">
                  <Lock size={26} />
                </div>
                <h4 className="font-bold text-stone-800 dark:text-stone-200 text-base mb-1">
                  该栏目受保护 / Area Terkunci
                </h4>
                <p className="text-[11px] text-stone-400 text-center mb-5 leading-normal">
                  该操作会扣除非环保产生的负碳足迹分。输入系统8位数安全授权密码解锁。
                </p>
                <form onSubmit={handlePenaltyUnlock} className="w-full space-y-3">
                  <SecurePasswordInput
                    value={penaltyInputPass}
                    onChange={setPenaltyInputPass}
                    placeholder="••••••••"
                    theme="rose"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingPenalty || penaltyInputPass.length < 8}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex justify-center items-center gap-1.5 transition-all select-none disabled:bg-stone-400"
                  >
                    解锁授权 / Unlock Pin
                  </button>
                </form>
              </div>
            </div>
          )}

          <div
            className={`space-y-4 ${
              !penaltyUnlocked ? 'opacity-25 pointer-events-none select-none blur-[1px]' : ''
            }`}
          >
            <div className="p-3 bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950 rounded-xl text-[10.5px] text-rose-700 dark:text-rose-400 flex items-start gap-1.5 select-none leading-relaxed">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>
                注意：碳消耗抵扣（例如未落实熄灯、产生多余厨余）属于扣分项目。扣分将抵消班级累加所得的低碳积分。重量以
                <b>负数</b> 记录。/ Sisa pembaziran akan direkod negatif.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-500">
                核定记录老师 / Disahkan Oleh
              </label>
              <input
                type="text"
                value={penaltyTeacher}
                onChange={e => setPenaltyTeacher(e.target.value)}
                placeholder="Disahkan oleh guru"
                className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-300 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-stone-450 block mb-1">年度 / Tahun</label>
                <select
                  value={penaltyYear}
                  onChange={e => setPenaltyYear(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-xs text-stone-700 dark:text-stone-300 outline-none"
                >
                  {YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-450 block mb-1">扣分学月 / Bulan</label>
                <select
                  value={penaltyMonthIdx}
                  onChange={e => setPenaltyMonthIdx(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-xs text-stone-700 dark:text-stone-300 outline-none"
                >
                  {MONTH_OPTIONS.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m.split('/')[1].trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-450 block mb-1">扣减班级 / Kelas</label>
                <select
                  value={penaltyClass}
                  onChange={e => setPenaltyClass(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-xs text-stone-700 dark:text-stone-350 outline-none"
                >
                  <option value="">- 选择 -</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-950/20 border border-stone-200/50 dark:border-stone-850 p-4 rounded-2xl space-y-3 shadow-inner">
              <span className="text-[10px] font-extrabold text-stone-400 dark:text-stone-600 block uppercase tracking-wide">
                项目名额数值输入 / Nilai Pembaziran (KG)
              </span>
              <div className="space-y-2">
                {[
                  { key: 'Food Waste', zh: '厨余垃圾', ms: 'Pembaziran Makanan' },
                  { key: 'Electricity', zh: '浪费电源', ms: 'Pembaziran Elektrik' },
                  { key: 'Others', zh: '其他不当垃圾投放', ms: 'Lain-lain' }
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 p-2 rounded-xl">
                    <span className="flex-1 text-xs font-bold text-stone-750 text-stone-700 dark:text-stone-300">
                      {language === 'zh' ? item.zh : item.ms}
                    </span>
                    <div className="w-28 relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={penaltyInputs[item.key]}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPenaltyInputs(p => ({ ...p, [item.key]: val }));
                        }}
                        className="w-full p-1.5 pr-8 bg-rose-500/[0.04] text-rose-600 dark:text-rose-400 border border-rose-200 rounded-lg font-mono font-bold text-right outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-rose-455 font-bold text-rose-500">
                        KG
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handlePenaltySubmit}
              disabled={loading}
              className="w-full p-3.5 bg-rose-600 hover:bg-rose-705 bg-rose-604 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active-press"
            >
              一键确认并扣分 / Hantar Penalti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminEntryView;
