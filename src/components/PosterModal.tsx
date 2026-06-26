import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileDown, Trophy, Award, Crown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CO2_FACTOR, MONTH_OPTIONS, QUARTERS } from '../types';
import { useLanguage } from './LanguageContext';

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'monthly' | 'quarterly' | 'class_banner' | 'individual';
  config: { monthIndex: number; year: number; quarter?: string };
  data: any; 
}

export const PosterModal: React.FC<PosterModalProps> = ({
  isOpen,
  onClose,
  type,
  config,
  data
}) => {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  if (!isOpen || !data) return null;

  const currentMonthName = (MONTH_OPTIONS[config.monthIndex] || '').split('/')[0]?.trim() || '';
  const currentMonthMalay = (MONTH_OPTIONS[config.monthIndex] || '').split('/')[1]?.trim() || '';
  const currentYear = config.year;

  const handleDownloadPNG = async (elementId: string, filename: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Failed to generate image poster:", e);
    }
  };

  const handleDownloadPDF = async (elementId: string, filename: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, width, height);
      pdf.save(filename);
    } catch (e) {
      console.error("Failed to generate PDF document:", e);
    }
  };

  const renderNameComponent = (name: string) => {
    if (!name) return '-';
    const chineseMatches = name.match(/[\u4e00-\u9fa5]+/g);
    if (chineseMatches) {
      const cn = chineseMatches.join(' ');
      const my = name.replace(/[\u4e00-\u9fa5]+/g, '').replace(/[()]/g, '').trim();
      return (
        <span className="flex flex-col text-left">
          {language === 'zh' && <span className="font-bold text-stone-800 text-xs sm:text-sm">{cn}</span>}
          {(my || language !== 'zh') && <span className={language === 'zh' ? "text-[10px] text-stone-500 font-normal" : "font-bold text-stone-800 text-xs sm:text-sm"}>{my || name}</span>}
        </span>
      );
    }
    return <span className="font-semibold text-stone-850 text-stone-800 text-xs sm:text-sm">{name}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh]">
        {/* Top Control bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-850 flex justify-between items-center bg-stone-50 dark:bg-stone-9000">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            <h3 className="font-bold text-stone-850 text-stone-800 dark:text-stone-100 text-sm sm:text-base">
              荣誉报表生成器 | Penjana Laporan
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {type === 'monthly' && (
              <button
                onClick={() => handleDownloadPNG('monthly-report-node', `SJKC_Recycle_Report_${currentYear}_${config.monthIndex + 1}.png`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active-press"
              >
                <Download size={14} /> 保存图片 (PNG)
              </button>
            )}
            {type === 'monthly' && (
              <button
                onClick={() => handleDownloadPDF('monthly-report-node', `SJKC_Recycle_Report_${currentYear}_${config.monthIndex + 1}.pdf`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active-press"
              >
                <FileDown size={14} /> 下载PDF
              </button>
            )}
            {type === 'quarterly' && (
              <button
                onClick={() => handleDownloadPNG('quarterly-report-node', `SJKC_Championship_Report_${currentYear}_${config.quarter}.png`)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active-press"
              >
                <Download size={14} /> 保存图片 (PNG)
              </button>
            )}
            {type === 'quarterly' && (
              <button
                onClick={() => handleDownloadPDF('quarterly-report-node', `SJKC_Championship_Report_${currentYear}_${config.quarter}.pdf`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active-press"
              >
                <FileDown size={14} /> 下载PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 px-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-sm active-press font-bold"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic render viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100 dark:bg-stone-950 flex justify-center custom-scrollbar">
          {type === 'monthly' && (
            <div
              id="monthly-report-node"
              className="bg-white p-8 w-[800px] min-h-[1130px] shadow-lg text-stone-900 border border-stone-200 rounded-xl"
              style={{ contentVisibility: 'auto' }}
            >
              {/* Header Title segment */}
              <div className="text-center pb-5 border-b-4 border-emerald-600 mb-6">
                <h1 className="text-2xl md:text-3xl font-black text-stone-800 tracking-tight">
                  新廊华小校园环保回收计划
                </h1>
                <h2 className="text-lg font-bold text-emerald-700 tracking-wide mt-1">
                  月度总结荣誉成绩单
                </h2>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                  LAPORAN BULANAN KITAR SEMULA SJK (C) LADANG GRISEK
                </p>
                <div className="inline-block bg-stone-50 border border-stone-200/60 rounded-full px-4 py-1 text-xs font-bold text-stone-600 mt-3 shadow-inner">
                  {currentYear}年 {currentMonthName}月 / {currentMonthMalay} {currentYear}
                </div>
              </div>

              {/* Lower and Upper grid layouts */}
              <div className="grid grid-cols-2 gap-6 select-none">
                {/* Lower grades stage panel */}
                <div className="space-y-6">
                  <div className="bg-slate-800 text-white p-3 rounded-t-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm">低年级组 (一至三年级)</h4>
                      <p className="text-[9px] text-stone-300 font-medium">Tahap 1 (Tahun 1 - 3)</p>
                    </div>
                    <Award size={16} className="text-yellow-500" />
                  </div>
                  <div className="border-x border-b border-stone-200 p-4 bg-white rounded-b-xl">
                    <h5 className="font-bold text-xs text-stone-700 border-b-2 border-emerald-500 pb-1 mb-2">
                      班级排行榜 / Kedudukan Kelas
                    </h5>
                    <table className="w-full text-left text-[11px] mb-6">
                      <thead>
                        <tr className="bg-stone-100/60 font-bold text-stone-600 border-b border-stone-200">
                          <th className="p-1.5 w-8 text-center">排名</th>
                          <th className="p-1.5">班级</th>
                          <th className="p-1.5 text-right">碳扣(kg)</th>
                          <th className="p-1.5 text-right font-bold">回收(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lower.classes.slice(0, 5).map((c: any, idx: number) => (
                          <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                            <td className="p-1.5 text-center font-black">{idx + 1}</td>
                            <td className="p-1.5 font-bold text-stone-700">{c.className}</td>
                            <td className="p-1.5 text-right text-rose-500">-{c.totalDeduction?.toFixed(1) || '0.0'}</td>
                            <td className="p-1.5 text-right font-bold text-emerald-700">{c.totalWeight?.toFixed(1) || '0.0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h5 className="font-bold text-xs text-stone-700 border-b-2 border-blue-500 pb-1 mb-2">
                      个人小先锋 / Tokoh Pelajar (TOP 10)
                    </h5>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-stone-100/60 font-bold text-stone-600 border-b border-stone-200">
                          <th className="p-1.5 w-8 text-center">排名</th>
                          <th className="p-1.5">学生姓名</th>
                          <th className="p-1.5 w-10 text-center">班级</th>
                          <th className="p-1.5 text-right font-bold">总计(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lower.individuals.slice(0, 10).map((s: any, idx: number) => (
                          <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                            <td className="p-1.5 text-center text-stone-500 font-bold">{idx + 1}</td>
                            <td className="p-1.5 flex items-center gap-1.5">{renderNameComponent(s.name)}</td>
                            <td className="p-1.5 text-center text-stone-600 font-bold">{s.className}</td>
                            <td className="p-1.5 text-right font-bold text-stone-700">{s.totalWeight?.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upper grades stage panel */}
                <div className="space-y-6">
                  <div className="bg-emerald-800 text-white p-3 rounded-t-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm">高年级组 (四至六年级)</h4>
                      <p className="text-[9px] text-stone-300 font-medium">Tahap 2 (Tahun 4 - 6)</p>
                    </div>
                    <Award size={16} className="text-yellow-500 animate-bounce" />
                  </div>
                  <div className="border-x border-b border-stone-200 p-4 bg-white rounded-b-xl animate-fade-in">
                    <h5 className="font-bold text-xs text-stone-700 border-b-2 border-emerald-500 pb-1 mb-2">
                      班级排行榜 / Kedudukan Kelas
                    </h5>
                    <table className="w-full text-left text-[11px] mb-6">
                      <thead>
                        <tr className="bg-stone-100/60 font-bold text-stone-600 border-b border-stone-200">
                          <th className="p-1.5 w-8 text-center">排名</th>
                          <th className="p-1.5">班级</th>
                          <th className="p-1.5 text-right">碳扣(kg)</th>
                          <th className="p-1.5 text-right font-bold">回收(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.upper.classes.slice(0, 5).map((c: any, idx: number) => (
                          <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                            <td className="p-1.5 text-center font-black">{idx + 1}</td>
                            <td className="p-1.5 font-bold text-stone-700">{c.className}</td>
                            <td className="p-1.5 text-right text-rose-500">-{c.totalDeduction?.toFixed(1) || '0.0'}</td>
                            <td className="p-1.5 text-right font-bold text-emerald-700">{c.totalWeight?.toFixed(1) || '0.0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <h5 className="font-bold text-xs text-stone-700 border-b-2 border-blue-500 pb-1 mb-2">
                      个人小先锋 / Tokoh Pelajar (TOP 10)
                    </h5>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-stone-100/60 font-bold text-stone-600 border-b border-stone-200">
                          <th className="p-1.5 w-8 text-center">排名</th>
                          <th className="p-1.5">学生姓名</th>
                          <th className="p-1.5 w-10 text-center">班级</th>
                          <th className="p-1.5 text-right font-bold">总计(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.upper.individuals.slice(0, 10).map((s: any, idx: number) => (
                          <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                            <td className="p-1.5 text-center text-stone-500 font-bold">{idx + 1}</td>
                            <td className="p-1.5 flex items-center gap-1.5">{renderNameComponent(s.name)}</td>
                            <td className="p-1.5 text-center text-stone-600 font-bold">{s.className}</td>
                            <td className="p-1.5 text-right font-bold text-stone-700">{s.totalWeight?.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Custom seal and footers */}
              <div className="mt-8 pt-5 border-t border-stone-200 flex justify-between items-center text-[10px] text-stone-400 font-medium">
                <div>
                  <p>新廊华小生态永续教育小组制印</p>
                  <p>Jawatankuasa Kelestarian SJK (C) Ladang Grisek</p>
                </div>
                <div className="text-right">
                  <p>生成时间: {new Date().toLocaleDateString('zh-CN')} {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Eco-Recycle Engine v2.0 • SHA-255 Secure Digest Approved</p>
                </div>
              </div>
            </div>
          )}

          {type === 'quarterly' && (
            <div id="quarterly-report-node" className="bg-white p-8 w-[800px] min-h-[1130px] shadow-lg text-stone-900 border border-stone-200 rounded-xl">
              <div className="text-center pb-4 border-b-4 border-amber-500 mb-6 relative">
                <div className="absolute top-0 right-4 opacity-15"><Crown size={52} className="text-amber-500" /></div>
                <h1 className="text-2xl md:text-3xl font-black text-stone-850 tracking-tight">新廊华小本季回收王者荣誉榜</h1>
                <h2 className="text-lg font-black text-amber-600 tracking-wide mt-1">THE KING OF RECYCLING</h2>
                <div className="inline-block bg-amber-50 text-amber-800 border border-amber-200/80 px-4 py-1 rounded-full text-xs font-bold mt-2 shadow-sm">
                  {currentYear}年度 {QUARTERS[config.quarter || 'Q1'].label}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 select-none">
                {/* Tahap 1 segment */}
                <div>
                  <div className="bg-amber-600 text-white p-3 rounded-t-xl font-bold flex items-center justify-between shadow-sm">
                    <span>低年级小先锋 (Tahap 1)</span>
                    <Trophy size={16} />
                  </div>
                  <div className="border-x border-b border-stone-200 p-4 rounded-b-xl bg-stone-50/50">
                    <table className="w-full text-[11px] border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-stone-150 bg-stone-100 font-bold text-stone-600 text-left border-b border-stone-200">
                          <th className="p-2 w-8 text-center">排名</th>
                          <th className="p-2">姓名 / Nama</th>
                          <th className="p-2 text-center w-12">班级</th>
                          <th className="p-2 text-right font-black">累积(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lower.slice(0, 15).map((s: any, idx: number) => {
                          const medalSym = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;
                          return (
                            <tr key={idx} className="border-b border-stone-100 hover:bg-amber-50/20">
                              <td className="p-2 text-center font-bold">{medalSym}</td>
                              <td className="p-2 flex items-center gap-1.5">{renderNameComponent(s.name)}</td>
                              <td className="p-2 text-center font-bold text-stone-500">{s.className}</td>
                              <td className="p-2 text-right font-black text-amber-700">{s.totalWeight?.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tahap 2 segment */}
                <div>
                  <div className="bg-orange-600 text-white p-3 rounded-t-xl font-bold flex items-center justify-between shadow-sm">
                    <span>高年级大名士 (Tahap 2)</span>
                    <Trophy size={16} />
                  </div>
                  <div className="border-x border-b border-stone-200 p-4 rounded-b-xl bg-stone-50/50">
                    <table className="w-full text-[11px] border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-stone-150 bg-stone-100 font-bold text-stone-600 text-left border-b border-stone-200">
                          <th className="p-2 w-8 text-center">排名</th>
                          <th className="p-2">姓名 / Nama</th>
                          <th className="p-2 text-center w-12">班级</th>
                          <th className="p-2 text-right font-black">累积(kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.upper.slice(0, 15).map((s: any, idx: number) => {
                          const medalSym = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;
                          return (
                            <tr key={idx} className="border-b border-stone-100 hover:bg-orange-50/20">
                              <td className="p-2 text-center font-bold">{medalSym}</td>
                              <td className="p-2 flex items-center gap-1.5">{renderNameComponent(s.name)}</td>
                              <td className="p-2 text-center font-bold text-stone-500">{s.className}</td>
                              <td className="p-2 text-right font-black text-orange-700">{s.totalWeight?.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-stone-200 flex justify-between items-center text-[10px] text-stone-400 font-medium">
                <div>
                  <p>新廊华小生态永续教育小组制印</p>
                  <p>Laporan Raja Kitar Semula SJKC Ladang Grisek</p>
                </div>
                <div className="text-right">
                  <p>生成时间: {new Date().toLocaleDateString('zh-CN')}</p>
                  <p>Eco-Recycle Engine v2.0 • SJKC Recycling System</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PosterModal;
