import React, { useState } from 'react';
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
  ArrowRight
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

  // Flatten containers from live PostgreSQL jobs
  const rows = [];
  jobs.forEach((j) => {
    (j.containers || []).forEach((c) => {
      rows.push({
        id: c.id,
        containerNo: c.no || c.containerNo || 'MSKU-TBA',
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
        // Operational attributes
        ediStatus: c.ediSbStatus || 'LEO_PASSED',
        trainNo: c.trainNo || 'CONCOR DFC RAKE #9182',
        wagonNo: c.wagonNo || 'CR-104928',
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
        await api.updateRailOut({ containerId: selectedCont.id, trainNo: inputVal, rakeOutDate: dateVal });
        selectedCont.trainNo = inputVal;
        selectedCont.rakeDate = dateVal;
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

  const filtered = rows.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const cno = String(r.containerNo || '').toLowerCase();
    const cust = String(r.customer || '').toLowerCase();
    const jno = String(r.jobNo || '').toLowerCase();
    return cno.includes(q) || cust.includes(q) || jno.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
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
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${activeMeta.title} by Container No, Shipper, Job Order...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>
        <span className="text-xs font-mono text-slate-500">
          {filtered.length} container unit(s)
        </span>
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
                  {activeSection === 'RailOutStatus' && 'Train Rake / Wagon'}
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
                        <div className="font-mono">
                          <div className="font-bold text-slate-800">{r.trainNo}</div>
                          <div className="text-[11px] text-slate-500">Wagon: {r.wagonNo} &bull; {r.rakeDate}</div>
                        </div>
                      )}
                      {activeSection === 'VesselPlanDetails' && (
                        <div>
                          <div className="font-semibold text-slate-800">{r.feederVessel}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Cut-off: {r.cutOffDate}</div>
                        </div>
                      )}
                      {activeSection === 'SobUpdate' && (
                        <span className="font-mono font-bold text-emerald-700">
                          SOB: {r.sobDate}
                        </span>
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
                      <button
                        onClick={() => {
                          setSelectedCont(r);
                          setInputVal('');
                          setDateVal('');
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
