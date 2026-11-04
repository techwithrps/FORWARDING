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

export default function TripPendencyView({ jobs = [], onUpdateContainerGR, onNewBookingClick }) {
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
          jobId: job.id,
          contIndex: idx,
          contNo: c.no || 'TBA',
          size: c.size || '40HC',
          customer: job.customer || 'Consignor',
          consignee: job.consignee || 'Consignee',
          line: job.line || 'Shipping Line',
          origin: job.origin || 'Dadri ICD',
          pod: job.pod || 'Port',
          bookingNo: job.bookingNo || '-',
          sealNo: c.seal || c.sealNo || '',
          agentSeal: c.agentSeal || c.customSeal || '',
          cargoWeight: c.cargoWeight || 24000,
          vehicleNo: c.truck && c.truck !== 'TBA' ? c.truck : '',
          driverName: '',
          driverPhone: '',
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

  return (
    <div className="space-y-6 w-full">
      {/* Header (Exact SPJ-2 Screen Title: Trip Pendency) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              20. Trip Pendency &amp; 21. GR Generation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {pendingContainers.length} Containers Awaiting GR
            </span>
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

      {/* Info Alert explaining the Rule from FREIGHT_FORWARDING.docx */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 shadow-xs">
        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Doc Business Logic (Item 20): </span>
          <span>
            Jaise hi container book hota hai aur uska GR generate nahi hua, wo automatically is Trip Pendency queue me dikhta hai. 
            Truck No aur Driver punch karke <strong>Generate GR</strong> dabate hi wo Lorry Receipt generate karta hai aur movement ke liye <strong>Shipment Status</strong> me chala jata hai.
          </span>
        </div>
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
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Customers (Consignors)</option>
              <option value="Fair Exports (India) Pvt Ltd">Fair Exports (India) Pvt Ltd</option>
              <option value="Marhaba Frozen Foods">Marhaba Frozen Foods</option>
              <option value="Allanasons Private Limited">Allanasons Private Limited</option>
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
                <th className="p-2.5 font-semibold min-w-[110px]">Route</th>
                <th className="p-2.5 font-semibold min-w-[110px]">Vehicle No *</th>
                <th className="p-2.5 font-semibold min-w-[110px]">Driver Name</th>
                <th className="p-2.5 font-semibold min-w-[100px]">Driver Phone</th>
                <th className="p-2.5 font-semibold min-w-[110px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400 font-sans">
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
                  const rowData = allotmentData[key] || {};
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
                      <td className="p-2 font-mono font-bold text-blue-700">{item.jobId}</td>
                      <td className="p-2 font-mono font-bold text-[rgb(25,40,57)]">{item.contNo}</td>
                      <td className="p-2 font-mono text-slate-600">{item.size}</td>
                      <td className="p-2 font-medium text-[rgb(25,40,57)]">{item.customer}</td>
                      <td className="p-2 text-slate-700">{item.line}</td>
                      <td className="p-2 text-slate-600 font-mono text-[11px]">
                        {item.origin} &rarr; {item.pod}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="UP16BT...."
                          value={rowData.vehicleNo !== undefined ? rowData.vehicleNo : item.vehicleNo}
                          onChange={(e) => handleFieldChange(key, 'vehicleNo', e.target.value.toUpperCase())}
                          className="w-24 px-2 py-1 rounded border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Driver Name"
                          value={rowData.driverName || ''}
                          onChange={(e) => handleFieldChange(key, 'driverName', e.target.value)}
                          className="w-28 px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Mobile No"
                          value={rowData.driverPhone || ''}
                          onChange={(e) => handleFieldChange(key, 'driverPhone', e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>
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
                  <span className="text-slate-500 block">Seal &amp; Weight:</span>
                  <span className="font-bold">{activeGrModal.sealNo}{activeGrModal.agentSeal ? ` | Cust: ${activeGrModal.agentSeal}` : ''} &bull; {activeGrModal.weight} kg</span>
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
