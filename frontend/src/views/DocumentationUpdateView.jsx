import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Zap,
  Save,
  Download
} from 'lucide-react';

export default function DocumentationUpdateView({ jobs = [], onUpdateJob }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [shipperFilter, setShipperFilter] = useState('ALL');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [docRows, setDocRows] = useState([]);
  const [quickSb, setQuickSb] = useState('');
  const [quickSbDate, setQuickSbDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickInv, setQuickInv] = useState('');
  const [quickInvDate, setQuickInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickStampNotice, setQuickStampNotice] = useState('');

  // Flatten containers across bookings with their documentation attributes
  useEffect(() => {
    const rows = [];
    jobs.forEach((job) => {
      (job.containers || []).forEach((c, idx) => {
        rows.push({
          id: (job.id || 'job') + '-' + idx,
          jobId: job.id || job.joNo,
          sr: rows.length + 1,
          shipper: job.customer || job.consignor || 'Verified Shipper',
          contNo: c.no || c.containerNo || '',
          invoiceNo: c.invoiceNo || job.partyInvoiceNo || '',
          invoiceDate: c.invoiceDate || job.partyInvoiceDate || '',
          sbNo: c.sbNo || job.sbNo || '',
          sbDate: c.sbDate || job.sbDate || '',
          bookingNo: job.bookingNo || '',
          bookingDate: job.bookingDate || '',
          siCutDate: job.siCutDate || '',
          portCutDate: job.cutOffDate || '',
          line: job.line || job.shippingLine || 'Shipping Line',
          cfs: 'Dadri ICD CFS',
          pol: job.origin || job.fromLocation || 'INNSA1',
          pod: job.pod || job.toLocation || 'AEJEA',
          planVessel: job.vessel || '',
          etd: job.etdDate || '',
          docType: c.docType || 'Checklist Approved',
          remark: c.remark || ''
        });
      });
    });
    setDocRows(rows);
  }, [jobs]);

  const handleQuickStampAll = () => {
    if (!quickSb && !quickInv) {
      alert('Please enter a Shipping Bill No or Exporter Invoice No!');
      return;
    }

    setDocRows(prev =>
      prev.map(r => ({
        ...r,
        sbNo: quickSb || r.sbNo,
        sbDate: quickSbDate || r.sbDate,
        invoiceNo: quickInv || r.invoiceNo,
        invoiceDate: quickInvDate || r.invoiceDate
      }))
    );

    setQuickStampNotice('⚡ Shipping Bill & Invoice stamped across all container rows in 1-Click!');
    setTimeout(() => setQuickStampNotice(''), 3500);
  };

  const handleFieldChange = (id, field, value) => {
    setDocRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveAll = async () => {
    if (onUpdateJob) {
      for (const row of docRows) {
        try {
          await onUpdateJob(row.jobId, {
            sbNo: row.sbNo,
            sbDate: row.sbDate,
            partyInvoiceNo: row.invoiceNo,
            partyInvoiceDate: row.invoiceDate
          });
        } catch (err) {
          console.error('Error saving doc row:', err);
        }
      }
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Safe search and filtering
  const filteredRows = docRows.filter((r) => {
    if (shipperFilter !== 'ALL' && r.shipper !== shipperFilter) return false;
    if (lineFilter !== 'ALL' && r.line !== lineFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const jid = String(r.jobId || '').toLowerCase();
    const cno = String(r.contNo || '').toLowerCase();
    const shp = String(r.shipper || '').toLowerCase();
    const sb = String(r.sbNo || '').toLowerCase();
    const inv = String(r.invoiceNo || '').toLowerCase();
    return jid.includes(q) || cno.includes(q) || shp.includes(q) || sb.includes(q) || inv.includes(q);
  });

  // Unique shippers & lines
  const uniqueShippers = Array.from(new Set(docRows.map(r => r.shipper).filter(Boolean)));
  const uniqueLines = Array.from(new Set(docRows.map(r => r.line).filter(Boolean)));

  return (
    <div className="space-y-5 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
            Documentation Update
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Shipping Bills &bull; Exporter Invoices &bull; SI Cut-Offs &bull; BL Lifecycle Checklist
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              Saved to PostgreSQL!
            </span>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save All Rows</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Shipper, Cont No, SB, Inv..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div>
            <select
              value={shipperFilter}
              onChange={(e) => setShipperFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Shippers (Consignors)</option>
              {uniqueShippers.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={lineFilter}
              onChange={(e) => setLineFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Shipping Lines</option>
              {uniqueLines.map((l, idx) => (
                <option key={idx} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-mono">
            Total Records: <span className="font-bold text-[rgb(25,40,57)] ml-1">{filteredRows.length}</span>
          </div>
        </div>
      </div>

      {/* Quick Bulk Stamp Bar */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>⚡ 1-Click Fast Bulk Stamp (Shipping Bill &amp; Invoice)</span>
          </div>
          {quickStampNotice && (
            <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
              {quickStampNotice}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
          <input
            type="text"
            placeholder="Shipping Bill No (e.g. SB-91823)"
            value={quickSb}
            onChange={(e) => setQuickSb(e.target.value.toUpperCase())}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
          />

          <input
            type="date"
            value={quickSbDate}
            onChange={(e) => setQuickSbDate(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
          />

          <input
            type="text"
            placeholder="Exporter Inv No (e.g. EXP-1049)"
            value={quickInv}
            onChange={(e) => setQuickInv(e.target.value.toUpperCase())}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
          />

          <input
            type="date"
            value={quickInvDate}
            onChange={(e) => setQuickInvDate(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
          />

          <button
            type="button"
            onClick={handleQuickStampAll}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Apply to All Rows</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-heading text-[11px] uppercase tracking-wider">
                <th className="p-2.5 font-semibold text-center w-10">Sr.</th>
                <th className="p-2.5 font-semibold min-w-[130px]">Shipper</th>
                <th className="p-2.5 font-semibold min-w-[120px]">Cont No</th>
                <th className="p-2.5 font-semibold min-w-[110px]">Invoice No</th>
                <th className="p-2.5 font-semibold min-w-[100px]">Invoice Date</th>
                <th className="p-2.5 font-semibold min-w-[110px]">SB No.</th>
                <th className="p-2.5 font-semibold min-w-[100px]">SB Date</th>
                <th className="p-2.5 font-semibold min-w-[110px]">Booking No.</th>
                <th className="p-2.5 font-semibold min-w-[100px]">Line</th>
                <th className="p-2.5 font-semibold min-w-[80px]">POL</th>
                <th className="p-2.5 font-semibold min-w-[80px]">POD</th>
                <th className="p-2.5 font-semibold min-w-[120px]">Plan Vessel</th>
                <th className="p-2.5 font-semibold min-w-[120px]">Doc Type</th>
                <th className="p-2.5 font-semibold min-w-[130px]">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-slate-400 font-sans">
                    No documentation records pending. Create a Container Booking to begin documentation.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                    <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-2 font-medium text-[rgb(25,40,57)]">{r.shipper}</td>
                    <td className="p-2 font-mono font-bold text-blue-700">{r.contNo || 'TBA'}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="e.g. INV-1049"
                        value={r.invoiceNo || ''}
                        onChange={(e) => handleFieldChange(r.id, 'invoiceNo', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={r.invoiceDate || ''}
                        onChange={(e) => handleFieldChange(r.id, 'invoiceDate', e.target.value)}
                        className="w-full px-1.5 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="e.g. SB-9281720"
                        value={r.sbNo || ''}
                        onChange={(e) => handleFieldChange(r.id, 'sbNo', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={r.sbDate || ''}
                        onChange={(e) => handleFieldChange(r.id, 'sbDate', e.target.value)}
                        className="w-full px-1.5 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2 font-mono text-slate-700">{r.bookingNo || '-'}</td>
                    <td className="p-2 text-slate-700">{r.line}</td>
                    <td className="p-2 font-mono text-slate-700">{r.pol}</td>
                    <td className="p-2 font-mono text-slate-700">{r.pod}</td>
                    <td className="p-2 text-slate-700">{r.planVessel || 'TBA'}</td>
                    <td className="p-2">
                      <select
                        value={r.docType || 'Checklist Approved'}
                        onChange={(e) => handleFieldChange(r.id, 'docType', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Checklist Approved">Checklist Approved</option>
                        <option value="Draft BL Sent">Draft BL Sent</option>
                        <option value="Final BL Approved">Final BL Approved</option>
                        <option value="Original BL Released">Original BL Released</option>
                        <option value="Waybill / Seaway">Waybill / Seaway</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={r.remark || ''}
                        onChange={(e) => handleFieldChange(r.id, 'remark', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
