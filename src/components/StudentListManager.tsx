import React, { useState, useRef, useMemo } from 'react';
import { UserPlus, FileUp, Search, Trash2, Edit2, X, Trash, RefreshCw } from 'lucide-react';
import { CLASS_OPTIONS } from '../types';
import { useLanguage } from './LanguageContext';

interface StudentListManagerProps {
  students: any[];
  onAddStudentsBatch: (studentsList: any[]) => Promise<any>;
  onUpdateStudent: (student: any) => Promise<any>;
  onDeleteStudent: (id: string) => Promise<any>;
  onShowMessage: (msg: string, type: 'success' | 'error') => void;
  loading: boolean;
}

export const StudentListManager: React.FC<StudentListManagerProps> = ({
  students,
  onAddStudentsBatch,
  onUpdateStudent,
  onDeleteStudent,
  onShowMessage,
  loading
}) => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [singleStudent, setSingleStudent] = useState({ id: '', name: '', className: '' });
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  // Manual import text
  const [importText, setImportText] = useState('');
  const [importClass, setImportClass] = useState('');
  const smartImportRef = useRef<HTMLInputElement>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    });
  }, [students, searchTerm]);

  // Handle single student addition
  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudent.id.trim() || !singleStudent.name.trim() || !singleStudent.className) {
      return onShowMessage("请填写完整的学生信息 / Sila isi maklumat.", "error");
    }
    if (students.some(s => s.id === singleStudent.id.trim())) {
      return onShowMessage("该学号已经登记存在！/ ID sudah wujud.", "error");
    }

    const newObj = {
      id: singleStudent.id.trim(),
      name: singleStudent.name.trim(),
      className: singleStudent.className,
      createdAt: Date.now()
    };

    await onAddStudentsBatch([newObj]);
    setSingleStudent({ id: '', name: '', className: '' });
    onShowMessage(`已成功登记学生: ${newObj.name}`, "success");
  };

  // Multiple selection actions
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const toggleSelectOne = (id: string) => {
    const nextSet = new Set(selectedStudentIds);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    setSelectedStudentIds(nextSet);
  };

  // Bulk deleted selection
  const handleBatchDelete = async () => {
    if (selectedStudentIds.size === 0) return;
    if (!confirm(`确定清除选定的 ${selectedStudentIds.size} 名学生数据？这不会清理已有的回收记录。\nPadam ${selectedStudentIds.size} orang murid?`)) return;

    const idsArr = Array.from(selectedStudentIds);
    for (const deleteId of idsArr) {
      await onDeleteStudent(deleteId);
    }

    setSelectedStudentIds(new Set());
    onShowMessage("已批量清除指定学员名单 / Murid telah dipadam.", "success");
  };

  // Drag and drop CSV parser
  const handleSmartImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const listToImport: any[] = [];
        const timestamp = Date.now();

        lines.forEach((line, index) => {
          if (index === 0 || !line.trim()) return; // skip header
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            // CSV: ClassName, ID, Name
            listToImport.push({
              className: parts[0],
              id: parts[1],
              name: parts[2],
              createdAt: timestamp + index
            });
          }
        });

        if (listToImport.length > 0) {
          await onAddStudentsBatch(listToImport);
          onShowMessage(`通过智能CSV文件一键成功登记 ${listToImport.length} 个人员。`, "success");
        } else {
          onShowMessage("CSV解析为空。请核对第一行是表头，第二行起格式类似: 1A, 26001, 阿里", "error");
        }
      } catch (err) {
        onShowMessage("文件解析遇到技术异常。/ Gagal mengimport.", "error");
      }
      if (smartImportRef.current) smartImportRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Manual raw text import
  const handleImportText = async () => {
    if (!importClass) return onShowMessage("请先选定目标登记班级 / Sila pilih kelas.", "error");
    if (!importText.trim()) return onShowMessage("请输入需要登记学生的信息文本！/ Sila isi senarai.", "error");

    const lines = importText.split('\n');
    const listToImport: any[] = [];
    const timestamp = Date.now();

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 2) {
        // Text: ID, Name
        listToImport.push({
          id: parts[0].trim(),
          name: parts[1].trim(),
          className: importClass,
          createdAt: timestamp + index
        });
      }
    });

    if (listToImport.length === 0) {
      return onShowMessage("匹配的格式不正确。正确行样式: 学号, 名字", "error");
    }

    await onAddStudentsBatch(listToImport);
    setImportText('');
    onShowMessage(`成功导入本班级新登记成员 ${listToImport.length} 名。`, "success");
  };

  // Edit single pupil inline
  const handleUpdateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    await onUpdateStudent(editingStudent);
    setEditingStudent(null);
    onShowMessage("学生卡片详细属性已更新", "success");
  };

  return (
    <div className="space-y-6 select-none animate-fade-in" id="student-manager-workspace">
      {/* Smart CSV Drag import block */}
      <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/5 border border-emerald-100/60 dark:border-emerald-900/40 rounded-2xl">
        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2">
          <FileUp size={16} />
          校际名单智能外部导入 / Import CSV
        </h4>
        <p className="text-[10.5px] text-stone-500 dark:text-stone-400 mt-1 mb-3.5 leading-normal">
          直接上传学校名册 CSV 文件。系统将自动批量归集整理班级名册。（格式表头: 班级,学号,姓名 | Kelas,ID,Nama）
        </p>
        <input
          type="file"
          accept=".csv"
          ref={smartImportRef}
          onChange={handleSmartImport}
          className="w-full text-xs text-stone-400 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border file:border-emerald-100 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white file:cursor-pointer hover:file:bg-emerald-700 hover:file:border-emerald-250 cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none">
        {/* Adds manual pupil card block */}
        <div className="bg-stone-50/50 dark:bg-stone-900/30 border border-stone-200/50 dark:border-stone-850 p-5 rounded-2xl">
          <h4 className="font-bold text-stone-700 dark:text-stone-300 text-sm flex items-center gap-2 mb-3">
            <UserPlus size={16} />
            手动登记单名学生 / Registrasi Individu
          </h4>
          <form onSubmit={handleAddSingleStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-stone-405 font-bold mb-1 block text-stone-400">学号 / ID</label>
                <input
                  type="text"
                  value={singleStudent.id}
                  onChange={e => setSingleStudent({ ...singleStudent, id: e.target.value })}
                  placeholder="ID: 26023"
                  className="w-full p-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-405 font-bold mb-1 block text-stone-400">姓名 / Nama</label>
                <input
                  type="text"
                  value={singleStudent.name}
                  onChange={e => setSingleStudent({ ...singleStudent, name: e.target.value })}
                  placeholder="ALI"
                  className="w-full p-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg font-bold"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-stone-450 font-bold mb-1 block text-stone-400">核属班级 / Kelas</label>
              <select
                value={singleStudent.className}
                onChange={e => setSingleStudent({ ...singleStudent, className: e.target.value })}
                className="w-full p-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg font-bold"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm active-press transition-colors"
            >
              一键添加保存 / Tambah
            </button>
          </form>
        </div>

        {/* Text paste parse panel */}
        <div className="bg-stone-50/50 dark:bg-stone-900/30 border border-stone-200/50 dark:border-stone-850 p-5 rounded-2xl">
          <h4 className="font-bold text-stone-700 dark:text-stone-300 text-sm flex items-center gap-2 mb-2">
            <RefreshCw size={15} />
            班级大块文本输入批量登记 / Copas
          </h4>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mb-2.5">
            1. 选择下面目标<b>班级</b> 2. 从 Excel 复制学号与姓名 3. 直接粘贴 (多行样式: 学号, 名字)
          </p>
          <div className="space-y-2">
            <select
              value={importClass}
              onChange={e => setImportClass(e.target.value)}
              className="w-full p-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg font-bold"
            >
              <option value="">- 选班归集 -</option>
              {CLASS_OPTIONS.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={2}
              placeholder={`26001, Ali\n26002, Bob`}
              className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg font-mono text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
            ></textarea>
            <button
              onClick={handleImportText}
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm active-press transition-colors"
            >
              分析文本块并导入 / Masuk
            </button>
          </div>
        </div>
      </div>

      {/* Interactive student search datatable board */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 输入任何学号、姓名、或班级进行即时档案检索 (Cari Pelajar)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-stone-700 dark:text-stone-300 shadow-inner"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            <Search size={16} />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm max-h-[350px] overflow-y-auto custom-scrollbar relative">
          <table className="w-full text-left text-xs text-stone-700 dark:text-stone-350">
            <thead className="bg-stone-50 dark:bg-stone-950 sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800">
              <tr className="text-stone-500 font-bold select-none">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">学号 ID</th>
                <th className="p-3">姓名 / Nama</th>
                <th className="p-3">学籍班级 / Kelas</th>
                <th className="p-3 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} className="border-b border-stone-100 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-950/20">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.has(student.id)}
                      onChange={() => toggleSelectOne(student.id)}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 font-mono font-bold text-stone-500">{student.id}</td>
                  <td className="p-3 font-extrabold text-stone-800 dark:text-stone-200">
                    {language === 'zh' ? student.name : (student.name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim() || student.name)}
                  </td>
                  <td className="p-3">
                    <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      {student.className}
                    </span>
                  </td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="p-1 px-1.5 bg-stone-150 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded text-stone-500 dark:text-stone-400 active-press"
                      title="编辑"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确定要从登记注册库里清空该学生 [${student.name}] 的信息吗？`)) {
                          onDeleteStudent(student.id);
                        }
                      }}
                      className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 rounded text-rose-500 active-press"
                      title="删除"
                    >
                      <Trash size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-405 text-stone-400 font-semibold">
                    档案无关联查询学员！
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-[11px] font-bold text-stone-400 pt-1 select-none">
          <span>列表人数: {filteredStudents.length} 名 • 选定 {selectedStudentIds.size} 人</span>
          <span>录入总计库: {students.length} 人</span>
        </div>

        {selectedStudentIds.size > 0 && (
          <button
            onClick={handleBatchDelete}
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 shadow-md active-press animate-fade-in"
          >
            <Trash2 size={15} /> 批量清除所选学生名单 ({selectedStudentIds.size} 名)
          </button>
        )}
      </div>

      {/* Inline quick editing modal popup */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 animate-fade-in">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 text-base mb-4 flex items-center gap-2">
              <Edit2 size={16} /> 编辑学生属性详情
            </h3>
            <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-stone-400 font-bold block mb-1">学籍号 ID (无法变动)</label>
                <input
                  type="text"
                  value={editingStudent.id}
                  disabled
                  className="w-full p-2.5 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-500 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-450 font-bold block mb-1 text-stone-400">登载姓名 / Nama</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-350 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-450 font-bold block mb-1 text-stone-400">班籍归属 / Kelas</label>
                <select
                  value={editingStudent.className}
                  onChange={e => setEditingStudent({ ...editingStudent, className: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-350 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-1.5 bg-stone-100 border border-stone-200 dark:bg-stone-850 dark:border-stone-800 text-stone-500 hover:text-stone-700 rounded-lg text-xs font-bold transition-all"
                >
                  取消 / Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-705 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-xs font-bold shadow-md transition-all"
                >
                  保存数据 / Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentListManager;
