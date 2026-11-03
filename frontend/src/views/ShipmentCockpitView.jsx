import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Ship,
  Search,
  Download,
  Receipt,
  ArrowRight
} from 'lucide-react';

export default function ShipmentCockpitView({
  jobs = [],
  job = null,
  onGoToBilling,
  onSelectJob,
  onNewBookingClick
}) {
  const [selectedJobState, setSelectedJobState] = useState(job || jobs[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [portFilter, setPortFilter] = useState('ALL');

  // Milestone stages (Exact SPJ-2 Lifecycle)
  const milestoneStages = [
    { key: 'ALLOTTED', label: 'Allotted' },
    { key: 'STUFFED', label: 'Stuffed' },
    { key: 'ICD_GATE_IN', label: 'ICD Gate In' },
    { key: 'RAIL_OUT', label: 'Rail Out' },
    { key: 'PORT_GATE_IN', label: 'Port In' },
    { key: 'SOB', label: 'SOB / Sailed' },
    { key: 'DISCHARGED', label: 'Discharged' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const currentJob = selectedJobState || job || jobs[0] || null;

  // Local containers state for active job
  const [containers, setContainers] = useState(() => {
    if (!currentJob) return [];
    return currentJob.containers || [];
  });

  // Sync containers when currentJob changes or jobs update from PostgreSQL
  useEffect(() => {
    if (job) {
      setSelectedJobState(job);
      setContainers(job.containers || []);
    } else if (jobs.length > 0) {
      if (!selectedJobState) {
        setSelectedJobState(jobs[0]);
        setContainers(jobs[0].containers || []);
      } else {
        const found = jobs.find(j => j.id === selectedJobState.id);
        if (found) {
          setSelectedJobState(found);
          setContainers(found.containers || []);
        }
      }
    }
  }, [jobs, job]);

  useEffect(() => {
    if (selectedJobState) {
      setContainers(selectedJobState.containers || []);
    }
  }, [selectedJobState]);

  const advanceMilestone = async (idx) => {
    const updated = [...containers];
    const current = updated[idx].status || 'ALLOTTED';
    const curIdx = milestoneStages.findIndex((m) => m.key === current);
    const nextIdx = (curIdx + 1) % milestoneStages.length;
    const nextStage = milestoneStages[nextIdx].key;
    updated[idx].status = nextStage;
    setContainers(updated);

    // Call API to persist milestone change in PostgreSQL
    if (updated[idx].id) {
      try {
        await api.advanceMilestone({
          containerId: updated[idx].id,
          milestone: nextStage
        });
      } catch (err) {
        console.warn('Milestone advance API warning:', err);
      }
    }
  };

  const handleContainerFieldChange = (idx, field, value) => {
    const updated = [...containers];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setContainers(updated);
  };

  // Filter jobs list safely
  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    if (lineFilter !== 'ALL' && (j.line || j.shippingLine) !== lineFilter) return false;
    if (portFilter !== 'ALL' && (j.pod || j.toLocation) !== portFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const id = String(j.id || j.joNo || '').toLowerCase();
    const cust = String(j.customer || j.consignor || '').toLowerCase();
    const ln = String(j.line || j.shippingLine || '').toLowerCase();
    const bk = String(j.bookingNo || '').toLowerCase();
    const vs = String(j.vessel || '').toLowerCase();
    return id.includes(q) || cust.includes(q) || ln.includes(q) || bk.includes(q) || vs.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
            Shipment Status
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Container Movement Tracking &bull; Milestones &bull; Rail Out &bull; SOB &bull; Discharge Updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting Movement Sheet to CSV...')}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Movement Sheet</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Job No, Customer, Vessel, Booking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="ALL">All Milestones</option>
          {milestoneStages.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Jobs Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
            Job Orders Tracking Register
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {filteredJobs.length} active job(s)
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Job Order</th>
                <th className="py-2.5 px-3">Customer (Shipper)</th>
                <th className="py-2.5 px-3">Line</th>
                <th className="py-2.5 px-3">Booking No</th>
                <th className="py-2.5 px-3">Routing</th>
                <th className="py-2.5 px-3">Vessel</th>
                <th className="py-2.5 px-3">Containers</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No active shipments found. Create a Container Booking to begin tracking.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => {
                      setSelectedJobState(j);
                      setContainers(j.containers || []);
                    }}
                    className={
                      'hover:bg-slate-50/80 cursor-pointer transition ' +
                      (currentJob && currentJob.id === j.id ? 'bg-blue-50/50' : '')
                    }
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{j.id || j.joNo}</td>
                    <td className="py-2.5 px-3 font-medium text-[rgb(25,40,57)]">{j.customer || j.consignor}</td>
                    <td className="py-2.5 px-3 text-slate-700">{j.line || j.shippingLine}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{j.bookingNo || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {j.origin || j.fromLocation} &rarr; <span className="font-semibold text-blue-700">{j.pod || j.toLocation}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{j.vessel || 'TBA'}</td>
                    <td className="py-2.5 px-3 font-mono">{j.containersCount || (j.containers && j.containers.length) || 1} Cont</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {j.status || 'BOOKED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobState(j);
                          setContainers(j.containers || []);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        View Units &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Job Order Container Units Details Panel */}
      {currentJob && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  Job Order: {currentJob.id || currentJob.joNo}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  {currentJob.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                <span className="font-semibold text-[rgb(25,40,57)]">{currentJob.customer || currentJob.consignor}</span> &bull; {currentJob.origin || currentJob.fromLocation} &rarr;{' '}
                <span className="font-semibold text-blue-700">{currentJob.pod || currentJob.toLocation}</span> &bull; Vessel:{' '}
                <span className="font-semibold text-[rgb(25,40,57)]">{currentJob.vessel || 'TBA'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onGoToBilling}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Go To Invoice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Sr.</th>
                  <th className="py-2.5 px-3">Cont No *</th>
                  <th className="py-2.5 px-3">Size/Type</th>
                  <th className="py-2.5 px-3">Seal No</th>
                  <th className="py-2.5 px-3">Gross Wt (kg)</th>
                  <th className="py-2.5 px-3">Vehicle No</th>
                  <th className="py-2.5 px-3">GR No</th>
                  <th className="py-2.5 px-3 text-right">Shipment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No container units attached to this job order.
                    </td>
                  </tr>
                ) : (
                  containers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="e.g. MSKU1234567"
                          value={c.no || c.containerNo || ''}
                          onChange={(e) => handleContainerFieldChange(idx, 'no', e.target.value.toUpperCase())}
                          className="px-2 py-1 rounded border border-slate-200 font-mono font-bold text-blue-700 text-xs w-32 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{c.size || c.sizeType || '40HC'}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="e.g. MSK98124"
                          value={c.seal || c.sealNo || ''}
                          onChange={(e) => handleContainerFieldChange(idx, 'seal', e.target.value.toUpperCase())}
                          className="px-2 py-1 rounded border border-slate-200 font-mono text-xs w-28 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          placeholder="e.g. 27500"
                          value={c.gross || c.grossWeight || ''}
                          onChange={(e) => handleContainerFieldChange(idx, 'gross', Number(e.target.value))}
                          className="px-2 py-1 rounded border border-slate-200 font-mono text-xs w-24 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="e.g. UP16BT9912"
                          value={c.truck || c.truckNo || ''}
                          onChange={(e) => handleContainerFieldChange(idx, 'truck', e.target.value.toUpperCase())}
                          className="px-2 py-1 rounded border border-slate-200 font-mono text-xs w-28 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="e.g. GR-8841"
                          value={c.gr || c.grNumber || ''}
                          onChange={(e) => handleContainerFieldChange(idx, 'gr', e.target.value.toUpperCase())}
                          className="px-2 py-1 rounded border border-slate-200 font-mono text-xs font-semibold text-emerald-700 w-24 focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => advanceMilestone(idx)}
                          title="Click to advance status"
                          className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer"
                        >
                          ● {c.status || 'ALLOTTED'} &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
