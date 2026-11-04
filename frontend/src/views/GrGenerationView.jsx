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

export default function GrGenerationView({ jobs = [], onUpdateContainerGR, onNewBookingClick, onNavigateToGrSearching }) {
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
          sealNo: c.seal || '',
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
          <button
            type="button"
            onClick={onNavigateToGrSearching}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>GR Searching</span>
          </button>

          <button
            onClick={onNewBookingClick}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Generate GR</span>
          </button>
        </div>
      </div>

         </div>
  );
}