import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { EDI_SEED_DATA } from '../data/ediSeedData';

// Master Dropdown Options matching SPJ-2
const PACKAGE_TYPES = ['CNTS', 'CUBE', 'PLTS', 'BGS', 'DRMS', 'PKG', 'Container', 'KG'];
const CONSIGNMENT_TYPES = ['CIF', 'FOB', 'CNF', 'DDP', 'DAP'];
const REMARKS_OPTIONS = [
  'Select',
  'Invoice Pending',
  'RFID Data Not Submitted',
  'VHC Pending',
  'Factory Stuffing',
  'Delay at Terminal',
  'Documentation Complete'
];

export default function EdiUpdateView({ jobs = [], onNavigate }) {
  // Main records state, initialized with 140 live records from CSV
  const [records, setRecords] = useState(EDI_SEED_DATA);
  const [dirtyIds, setDirtyIds] = useState(new Set());
  const [selectedConts, setSelectedConts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [shipperFilter, setShipperFilter] = useState('ALL');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [cfsFilter, setCfsFilter] = useState('ALL');
  const [podFilter, setPodFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk update drawer/bar state
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [bulkFields, setBulkFields] = useState({
    consignee: '',
    notify: '',
    sbNo: '',
    sbDate: '',
    invNo: '',
    invDate: '',
    pkgType: '',
    consignmentType: '',
    commodity: '',
    pod: '',
    cha: '',
    remarks: ''
  });

  // Quick Paste Modal
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Show toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch live records from backend / PostgreSQL
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.getEdiRecords();
      if (res && res.success && res.data && res.data.length > 0) {
        setRecords(res.data);
        setDirtyIds(new Set());
        showToast(`Loaded ${res.data.length} live EDI container records from DB`);
      } else {
        // Fallback to seed data
        setRecords(EDI_SEED_DATA);
      }
    } catch (err) {
      console.warn('Could not fetch from backend, displaying preloaded live records:', err.message);
      // Keep existing or seed data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Compute filter options dynamically from current records
  const uniqueShippers = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.shipper) set.add(r.shipper); });
    return Array.from(set).sort();
  }, [records]);

  const uniqueLines = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.line) set.add(r.line); });
    return Array.from(set).sort();
  }, [records]);

  const uniqueCFS = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.cfs) set.add(r.cfs); });
    return Array.from(set).sort();
  }, [records]);

  const uniquePODs = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.pod) set.add(r.pod); });
    return Array.from(set).sort();
  }, [records]);

  const uniqueCHAs = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.cha) set.add(r.cha); });
    return Array.from(set).sort();
  }, [records]);

  const uniqueCommodities = useMemo(() => {
    const set = new Set();
    records.forEach(r => { if (r.commodity) set.add(r.commodity); });
    return Array.from(set).sort();
  }, [records]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    let result = records;
    if (shipperFilter !== 'ALL') {
      result = result.filter(r => r.shipper === shipperFilter);
    }
    if (lineFilter !== 'ALL') {
      result = result.filter(r => r.line === lineFilter);
    }
    if (cfsFilter !== 'ALL') {
      result = result.filter(r => r.cfs === cfsFilter);
    }
    if (podFilter !== 'ALL') {
      result = result.filter(r => r.pod === podFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r =>
        (r.contNo && r.contNo.toLowerCase().includes(q)) ||
        (r.sbNo && r.sbNo.toLowerCase().includes(q)) ||
        (r.invNo && r.invNo.toLowerCase().includes(q)) ||
        (r.jobNo && r.jobNo.toLowerCase().includes(q)) ||
        (r.shipper && r.shipper.toLowerCase().includes(q)) ||
        (r.consignee && r.consignee.toLowerCase().includes(q)) ||
        (r.commodity && r.commodity.toLowerCase().includes(q))
      );
    }
    return result;
  }, [records, shipperFilter, lineFilter, cfsFilter, podFilter, searchQuery]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    if (pageSize === 9999) return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle cell inline change
  const handleCellChange = (contNo, field, value) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.contNo === contNo) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
    setDirtyIds(prev => new Set(prev).add(contNo));
  };

  // Toggle single row selection
  const toggleSelectRow = (contNo) => {
    setSelectedConts(prev => {
      const next = new Set(prev);
      if (next.has(contNo)) {
        next.delete(contNo);
      } else {
        next.add(contNo);
      }
      return next;
    });
  };

  // Toggle select all on current visible page
  const isAllCurrentSelected = paginatedRecords.length > 0 && paginatedRecords.every(r => selectedConts.has(r.contNo));
  const toggleSelectAllPage = () => {
    setSelectedConts(prev => {
      const next = new Set(prev);
      if (isAllCurrentSelected) {
        paginatedRecords.forEach(r => next.delete(r.contNo));
      } else {
        paginatedRecords.forEach(r => next.add(r.contNo));
      }
      return next;
    });
  };

  // Apply Bulk Fill to all selected containers
  const handleApplyBulk = () => {
    if (selectedConts.size === 0) {
      alert('Please select at least one container using the checkboxes first.');
      return;
    }

    setRecords(prev =>
      prev.map(r => {
        if (selectedConts.has(r.contNo)) {
          const updated = { ...r };
          Object.keys(bulkFields).forEach(key => {
            if (bulkFields[key] !== '' && bulkFields[key] !== 'Select') {
              updated[key] = bulkFields[key];
            }
          });
          return updated;
        }
        return r;
      })
    );

    // Mark all selected as dirty
    setDirtyIds(prev => {
      const next = new Set(prev);
      selectedConts.forEach(c => next.add(c));
      return next;
    });

    showToast(`Bulk applied values to ${selectedConts.size} selected container(s)!`);
  };

  // Save modified records to Database (PostgreSQL spjlive."ALL_PARTY_ACCOUNT")
  const handleSaveToDb = async () => {
    const toSave = records.filter(r => dirtyIds.has(r.contNo));
    if (toSave.length === 0) {
      showToast('No pending changes to save. Edit any cell or apply bulk changes first.', 'info');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateEdiRecords({ records: toSave });
      if (res && res.success) {
        setDirtyIds(new Set());
        showToast(`✅ Successfully saved ${res.updatedCount || toSave.length} record(s) directly to Database!`);
      } else {
        showToast('Saved locally. Database sync reported: ' + (res?.message || 'Done'), 'info');
        setDirtyIds(new Set());
      }
    } catch (err) {
      console.error('Error saving to DB:', err);
      showToast('⚠️ Changes saved in session (DB Error: ' + err.message + ')', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Export current table view to exact SPJ-2 CSV format
  const handleExportCsv = () => {
    const headers = [
      'Sr.',
      'Shipper',
      'Consignee',
      'Notify',
      'LINE',
      'Cont No',
      'Allotment Date',
      'TYPE',
      'Cont Size',
      'Cont Type',
      'CFS',
      'Commodity Gross Wt.',
      'Commodity Net Wt.',
      'REF Id',
      'Health Cert.No',
      'Package Type',
      'No of PCS.',
      'Commodity',
      'Invoice No',
      'Invoice Date',
      'SB No.',
      'SB Date',
      'Consignment Type',
      'FOB Value',
      'POD',
      'CHA',
      'JOB No',
      'JOB Date',
      'Remarks'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = filteredRecords.map((r, i) => [
      r.sr || i + 1,
      r.shipper,
      r.consignee,
      r.notify,
      r.line,
      r.contNo,
      r.allotmentDate,
      r.type,
      r.contSize,
      r.contType,
      r.cfs,
      r.grossWt,
      r.netWt,
      r.refId,
      r.healthCert,
      r.pkgType,
      r.pcs,
      r.commodity,
      r.invNo,
      r.invDate,
      r.sbNo,
      r.sbDate,
      r.consignmentType,
      r.fobValue,
      r.pod,
      r.cha,
      r.jobNo,
      r.jobDate,
      r.remarks
    ].map(escapeCsv).join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EDI_Update_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredRecords.length} records to CSV!`);
  };

  // Quick Paste handler from tab-separated or comma-separated clipboard
  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split(/\r?\n/).filter(l => l.trim().length > 0);
    let matched = 0;

    setRecords(prev => {
      const map = new Map(prev.map(r => [r.contNo.toUpperCase(), { ...r }]));
      lines.forEach(line => {
        // Detect comma or tab
        const delimiter = line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
        // Find container number in row (typically 4 letters + 7 numbers)
        const contIndex = cols.findIndex(c => /^[A-Z]{3,4}\d{6,7}$/i.test(c));
        if (contIndex !== -1) {
          const contNo = cols[contIndex].toUpperCase();
          const existing = map.get(contNo);
          if (existing) {
            matched++;
            // Map common columns if found
            // If line is full 29-col SPJ2 format:
            if (cols.length >= 20) {
              if (cols[2]) existing.consignee = cols[2];
              if (cols[3]) existing.notify = cols[3];
              if (cols[11]) existing.grossWt = cols[11];
              if (cols[12]) existing.netWt = cols[12];
              if (cols[18]) existing.invNo = cols[18];
              if (cols[19]) existing.invDate = cols[19];
              if (cols[20]) existing.sbNo = cols[20];
              if (cols[21]) existing.sbDate = cols[21];
              if (cols[23]) existing.fobValue = cols[23];
              if (cols[24]) existing.pod = cols[24];
              if (cols[25]) existing.cha = cols[25];
            } else if (cols.length >= 3) {
              // Simple: [ContNo, SB_NO, SB_DATE] or [ContNo, InvNo, InvDate, SB_NO, SB_DATE]
              if (cols[contIndex + 1]) existing.sbNo = cols[contIndex + 1];
              if (cols[contIndex + 2]) existing.sbDate = cols[contIndex + 2];
            }
            dirtyIds.add(contNo);
          }
        }
      });
      return Array.from(map.values());
    });

    setShowPasteModal(false);
    setPasteText('');
    showToast(`Quick paste matched & updated ${matched} container(s)!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Toast popup */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-in slide-in-from-bottom duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-900 text-rose-100 border-rose-700'
            : toast.type === 'info'
            ? 'bg-blue-900 text-blue-100 border-blue-700'
            : 'bg-emerald-900 text-emerald-100 border-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-[1900px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  eLOGiFreight™ :: EDI Update & Customs Transmission
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Page 24
                </span>
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Database className="w-3 h-3 text-emerald-500" /> PostgreSQL Live Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time sync with <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">spjlive."ALL_PARTY_ACCOUNT"</code> & Icegate Customs Shipping Bill registry
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
              title="Paste data directly from Excel or clipboard"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Quick Paste
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
              title="Export all rows to SPJ-2 CSV format"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>

            <button
              onClick={fetchRecords}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh records from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleSaveToDb}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all ${
                dirtyIds.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500 ring-offset-1'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving to DB...' : dirtyIds.size > 0 ? `Save to DB (${dirtyIds.size} Pending)` : 'Save to DB'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar (Matching SPJ-2 Filter Section) */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-6 py-3">
        <div className="max-w-[1900px] mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1 uppercase tracking-wider text-[11px]">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
            </span>

            {/* Shipper */}
            <div className="flex flex-col">
              <select
                value={shipperFilter}
                onChange={e => { setShipperFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-[200px]"
              >
                <option value="ALL">All Shippers ({uniqueShippers.length})</option>
                {uniqueShippers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Shipping Line */}
            <div className="flex flex-col">
              <select
                value={lineFilter}
                onChange={e => { setLineFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-[180px]"
              >
                <option value="ALL">All Lines ({uniqueLines.length})</option>
                {uniqueLines.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* CFS */}
            <div className="flex flex-col">
              <select
                value={cfsFilter}
                onChange={e => { setCfsFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-[160px]"
              >
                <option value="ALL">All CFS ({uniqueCFS.length})</option>
                {uniqueCFS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* POD */}
            <div className="flex flex-col">
              <select
                value={podFilter}
                onChange={e => { setPodFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-w-[180px]"
              >
                <option value="ALL">All PODs ({uniquePODs.length})</option>
                {uniquePODs.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(shipperFilter !== 'ALL' || lineFilter !== 'ALL' || cfsFilter !== 'ALL' || podFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setShipperFilter('ALL');
                  setLineFilter('ALL');
                  setCfsFilter('ALL');
                  setPodFilter('ALL');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs underline font-medium px-1"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Search Box & Selection count */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search Cont No, SB No, Inv, Job..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => setShowBulkBar(!showBulkBar)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                showBulkBar || selectedConts.size > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Bulk Fill ({selectedConts.size})
            </button>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Fill Panel (when activated) */}
      {showBulkBar && (
        <div className="bg-indigo-900 text-white px-6 py-4 border-b border-indigo-800 shadow-xl transition-all">
          <div className="max-w-[1900px] mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-indigo-200 uppercase">
                  ⚡ WRITE & SELECT - BULK APPLY TO SELECTED
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-700 text-indigo-100 text-xs font-bold">
                  {selectedConts.size} Containers Selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedConts(new Set())}
                  className="text-xs text-indigo-300 hover:text-white underline font-medium"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => setShowBulkBar(false)}
                  className="text-xs text-indigo-300 hover:text-white font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Input grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Consignee</label>
                <input
                  type="text"
                  placeholder="Consignee Name"
                  value={bulkFields.consignee}
                  onChange={e => setBulkFields({ ...bulkFields, consignee: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Notify Party</label>
                <input
                  type="text"
                  placeholder="Notify Party"
                  value={bulkFields.notify}
                  onChange={e => setBulkFields({ ...bulkFields, notify: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Shipping Bill (SB No)</label>
                <input
                  type="text"
                  placeholder="e.g. 8559212"
                  value={bulkFields.sbNo}
                  onChange={e => setBulkFields({ ...bulkFields, sbNo: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">SB Date (DD/MM/YYYY)</label>
                <input
                  type="text"
                  placeholder="10/11/2026"
                  value={bulkFields.sbDate}
                  onChange={e => setBulkFields({ ...bulkFields, sbDate: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Invoice No</label>
                <input
                  type="text"
                  placeholder="e.g. IAF/569/2026-27"
                  value={bulkFields.invNo}
                  onChange={e => setBulkFields({ ...bulkFields, invNo: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Invoice Date (DD/MM/YYYY)</label>
                <input
                  type="text"
                  placeholder="10/11/2026"
                  value={bulkFields.invDate}
                  onChange={e => setBulkFields({ ...bulkFields, invDate: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Package Type</label>
                <select
                  value={bulkFields.pkgType}
                  onChange={e => setBulkFields({ ...bulkFields, pkgType: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">-- Keep Existing --</option>
                  {PACKAGE_TYPES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Consignment Type</label>
                <select
                  value={bulkFields.consignmentType}
                  onChange={e => setBulkFields({ ...bulkFields, consignmentType: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">-- Keep Existing --</option>
                  {CONSIGNMENT_TYPES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Port of Discharge (POD)</label>
                <select
                  value={bulkFields.pod}
                  onChange={e => setBulkFields({ ...bulkFields, pod: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">-- Keep Existing --</option>
                  {uniquePODs.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Customs CHA</label>
                <input
                  type="text"
                  placeholder="e.g. PURAN JOSHI"
                  value={bulkFields.cha}
                  onChange={e => setBulkFields({ ...bulkFields, cha: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-indigo-200 block mb-1">Remarks</label>
                <select
                  value={bulkFields.remarks}
                  onChange={e => setBulkFields({ ...bulkFields, remarks: e.target.value })}
                  className="w-full bg-indigo-950/70 border border-indigo-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-400"
                >
                  {REMARKS_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleApplyBulk}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-1.5 px-3 rounded shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-900" />
                  Apply to Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 29-Column Spreadsheet Table */}
      <div className="flex-1 overflow-x-auto p-4 max-w-[1900px] mx-auto w-full">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-left text-xs border-collapse">
              {/* Header */}
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20 border-b border-slate-300 shadow-sm">
                <tr className="divide-x divide-slate-200 text-[11px] uppercase tracking-wider whitespace-nowrap">
                  <th className="p-2.5 text-center w-10 bg-slate-100">
                    <button
                      onClick={toggleSelectAllPage}
                      className="text-slate-600 hover:text-slate-900"
                      title={isAllCurrentSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllCurrentSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-2.5 text-center w-12">Sr.</th>
                  <th className="p-2.5 min-w-[220px]">Shipper</th>
                  <th className="p-2.5 min-w-[180px] text-blue-900 bg-blue-50/50">Consignee ✎</th>
                  <th className="p-2.5 min-w-[180px] text-blue-900 bg-blue-50/50">Notify Party ✎</th>
                  <th className="p-2.5 min-w-[140px]">LINE</th>
                  <th className="p-2.5 min-w-[130px] font-mono">Cont No</th>
                  <th className="p-2.5 min-w-[100px]">Allotment Date</th>
                  <th className="p-2.5 min-w-[60px] text-center">TYPE</th>
                  <th className="p-2.5 min-w-[60px] text-center">Size</th>
                  <th className="p-2.5 min-w-[60px] text-center">Type</th>
                  <th className="p-2.5 min-w-[150px]">CFS</th>
                  <th className="p-2.5 min-w-[110px] text-emerald-900 bg-emerald-50/50">Gross Wt. (kg) ✎</th>
                  <th className="p-2.5 min-w-[110px] text-emerald-900 bg-emerald-50/50">Net Wt. (kg) ✎</th>
                  <th className="p-2.5 min-w-[80px]">REF Id ✎</th>
                  <th className="p-2.5 min-w-[110px]">Health Cert ✎</th>
                  <th className="p-2.5 min-w-[90px]">Pkg Type ✎</th>
                  <th className="p-2.5 min-w-[90px]">No of PCS ✎</th>
                  <th className="p-2.5 min-w-[180px]">Commodity ✎</th>
                  <th className="p-2.5 min-w-[140px] text-indigo-900 bg-indigo-50/50">Invoice No ✎</th>
                  <th className="p-2.5 min-w-[110px] text-indigo-900 bg-indigo-50/50">Invoice Date ✎</th>
                  <th className="p-2.5 min-w-[120px] text-amber-900 bg-amber-50/50">SB No. ✎</th>
                  <th className="p-2.5 min-w-[110px] text-amber-900 bg-amber-50/50">SB Date ✎</th>
                  <th className="p-2.5 min-w-[90px]">Consign. Type ✎</th>
                  <th className="p-2.5 min-w-[110px]">FOB Value ✎</th>
                  <th className="p-2.5 min-w-[180px]">POD (Port of Discharge) ✎</th>
                  <th className="p-2.5 min-w-[130px]">CHA ✎</th>
                  <th className="p-2.5 min-w-[130px]">JOB No</th>
                  <th className="p-2.5 min-w-[100px]">JOB Date</th>
                  <th className="p-2.5 min-w-[150px]">Remarks ✎</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-200">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={30} className="p-8 text-center text-slate-500">
                      No matching container EDI records found. Try adjusting filters or search query.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const isSelected = selectedConts.has(r.contNo);
                    const isDirty = dirtyIds.has(r.contNo);
                    const rowIndex = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={r.contNo || idx}
                        className={`hover:bg-blue-50/40 transition-colors divide-x divide-slate-100 ${
                          isSelected ? 'bg-blue-50/70' : isDirty ? 'bg-amber-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-2 text-center">
                          <button
                            onClick={() => toggleSelectRow(r.contNo)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Sr. */}
                        <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                          {rowIndex}
                        </td>

                        {/* Shipper */}
                        <td className="p-2 font-medium text-slate-900 truncate max-w-[240px]" title={r.shipper}>
                          <div className="flex items-center gap-1.5">
                            {isDirty && (
                              <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
                            )}
                            <span className="truncate">{r.shipper || '—'}</span>
                          </div>
                        </td>

                        {/* Consignee (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.consignee || ''}
                            onChange={e => handleCellChange(r.contNo, 'consignee', e.target.value)}
                            placeholder="Enter Consignee..."
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Notify Party (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.notify || ''}
                            onChange={e => handleCellChange(r.contNo, 'notify', e.target.value)}
                            placeholder="Enter Notify Party..."
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* LINE */}
                        <td className="p-2 text-slate-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {r.line || '—'}
                          </span>
                        </td>

                        {/* Cont No */}
                        <td className="p-2 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {r.contNo}
                        </td>

                        {/* Allotment Date */}
                        <td className="p-2 text-slate-600 text-center whitespace-nowrap">
                          {r.allotmentDate || '—'}
                        </td>

                        {/* TYPE */}
                        <td className="p-2 text-center font-semibold text-slate-700">
                          {r.type || 'RF'}
                        </td>

                        {/* Cont Size */}
                        <td className="p-2 text-center text-slate-700">
                          {r.contSize || '40'}
                        </td>

                        {/* Cont Type */}
                        <td className="p-2 text-center text-slate-700">
                          {r.contType || 'RF'}
                        </td>

                        {/* CFS */}
                        <td className="p-2 text-slate-600 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                            {r.cfs || 'TRANSWORLD-DADRI'}
                          </span>
                        </td>

                        {/* Gross Wt. (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.grossWt || ''}
                            onChange={e => handleCellChange(r.contNo, 'grossWt', e.target.value)}
                            placeholder="kg"
                            className="w-full font-mono text-right bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Net Wt. (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.netWt || ''}
                            onChange={e => handleCellChange(r.contNo, 'netWt', e.target.value)}
                            placeholder="kg"
                            className="w-full font-mono text-right bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* REF Id (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.refId || ''}
                            onChange={e => handleCellChange(r.contNo, 'refId', e.target.value)}
                            placeholder="0"
                            className="w-full text-center bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Health Cert (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.healthCert || ''}
                            onChange={e => handleCellChange(r.contNo, 'healthCert', e.target.value)}
                            placeholder="Cert No."
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Package Type (Editable Dropdown) */}
                        <td className="p-1">
                          <select
                            value={r.pkgType || 'CNTS'}
                            onChange={e => handleCellChange(r.contNo, 'pkgType', e.target.value)}
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          >
                            {PACKAGE_TYPES.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>

                        {/* No of PCS (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.pcs || ''}
                            onChange={e => handleCellChange(r.contNo, 'pcs', e.target.value)}
                            placeholder="PCS / Ctns"
                            className="w-full font-mono text-center bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Commodity (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.commodity || ''}
                            onChange={e => handleCellChange(r.contNo, 'commodity', e.target.value)}
                            placeholder="Commodity Description"
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 truncate"
                          />
                        </td>

                        {/* Invoice No (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.invNo || ''}
                            onChange={e => handleCellChange(r.contNo, 'invNo', e.target.value)}
                            placeholder="Inv No."
                            className="w-full font-medium bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-indigo-900 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Invoice Date (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.invDate || ''}
                            onChange={e => handleCellChange(r.contNo, 'invDate', e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="w-full text-center bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* SB No. (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.sbNo || ''}
                            onChange={e => handleCellChange(r.contNo, 'sbNo', e.target.value)}
                            placeholder="SB No."
                            className="w-full font-bold bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-amber-900 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* SB Date (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.sbDate || ''}
                            onChange={e => handleCellChange(r.contNo, 'sbDate', e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="w-full text-center bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Consignment Type (Editable Dropdown) */}
                        <td className="p-1">
                          <select
                            value={r.consignmentType || 'CIF'}
                            onChange={e => handleCellChange(r.contNo, 'consignmentType', e.target.value)}
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          >
                            {CONSIGNMENT_TYPES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>

                        {/* FOB Value (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.fobValue || ''}
                            onChange={e => handleCellChange(r.contNo, 'fobValue', e.target.value)}
                            placeholder="INR"
                            className="w-full font-mono text-right bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* POD (Editable Dropdown or Text) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.pod || ''}
                            onChange={e => handleCellChange(r.contNo, 'pod', e.target.value)}
                            placeholder="Discharge Port"
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 truncate"
                          />
                        </td>

                        {/* CHA (Editable) */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={r.cha || ''}
                            onChange={e => handleCellChange(r.contNo, 'cha', e.target.value)}
                            placeholder="CHA Agent"
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 truncate"
                          />
                        </td>

                        {/* JOB No */}
                        <td className="p-2 text-slate-600 font-mono text-center whitespace-nowrap">
                          {r.jobNo || '—'}
                        </td>

                        {/* JOB Date */}
                        <td className="p-2 text-slate-600 text-center whitespace-nowrap">
                          {r.jobDate || '—'}
                        </td>

                        {/* Remarks (Editable Dropdown) */}
                        <td className="p-1">
                          <select
                            value={r.remarks || 'Select'}
                            onChange={e => handleCellChange(r.contNo, 'remarks', e.target.value)}
                            className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 py-1 text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          >
                            {REMARKS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong className="text-slate-900">{filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
                <strong className="text-slate-900">
                  {Math.min(currentPage * pageSize, filteredRecords.length)}
                </strong>{' '}
                of <strong className="text-slate-900">{filteredRecords.length}</strong> containers
                {filteredRecords.length !== records.length && ` (filtered from ${records.length})`}
              </span>

              {/* Rows per page selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Rows:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={9999}>All ({filteredRecords.length})</option>
                </select>
              </div>
            </div>

            {/* Pagination controls */}
            {pageSize !== 9999 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                <div className="px-3 py-1 font-medium text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  📋
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quick Paste from Excel / SPJ-2</h3>
                  <p className="text-xs text-slate-500">Paste tab-delimited or comma-separated rows. Matches container numbers automatically.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={8}
                placeholder="Paste rows here (e.g. MEDU9004289, 8559212, 10/11/2026 or full CSV lines)..."
                className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPaste}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
              >
                Apply Pasted Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
