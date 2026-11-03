import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import TaxDocumentPdfView from '../components/TaxDocumentPdfView.jsx';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Printer,
  Download,
  AlertCircle,
  X,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function CreditDebitNoteView({ jobs = [] }) {
  const [activeType, setActiveType] = useState('CREDIT'); // 'CREDIT' or 'DEBIT'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activePrintModal, setActivePrintModal] = useState(null);

  // Existing Notes Register (Loaded from PostgreSQL)
  const [notesList, setNotesList] = useState([]);

  const loadNotes = async () => {
    try {
      const res = await api.getNotes();
      if (res && res.data) {
        setNotesList(res.data.map(n => ({
          id: n.note_number || n.id,
          noteType: n.note_type,
          noteDate: n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          party: n.party_name,
          partyType: 'CUSTOMER',
          origInvoiceNo: n.original_invoice_no,
          origInvoiceDate: n.original_invoice_date || '',
          reason: n.reason_code,
          sacCode: '996511',
          taxableAmount: Number(n.taxable_amount) || 0,
          cgst: 0,
          sgst: 0,
          igst: Number(n.total_tax) || 0,
          totalAmount: Number(n.grand_total) || 0,
          status: n.status || 'APPROVED',
          tallyStatus: 'POSTED'
        })));
      }
    } catch (err) {
      console.warn('Error fetching notes from PostgreSQL:', err);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // Create New Note Form State
  const [form, setForm] = useState({
    noteType: 'CREDIT',
    origInvoiceNo: 'INV-2026-1001',
    party: 'Fair Exports (India) Pvt Ltd',
    reason: 'Freight Rate Adjustment',
    sacCode: '996511',
    particulars: 'Basic Ocean Freight Difference on 2x40HC',
    adjustedAmount: 10000,
    gstRate: 0, // 0 for LUT export, 18 for domestic/detention
    remarks: ''
  });

  const handleCreateNoteSubmit = async (e) => {
    e.preventDefault();
    const taxable = Number(form.adjustedAmount) || 0;
    const gstPct = Number(form.gstRate) || 0;
    const taxAmt = (taxable * gstPct) / 100;

    try {
      await api.createNote({
        noteType: form.noteType,
        originalInvoiceNo: form.origInvoiceNo,
        partyName: form.party,
        reasonCode: form.reason,
        taxableAmount: taxable,
        totalTax: taxAmt,
        remarks: form.remarks
      });
      await loadNotes();
    } catch (err) {
      console.error('Error creating note:', err);
    }
    setShowCreateModal(false);
  };

  const filteredNotes = notesList.filter((n) => {
    if (activeType !== 'ALL' && n.noteType !== activeType) return false;
    if (filterParty !== 'ALL' && !String(n.party || '').includes(filterParty)) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const nid = String(n.id || '').toLowerCase();
    const inv = String(n.origInvoiceNo || '').toLowerCase();
    const pty = String(n.party || '').toLowerCase();
    const rsn = String(n.reason || '').toLowerCase();
    return nid.includes(q) || inv.includes(q) || pty.includes(q) || rsn.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              Credit Note &amp; Debit Note
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              GST Section 34 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Rate Adjustments &bull; Rebates &bull; Line Detention &bull; Demurrage Billed to Shippers &bull; Tally Integration
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Create Note</span>
        </button>
      </div>

      {/* Type Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'CREDIT', label: 'Credit Notes (Rebates / Price Reduction)', icon: TrendingDown, color: 'text-rose-600' },
          { id: 'DEBIT', label: 'Debit Notes (Detention / Demurrage / Extra Charges)', icon: TrendingUp, color: 'text-blue-600' },
          { id: 'ALL', label: 'All Notes Register', icon: Receipt, color: 'text-slate-600' }
        ].map((t) => {
          const Icon = t.icon;
          const isAct = activeType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ' +
                (isAct
                  ? 'bg-blue-50 text-blue-700 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
              }
            >
              <Icon className={'w-3.5 h-3.5 ' + t.color} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Note No, Invoice No, Shipper, Reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterParty}
          onChange={(e) => setFilterParty(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Parties</option>
          <option value="Fair Exports">Fair Exports (India)</option>
          <option value="Marhaba">Marhaba Frozen Foods</option>
        </select>
      </div>

      {/* Notes Register Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Note No</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Party (Shipper / Client)</th>
                <th className="py-2.5 px-3">Original Invoice</th>
                <th className="py-2.5 px-3">Reason / Particulars</th>
                <th className="py-2.5 px-3">SAC</th>
                <th className="py-2.5 px-3">Taxable (₹)</th>
                <th className="py-2.5 px-3">GST (₹)</th>
                <th className="py-2.5 px-3">Total (₹)</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-sans">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-sans">
                    No Credit / Debit notes issued yet.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((n) => {
                  const isCredit = n.noteType === 'CREDIT';
                  return (
                    <tr key={n.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{n.id}</td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            'px-2 py-0.5 rounded text-[10px] font-mono font-bold ' +
                            (isCredit
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200')
                          }
                        >
                          {n.noteType} NOTE
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{n.noteDate}</td>
                      <td className="py-3 px-3 font-semibold text-[rgb(25,40,57)]">{n.party}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {n.origInvoiceNo} <span className="text-slate-400">({n.origInvoiceDate})</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[220px] truncate" title={n.reason}>
                        {n.reason}
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-700">{n.sacCode}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        ₹ {n.taxableAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        ₹ {(n.cgst + n.sgst + n.igst).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[rgb(25,40,57)]">
                        ₹ {n.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setActivePrintModal(n)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 shadow-2xs ml-auto"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Print Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CREATE NOTE MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Issue Credit / Debit Note</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNoteSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Note Type *</label>
                  <select
                    value={form.noteType}
                    onChange={(e) => setForm({ ...form, noteType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="CREDIT">Credit Note (Refund / Rate Rebate)</option>
                    <option value="DEBIT">Debit Note (Detention / Demurrage Charge)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Original Tax Invoice No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-1001"
                    value={form.origInvoiceNo}
                    onChange={(e) => setForm({ ...form, origInvoiceNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-blue-700 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Customer / Party Name *</label>
                <select
                  value={form.party}
                  onChange={(e) => setForm({ ...form, party: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Fair Exports (India) Pvt Ltd">Fair Exports (India) Pvt Ltd</option>
                  <option value="Marhaba Frozen Foods">Marhaba Frozen Foods</option>
                  <option value="Allanasons Private Limited">Allanasons Private Limited</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason for Note Issuance (GST Rule) *</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Rate Revision / Freight Discount Approved">Rate Revision / Freight Discount Approved</option>
                  <option value="Line Container Detention Charges">Line Container Detention Charges</option>
                  <option value="Port Ground Rent / Demurrage Charges">Port Ground Rent / Demurrage Charges</option>
                  <option value="Cargo Weight Shortage / Dispute">Cargo Weight Shortage / Dispute</option>
                  <option value="Correction in Original Invoice Head">Correction in Original Invoice Head</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">SAC Code</label>
                  <select
                    value={form.sacCode}
                    onChange={(e) => setForm({ ...form, sacCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="996511">996511 (Freight)</option>
                    <option value="996719">996719 (THC/Detention)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Adjusted Taxable (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="10000"
                    value={form.adjustedAmount}
                    onChange={(e) => setForm({ ...form, adjustedAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">GST Rate</label>
                  <select
                    value={form.gstRate}
                    onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="0">0% (LUT Export)</option>
                    <option value="18">18% (Standard GST)</option>
                    <option value="5">5% (Freight GST)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save &amp; Generate Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRINTABLE NOTE SLIP MODAL (IDENTICAL PDF TAX DOCUMENT) ================= */}
      {activePrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl p-4 sm:p-6 rounded-2xl bg-slate-100 border border-slate-300 shadow-2xl space-y-3 my-8">
            <div className="no-print flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  Official GST {activePrintModal.noteType === 'CREDIT' ? 'Credit Note' : 'Debit Note'} (PDF Document)
                </h2>
              </div>
              <button 
                onClick={() => setActivePrintModal(null)} 
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <TaxDocumentPdfView
              docType={activePrintModal.noteType === 'CREDIT' ? 'CREDIT NOTE' : 'DEBIT NOTE'}
              docNumber={activePrintModal.id}
              docDate={activePrintModal.noteDate}
              origInvoiceNo={activePrintModal.origInvoiceNo}
              origInvoiceDate={activePrintModal.origInvoiceDate}
              reason={activePrintModal.reason}
              customer={{
                name: activePrintModal.party,
                address: 'Plot 4, Ecotech-II, Udyog Vihar, Greater Noida, UP - 201306',
                gstin: '09AAACF9128M1Z8',
                state: 'Uttar Pradesh (09)',
                pos: 'Dadri ICD (INICD6)'
              }}
              shipment={{
                jobNo: 'JOB-JO-2026-0001',
                origin: 'Dadri ICD',
                pod: 'Jebel Ali (AEJEA)',
                line: 'Maersk Line India Pvt Ltd',
                vessel: 'MAERSK COLOMBO',
                voyage: '2604W',
                containersCount: 1,
                size: "40' HC"
              }}
              items={[
                {
                  id: 1,
                  head: `${activePrintModal.noteType === 'CREDIT' ? 'Credit' : 'Debit'} Adjustment: ${activePrintModal.reason || 'Freight Differential & Rebate'}`,
                  sac: activePrintModal.sacCode || '996511',
                  qty: 1,
                  rate: activePrintModal.taxableAmount,
                  taxRate: 0
                }
              ]}
              taxableTotal={activePrintModal.taxableAmount}
              taxTotal={activePrintModal.igst}
              grandTotal={activePrintModal.totalAmount}
              isLut={true}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
