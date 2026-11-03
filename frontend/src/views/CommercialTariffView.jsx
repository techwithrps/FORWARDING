import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  DollarSign,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
  Ship,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export default function CommercialTariffView({ activeSubPage = 'RateTariff' }) {
  const [activeTab, setActiveTab] = useState(activeSubPage === 'RateApproval' ? 'APPROVAL' : 'TARIFF');
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    tariffCode: '',
    origin: 'Dadri ICD (INICD6)',
    destination: 'Jebel Ali (AEJEA)',
    containerSize: '40HC',
    commodity: 'FROZEN MEAT',
    buyRate: 98000,
    sellRate: 115000
  });

  const loadTariffs = async () => {
    try {
      setLoading(true);
      const res = await api.getTariffs();
      if (res && res.data) {
        setTariffs(res.data);
      }
    } catch (err) {
      console.warn('Error loading tariffs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTariffs();
  }, []);

  useEffect(() => {
    if (activeSubPage === 'RateApproval') setActiveTab('APPROVAL');
    else if (activeSubPage === 'RateTariff') setActiveTab('TARIFF');
  }, [activeSubPage]);

  const handleCreateTariff = async (e) => {
    e.preventDefault();
    try {
      await api.createTariff({
        tariffCode: form.tariffCode || `TRF-2026-${String(Date.now()).slice(-4)}`,
        origin: form.origin,
        destination: form.destination,
        containerSize: form.containerSize,
        commodity: form.commodity,
        buyRate: Number(form.buyRate),
        sellRate: Number(form.sellRate)
      });
      setNotice('Rate Tariff submitted for Commercial Approval!');
      setTimeout(() => setNotice(''), 3000);
      setShowAddModal(false);
      await loadTariffs();
    } catch (err) {
      alert('Error saving tariff: ' + err.message);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.approveTariff(id, { status, approvedBy: 'Commercial Director' });
      setNotice(`Tariff marked as ${status}!`);
      setTimeout(() => setNotice(''), 3000);
      await loadTariffs();
    } catch (err) {
      alert('Error updating tariff approval: ' + err.message);
    }
  };

  const filtered = tariffs.filter((t) => {
    if (activeTab === 'APPROVAL' && t.status !== 'PENDING_APPROVAL') return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const code = String(t.tariff_code || t.id || '').toLowerCase();
    const orig = String(t.origin || '').toLowerCase();
    const dest = String(t.destination || '').toLowerCase();
    const comm = String(t.commodity || '').toLowerCase();
    return code.includes(q) || orig.includes(q) || dest.includes(q) || comm.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              {activeTab === 'TARIFF' ? '15. Rate Tariff Master' : '16. Rate Approval Workflow'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Commercial Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Shipping Line Buy Rates &bull; Shipper Sell Quotations &bull; Profit Margin Control &bull; Multi-tier Approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notice && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              {notice}
            </span>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Create Rate Tariff</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('TARIFF')}
          className={
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ' +
            (activeTab === 'TARIFF'
              ? 'bg-blue-50 text-blue-700 font-semibold border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
          }
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Page 15: All Rate Tariffs</span>
        </button>

        <button
          onClick={() => setActiveTab('APPROVAL')}
          className={
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ' +
            (activeTab === 'APPROVAL'
              ? 'bg-blue-50 text-blue-700 font-semibold border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
          }
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Page 16: Rate Approval Queue ({tariffs.filter(t => t.status === 'PENDING_APPROVAL').length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Tariff Code, Sector (Origin / Destination), Commodity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-500">
          Showing {filtered.length} record(s)
        </span>
      </div>

      {/* Tariffs Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Tariff Code</th>
                <th className="py-2.5 px-3">Sector (Routing)</th>
                <th className="py-2.5 px-3">Size/Type</th>
                <th className="py-2.5 px-3">Commodity</th>
                <th className="py-2.5 px-3 text-right">Carrier Buy (₹)</th>
                <th className="py-2.5 px-3 text-right">Customer Sell (₹)</th>
                <th className="py-2.5 px-3 text-right font-bold text-emerald-700">Margin (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                    No tariff records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const buy = Number(t.buy_rate || 0);
                  const sell = Number(t.sell_rate || 0);
                  const margin = sell - buy;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{t.tariff_code || t.id}</td>
                      <td className="py-3 px-3 text-slate-700">
                        {t.origin} &rarr; <span className="font-semibold text-blue-800">{t.destination}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">{t.container_size || '40HC'}</td>
                      <td className="py-3 px-3 text-slate-600">{t.commodity || 'GENERAL'}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">₹ {buy.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹ {sell.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹ {margin.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={
                            'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ' +
                            (t.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200')
                          }
                        >
                          {t.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {t.status === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(t.id, 'APPROVED')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(t.id, 'REJECTED')}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 font-semibold text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            {t.approved_by || 'Verified'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tariff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>Create Rate Tariff (Quotation)</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTariff} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Origin Sector *</label>
                  <input
                    type="text"
                    required
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Destination (POD) *</label>
                  <input
                    type="text"
                    required
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Container Size</label>
                  <select
                    value={form.containerSize}
                    onChange={(e) => setForm({ ...form, containerSize: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="40HC">40ft High Cube (40HC)</option>
                    <option value="20FT">20ft Standard (20FT)</option>
                    <option value="45FT">45ft Pallet Wide (45FT)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Commodity</label>
                  <input
                    type="text"
                    value={form.commodity}
                    onChange={(e) => setForm({ ...form, commodity: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Shipping Line Buy Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.buyRate}
                    onChange={(e) => setForm({ ...form, buyRate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Shipper Sell Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.sellRate}
                    onChange={(e) => setForm({ ...form, sellRate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono">
                <span className="text-slate-500 text-[11px]">Realized Margin Per Unit:</span>
                <span className="text-emerald-700 font-bold text-sm">
                  ₹ {(Number(form.sellRate) - Number(form.buyRate)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Submit for Rate Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
