import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  RefreshCw,
  Edit2
} from 'lucide-react';

export default function FleetMovementView({ jobs = [], activeSubPage = 'RunningPosition' }) {
  const [activeTab, setActiveTab] = useState(activeSubPage === 'TripClose' ? 'CLOSE' : 'RUNNING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'UPDATE_LOCATION' or 'CLOSE_TRIP'
  const [locationInput, setLocationInput] = useState('');
  const [runningStatusInput, setRunningStatusInput] = useState('IN_TRANSIT');
  const [receiverInput, setReceiverInput] = useState('');
  const [notice, setNotice] = useState('');
  const [liveContainers, setLiveContainers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Status Milestone Dates (Requirement 10)
  const [statusDates, setStatusDates] = useState({
    emptyOutDate: '',
    factoryGateInDate: '',
    factoryGateOutDate: '',
    bufferInDate: '',
    loadedIcdInDate: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getRunningPosition();
      if (res?.data && Array.isArray(res.data)) {
        setLiveContainers(res.data);
      }
    } catch (e) {
      console.warn('Could not load live running position:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combine live containers with in-memory jobs
  const seen = new Set();
  const containers = [];

  liveContainers.forEach((c) => {
    const cno = (c.containerNo || c.container_number || '').trim();
    if (cno) seen.add(cno.toUpperCase());
    containers.push({
      id: c.id,
      containerNo: cno || 'TBA',
      size: c.sizeType || '40HC',
      jobNo: c.jobNo || c.job_number || 'JO',
      customer: c.customer || c.shipper || 'Fair Exports (India) Pvt Ltd',
      origin: c.origin || 'Dadri ICD',
      destination: c.destination || 'Port',
      vessel: c.vessel || 'MAERSK COLOMBO',
      truckNo: c.truckNo || c.truck_number || 'UP16BT9912',
      driverName: c.driverName || c.driver_name || 'Ramesh Kumar',
      driverMobile: c.driverMobile || c.driver_mobile || '9876543210',
      currentLocation: c.currentLocation || c.current_location || 'Dadri ICD to Gateway Port',
      runningStatus: c.runningStatus || c.running_status || 'IN_TRANSIT',
      tripClosed: Boolean(c.tripCloseDate || c.trip_close_date || c.runningStatus === 'COMPLETED'),
      tripCloseDate: c.tripCloseDate || c.trip_close_date || null,
      podReceivedBy: c.podReceivedBy || c.pod_received_by || '',
      emptyOutDate: c.emptyOutDate || '',
      factoryGateInDate: c.factoryGateInDate || '',
      factoryGateOutDate: c.factoryGateOutDate || '',
      bufferInDate: c.bufferInDate || '',
      loadedIcdInDate: c.loadedIcdInDate || ''
    });
  });

  jobs.forEach((j) => {
    (j.containers || []).forEach((c) => {
      const cno = (c.no || c.containerNo || '').trim();
      if (cno && !seen.has(cno.toUpperCase())) {
        seen.add(cno.toUpperCase());
        containers.push({
          id: c.id,
          containerNo: cno || 'MSKU-TBA',
          size: c.size || c.sizeType || '40HC',
          jobNo: j.id || j.joNo,
          customer: j.customer || j.consignor || 'Fair Exports (India)',
          origin: j.origin || j.fromLocation || 'Dadri ICD',
          destination: j.pod || j.toLocation || 'Jebel Ali',
          vessel: j.vessel || 'MAERSK COLOMBO',
          truckNo: c.truck || c.truckNo || 'UP16BT9912',
          driverName: c.driverName || 'Ramesh Kumar',
          driverMobile: c.driverMobile || '9876543210',
          currentLocation: c.currentLocation || 'Dadri Dedicated Freight Corridor (DFC)',
          runningStatus: c.runningStatus || 'IN_TRANSIT',
          tripClosed: c.tripClosed || false,
          tripCloseDate: c.tripCloseDate || null,
          podReceivedBy: c.podReceivedBy || '',
          emptyOutDate: c.emptyOutDate || '',
          factoryGateInDate: c.factoryGateInDate || '',
          factoryGateOutDate: c.factoryGateOutDate || '',
          bufferInDate: c.bufferInDate || '',
          loadedIcdInDate: c.loadedIcdInDate || ''
        });
      }
    });
  });

  const handleOpenUpdateModal = (c) => {
    setSelectedContainer(c);
    setLocationInput(c.currentLocation || '');
    setRunningStatusInput(c.runningStatus || 'IN_TRANSIT');
    setStatusDates({
      emptyOutDate: c.emptyOutDate || '',
      factoryGateInDate: c.factoryGateInDate || '',
      factoryGateOutDate: c.factoryGateOutDate || '',
      bufferInDate: c.bufferInDate || '',
      loadedIcdInDate: c.loadedIcdInDate || ''
    });
    setModalMode('UPDATE_LOCATION');
  };

  const handleUpdateLocationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContainer) return;
    try {
      await api.updateRunningPosition({
        containerId: selectedContainer.id || selectedContainer.containerNo,
        currentLocation: locationInput,
        runningStatus: runningStatusInput,
        emptyOutDate: statusDates.emptyOutDate || null,
        factoryGateInDate: statusDates.factoryGateInDate || null,
        factoryGateOutDate: statusDates.factoryGateOutDate || null,
        bufferInDate: statusDates.bufferInDate || null,
        loadedIcdInDate: statusDates.loadedIcdInDate || null
      });
      selectedContainer.currentLocation = locationInput;
      selectedContainer.runningStatus = runningStatusInput;
      selectedContainer.emptyOutDate = statusDates.emptyOutDate;
      selectedContainer.factoryGateInDate = statusDates.factoryGateInDate;
      selectedContainer.factoryGateOutDate = statusDates.factoryGateOutDate;
      selectedContainer.bufferInDate = statusDates.bufferInDate;
      selectedContainer.loadedIcdInDate = statusDates.loadedIcdInDate;

      setNotice('Running Position & Status milestone dates updated successfully!');
      setTimeout(() => setNotice(''), 3000);
      setModalMode(null);
      loadData();
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
      loadData();
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
                            onClick={() => handleOpenUpdateModal(c)}
                            className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold text-[11px] border border-blue-200 transition cursor-pointer flex items-center gap-1"
                            title="Update Status milestone dates & running position"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Update Status</span>
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
                        <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-rose-600" />
                          <span>Closed</span>
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

      {/* Update Position & Status Milestone Dates Modal (Requirement 10) */}
      {modalMode === 'UPDATE_LOCATION' && selectedContainer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Update Status &amp; Running Position: {selectedContainer.containerNo}</span>
                </h2>
                <p className="text-[10px] text-slate-400">
                  Vehicle: <strong className="text-slate-700">{selectedContainer.truckNo}</strong> &bull; Driver: {selectedContainer.driverName}
                </p>
              </div>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateLocationSubmit} className="space-y-3.5 text-xs">
              {/* En-Route Current Location */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-700">Current En-Route Location / Toll / DFC Crossing *</label>
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Rewari Junction DFC Yard, Haryana"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {/* Running Status Stage */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-700">Movement Stage / Status</label>
                <select
                  value={runningStatusInput}
                  onChange={(e) => setRunningStatusInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans bg-white"
                >
                  <option value="IN_TRANSIT">In Transit (En-route)</option>
                  <option value="EMPTY_PICKUP">Empty Picked Up from Depot</option>
                  <option value="FACTORY_GATE_IN">Factory Gate In</option>
                  <option value="FACTORY_STUFFING">Factory Stuffing in Progress</option>
                  <option value="FACTORY_GATE_OUT">Factory Gate Out (Laden)</option>
                  <option value="BUFFER_YARD">Buffer Yard Parking</option>
                  <option value="LOADED_ICD_IN">Loaded Container ICD In</option>
                  <option value="PORT_GATE_IN">Port Terminal Gate In</option>
                </select>
              </div>

              {/* 5 Specific Status Milestone Dates (Requirement 10) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Logistics Milestone Dates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                      Empty Out Date from ICD
                    </label>
                    <input
                      type="date"
                      value={statusDates.emptyOutDate}
                      onChange={(e) => setStatusDates({ ...statusDates, emptyOutDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                      Factory Gate In Date
                    </label>
                    <input
                      type="date"
                      value={statusDates.factoryGateInDate}
                      onChange={(e) => setStatusDates({ ...statusDates, factoryGateInDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                      Factory Gate Out Date
                    </label>
                    <input
                      type="date"
                      value={statusDates.factoryGateOutDate}
                      onChange={(e) => setStatusDates({ ...statusDates, factoryGateOutDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                      Buffer In Date
                    </label>
                    <input
                      type="date"
                      value={statusDates.bufferInDate}
                      onChange={(e) => setStatusDates({ ...statusDates, bufferInDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-extrabold text-slate-600 uppercase block mb-0.5">
                      Loaded ICD In Date
                    </label>
                    <input
                      type="date"
                      value={statusDates.loadedIcdInDate}
                      onChange={(e) => setStatusDates({ ...statusDates, loadedIcdInDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Save Status &amp; Position</button>
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
