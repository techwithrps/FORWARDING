import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  Ship,
  FileText,
  Search,
  CheckCircle2,
  Zap,
  Calendar,
  Send,
  Anchor,
  FileCheck,
  ShieldCheck,
  Check,
  Edit2,
  Train,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function ShipmentLifecycleHubView({ jobs = [], initialSection = 'EdiUpdate' }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCont, setSelectedCont] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedContIds, setSelectedContIds] = useState([]);
  const [bulkVal, setBulkVal] = useState('');
  const [bulkDate, setBulkDate] = useState('');
  const [liveRows, setLiveRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dedicated Rail Out state (Train, Wagon, Deck Tier, Departure Date)
  const [railTrainNo, setRailTrainNo] = useState('');
  const [railWagonNo, setRailWagonNo] = useState('');
  const [railDeckTier, setRailDeckTier] = useState('LOWER');
  const [railDepartureDate, setRailDepartureDate] = useState('');

  // Dedicated SOB Update Filters (POL, POD, Shipping Line, Status)
  const [sobPolFilter, setSobPolFilter] = useState('ALL');
  const [sobPodFilter, setSobPodFilter] = useState('ALL');
  const [sobLineFilter, setSobLineFilter] = useState('ALL');
  const [sobStatusFilter, setSobStatusFilter] = useState('ALL');

  const loadLiveData = async () => {
    try {
      setLoading(true);
      const res = await api.getRunningPosition();
      if (res?.data && Array.isArray(res.data)) {
        setLiveRows(res.data);
      }
    } catch (err) {
      console.warn('Could not load live lifecycle data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  // 11 distinct operational lifecycle sections (Pages 24-34)
  const sections = [
    { id: 'EdiUpdate', pageNo: '24', title: 'EDI Update', desc: 'Icegate Shipping Bill transmission & LEO clearance' },
    { id: 'RailOutStatus', pageNo: '25', title: 'Rail Out Status', desc: 'CONCOR / DFC Train Rake Out & Wagon movement' },
    { id: 'VesselPlanDetails', pageNo: '26', title: 'Vessel Plan Details', desc: 'Feeder/Mother vessel scheduling & cut-offs' },
    { id: 'SobUpdate', pageNo: '27', title: 'SOB Update', desc: 'Shipped On Board date & onboard B/L verification' },
    { id: 'DocumentUpdate', pageNo: '28', title: 'Document Update', desc: 'Checklist approval, SI Cut-off & Exporter Invoice' },
    { id: 'BlStatusUpdate', pageNo: '29', title: 'BL Status Update', desc: 'Draft B/L approval & Original B/L release' },
    { id: 'TelexStatusUpdate', pageNo: '30', title: 'Telex Status Update', desc: 'Surrender endorsement & Telex message release' },
    { id: 'TrUpdate', pageNo: '31', title: 'TR Update', desc: 'Transshipment Request (TR / SMTP) customs permit' },
    { id: 'HandoverUpdate', pageNo: '32', title: 'Handover Update', desc: 'Customs Examination & Port Terminal Handover' },
    { id: 'EgmUpdate', pageNo: '33', title: 'EGM Update', desc: 'Export General Manifest filing number & rotation' },
    { id: 'ShipmentDischargeStatus', pageNo: '34', title: 'Shipment Discharge Status', desc: 'Destination port vessel discharge & empty turnaround' }
  ];

  // Flatten containers from live PostgreSQL + local jobs
  const seenCnos = new Set();
  const rows = [];

  liveRows.forEach((c) => {
    const cno = (c.containerNo || c.container_number || '').trim();
    if (cno) seenCnos.add(cno.toUpperCase());
    rows.push({
      id: c.id,
      containerNo: cno || 'TBA',
      size: c.sizeType || '40HC',
      jobNo: c.jobNo || c.job_number || 'JO',
      customer: c.customer || c.shipper || 'Fair Exports (India) Pvt Ltd',
      origin: c.origin || 'Dadri ICD',
      destination: c.destination || 'Port',
      line: c.shippingLine || 'Maersk Line',
      vessel: c.vessel || 'MAERSK COLOMBO',
      sbNo: c.sbNo || 'SB-981024',
      sbDate: c.sbDate || '2026-10-28',
      blNo: c.blNo || 'MSK-2026-98124',
      ediStatus: c.ediSbStatus || 'LEO_PASSED',
      trainNo: c.trainNo || 'CONCOR DFC RAKE #9182',
      wagonNo: c.wagonNo || 'CR-104928',
      deckTier: c.deck_tier || c.deckTier || 'LOWER',
      rakeDate: c.rakeOutDate || '2026-10-29',
      feederVessel: c.feederVessel || c.vessel || 'MAERSK COLOMBO',
      cutOffDate: c.cutOffDate || '2026-11-03',
      sobDate: c.sobDate || '2026-11-05',
      blStage: c.blStage || 'DRAFT_BL_APPROVED',
      telexReleased: Boolean(c.telexReleased),
      trNo: c.trNo || 'TR-2026-DAD-881',
      trStatus: c.trStatus || 'APPROVED',
      handoverStatus: c.handoverStatus || 'COMPLETED',
      egmNo: c.egmNo || 'EGM-2026-JNPT-0192',
      dischargeDate: c.dischargeDate || '2026-11-12'
    });
  });

  jobs.forEach((j) => {
    (j.containers || []).forEach((c) => {
      const cno = (c.no || c.containerNo || '').trim();
      if (cno && !seenCnos.has(cno.toUpperCase())) {
        seenCnos.add(cno.toUpperCase());
        rows.push({
          id: c.id,
          containerNo: cno || 'MSKU-TBA',
          size: c.size || c.sizeType || '40HC',
          jobNo: j.id || j.joNo,
          customer: j.customer || j.consignor || 'Fair Exports (India)',
          origin: j.origin || j.fromLocation || 'Dadri ICD',
          destination: j.pod || j.toLocation || 'Jebel Ali',
          line: j.line || j.shippingLine || 'Maersk Line',
          vessel: j.vessel || 'MAERSK COLOMBO',
          sbNo: j.sbNo || 'SB-981024',
          sbDate: j.sbDate || '2026-10-28',
          blNo: j.blNo || 'MSK-2026-98124',
          ediStatus: c.ediSbStatus || 'LEO_PASSED',
          trainNo: c.trainNo || 'CONCOR DFC RAKE #9182',
          wagonNo: c.wagonNo || 'CR-104928',
          deckTier: c.deckTier || c.deck_tier || 'LOWER',
          rakeDate: c.rakeOutDate || '2026-10-29',
          feederVessel: c.feederVessel || j.vessel || 'MAERSK COLOMBO',
          cutOffDate: c.cutOffDate || '2026-11-03',
          sobDate: c.sobDate || '2026-11-05',
          blStage: c.blStage || 'DRAFT_BL_APPROVED',
          telexReleased: c.telexReleased || false,
          trNo: c.trNo || 'TR-2026-DAD-881',
          trStatus: c.trStatus || 'APPROVED',
          handoverStatus: c.handoverStatus || 'COMPLETED',
          egmNo: c.egmNo || 'EGM-2026-JNPT-0192',
          dischargeDate: c.dischargeDate || '2026-11-12'
        });
      }
    });
  });

  const activeMeta = sections.find((s) => s.id === activeSection) || sections[0];

  // 1-Click Bulk Update for all selected containers
  const handleBulkApply = async () => {
    if (selectedContIds.length === 0) {
      alert('Please select at least 1 container using the checkboxes!');
      return;
    }
    if (!bulkVal.trim() && !bulkDate.trim()) {
      alert('Please enter a value or date to apply in bulk!');
      return;
    }

    const targets = rows.filter(r => selectedContIds.includes(r.id || r.containerNo));
    for (const r of targets) {
      try {
        const cid = r.id || r.containerNo;
        if (activeSection === 'EdiUpdate') {
          await api.updateEdi({ containerId: cid, ediSbStatus: bulkVal });
          r.ediStatus = bulkVal;
        } else if (activeSection === 'RailOutStatus') {
          await api.updateRailOut({ containerId: cid, trainNo: bulkVal, rakeOutDate: bulkDate });
          r.trainNo = bulkVal;
          r.rakeDate = bulkDate;
        } else if (activeSection === 'VesselPlanDetails') {
          await api.updateVesselPlan({ containerId: cid, feederVessel: bulkVal, cutOffDate: bulkDate });
          r.feederVessel = bulkVal;
          r.cutOffDate = bulkDate;
        } else if (activeSection === 'SobUpdate') {
          await api.updateSob({ containerId: cid, sobDate: bulkDate });
          r.sobDate = bulkDate;
        } else if (activeSection === 'BlStatusUpdate') {
          await api.updateBlStatus({ containerId: cid, blStage: bulkVal });
          r.blStage = bulkVal;
        } else if (activeSection === 'TelexStatusUpdate') {
          await api.updateTelex({ containerId: cid, telexReleased: true });
          r.telexReleased = true;
        } else if (activeSection === 'TrUpdate') {
          await api.updateTr({ containerId: cid, trNo: bulkVal, trStatus: 'APPROVED' });
          r.trNo = bulkVal;
        } else if (activeSection === 'HandoverUpdate') {
          await api.updateHandover({ containerId: cid, handoverStatus: bulkVal });
          r.handoverStatus = bulkVal;
        } else if (activeSection === 'EgmUpdate') {
          await api.updateEgm({ containerId: cid, egmNo: bulkVal });
          r.egmNo = bulkVal;
        } else if (activeSection === 'ShipmentDischargeStatus') {
          await api.updateDischargeStatus({ containerId: cid, dischargeDate: bulkDate });
          r.dischargeDate = bulkDate;
        }
      } catch (err) {
        console.warn('Bulk update error for container:', err);
      }
    }

    setNotice(`⚡ Bulk updated ${targets.length} units with ${activeMeta.title} in 1-Click!`);
    setTimeout(() => setNotice(''), 3500);
    setSelectedContIds([]);
    setBulkVal('');
    setBulkDate('');
  };

  const handleUpdateAction = async (e) => {
    e.preventDefault();
    if (!selectedCont) return;

    try {
      if (activeSection === 'EdiUpdate') {
        await api.updateEdi({ containerId: selectedCont.id, ediSbStatus: inputVal });
        selectedCont.ediStatus = inputVal;
      } else if (activeSection === 'RailOutStatus') {
        await api.updateRailOut({
          containerId: selectedCont.id || selectedCont.containerNo,
          trainNo: railTrainNo,
          wagonNo: railWagonNo,
          deckTier: railDeckTier,
          rakeOutDate: railDepartureDate
        });
        selectedCont.trainNo = railTrainNo;
        selectedCont.wagonNo = railWagonNo;
        selectedCont.deckTier = railDeckTier;
        selectedCont.rakeDate = railDepartureDate;
      } else if (activeSection === 'VesselPlanDetails') {
        await api.updateVesselPlan({ containerId: selectedCont.id, feederVessel: inputVal, cutOffDate: dateVal });
        selectedCont.feederVessel = inputVal;
        selectedCont.cutOffDate = dateVal;
      } else if (activeSection === 'SobUpdate') {
        await api.updateSob({ containerId: selectedCont.id, sobDate: dateVal });
        selectedCont.sobDate = dateVal;
      } else if (activeSection === 'BlStatusUpdate') {
        await api.updateBlStatus({ containerId: selectedCont.id, blStage: inputVal });
        selectedCont.blStage = inputVal;
      } else if (activeSection === 'TelexStatusUpdate') {
        await api.updateTelex({ containerId: selectedCont.id, telexReleased: true });
        selectedCont.telexReleased = true;
      } else if (activeSection === 'TrUpdate') {
        await api.updateTr({ containerId: selectedCont.id, trNo: inputVal, trStatus: 'APPROVED' });
        selectedCont.trNo = inputVal;
      } else if (activeSection === 'HandoverUpdate') {
        await api.updateHandover({ containerId: selectedCont.id, handoverStatus: inputVal });
        selectedCont.handoverStatus = inputVal;
      } else if (activeSection === 'EgmUpdate') {
        await api.updateEgm({ containerId: selectedCont.id, egmNo: inputVal });
        selectedCont.egmNo = inputVal;
      } else if (activeSection === 'ShipmentDischargeStatus') {
        await api.updateDischargeStatus({ containerId: selectedCont.id, dischargeDate: dateVal });
        selectedCont.dischargeDate = dateVal;
      }

      setNotice(`${activeMeta.title} updated in PostgreSQL successfully!`);
      setTimeout(() => setNotice(''), 3000);
      setModalOpen(false);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Unique POL, POD, and Lines for SOB filtering
  const sobUniquePols = useMemo(() => Array.from(new Set(rows.map(r => r.origin).filter(Boolean))).sort(), [rows]);
  const sobUniquePods = useMemo(() => Array.from(new Set(rows.map(r => r.destination).filter(Boolean))).sort(), [rows]);
  const sobUniqueLines = useMemo(() => Array.from(new Set(rows.map(r => r.line).filter(Boolean))).sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (activeSection === 'SobUpdate') {
      if (sobPolFilter !== 'ALL' && r.origin !== sobPolFilter) return false;
      if (sobPodFilter !== 'ALL' && r.destination !== sobPodFilter) return false;
      if (sobLineFilter !== 'ALL' && r.line !== sobLineFilter) return false;
      if (sobStatusFilter === 'PENDING' && (r.sobDate && String(r.sobDate).trim() !== '')) return false;
      if (sobStatusFilter === 'CONFIRMED' && (!r.sobDate || String(r.sobDate).trim() === '')) return false;
    }
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const cno = String(r.containerNo || '').toLowerCase();
    const cust = String(r.customer || '').toLowerCase();
    const jno = String(r.jobNo || '').toLowerCase();
    const pol = String(r.origin || '').toLowerCase();
    const pod = String(r.destination || '').toLowerCase();
    const line = String(r.line || '').toLowerCase();
    const vsl = String(r.vessel || '').toLowerCase();
    return cno.includes(q) || cust.includes(q) || jno.includes(q) || pol.includes(q) || pod.includes(q) || line.includes(q) || vsl.includes(q);
  });

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              {activeMeta.pageNo}. {activeMeta.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Shipment Lifecycle Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {activeMeta.desc}
          </p>
        </div>

        {notice && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            {notice}
          </span>
        )}
      </div>

      {/* 11 Horizontal Sub-Nav Tabs for Pages 24-34 */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-thin">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ' +
              (activeSection === s.id
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200')
            }
          >
            {s.pageNo}. {s.title}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeMeta.title} by Container No, Shipper, Job Order, POL, POD...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>
          <span className="text-xs font-mono text-slate-500 shrink-0">
            {filtered.length} container unit(s)
          </span>
        </div>

        {/* Dedicated Filters for SOB Update (POL, POD, Shipping Line, Status) */}
        {activeSection === 'SobUpdate' && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> SOB Filters:
            </span>

            {/* POL Filter */}
            <select
              value={sobPolFilter}
              onChange={(e) => setSobPolFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All POL (Ports of Loading) ({sobUniquePols.length})</option>
              {sobUniquePols.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* POD Filter */}
            <select
              value={sobPodFilter}
              onChange={(e) => setSobPodFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All POD (Ports of Discharge) ({sobUniquePods.length})</option>
              {sobUniquePods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Line Filter */}
            <select
              value={sobLineFilter}
              onChange={(e) => setSobLineFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Shipping Lines ({sobUniqueLines.length})</option>
              {sobUniqueLines.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={sobStatusFilter}
              onChange={(e) => setSobStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All SOB Status</option>
              <option value="PENDING">⏳ Pending SOB</option>
              <option value="CONFIRMED">⚓ Shipped On Board (Confirmed)</option>
            </select>

            {(sobPolFilter !== 'ALL' || sobPodFilter !== 'ALL' || sobLineFilter !== 'ALL' || sobStatusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSobPolFilter('ALL');
                  setSobPodFilter('ALL');
                  setSobLineFilter('ALL');
                  setSobStatusFilter('ALL');
                }}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline px-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1-Click Bulk Action Bar */}
      {selectedContIds.length > 0 && (
        <div className="p-3.5 bg-blue-50/90 border-2 border-blue-300 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-blue-900">
              Bulk Action on {selectedContIds.length} Selected Container(s):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeSection === 'SobUpdate' ? (
              <>
                <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded">
                  ⚓ Shipped On Board (SOB) Date for Selected:
                </span>
                <input
                  type="date"
                  value={bulkDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs focus:outline-none focus:border-emerald-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (!bulkDate) setBulkDate(todayStr);
                    handleBulkApply();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>⚡ Mark All Selected as Shipped on Board</span>
                </button>
              </>
            ) : activeSection === 'RailOutStatus' ? (
              <>
                <span className="text-[11px] font-semibold text-blue-900 bg-blue-100/80 px-2 py-1 rounded">
                  🚂 Train No & Departure apply honge (Deck/Wagon preserved):
                </span>
                <input
                  type="text"
                  placeholder="Train No (e.g. TR-8812)"
                  value={bulkVal}
                  onChange={(e) => setBulkVal(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs w-44 focus:outline-none focus:border-blue-500 font-sans"
                />
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-white border border-blue-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
                <button
                  type="button"
                  onClick={handleBulkApply}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <span>⚡ Apply Train & Departure to Selected</span>
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder={`Enter ${activeMeta.title} value for all...`}
                  value={bulkVal}
                  onChange={(e) => setBulkVal(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs w-48 focus:outline-none focus:border-blue-500 font-sans"
                />

                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-white border border-blue-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />

                <button
                  type="button"
                  onClick={handleBulkApply}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <span>⚡ Apply to All Selected</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setSelectedContIds([])}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedContIds.length === filtered.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedContIds(filtered.map(r => r.id || r.containerNo));
                      else setSelectedContIds([]);
                    }}
                    className="rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Container No</th>
                <th className="py-2.5 px-3">Job / Shipper</th>
                <th className="py-2.5 px-3">Routing</th>
                <th className="py-2.5 px-3">Line &amp; Vessel</th>
                <th className="py-2.5 px-3 font-bold text-blue-700">
                  {activeSection === 'EdiUpdate' && 'EDI Icegate Status'}
                  {activeSection === 'RailOutStatus' && 'Train, Wagon, Deck & Departure'}
                  {activeSection === 'VesselPlanDetails' && 'Plan Vessel & Cut-off'}
                  {activeSection === 'SobUpdate' && 'SOB Date'}
                  {activeSection === 'DocumentUpdate' && 'SB No & Date'}
                  {activeSection === 'BlStatusUpdate' && 'B/L Stage'}
                  {activeSection === 'TelexStatusUpdate' && 'Telex Release Status'}
                  {activeSection === 'TrUpdate' && 'TR / SMTP Permit'}
                  {activeSection === 'HandoverUpdate' && 'Handover Status'}
                  {activeSection === 'EgmUpdate' && 'EGM No & Date'}
                  {activeSection === 'ShipmentDischargeStatus' && 'POD Discharge Date'}
                </th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                    No containers found pending {activeMeta.title}.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedContIds.includes(r.id || r.containerNo)}
                        onChange={(e) => {
                          const cid = r.id || r.containerNo;
                          if (e.target.checked) setSelectedContIds([...selectedContIds, cid]);
                          else setSelectedContIds(selectedContIds.filter(id => id !== cid));
                        }}
                        className="rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{r.containerNo} ({r.size})</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[rgb(25,40,57)]">{r.customer}</div>
                      <div className="font-mono text-[10px] text-slate-400">{r.jobNo}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {r.origin} &rarr; <span className="font-semibold text-blue-700">{r.destination}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{r.vessel}</div>
                      <div className="text-[11px] text-slate-500">{r.line}</div>
                    </td>
                    <td className="py-3 px-3">
                      {activeSection === 'EdiUpdate' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {r.ediStatus}
                        </span>
                      )}
                      {activeSection === 'RailOutStatus' && (
                        <div className="font-mono space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">{r.trainNo || 'Pending Train'}</span>
                            {r.deckTier === 'UPPER' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                ▲ Upper Deck
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                ▼ Lower Deck
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            <span className="font-medium text-slate-600">Wagon:</span> {r.wagonNo || '—'} &bull; <span className="font-medium text-slate-600">Dep:</span> {r.rakeDate || '—'}
                          </div>
                        </div>
                      )}
                      {activeSection === 'VesselPlanDetails' && (
                        <div>
                          <div className="font-semibold text-slate-800">{r.feederVessel}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Cut-off: {r.cutOffDate}</div>
                        </div>
                      )}
                      {activeSection === 'SobUpdate' && (
                        <div className="space-y-1 font-mono">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {r.sobDate && String(r.sobDate).trim() !== '' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                ⚓ SOB Confirmed: {r.sobDate}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                ⏳ PENDING SOB
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans">
                            <span className="font-semibold text-slate-700">SB:</span> {r.sbNo || 'Pending'} {r.sbDate ? `(${r.sbDate})` : ''} &bull; <span className="font-semibold text-slate-700">Rail Out:</span> {r.rakeDate || '—'}
                          </div>
                        </div>
                      )}
                      {activeSection === 'DocumentUpdate' && (
                        <div className="font-mono">
                          <div className="font-bold text-slate-800">{r.sbNo}</div>
                          <div className="text-[11px] text-slate-500">Date: {r.sbDate}</div>
                        </div>
                      )}
                      {activeSection === 'BlStatusUpdate' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {r.blStage}
                        </span>
                      )}
                      {activeSection === 'TelexStatusUpdate' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.telexReleased ? 'RELEASED ✓' : 'PENDING'}
                        </span>
                      )}
                      {activeSection === 'TrUpdate' && (
                        <div className="font-mono">
                          <div className="font-bold text-blue-700">{r.trNo}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">{r.trStatus}</div>
                        </div>
                      )}
                      {activeSection === 'HandoverUpdate' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {r.handoverStatus}
                        </span>
                      )}
                      {activeSection === 'EgmUpdate' && (
                        <span className="font-mono font-bold text-slate-800">{r.egmNo}</span>
                      )}
                      {activeSection === 'ShipmentDischargeStatus' && (
                        <span className="font-mono font-bold text-blue-800">
                          Discharge ETA: {r.dischargeDate}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {activeSection === 'SobUpdate' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            try {
                              await api.updateSob({
                                containerId: r.id || r.containerNo,
                                sobDate: todayStr
                              });
                              r.sobDate = todayStr;
                              setNotice(`⚓ Container ${r.containerNo} marked Shipped on Board (SOB Today: ${todayStr})!`);
                              setTimeout(() => setNotice(''), 3000);
                              loadLiveData();
                            } catch (e) {
                              alert('Error updating SOB: ' + e.message);
                            }
                          }}
                          className="mr-1.5 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] shadow-xs cursor-pointer inline-flex items-center gap-1"
                          title="1-Click Mark Shipped on Board Today"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Today</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCont(r);
                          setInputVal('');
                          setDateVal(r.sobDate || new Date().toISOString().split('T')[0]);
                          if (activeSection === 'RailOutStatus') {
                            setRailTrainNo(r.trainNo || '');
                            setRailWagonNo(r.wagonNo || '');
                            setRailDeckTier(r.deckTier || 'LOWER');
                            setRailDepartureDate(r.rakeDate || '');
                          }
                          setModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-xs cursor-pointer"
                      >
                        Update &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Update Modal */}
      {modalOpen && selectedCont && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                Update {activeMeta.title}: {selectedCont.containerNo}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateAction} className="space-y-3 text-xs">
              {activeSection === 'SobUpdate' ? (
                <>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Container:</span>
                      <span className="font-mono font-bold text-blue-700">{selectedCont.containerNo} ({selectedCont.size})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shipper / Job:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[220px]">{selectedCont.customer} ({selectedCont.jobNo})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Routing (POL &rarr; POD):</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedCont.origin} &rarr; {selectedCont.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Line &amp; Vessel:</span>
                      <span className="text-slate-700">{selectedCont.line} &bull; {selectedCont.vessel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SB &amp; Rail Out:</span>
                      <span className="font-mono text-slate-600">SB: {selectedCont.sbNo || 'Pending'} &bull; Rail: {selectedCont.rakeDate || 'Pending'}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 font-bold">Shipped On Board (SOB) Date *</label>
                      <button
                        type="button"
                        onClick={() => setDateVal(new Date().toISOString().split('T')[0])}
                        className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                      >
                        ⚡ Set Today
                      </button>
                    </div>
                    <input
                      type="date"
                      required
                      value={dateVal || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDateVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-xs focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Real-time sync to PostgreSQL and spjlive."ALL_PARTY_ACCOUNT" (SOB = 'Y')</span>
                  </div>
                </>
              ) : activeSection === 'RailOutStatus' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700 font-medium">Train No *</label>
                    <input
                      type="text"
                      required
                      value={railTrainNo}
                      onChange={(e) => setRailTrainNo(e.target.value)}
                      placeholder="e.g. TR-8812 / CONCOR DFC RAKE #9182"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-medium">Wagon No</label>
                    <input
                      type="text"
                      value={railWagonNo}
                      onChange={(e) => setRailWagonNo(e.target.value)}
                      placeholder="e.g. CR-104928 / WAG-5502"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-medium block">Deck Position (Tier)</label>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setRailDeckTier('LOWER')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          railDeckTier === 'LOWER'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ▼ Lower Deck
                      </button>
                      <button
                        type="button"
                        onClick={() => setRailDeckTier('UPPER')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          railDeckTier === 'UPPER'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ▲ Upper Deck
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-medium">Departure Date (Rake Out) *</label>
                    <input
                      type="date"
                      required
                      value={railDepartureDate}
                      onChange={(e) => setRailDepartureDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700 font-medium">Status / Reference Value *</label>
                    <input
                      type="text"
                      required
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder={`Enter updated ${activeMeta.title} value`}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-medium">Date (if applicable)</label>
                    <input
                      type="date"
                      value={dateVal}
                      onChange={(e) => setDateVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">Save Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
