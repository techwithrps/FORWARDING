import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  Navigation,
  FileCheck,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function FleetMovementView({ jobs = [], activeSubPage = 'RunningPosition' }) {
  const [activeTab, setActiveTab] = useState(activeSubPage === 'TripClose' ? 'CLOSE' : 'RUNNING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'UPDATE_LOCATION' or 'CLOSE_TRIP'
  const [locationInput, setLocationInput] = useState('');
  const [receiverInput, setReceiverInput] = useState('');
  const [notice, setNotice] = useState('');

  // Extract containers from jobs
  const containers = [];
  jobs.forEach((j) => {
    (j.containers || []).forEach((c) => {
      containers.push({
        id: c.id,
        containerNo: c.no || c.containerNo || 'MSKU-TBA',
        size: c.size || c.sizeType || '40HC',
        jobNo: j.id || j.joNo,
        customer: j.customer || j.consignor || 'Fair Exports (India)',
        origin: j.origin || j.fromLocation || 'Dadri ICD',
        destination: j.pod || j.toLocation || 'Jebel Ali',
        vessel: j.vessel || 'MAERSK COLOMBO',
        truckNo: c.truck || c.truckNo || 'UP16BT9912',
        driverName: c.driverName || 'Ramesh Kumar',
        driverMobile: c.driverMobile || '9876543210',
        currentLocation: c.currentLocation || 'Khurja-Dadri Dedicated Freight Corridor (DFC)',
        runningStatus: c.runningStatus || 'IN_TRANSIT',
        tripClosed: c.tripClosed || false,
        tripCloseDate: c.tripCloseDate || null,
        podReceivedBy: c.podReceivedBy || ''
      });
    });
  });

  const handleUpdateLocationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContainer) return;
    try {
      await api.updateRunningPosition({
        containerId: selectedContainer.id || selectedContainer.containerNo,
        currentLocation: locationInput,
        runningStatus: 'IN_TRANSIT'
      });
      selectedContainer.currentLocation = locationInput;
      setNotice('Vehicle Running Position updated in live GPS tracking!');
      setTimeout(() => setNotice(''), 3000);
      setModalMode(null);
    } catch (err) {
      alert('Error updating position: ' + err.message);
    }
  };

  const handleTripCloseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContainer) return;
    try {
      await api.updateTripClose({
        containerId: selectedContainer.id || selectedContainer.containerNo,
        podReceivedBy: receiverInput || 'Terminal Gate Inspector'
      });
      selectedContainer.tripClosed = true;
      selectedContainer.runningStatus = 'COMPLETED';
      selectedContainer.podReceivedBy = receiverInput;
      setNotice('Trip closed successfully! POD signed & vehicle released.');
      setTimeout(() => setNotice(''), 3000);
      setModalMode(null);
    } catch (err) {
      alert('Error closing trip: ' + err.message);
    }
  };

  const filtered = containers.filter((c) => {
    if (activeTab === 'CLOSE' && c.runningStatus === 'COMPLETED') return true;
    if (activeTab === 'RUNNING' && c.runningStatus === 'COMPLETED') return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const cno = String(c.containerNo || '').toLowerCase();
    const trk = String(c.truckNo || '').toLowerCase();
    const loc = String(c.currentLocation || '').toLowerCase();
    const cust = String(c.customer || '').toLowerCase();
    return cno.includes(q) || trk.includes(q) || loc.includes(q) || cust.includes(q);
  });

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              {activeTab === 'RUNNING' ? '22. Running Position' : '23. Trip Close'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Fleet &amp; Rail Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            En-route GPS tracking &bull; DFC Wagon movement &bull; Trip Closure &bull; Driver Turnaround Time
          </p>
        </div>

        {notice && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            {notice}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('RUNNING')}
          className={
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ' +
            (activeTab === 'RUNNING'
              ? 'bg-blue-50 text-blue-700 font-semibold border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
          }
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>22. Running Position ({containers.filter(c => c.runningStatus !== 'COMPLETED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CLOSE')}
          className={
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ' +
            (activeTab === 'CLOSE'
              ? 'bg-blue-50 text-blue-700 font-semibold border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
          }
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>23. Trip Close ({containers.filter(c => c.runningStatus === 'COMPLETED').length})</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Container No, Truck No, Live Location, Shipper..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-500">
          Total: {filtered.length} units
        </span>
      </div>

      {/* Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Container No</th>
                <th className="py-2.5 px-3">Job / Shipper</th>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3">Vehicle / Truck</th>
                <th className="py-2.5 px-3">Driver Details</th>
                <th className="py-2.5 px-3">Current Running Position</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    No active trips under this status. Book containers or generate GR to initiate movement.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{c.containerNo} ({c.size})</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[rgb(25,40,57)]">{c.customer}</div>
                      <div className="font-mono text-[10px] text-slate-400">{c.jobNo}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {c.origin} &rarr; <span className="font-semibold text-blue-700">{c.destination}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{c.truckNo}</td>
                    <td className="py-3 px-3">
                      <div>{c.driverName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{c.driverMobile}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-medium">{c.currentLocation}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ' +
                          (c.runningStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200')
                        }
                      >
                        {c.runningStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {c.runningStatus !== 'COMPLETED' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedContainer(c);
                              setLocationInput(c.currentLocation);
                              setModalMode('UPDATE_LOCATION');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                          >
                            Update GPS
                          </button>
                          <button
                            onClick={() => {
                              setSelectedContainer(c);
                              setReceiverInput('');
                              setModalMode('CLOSE_TRIP');
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs cursor-pointer"
                          >
                            Close Trip
                          </button>
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-mono font-semibold text-[11px]">
                          POD Verified ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Position Modal */}
      {modalMode === 'UPDATE_LOCATION' && selectedContainer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Update Running Position: {selectedContainer.containerNo}</span>
              </h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleUpdateLocationSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-medium">Current En-Route Location / Toll / DFC Crossing *</label>
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Rewari Junction DFC Yard, Haryana"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">Save Position</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trip Close Modal */}
      {modalMode === 'CLOSE_TRIP' && selectedContainer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Close Trip: {selectedContainer.containerNo}</span>
              </h2>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleTripCloseSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-medium">Destination Gate-In Officer / Consignee Receiver Name *</label>
                <input
                  type="text"
                  required
                  value={receiverInput}
                  onChange={(e) => setReceiverInput(e.target.value)}
                  placeholder="e.g. Officer S. K. Verma (JNPT Port Gate 4)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                Closing this trip records Proof of Delivery (POD), releases vehicle <span className="font-bold">{selectedContainer.truckNo}</span> for new assignments, and stamps the milestone as GATE_IN.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer">Confirm Trip Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
