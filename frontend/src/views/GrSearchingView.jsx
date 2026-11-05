import React, { useState, useEffect } from 'react';
import { Search, Download, LogOut, ArrowLeft, Truck, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api.js';

export default function GrSearchingView({ onExit, onSelectGr }) {
  const todayStr = new Date().toISOString().split('T')[0];
  // Default to 15 days ago so user sees live recent records immediately
  const defaultFromDate = new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fromDate: defaultFromDate,
    toDate: todayStr,
    vehicleNo: ''
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [vehicleList, setVehicleList] = useState([]);

  // Fetch available fleet vehicles for quick datalist autocomplete
  useEffect(() => {
    let isMounted = true;
    api.getVehicles()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          const list = res.data.map((v) => v.truck_no).filter(Boolean);
          setVehicleList(list);
        }
      })
      .catch((err) => console.warn('Could not fetch vehicle list for searching:', err));

    // Automatically perform initial search on mount so screen is populated
    performSearch(defaultFromDate, todayStr, '');

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const performSearch = async (from, to, vehicle) => {
    if (!from || !to) {
      setErrorMessage('Please fill mandatory fields: From Date and To Date');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    try {
      const res = await api.searchGR({
        fromDate: from,
        toDate: to,
        vehicleNo: vehicle ? vehicle.trim() : undefined
      });

      if (res && res.success) {
        setResults(res.data || []);
        setReportDate(res.reportDate || new Date().toLocaleString('en-GB'));
        if (!res.data || res.data.length === 0) {
          setErrorMessage('No Record Found for the selected date range & vehicle.');
        }
      } else {
        setResults([]);
        setErrorMessage(res?.error || 'Failed to fetch GR records.');
      }
    } catch (err) {
      console.error('Error in searchGR:', err);
      setResults([]);
      setErrorMessage(err.message || 'Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisplay = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    performSearch(formData.fromDate, formData.toDate, formData.vehicleNo);
  };

  const handleExcelDownload = () => {
    if (results.length === 0) {
      alert('No records available to download. Please click "Display" first.');
      return;
    }

    const exportRows = results.map((r, idx) => ({
      'Sr.': idx + 1,
      'Vehicle No': r.vehicle_no || '',
      'Type': r.vh_type || 'T40',
      'Size': r.vh_size || '40',
      'GR No': r.gr_no || '',
      'GR Date': r.gr_date || '',
      'Cont No.': r.cont_no || '',
      'Cont Size': r.cont_size || '',
      'From Location': r.from_location || '',
      'To Location': r.to_location || '',
      'Handover': r.factory_location || '',
      'Customer': r.customer || '',
      'Trip Close Date': r.close_date || 'Active / In Transit'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GR_Searching');
    XLSX.writeFile(wb, `SPJ_GR_Searching_Report_${formData.fromDate}_to_${formData.toDate}.xlsx`);
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="space-y-2.5 w-full font-sans pb-4">
      {/* 1. Header with Compact Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/90 pb-2 mb-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExit}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            title="Back to GR Generation"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span>Gr Searching</span>
          </h1>
          {results.length > 0 && (
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold border border-blue-200 shadow-2xs">
              {results.length} Records Found
            </span>
          )}
          <span className="hidden lg:inline-block text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
            eLOGiFleet &bull; Goods Receipt Tracking &amp; Vehicle Status
          </span>
        </div>

        <div className="flex items-center gap-2">
          {reportDate && (
            <span className="text-[11px] font-semibold text-slate-500">
              Report Date: <strong className="text-slate-700 font-mono">{reportDate}</strong>
            </span>
          )}
          <button
            type="button"
            onClick={handleExit}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-300 shadow-2xs transition"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* 2. Error / Warning Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* 3. Search Form UI */}
      <form onSubmit={handleDisplay} className="space-y-2.5">
        <div className="p-3 sm:px-3.5 sm:py-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          {/* Fields Grid */}
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
              <div className="relative">
                <input
                  type="text"
                  list="vehicle-search-options"
                  placeholder="e.g. HR55AN2094"
                  value={formData.vehicleNo}
                  onChange={(e) => handleChange('vehicleNo', e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs uppercase font-mono outline-none bg-white border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
                />
                <datalist id="vehicle-search-options">
                  {vehicleList.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
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
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer select-none disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{loading ? 'Searching...' : 'Display'}</span>
              </button>

              <button
                type="button"
                onClick={handleExcelDownload}
                disabled={results.length === 0}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-extrabold text-xs border border-slate-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer select-none disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Excel Download</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 4. Results Table Container (Matching SPJ 2 LogiPark FleetVehicleSearch) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              GR Search Results
            </h2>
          </div>
          {results.length > 0 && (
            <span className="text-[11px] font-bold text-slate-600">
              Showing {results.length} Goods Receipts
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold">Querying database for Goods Receipts...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-black uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">Sr</th>
                  <th className="px-3 py-2">Vehicle No</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">GR No</th>
                  <th className="px-3 py-2">GR Date</th>
                  <th className="px-3 py-2">Cont No.</th>
                  <th className="px-3 py-2">Cont Size</th>
                  <th className="px-3 py-2">From Location</th>
                  <th className="px-3 py-2">To Location</th>
                  <th className="px-3 py-2">Handover</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-center">Trip Close Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {results.map((r, idx) => (
                  <tr
                    key={r.gr_id || idx}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    {/* Sr */}
                    <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Vehicle No */}
                    <td className="px-3 py-2 font-mono font-bold text-blue-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        {r.vehicle_no}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {r.vh_type || 'T40'}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {r.vh_size || '40'}
                    </td>

                    {/* GR No */}
                    <td className="px-3 py-2 font-mono font-black text-slate-900 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60">
                        {r.gr_no}
                      </span>
                    </td>

                    {/* GR Date */}
                    <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">
                      {r.gr_date}
                    </td>

                    {/* Cont No */}
                    <td className="px-3 py-2 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {r.cont_no}
                    </td>

                    {/* Cont Size */}
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {r.cont_size}
                    </td>

                    {/* From Location */}
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                      {r.from_location || '-'}
                    </td>

                    {/* To Location */}
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                      {r.to_location || '-'}
                    </td>

                    {/* Handover Location */}
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                      {r.factory_location || '-'}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-2 text-slate-800 max-w-[200px] truncate" title={r.customer}>
                      {r.customer || 'Fair Exports (India) Pvt Ltd'}
                    </td>

                    {/* Close Date */}
                    <td className="px-3 py-2 text-center whitespace-nowrap font-mono text-[11px]">
                      {r.close_date ? (
                        <span className="text-slate-600 font-semibold">{r.close_date}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Active / In Transit
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Goods Receipt Found</p>
            <p className="text-xs text-slate-400">
              No records matched the selected date range or vehicle number.
            </p>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Ready to Search</p>
            <p className="text-xs text-slate-400">
              Select date range and click <strong className="text-blue-600 font-semibold">Display</strong> to view Goods Receipts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
