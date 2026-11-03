import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import DashboardView from './views/DashboardView.jsx';
import JobOrderWizardView from './views/JobOrderWizardView.jsx';
import ShipmentCockpitView from './views/ShipmentCockpitView.jsx';
import InvoicingView from './views/InvoicingView.jsx';
import DSRHubView from './views/DSRHubView.jsx';
import MasterVaultView from './views/MasterVaultView.jsx';
import DocumentationUpdateView from './views/DocumentationUpdateView.jsx';
import TripPendencyView from './views/TripPendencyView.jsx';
import CreditDebitNoteView from './views/CreditDebitNoteView.jsx';
import EmptyManagementView from './views/EmptyManagementView.jsx';
import CommercialReportsView from './views/CommercialReportsView.jsx';
import LoginView from './views/LoginView.jsx';
import CommercialTariffView from './views/CommercialTariffView.jsx';
import FleetMovementView from './views/FleetMovementView.jsx';
import ShipmentLifecycleHubView from './views/ShipmentLifecycleHubView.jsx';
import AICopilot from './components/AICopilot.jsx';

import {
  Search,
  PlusCircle,
  X,
  Building2
} from 'lucide-react';


class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('View Render Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center rounded-xl bg-white border border-rose-200 text-rose-700 space-y-2">
          <h2 className="text-base font-bold">Something went wrong in this view</h2>
          <p className="text-xs font-mono text-slate-500">{String(this.state.error)}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1 bg-rose-600 text-white rounded text-xs"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openRecentDirectly, setOpenRecentDirectly] = useState(false);
  const [copilotFillData, setCopilotFillData] = useState(null);
  const [copilotClearTrigger, setCopilotClearTrigger] = useState(0);
  const [triggerGenerateInvoice, setTriggerGenerateInvoice] = useState(0);
  const [userRole, setUserRole] = useState('ADMIN'); // 'ADMIN' or 'OPERATIONS'
  const [currentBranch, setCurrentBranch] = useState('Dadri ICD (INICD6)');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showInlinePartyModal, setShowInlinePartyModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parties Master state (Loaded from PostgreSQL)
  const [parties, setParties] = useState([]);
  // Jobs state (Loaded from PostgreSQL)
  const [jobs, setJobs] = useState([]);

  // Quick Party Modal State
  const [quickParty, setQuickParty] = useState({
    name: '',
    type: 'SHIPPER',
    gstin: '',
    city: ''
  });

  // Central PostgreSQL data loader
  const loadInitialData = async () => {
    try {
      const [bRes, pRes] = await Promise.allSettled([
        api.getBookings(),
        api.getCustomers()
      ]);

      if (bRes.status === 'fulfilled' && bRes.value && bRes.value.data) {
        setJobs(bRes.value.data.map(j => ({
          id: j.id,
          joNo: j.joNo,
          bookingNo: j.bookingNo,
          customer: j.customerName || j.consignor,
          consignor: j.consignor,
          line: j.shippingLineName || j.shippingLine,
          shippingLine: j.shippingLine,
          vessel: j.vessel,
          voyage: j.voyage,
          origin: j.fromLocation,
          fromLocation: j.fromLocation,
          pod: j.toLocation,
          toLocation: j.toLocation,
          containersCount: j.containersCount || (j.containers ? j.containers.length : 1),
          status: j.status,
          sellFreight: j.sellFreight,
          buyFreight: j.buyFreight,
          sbNo: j.sbNo,
          sbDate: j.sbDate,
          partyInvoiceNo: j.partyInvoiceNo,
          partyInvoiceDate: j.partyInvoiceDate,
          blNo: j.blNo,
          telexReleased: j.telexReleased,
          createdDate: j.createdAt ? new Date(j.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          containers: (j.containers || []).map(c => ({
            id: c.id,
            no: c.containerNo,
            containerNo: c.containerNo,
            size: c.sizeType,
            sizeType: c.sizeType,
            tare: c.tareWeight,
            gross: c.grossWeight,
            cargo: c.cargoWeight,
            seal: c.sealNo,
            sealNo: c.sealNo,
            gr: c.grNumber,
            grNumber: c.grNumber,
            grDate: c.grDate,
            truck: c.truckNo,
            truckNo: c.truckNo,
            driverName: c.driverName,
            driverMobile: c.driverMobile,
            status: c.status
          }))
        })));
      }

      if (pRes.status === 'fulfilled' && pRes.value && pRes.value.data) {
        setParties(pRes.value.data.map(p => ({
          id: p.id,
          code: p.code || p.id,
          name: p.name,
          type: p.party_type || 'SHIPPER',
          gstin: p.gstin || 'N/A',
          city: p.city || 'Delhi NCR',
          state: p.state || ''
        })));
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleQuickPartySave = async (e) => {
    e.preventDefault();
    if (!quickParty.name) return;
    try {
      await api.createCustomer(quickParty);
      await loadInitialData();
    } catch (err) {
      const newEntry = {
        id: String(parties.length + 1),
        name: quickParty.name,
        type: quickParty.type,
        gstin: quickParty.gstin || 'N/A',
        city: quickParty.city || 'Delhi NCR'
      };
      setParties([...parties, newEntry]);
    }
    setShowInlinePartyModal(false);
    setQuickParty({ name: '', type: 'SHIPPER', gstin: '', city: '' });
  };

  const handleCreateJob = async (formData) => {
    try {
      const customerObj = parties.find((p) => p.id === formData.customerId);
      const lineObj = parties.find((p) => p.id === formData.shippingLineId);
      const payload = {
        joNo: `JO-2026-${String(jobs.length + 1).padStart(4, '0')}`,
        consignor: customerObj ? customerObj.name : 'Fair Exports (India) Pvt Ltd',
        customerName: customerObj ? customerObj.name : 'Fair Exports (India) Pvt Ltd',
        shippingLine: lineObj ? lineObj.name : 'Maersk Line India Pvt Ltd',
        shippingLineName: lineObj ? lineObj.name : 'Maersk Line India Pvt Ltd',
        fromLocation: formData.fromLocation || 'Dadri ICD',
        toLocation: formData.toLocation || 'Jebel Ali Port',
        pol: formData.originPort || 'INICD6',
        pod: formData.podPort || 'AEJEA',
        vessel: formData.vesselName || 'MAERSK COLOMBO',
        voyage: formData.voyage || '2604W',
        commodity: formData.commodity || 'FROZEN BUFFALO BONELSS MEAT',
        temperature: formData.temperature || '-18°C',
        sellFreight: Number(formData.sellRate) || 135000,
        buyFreight: Number(formData.buyRate) || 118000,
        containers: formData.containers && formData.containers.length > 0
          ? formData.containers
          : Array.from({ length: Number(formData.containersCount || 1) }, (_, idx) => ({
              containerNo: `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`,
              sizeType: formData.sizeType || '40HC',
              tareWeight: 4200,
              grossWeight: 28500,
              cargoWeight: 24300,
              sealNo: `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`
            }))
      };

      const res = await api.createBooking(payload);
      await loadInitialData();
      if (res.data) setSelectedJobId(res.data.id);
      setActiveView('ShipmentStatus');
    } catch (err) {
      console.error('Job creation error:', err);
    }
  };

  const handleUpdateContainerGR = async (jobId, containerNo, truckNo, driverName, driverMobile) => {
    try {
      await api.generateGR({
        containerId: containerNo,
        truckNo,
        driverName,
        driverMobile
      });
      await loadInitialData();
    } catch (err) {
      console.error('GR Generation API error:', err);
      // Local fallback
      setJobs((prevJobs) =>
        prevJobs.map((j) => {
          if (j.id === jobId || j.joNo === jobId) {
            return {
              ...j,
              status: 'STUFFED',
              containers: j.containers.map((c) =>
                (c.no === containerNo || c.containerNo === containerNo)
                  ? {
                      ...c,
                      gr: `GR-${Math.floor(1000 + Math.random() * 9000)}`,
                      grNumber: `GR-${Math.floor(1000 + Math.random() * 9000)}`,
                      truck: truckNo || c.truck,
                      truckNo: truckNo || c.truckNo,
                      driverName: driverName || c.driverName,
                      driverMobile: driverMobile || c.driverMobile,
                      status: 'STUFFED'
                    }
                  : c
              )
            };
          }
          return j;
        })
      );
    }
  };

  const handleUpdateJob = async (jobId, updatedFields) => {
    try {
      await api.updateDocs({
        jobId,
        ...updatedFields
      });
      await loadInitialData();
    } catch (err) {
      console.error('Documentation update API error:', err);
      setJobs((prevJobs) =>
        prevJobs.map((j) => (j.id === jobId || j.joNo === jobId ? { ...j, ...updatedFields } : j))
      );
    }
  };

  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;

  return (
    <div className="flex h-screen bg-slate-50 text-[rgb(25,40,57)] overflow-hidden font-sans">
      {/* 1. Amazon-Style Sliding Sidebar Drawer (Hidden by default) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
        currentBranch={currentBranch}
        setCurrentBranch={setCurrentBranch}
        onVesselClick={() => setActiveView('VesselPlanDetails')}
          userRole={userRole}
      />

      {/* 2. Main Workspace Layout (Full-Width Clean Workspace) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header with Universal Search & Amazon-Style 'All' Button */}
        <Header
          userRole={userRole}
          setUserRole={setUserRole}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onNewBookingClick={() => setActiveView('ContainerBooking')}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onSelectView={(view) => setActiveView(view)}
          onOpenPartyModal={() => setShowInlinePartyModal(true)}
          jobs={jobs}
          parties={parties}
          onSelectJob={(id) => {
            setSelectedJobId(id);
            setActiveView('ShipmentStatus');
          }}
        />

        {/* Central Dynamic View Container */}
        <main className="flex-1 p-6 pb-20 md:pb-8">
          <ViewErrorBoundary key={activeView}>
          {/* 1. Login Page */}
          {activeView === 'Login' && (
            <LoginView
              userRole={userRole}
              setUserRole={setUserRole}
              onLoginSuccess={() => setActiveView('Dashboard')}
            />
          )}

          {/* Executive Dashboard */}
          {activeView === 'Dashboard' && (
            <DashboardView
              jobs={jobs}
              onSelectJob={(id) => setSelectedJobId(id)}
              onNewBookingClick={() => setActiveView('ContainerBooking')}
              onOpenShipmentStatus={() => setActiveView('ShipmentStatus')}
            />
          )}

          {/* 2-14: All 13 Masters */}
          {['Master', 'CompanyMaster', 'TaxHead', 'TaxHeadGroup', 'ServiceMaster', 'CustomerMaster', 'VendorMaster', 'TerminalMaster', 'UomMaster', 'CommodityMaster', 'BankMaster', 'PortMaster', 'DriverMaster', 'VehicleMaster'].includes(activeView) && (
            <MasterVaultView
              parties={parties}
              initialTab={
                activeView === 'CompanyMaster' ? 'COMPANY' :
                activeView === 'TaxHead' ? 'TAX_HEAD' :
                activeView === 'TaxHeadGroup' ? 'TAX_GROUP' :
                activeView === 'ServiceMaster' ? 'SERVICES' :
                activeView === 'CustomerMaster' ? 'CUSTOMERS' :
                activeView === 'VendorMaster' ? 'VENDORS' :
                activeView === 'TerminalMaster' ? 'TERMINALS' :
                activeView === 'UomMaster' ? 'UOM' :
                activeView === 'CommodityMaster' ? 'COMMODITIES' :
                activeView === 'BankMaster' ? 'BANKS' :
                activeView === 'PortMaster' ? 'PORTS' :
                activeView === 'DriverMaster' ? 'DRIVERS' :
                activeView === 'VehicleMaster' ? 'VEHICLES' : 'CUSTOMERS'
              }
              onAddParty={(newParty) => {
                setParties((prev) => [newParty, ...prev]);
              }}
              onUpdateParty={(updatedParty) => {
                setParties((prev) => prev.map((p) => p.id === updatedParty.id ? updatedParty : p));
              }}
            />
          )}

          {/* 15 & 16: Commercial & Tariffs */}
          {['RateTariff', 'RateApproval'].includes(activeView) && (
            <CommercialTariffView activeSubPage={activeView} />
          )}

          {/* 17 & 18: Empty Containers */}
          {['EmptyBooking', 'EmptyInventory', 'EmptyManagement'].includes(activeView) && (
            <EmptyManagementView />
          )}

          {/* 19: Container Booking (Job Order Wizard) */}
          {activeView === 'ContainerBooking' && (
            <JobOrderWizardView
              parties={parties}
              jobs={jobs}
              onOpenQuickAddShipper={() => setShowInlinePartyModal(true)}
              onCreateJob={handleCreateJob}
              onSelectJob={(id) => setSelectedJobId(id)}
              onOpenShipmentStatus={() => setActiveView('ShipmentStatus')}
              openRecentDirectly={openRecentDirectly}
              onResetRecentDirectly={() => setOpenRecentDirectly(false)}
              copilotFillData={copilotFillData}
              onResetCopilotFill={() => setCopilotFillData(null)}
              copilotClearTrigger={copilotClearTrigger}
            />
          )}

          {/* 20 & 21: Trip Pendency & GR Generation */}
          {['TripPendency', 'GrGeneration'].includes(activeView) && (
            <TripPendencyView
              jobs={jobs}
              onUpdateContainerGR={handleUpdateContainerGR}
              onNewBookingClick={() => setActiveView('ContainerBooking')}
            />
          )}

          {/* 22 & 23: Vehicle Running Position & Trip Close */}
          {['RunningPosition', 'TripClose'].includes(activeView) && (
            <FleetMovementView
              jobs={jobs}
              activeSubPage={activeView}
            />
          )}

          {/* 24 to 34: Shipment Lifecycle & Customs Hub */}
          {['EdiUpdate', 'RailOutStatus', 'VesselPlanDetails', 'SobUpdate', 'BlStatusUpdate', 'TelexStatusUpdate', 'TrUpdate', 'HandoverUpdate', 'EgmUpdate', 'ShipmentDischargeStatus'].includes(activeView) && (
            <ShipmentLifecycleHubView
              jobs={jobs}
              initialSection={activeView}
            />
          )}

          {/* 28: Document Update */}
          {['DocumentUpdate', 'DocumentationUpdate'].includes(activeView) && (
            <DocumentationUpdateView
              jobs={jobs}
              onUpdateJob={handleUpdateJob}
            />
          )}

          {/* Detailed Shipment Status Cockpit */}
          {activeView === 'ShipmentStatus' && (
            <ShipmentCockpitView
              jobs={jobs}
              job={activeJob}
              onGoToBilling={() => setActiveView('Invoice')}
              onNewBookingClick={() => setActiveView('ContainerBooking')}
            />
          )}

          {/* Commercial Billing, Reports & Invoicing */}
          {activeView === 'Invoice' && (
            <InvoicingView
              jobs={jobs}
              job={activeJob}
              triggerGenerateInvoice={triggerGenerateInvoice}
            />
          )}
          {activeView === 'CreditDebitNotes' && <CreditDebitNoteView jobs={jobs} />}
          {activeView === 'CommercialReports' && <CommercialReportsView jobs={jobs} />}
          {activeView === 'DSRReport' && <DSRHubView jobs={jobs} />}
                  </ViewErrorBoundary>
        </main>
      </div>

      {/* ================= INLINE QUICK ADD SHIPPER MODAL ================= */}
      {showInlinePartyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Add Stakeholder / Shipper</span>
              </h2>
              <button
                onClick={() => setShowInlinePartyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPartySave} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-medium">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Falah Agro Exports Ltd"
                  value={quickParty.name}
                  onChange={(e) => setQuickParty({ ...quickParty, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-medium">Party Category</label>
                <select
                  value={quickParty.type}
                  onChange={(e) => setQuickParty({ ...quickParty, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-sans"
                >
                  <option value="SHIPPER">Shipper (Exporter / Customer)</option>
                  <option value="CONSIGNEE">Consignee (Foreign Buyer)</option>
                  <option value="TRANSPORTER">Transporter</option>
                  <option value="SHIPPING_LINE">Shipping Line</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-medium">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="e.g. 09AABCM1290F1ZX"
                  value={quickParty.gstin}
                  onChange={(e) => setQuickParty({ ...quickParty, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-[rgb(25,40,57)] font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-medium">City / State</label>
                <input
                  type="text"
                  placeholder="e.g. Aligarh, UP"
                  value={quickParty.city}
                  onChange={(e) => setQuickParty({ ...quickParty, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInlinePartyModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= AI LOGISTICS COPILOT (LIVE FORM FILL & STATUS) ================= */}
      <AICopilot
        jobs={jobs}
        parties={parties}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onOpenCustomerModal={() => setShowInlinePartyModal(true)}
        onFillBookingForm={(payload) => {
          setActiveView('ContainerBooking');
          setCopilotFillData(payload);
        }}
        onClearBookingForm={() => {
          setCopilotClearTrigger(prev => prev + 1);
        }}
        onGenerateInvoiceDirect={() => {
          setActiveView('Invoice');
          setTimeout(() => {
            setTriggerGenerateInvoice(prev => prev + 1);
          }, 200);
        }}
        onCreateBookingDirect={(payload) => {
          handleCreateJob(payload);
        }}
      />

      {/* ================= COMMAND PALETTE (CMD + K) ================= */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search container number, booking no, or party..."
                className="w-full bg-transparent text-sm text-[rgb(25,40,57)] focus:outline-none font-sans"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-slate-400 border border-slate-200">
                ESC
              </kbd>
            </div>
            <div className="p-2 space-y-1 text-xs">
              <div
                onClick={() => {
                  setActiveView('ContainerBooking');
                  setShowCommandPalette(false);
                }}
                className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium">New Container Booking</span>
              </div>
            </div>
            <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Shortcut: ⌘K</span>
              <button onClick={() => setShowCommandPalette(false)} className="hover:text-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
