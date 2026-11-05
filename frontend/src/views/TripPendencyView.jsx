import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  FileText,
  AlertCircle,
  PlusCircle,
  Printer,
  Zap,
  X,
  Building2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function TripPendencyView({ jobs = [], onUpdateContainerGR, onNewBookingClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [activeGrModal, setActiveGrModal] = useState(null); // Container for printable GR modal

  // Local state for inline truck & driver allotment
  const [allotmentData, setAllotmentData] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [batchNotice, setBatchNotice] = useState('');
  const [livePendency, setLivePendency] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live trip pendency directly from PostgreSQL backend
  const loadLivePendency = async () => {
    try {
      setIsLoading(true);
      const res = await api.getTripPendency();
      if (res?.data && Array.isArray(res.data)) {
        setLivePendency(res.data);
      }
    } catch (err) {
      console.warn('Could not load live trip pendency from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLivePendency();
  }, []);

  // Build complete list of pending containers: combining live DB records + any local in-memory jobs
  const seenContainers = new Set();
  const pendingContainers = [];

  // 1. First add live database records (source of truth)
  livePendency.forEach((r, idx) => {
    const cno = (r.containerNo || '').trim();
    if (cno) seenContainers.add(cno.toUpperCase());
    pendingContainers.push({
      jobId: r.jobNo || r.id,
      joNo: r.jobNo || r.id,
      contIndex: idx,
      contNo: cno || 'TBA',
      size: r.sizeType || '40HC',
      customer: r.shipper || 'Consignor',
      consignee: 'Consignee',
      line: r.shippingLine || 'Shipping Line',
      origin: r.origin || 'Dadri ICD',
      pod: r.destination || 'Port',
      bookingNo: r.bookingNo || '-',
      sealNo: '',
      cargoWeight: 24000,
      vehicleNo: r.truckNo || '',
      driverName: r.driverName || '',
      driverPhone: r.driverMobile || '',
      transporter: 'Dadri Express Logistics'
    });
  });

  // 2. Then merge in-memory/localStorage jobs where GR is pending (if not already seen)
  jobs.forEach((job) => {
    (job.containers || []).forEach((c, idx) => {
      const cno = (c.no || c.containerNo || '').trim();
      const hasGr = c.gr && c.gr !== 'PENDING' && c.gr.trim() !== '';
      if (!hasGr && cno && !seenContainers.has(cno.toUpperCase())) {
        seenContainers.add(cno.toUpperCase());
        pendingContainers.push({
          jobId: job.id,
          joNo: job.joNo || job.id,
          contIndex: idx,
          contNo: cno || 'TBA',
          size: c.size || c.sizeType || '40HC',
          customer: job.customer || job.customerName || job.consignor || 'Consignor',
          consignee: job.consignee || 'Consignee',
          line: job.line || job.shippingLineName || job.shippingLine || 'Shipping Line',
          origin: job.origin || job.fromLocation || 'Dadri ICD',
          pod: job.pod || job.toLocation || 'Port',
          bookingNo: job.bookingNo || '-',
          sealNo: c.seal || c.sealNo || '',
          cargoWeight: c.cargoWeight || c.cargo || 24000,
          vehicleNo: c.truck && c.truck !== 'TBA' ? c.truck : (c.truckNo || ''),
          driverName: c.driverName || '',
          driverPhone: c.driverMobile || '',
          transporter: 'Dadri Express Logistics'
        });
      }
    });
  });

  // 1-Click Batch GR Generation for all selected containers
  const handleBatchGenerateGr = async () => {
    const targets = filtered.filter(item => selectedItems.includes(item.jobId + '-' + item.contIndex));
    if (targets.length === 0) {
      alert('Please select at least 1 container from the checkbox list!');
      return;
    }

    let count = 0;
    for (const item of targets) {
      const key = item.jobId + '-' + item.contIndex;
      const rowData = allotmentData[key] || {};
      const vehicle = rowData.vehicleNo || item.vehicleNo || 'UP16BT' + Math.floor(1000 + Math.random() * 9000);
      const driver = rowData.driverName || 'Ramesh Kumar';
      const phone = rowData.driverPhone || '9876543210';
      if (onUpdateContainerGR) {
        await onUpdateContainerGR(item.jobId, item.contNo, vehicle, driver, phone);
        count++;
      }
    }

    setSelectedItems([]);
    setBatchNotice(`⚡ Batch generated GRs for ${count} containers in 1-Click! Units advanced to STUFFED.`);
    setTimeout(() => setBatchNotice(''), 4000);
  };

  const handleFieldChange = (key, field, val) => {
    setAllotmentData({
      ...allotmentData,
      [key]: {
        ...(allotmentData[key] || {}),
        [field]: val
      }
    });
  };

  const handleGenerateGr = (item) => {
    const key = item.jobId + '-' + item.contIndex;
    const rowData = allotmentData[key] || {};
    const vehicle = rowData.vehicleNo || item.vehicleNo || 'UP16BT' + Math.floor(1000 + Math.random() * 9000);
    const driver = rowData.driverName || 'Ramesh Kumar';
    const phone = rowData.driverPhone || '9876543210';
    const newGrNo = 'GR-2026-' + Math.floor(10000 + Math.random() * 90000);

    // Call update callback to save into job container
    if (onUpdateContainerGR) {
      onUpdateContainerGR(item.jobId, item.contNo, vehicle, driver, phone);
    }

    // Immediately remove from livePendency state so row disappears in real time
    setLivePendency(prev => prev.filter(p => (p.containerNo || '').trim().toUpperCase() !== (item.contNo || '').trim().toUpperCase()));

    // Open Printable GR slip modal
    setActiveGrModal({
      grNo: newGrNo,
      date: new Date().toLocaleDateString('en-GB'),
      jobId: item.joNo || item.jobId,
      customer: item.customer,
      consignee: item.consignee,
      contNo: item.contNo,
      size: item.size,
      sealNo: item.sealNo || 'SL-88192',
      weight: item.cargoWeight || 24000,
      origin: item.origin,
      pod: item.pod,
      vehicleNo: vehicle,
      driverName: driver,
      driverPhone: phone,
      transporter: rowData.transporter || 'Dadri Express Logistics'
    });
  };

  const filtered = pendingContainers.filter((item) => {
    if (customerFilter !== 'ALL' && item.customer !== customerFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const jid = String(item.jobId || '').toLowerCase();
    const jno = String(item.joNo || '').toLowerCase();
    const cno = String(item.contNo || '').toLowerCase();
    const cst = String(item.customer || '').toLowerCase();
    const ln = String(item.line || '').toLowerCase();
    const bno = String(item.bookingNo || '').toLowerCase();
    return (
      jid.includes(q) ||
      jno.includes(q) ||
      cno.includes(q) ||
      cst.includes(q) ||
      ln.includes(q) ||
      bno.includes(q)
    );
  });

  const uniqueCustomers = Array.from(
    new Set(pendingContainers.map((i) => i.customer).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6 w-full">
      {/* Header (Exact SPJ-2 Screen Title: Trip Pendency) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              Trip Pendency
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {pendingContainers.length} Containers Awaiting GR
            </span>
            <button
              type="button"
              onClick={loadLivePendency}
              disabled={isLoading}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition shadow-2xs"
              title="Refresh Live Pending Containers"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Containers booked in Container Booking pending Truck &bull; Driver &bull; GR Generation
          </p>
        </div>

        <button
          onClick={onNewBookingClick}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Container Booking</span>
        </button>
      </div>

      

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="text-[11px] font-mono font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>FILTER PENDING TRIPS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search JO No, Cont No, Customer, Line..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Customers (Consignors) ({uniqueCustomers.length})</option>
              {uniqueCustomers.map(cust => (
                <option key={cust} value={cust}>{cust}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            {batchNotice && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-mono">
                {batchNotice}
              </span>
            )}

            {filtered.length > 0 && (
              <button
                type="button"
                onClick={handleBatchGenerateGr}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="1-Click: Generates GR bilty, assigns trucks, and dispatches all selected units!"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Batch Generate GRs ({selectedItems.length || filtered.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trip Pendency Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-heading text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-2.5 font-semibold text-center w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedItems.length === filtered.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filtered.map(i => i.jobId + '-' + i.contIndex));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="p-2.5 font-semibold text-center w-8">Sr.</th>
                <th className="p-2.5 font-semibold min-w-[100px]">JO No</th>
                <th className="p-2.5 font-semibold min-w-[120px]">Cont No</th>
                <th className="p-2.5 font-semibold min-w-[70px]">Size/Type</th>
                <th className="p-2.5 font-semibold min-w-[130px]">Customer (Consignor)</th>
                <th className="p-2.5 font-semibold min-w-[100px]">Line</th>
                <th className="p-2.5 font-semibold min-w-[110px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-sans">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-medium text-slate-700 text-sm">No Pending Trips!</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All booked containers have their GR generated and dispatched.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const key = item.jobId + '-' + item.contIndex;
                  return (
                    <tr key={key} className="hover:bg-amber-50/40 transition font-sans">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedItems([...selectedItems, key]);
                            else setSelectedItems(selectedItems.filter(k => k !== key));
                          }}
                          className="rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-blue-700">{item.joNo || item.jobId}</td>
                      <td className="p-2 font-mono font-bold text-[rgb(25,40,57)]">{item.contNo}</td>
                      <td className="p-2 font-mono text-slate-600">{item.size}</td>
                      <td className="p-2 font-medium text-[rgb(25,40,57)]">{item.customer}</td>
                      <td className="p-2 text-slate-700">{item.line}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleGenerateGr(item)}
                          className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition ml-auto"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Generate GR</span>
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

      {/* ================= PRINTABLE GR (LORRY RECEIPT) MODAL ================= */}
      {activeGrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  Goods Lorry Receipt (GR / Bilty) Generated!
                </h2>
              </div>
              <button
                onClick={() => setActiveGrModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable GR Slip Card */}
            <div className="p-5 rounded-lg border-2 border-slate-300 bg-slate-50 space-y-4 font-mono text-xs">
              <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                <div>
                  <div className="font-bold text-sm text-[rgb(25,40,57)]">eLOGiFreight™ Logistics Fleet</div>
                  <div className="text-[11px] text-slate-500">Dadri ICD Complex, Greater Noida, UP</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase">Lorry Receipt No.</div>
                  <div className="text-base font-bold text-emerald-700">{activeGrModal.grNo}</div>
                  <div className="text-[11px] text-slate-500">Date: {activeGrModal.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Consignor (Shipper):</span>
                  <span className="font-bold text-[rgb(25,40,57)]">{activeGrModal.customer}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Consignee (Buyer):</span>
                  <span className="font-bold text-[rgb(25,40,57)]">{activeGrModal.consignee}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">From Location:</span>
                  <span className="font-bold">{activeGrModal.origin}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">To / Gateway Port:</span>
                  <span className="font-bold text-blue-700">{activeGrModal.pod}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Container No &amp; Size:</span>
                  <span className="font-bold text-blue-700">{activeGrModal.contNo} ({activeGrModal.size})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Seal No &amp; Weight:</span>
                  <span className="font-bold">{activeGrModal.sealNo} &bull; {activeGrModal.weight} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vehicle / Truck No:</span>
                  <span className="font-bold text-emerald-700">{activeGrModal.vehicleNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Driver Details:</span>
                  <span className="font-bold">{activeGrModal.driverName} ({activeGrModal.driverPhone})</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => alert()}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print GR Copy</span>
              </button>
              <button
                onClick={() => setActiveGrModal(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
