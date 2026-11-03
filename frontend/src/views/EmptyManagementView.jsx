import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Box,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Download,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function EmptyManagementView() {
  const [activeTab, setActiveTab] = useState('INVENTORY'); // 'INVENTORY' or 'BOOKING'
  const [lineFilter, setLineFilter] = useState('ALL');

  const [inventoryStock, setInventoryStock] = useState([]);
  const [emptyBookings, setEmptyBookings] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    shippingLine: 'Maersk Line',
    depotLocation: 'Dadri CONCOR ICD Depot',
    bookingRef: '',
    containerCount: 2,
    sizeType: '40HC',
    transporter: 'Dadri Express Logistics',
    validUntil: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]
  });

  const loadEmptyData = async () => {
    try {
      const [invRes, ordRes] = await Promise.allSettled([
        api.getEmptyInventory(),
        api.getEmptyOrders()
      ]);
      if (invRes.status === 'fulfilled' && invRes.value && invRes.value.data) {
        setInventoryStock(invRes.value.data.map(i => ({
          depot: i.depot_location,
          line: i.shipping_line,
          size: (i.size_type || '40HC').slice(0, 2) + 'FT',
          type: (i.size_type || '40HC').slice(2) || 'HC',
          totalAvailable: i.available_free,
          allotted: i.in_transit,
          damaged: i.damaged,
          freeDays: i.free_days
        })));
      }
      if (ordRes.status === 'fulfilled' && ordRes.value && ordRes.value.data) {
        setEmptyBookings(ordRes.value.data.map(o => ({
          orderNo: o.order_no,
          date: o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          line: o.shipping_line,
          depot: o.depot_location,
          size: o.size_type,
          qty: o.container_count,
          picked: o.container_count,
          customer: o.booking_ref,
          status: o.status || 'ACTIVE'
        })));
      }
    } catch (err) {
      console.warn('Error loading empty inventory:', err);
    }
  };

  useEffect(() => {
    loadEmptyData();
  }, []);

  const handleCreateEmptyOrder = async (e) => {
    e.preventDefault();
    try {
      await api.createEmptyOrder(orderForm);
      await loadEmptyData();
      setShowOrderModal(false);
      setOrderForm({
        shippingLine: 'Maersk Line',
        depotLocation: 'Dadri CONCOR ICD Depot',
        bookingRef: '',
        containerCount: 2,
        sizeType: '40HC',
        transporter: 'Dadri Express Logistics',
        validUntil: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error creating empty pickup order:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              Empty Container Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Doc Items 17 &amp; 18
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Empty Yard Pick-up Orders &bull; Container Stock Inventory &bull; Line Free Days &amp; Detention Tracking
          </p>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Empty Pick-up Order</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'INVENTORY', label: 'Empty Container Inventory (Stock Ledger)', icon: Box },
          { id: 'BOOKING', label: 'Empty Container Bookings (Pick-up Orders)', icon: Calendar }
        ].map((t) => {
          const Icon = t.icon;
          const isAct = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ' +
                (isAct
                  ? 'bg-blue-50 text-blue-700 font-semibold border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Inventory Stock Ledger */}
      {activeTab === 'INVENTORY' && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-heading text-[rgb(25,40,57)] uppercase font-mono tracking-wider">
              Depot Wise Empty Stock Balance
            </h2>
            <span className="text-xs text-slate-500 font-mono">Real-time Yard Position</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Depot / Yard Location</th>
                  <th className="py-2.5 px-3">Shipping Line</th>
                  <th className="py-2.5 px-3">Size/Type</th>
                  <th className="py-2.5 px-3 font-bold text-blue-700">Available Free</th>
                  <th className="py-2.5 px-3">Allotted (In Transit)</th>
                  <th className="py-2.5 px-3 text-rose-600">Damaged</th>
                  <th className="py-2.5 px-3">Allowed Free Days</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {inventoryStock.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-semibold text-[rgb(25,40,57)]">{s.depot}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{s.line}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{s.size} {s.type}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">{s.totalAvailable} Units</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{s.allotted} Units</td>
                    <td className="py-3 px-3 font-mono text-rose-600 font-semibold">{s.damaged}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{s.freeDays} Days</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">READY</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Empty Bookings */}
      {activeTab === 'BOOKING' && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Line</th>
                  <th className="py-2.5 px-3">Pick-up Depot</th>
                  <th className="py-2.5 px-3">Size/Type</th>
                  <th className="py-2.5 px-3">Customer (Shipper)</th>
                  <th className="py-2.5 px-3">Picked / Total</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {emptyBookings.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{b.orderNo}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{b.date}</td>
                    <td className="py-3 px-3 text-slate-700">{b.line}</td>
                    <td className="py-3 px-3 font-medium text-[rgb(25,40,57)]">{b.depot}</td>
                    <td className="py-3 px-3 font-mono">{b.size}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{b.customer}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {b.picked} / {b.qty} Cont
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
          {/* Empty Pick-up Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold font-heading text-[rgb(25,40,57)]">
                Create Empty Pick-up Order
              </h2>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmptyOrder} className="space-y-3 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Shipping Line</label>
                <select
                  value={orderForm.shippingLine}
                  onChange={(e) => setOrderForm({ ...orderForm, shippingLine: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Maersk Line">Maersk Line India Pvt Ltd</option>
                  <option value="MSC Line">Mediterranean Shipping Co (MSC)</option>
                  <option value="CMA CGM">CMA CGM Agencies India</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Depot Location</label>
                <input
                  type="text"
                  required
                  value={orderForm.depotLocation}
                  onChange={(e) => setOrderForm({ ...orderForm, depotLocation: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Line Booking Ref</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MSK-DEL-991204"
                  value={orderForm.bookingRef}
                  onChange={(e) => setOrderForm({ ...orderForm, bookingRef: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Container Size</label>
                  <select
                    value={orderForm.sizeType}
                    onChange={(e) => setOrderForm({ ...orderForm, sizeType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="40HC">40FT High Cube</option>
                    <option value="20GP">20FT General Purpose</option>
                    <option value="40RF">40FT Reefer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={orderForm.containerCount}
                    onChange={(e) => setOrderForm({ ...orderForm, containerCount: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Transporter</label>
                <input
                  type="text"
                  required
                  value={orderForm.transporter}
                  onChange={(e) => setOrderForm({ ...orderForm, transporter: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold shadow-xs"
                >
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}