import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

export default function GrGenerationView({
  jobs = [],
  onUpdateContainerGR,
  onNavigateToGrSearching,
  onNavigateToTripPendency
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [activeGrModal, setActiveGrModal] = useState(null); // Container for printable GR modal

  // Local state for inline truck & driver allotment
  const [allotmentData, setAllotmentData] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [batchNotice, setBatchNotice] = useState('');

  // Find all containers where GR is NOT generated
  const pendingContainers = [];
  jobs.forEach((job) => {
    (job.containers || []).forEach((c, idx) => {
      const hasGr = c.gr && c.gr !== 'PENDING' && c.gr.trim() !== '';
      if (!hasGr) {
        pendingContainers.push({
          jobId: job.id || job.joNo,
          contIndex: idx,
          contNo: c.no || c.containerNo || c.contNo || 'TBA',
          size: c.size || '40HC',
          customer: job.customer || job.consignor || 'Consignor',
          consignee: job.consignee || 'Consignee',
          line: job.line || job.shippingLine || 'Shipping Line',
          origin: job.origin || job.fromLocation || 'Dadri ICD',
          pod: job.pod || job.podPort || 'Port',
          bookingNo: job.bookingNo || job.lineBookingNo || '-',
          sealNo: c.seal || c.sealNo || '',
          agentSeal: c.agentSeal || '',
          cargoWeight: c.cargoWeight || 24000,
          vehicleNo: c.truck && c.truck !== 'TBA' ? c.truck : '',
          driverName: '',
          driverPhone: '',
          transporter: 'Dadri Express Logistics'
        });
      }
    });
  });

  const customersList = ['ALL', ...Array.from(new Set(pendingContainers.map((c) => c.customer).filter(Boolean)))];

  const handleFieldChange = (key, field, val) => {
    setAllotmentData((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: val
      }
    }));
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

    // Open Printable GR slip modal
    setActiveGrModal({
      grNo: newGrNo,
      date: new Date().toLocaleDateString('en-GB'),
      jobId: item.jobId,
      customer: item.customer,
      consignee: item.consignee,
      contNo: item.contNo,
      size: item.size,
      sealNo: item.sealNo || 'SL-88192',
      agentSeal: item.agentSeal || '',
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
    const q = searchTerm.toLowerCase();
    const jid = String(item.jobId || '').toLowerCase();
    const cno = String(item.contNo || '').toLowerCase();
    const cst = String(item.customer || '').toLowerCase();
    const ln = String(item.line || '').toLowerCase();
    return jid.includes(q) || cno.includes(q) || cst.includes(q) || ln.includes(q);
  });

  // 1-Click Batch GR Generation for all selected containers
  const handleBatchGenerateGr = async () => {
    const targets = filtered.filter((item) => selectedItems.includes(item.jobId + '-' + item.contIndex));
    if (targets.length === 0) {
      if (filtered.length > 0) {
        handleGenerateGr(filtered[0]);
        return;
      }
      alert('No pending containers available to generate GR!');
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filtered.map((item) => item.jobId + '-' + item.contIndex));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (key) => {
    setSelectedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-4 w-full font-sans pb-4">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              Gr Generation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {pendingContainers.length} Containers Awaiting GR
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Containers booked in Container Booking pending Truck &bull; Driver &bull; GR Generation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToTripPendency && (
            <button
              type="button"
              onClick={onNavigateToTripPendency}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Trip Pendency Queue</span>
            </button>
          )}

          {onNavigateToGrSearching && (
            <button
              type="button"
              onClick={onNavigateToGrSearching}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>GR Searching</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleBatchGenerateGr}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title="Generate GR for selected containers"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Generate GR {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Batch Success Banner */}
      {batchNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{batchNotice}</span>
        </div>
      )}

      {/* 2. Filter Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Container No, Job ID, Customer, Line..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 max-w-[200px] truncate"
              >
                {customersList.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Customers' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <button
              onClick={handleBatchGenerateGr}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>1-Click Batch Generate GR ({selectedItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Containers Table */}
      <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[9.5px] uppercase font-extrabold">
              <tr>
                <th className="p-2.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedItems.length === filtered.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="p-2.5 min-w-[130px]">Container No</th>
                <th className="p-2.5 min-w-[110px]">Job Order ID</th>
                <th className="p-2.5 min-w-[70px]">Size/Type</th>
                <th className="p-2.5 min-w-[140px]">Customer (Shipper)</th>
                <th className="p-2.5 min-w-[110px]">Shipping Line</th>
                <th className="p-2.5 min-w-[110px]">Route</th>
                <th className="p-2.5 min-w-[120px]">Vehicle No *</th>
                <th className="p-2.5 min-w-[120px]">Driver Name</th>
                <th className="p-2.5 min-w-[110px]">Driver Phone</th>
                <th className="p-2.5 min-w-[110px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-mono text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400 font-sans">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-medium text-slate-700 text-sm">No Pending Containers Awaiting GR!</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All container bookings have been allotted trucks and have valid Lorry Receipts (GR).
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const key = item.jobId + '-' + item.contIndex;
                  const rowData = allotmentData[key] || {};
                  const isSelected = selectedItems.includes(key);

                  return (
                    <tr key={key} className={`hover:bg-amber-50/40 transition font-sans ${isSelected ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(key)}
                          className="rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="p-2 font-mono font-bold text-blue-700">
                        {item.contNo}
                        {item.sealNo && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Seal: {item.sealNo}
                          </span>
                        )}
                      </td>

                      <td className="p-2 font-mono text-xs font-semibold text-slate-700">
                        {item.jobId}
                      </td>

                      <td className="p-2 font-mono text-slate-600">{item.size}</td>

                      <td className="p-2 font-medium text-[rgb(25,40,57)]">{item.customer}</td>

                      <td className="p-2 text-slate-700">{item.line}</td>

                      <td className="p-2 text-slate-600 font-mono text-[11px]">
                        {item.origin} &rarr; {item.pod}
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. UP16BT2094"
                          value={rowData.vehicleNo !== undefined ? rowData.vehicleNo : item.vehicleNo}
                          onChange={(e) => handleFieldChange(key, 'vehicleNo', e.target.value.toUpperCase())}
                          className="w-28 px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs uppercase focus:outline-none focus:border-blue-500 font-bold"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Driver Name"
                          value={rowData.driverName !== undefined ? rowData.driverName : item.driverName}
                          onChange={(e) => handleFieldChange(key, 'driverName', e.target.value)}
                          className="w-28 px-2 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Mobile No"
                          value={rowData.driverPhone !== undefined ? rowData.driverPhone : item.driverPhone}
                          onChange={(e) => handleFieldChange(key, 'driverPhone', e.target.value)}
                          className="w-24 px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleGenerateGr(item)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-2xs flex items-center gap-1 transition cursor-pointer ml-auto"
                          title="Generate Goods Lorry Receipt"
                        >
                          <PlusCircle className="w-3 h-3" />
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

      {/* ================= PRINTABLE GR (LORRY RECEIPT / BILTY) MODAL ================= */}
      {activeGrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  Goods Lorry Receipt (GR / Bilty) Generated!
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveGrModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable GR Slip Card */}
            <div className="p-5 rounded-xl border-2 border-slate-300 bg-slate-50 space-y-4 font-mono text-xs">
              <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                <div>
                  <div className="font-bold text-sm text-[rgb(25,40,57)]">SPJ Freight Logistics Ltd</div>
                  <div className="text-[11px] text-slate-500">Dadri ICD Complex, Greater Noida, UP</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase font-bold">Lorry Receipt No.</div>
                  <div className="text-base font-bold text-emerald-700">{activeGrModal.grNo}</div>
                  <div className="text-[11px] text-slate-500">Date: {activeGrModal.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-slate-500 block text-[11px]">Consignor (Shipper):</span>
                  <span className="font-bold text-[rgb(25,40,57)]">{activeGrModal.customer}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Consignee (Buyer):</span>
                  <span className="font-bold text-[rgb(25,40,57)]">{activeGrModal.consignee}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">From Location:</span>
                  <span className="font-bold text-slate-800">{activeGrModal.origin}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">To / Gateway Port:</span>
                  <span className="font-bold text-blue-700">{activeGrModal.pod}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Container No &amp; Size:</span>
                  <span className="font-bold text-blue-700 font-mono">{activeGrModal.contNo} ({activeGrModal.size})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Seal &amp; Weight:</span>
                  <span className="font-bold">{activeGrModal.sealNo}{activeGrModal.agentSeal ? ` | Cust: ${activeGrModal.agentSeal}` : ''} &bull; {activeGrModal.weight} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Vehicle / Truck No:</span>
                  <span className="font-bold text-emerald-700 font-mono">{activeGrModal.vehicleNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Driver Details:</span>
                  <span className="font-bold">{activeGrModal.driverName} ({activeGrModal.driverPhone})</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>Print GR Copy</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGrModal(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
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
