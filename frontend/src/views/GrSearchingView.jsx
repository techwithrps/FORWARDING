import React, { useState } from 'react';
import { Search, Download, LogOut } from 'lucide-react';

export default function GrSearchingView({ onExit }) {
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    vehicleNo: ''
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDisplay = (e) => {
    e.preventDefault();
    if (!formData.fromDate || !formData.toDate) {
      return;
    }
    // Form action for Display
  };

  const handleExcelDownload = () => {
    if (!formData.fromDate || !formData.toDate) {
      alert('Please fill mandatory fields: From Date and To Date');
      return;
    }
    // Form action for Excel download
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="space-y-2.5 w-full font-sans pb-1">
      {/* 1. Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/90 pb-2 mb-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span>Gr Searching</span>
          </h1>
        </div>
      </div>

      {/* 2. Form UI */}
      <form onSubmit={handleDisplay} className="space-y-2.5">
        <div className="p-3 sm:px-3.5 sm:py-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* From Date */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                From Date <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.fromDate}
                onChange={(e) => handleChange('fromDate', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none bg-white border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                To Date <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.toDate}
                onChange={(e) => handleChange('toDate', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none bg-white border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
              />
            </div>

            {/* Vehicle No */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Vehicle No
              </label>
              <input
                type="text"
                placeholder="e.g. HR55AN2094"
                value={formData.vehicleNo}
                onChange={(e) => handleChange('vehicleNo', e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs uppercase font-mono outline-none bg-white border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
              />
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-medium">
              * Mandatory fields marked with red asterisk are required
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer select-none"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Display</span>
              </button>

              <button
                type="button"
                onClick={handleExcelDownload}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-extrabold text-xs border border-slate-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer select-none"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Excel Download</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
