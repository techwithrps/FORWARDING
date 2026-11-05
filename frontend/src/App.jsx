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
import GrGenerationView from './views/GrGenerationView.jsx';
import GrSearchingView from './views/GrSearchingView.jsx';
import CreditDebitNoteView from './views/CreditDebitNoteView.jsx';
import EmptyManagementView from './views/EmptyManagementView.jsx';
import CommercialReportsView from './views/CommercialReportsView.jsx';
import LoginView from './views/LoginView.jsx';
import CommercialTariffView from './views/CommercialTariffView.jsx';
import FleetMovementView from './views/FleetMovementView.jsx';
import ShipmentLifecycleHubView from './views/ShipmentLifecycleHubView.jsx';
import VesselIntelligenceHubView from './views/VesselIntelligenceHubView.jsx';
import AICopilot from './components/AICopilot.jsx';
import { AppleHelloPageTransition, AppleWelcomeModal } from './components/AppleExperience.jsx';

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
  // Persistent routing across page refreshes via URL Hash, Search Params & localStorage
  const getInitialView = () => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash;
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam) return viewParam;
      const saved = localStorage.getItem('forwarder_active_view');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'Dashboard';
  };

  const [activeView, setActiveViewState] = useState(getInitialView);
  const [selectedGrForEdit, setSelectedGrForEdit] = useState(null);

  const setActiveView = (view) => {
    if (!view) return;
    setActiveViewState(view);
    try {
      localStorage.setItem('forwarder_active_view', view);
      if (window.location.hash !== `#${view}`) {
        window.history.pushState(null, '', `#${view}`);
      }
    } catch {
      // ignore
    }
  };

  // Sync on browser back / forward navigation and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash && hash !== activeView) {
          setActiveViewState(hash);
          localStorage.setItem('forwarder_active_view', hash);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [activeView]);

  // Keep URL hash synchronized on initial load
  useEffect(() => {
    if (activeView && !window.location.hash) {
      window.history.replaceState(null, '', `#${activeView}`);
    }
  }, [activeView]);

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
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    // Show on initial load if not already dismissed in this session
    return !sessionStorage.getItem('spj_v2_welcomed');
  });

  const handleDismissWelcome = () => {
    sessionStorage.setItem('spj_v2_welcomed', 'true');
    setShowWelcomeModal(false);
  };

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

  // Default standard parties master fallback
  const defaultParties = [
    { id: '1', code: 'CUST-001', name: 'Fair Exports (India) Pvt Ltd', type: 'SHIPPER', gstin: '07AAACF4921J1Z5', city: 'Delhi NCR' },
    { id: '2', code: 'CUST-002', name: 'Allanasons Private Limited', type: 'SHIPPER', gstin: '27AAACA0546L1Z4', city: 'Mumbai' },
    { id: '3', code: 'CUST-003', name: 'Marhaba Frozen Foods', type: 'SHIPPER', gstin: '09AAAFM1928K1Z2', city: 'Aligarh' },
    { id: '4', code: 'CUST-004', name: 'Al Sameer Exports Pvt Ltd', type: 'SHIPPER', gstin: '09AAACA8492J1Z0', city: 'Delhi NCR' },
    { id: '5', code: 'CUST-005', name: 'Deepmala Foods', type: 'SHIPPER', gstin: '09AABCD8921M1Z1', city: 'Hapur' },
    { id: '6', code: 'LINE-001', name: 'Maersk Line India Pvt Ltd', type: 'SHIPPING_LINE', gstin: '27AAACM1204K1Z8', city: 'Mumbai' },
    { id: '7', code: 'LINE-002', name: 'Mediterranean Shipping Co (MSC)', type: 'SHIPPING_LINE', gstin: '27AAACM9981P1Z3', city: 'Mumbai' },
    { id: '8', code: 'LINE-003', name: 'CMA CGM Agencies India', type: 'SHIPPING_LINE', gstin: '27AAACC4451M1Z2', city: 'Mumbai' }
  ];

  // Default pre-saved booking with complete SPJ-2 route chain
  const defaultJobs = [
    {
      id: 'JO-2026-0001',
      joNo: 'JO-2026-0001',
      joType: 'Export FCL',
      modeOfShipment: 'Multimodal (Rail + Road)',
      customer: 'Fair Exports (India) Pvt Ltd',
      customerName: 'Fair Exports (India) Pvt Ltd',
      consignor: 'Fair Exports (India) Pvt Ltd',
      consignee: 'Al Maya Trading LLC, Jebel Ali Free Zone, Dubai',
      shippingLine: 'Maersk Line India Pvt Ltd',
      shippingLineName: 'Maersk Line India Pvt Ltd',
      line: 'Maersk Line India Pvt Ltd',
      bookingNo: 'BK-982104',
      lineBookingNo: 'BK-982104',
      emptyPickupLocation: 'Dadri ICD Depot (CONCOR)',
      fromLocation: 'Fair Exports Processing Plant, Dadri',
      origin: 'Fair Exports Processing Plant, Dadri',
      handoverLocation: 'Dadri ICD CFS Complex',
      toLocation: 'Nhava Sheva-NSFT (INNSA1)',
      pol: 'INNSA1',
      polName: 'Nhava Sheva - JNPT (INNSA1)',
      pod: 'AEJEA',
      podPort: 'AEJEA',
      podName: 'JEBEL ALI, UAE (AEJEA)',
      vessel: 'MAERSK COLOMBO',
      vesselName: 'MAERSK COLOMBO',
      voyage: '2604W',
      etdDate: '2026-11-06',
      etaDate: '2026-11-10',
      portCutDate: '2026-11-04',
      siCutDate: '2026-11-04',
      bookingValidity: '2026-11-08',
      status: 'STUFFED',
      sellFreight: 145000,
      buyFreight: 118000,
      margin: 27000,
      containersCount: 2,
      equipmentBreakdown: [
        { id: 1, noOfCont: 2, size: '40' }
      ],
      sbNo: 'SB-8829104',
      sbDate: '2026-11-03',
      partyInvoiceNo: 'FE/EXP/2026/0491',
      partyInvoiceDate: '2026-11-02',
      blNo: 'MAEU982104882',
      telexReleased: true,
      createdDate: '03/11/2026',
      containers: [
        {
          id: 'C1',
          sr: 1,
          no: 'MSKU8492011',
          containerNo: 'MSKU8492011',
          size: "40'",
          type: 'HC',
          sizeType: '40HC',
          tare: 3820,
          tareWeight: 3820,
          cargo: 24500,
          cargoWeight: 24500,
          gross: 28320,
          grossWeight: 28320,
          seal: 'ML-IN-938210',
          sealNo: 'ML-IN-938210',
          truck: 'HR55AN2094',
          truckNo: 'HR55AN2094',
          gr: 'GR-2026-0841',
          grNo: 'GR-2026-0841',
          grNumber: 'GR-2026-0841',
          grDate: '2026-11-02',
          driverName: 'Ramesh Singh',
          driverMobile: '+91 98112 34567',
          status: 'SEALED & DISPATCHED'
        },
        {
          id: 'C2',
          sr: 2,
          no: 'MSKU7719284',
          containerNo: 'MSKU7719284',
          size: "40'",
          type: 'HC',
          sizeType: '40HC',
          tare: 3850,
          tareWeight: 3850,
          cargo: 24650,
          cargoWeight: 24650,
          gross: 28500,
          grossWeight: 28500,
          seal: 'ML-IN-938211',
          sealNo: 'ML-IN-938211',
          truck: 'UP14BT8120',
          truckNo: 'UP14BT8120',
          gr: 'GR-2026-0842',
          grNo: 'GR-2026-0842',
          grNumber: 'GR-2026-0842',
          grDate: '2026-11-02',
          driverName: 'Suresh Yadav',
          driverMobile: '+91 98710 88219',
          status: 'SEALED & DISPATCHED'
        }
      ]
    }
  ];

  // Parties Master state (Loaded from PostgreSQL or local fallback)
  const [parties, setParties] = useState(() => {
    try {
      const saved = localStorage.getItem('forwarder_parties');
      return saved ? JSON.parse(saved) : defaultParties;
    } catch (e) {
      return defaultParties;
    }
  });

  // Jobs state (Loaded from PostgreSQL or local fallback)
  const [jobs, setJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('forwarder_jobs');
      return saved ? JSON.parse(saved) : defaultJobs;
    } catch (e) {
      return defaultJobs;
    }
  });

  // Quick Party Modal State
  const [quickParty, setQuickParty] = useState({
    name: '',
    type: 'SHIPPER',
    gstin: '',
    city: ''
  });

  const [commodities, setCommodities] = useState([]);

  // Central PostgreSQL data loader
  const loadInitialData = async () => {
    try {
      const [bRes, pRes, cRes] = await Promise.allSettled([
        api.getBookings(),
        api.getCustomers(),
        api.getCommodities()
      ]);

      if (cRes.status === 'fulfilled' && cRes.value && cRes.value.data) {
        setCommodities(cRes.value.data);
      }

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
          chaName: j.chaName || '',
          onAccount: j.onAccount || '',
          packageType: j.packageType || 'Cartons',
          cartons: Number(j.cartons) || 0,
          cbm: Number(j.cbm) || 0,
          fpod: j.fpod || '',
          boeNo: j.boeNo || '',
          boeDate: j.boeDate || null,
          hblNo: j.hblNo || '',
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
            agentSeal: c.agentSeal || '',
            customSeal: c.agentSeal || '',
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
          pan: p.pan || (p.gstin && p.gstin.length >= 12 ? p.gstin.slice(2, 12) : 'N/A'),
          city: p.city || 'Delhi NCR',
          state: p.state || '',
          contactPerson: p.contact_person || '',
          mobile: p.mobile || p.contact_no || '',
          email: p.email_comm || p.email_ops || '',
          creditLimit: p.credit_limit || '10,00,000',
          creditPeriod: p.credit_period || '30',
          paymentTerms: p.payment_terms || '30 Days'
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
      const customerName = formData.customer || formData.consignor || (parties.find(p => p.id === formData.customerId)?.name) || 'Fair Exports (India) Pvt Ltd';
      const shippingLineName = formData.shippingLine || formData.line || (parties.find(p => p.id === formData.shippingLineId)?.name) || 'Maersk Line India Pvt Ltd';
      const vesselName = formData.vessel || formData.vesselName || 'MAERSK COLOMBO';
      const voyageNo = formData.voyage || '2604W';
      const polCode = formData.pol || formData.originPort || 'INNSA1';
      const podCode = formData.pod || formData.podPort || 'AEJEA';

      const payload = {
        id: formData.id || formData.joNo || `JO-2026-${String(jobs.length + 1).padStart(4, '0')}`,
        joNo: formData.joNo || formData.id || `JO-2026-${String(jobs.length + 1).padStart(4, '0')}`,
        joType: formData.joType || 'Export FCL',
        modeOfShipment: formData.modeOfShipment || 'Multimodal (Rail + Road)',
        consignor: customerName,
        customer: customerName,
        customerName: customerName,
        consignee: formData.consignee || 'Al Maya Trading LLC, Jebel Ali Free Zone, Dubai',
        shippingLine: shippingLineName,
        shippingLineName: shippingLineName,
        line: shippingLineName,
        bookingNo: formData.bookingNo || formData.lineBookingNo || `BK-${Math.floor(100000 + Math.random() * 900000)}`,
        lineBookingNo: formData.lineBookingNo || formData.bookingNo || `BK-${Math.floor(100000 + Math.random() * 900000)}`,
        emptyPickupLocation: formData.emptyPickupLocation || 'Dadri ICD Depot (CONCOR)',
        fromLocation: formData.fromLocation || formData.origin || 'Fair Exports Processing Plant, Dadri',
        origin: formData.fromLocation || formData.origin || 'Fair Exports Processing Plant, Dadri',
        handoverLocation: formData.handoverLocation || 'Dadri ICD CFS Complex',
        toLocation: formData.toLocation || 'Nhava Sheva-NSFT (INNSA1)',
        pol: polCode,
        pod: podCode,
        podPort: podCode,
        vessel: vesselName,
        vesselName: vesselName,
        voyage: voyageNo,
        etdDate: formData.etdDate || '2026-11-06',
        etaDate: formData.etaDate || '2026-11-10',
        portCutDate: formData.portCutDate || '2026-11-04',
        siCutDate: formData.siCutDate || '2026-11-04',
        bookingValidity: formData.bookingValidity || '2026-11-08',
        status: formData.status || 'STUFFED',
        sellFreight: Number(formData.sellFreight) || Number(formData.sellRate) || 145000,
        buyFreight: Number(formData.buyFreight) || Number(formData.buyRate) || 118000,
        margin: (Number(formData.sellFreight) || 145000) - (Number(formData.buyFreight) || 118000),
        containersCount: Number(formData.containersCount) || (formData.containers ? formData.containers.length : 1),
        equipmentBreakdown: formData.equipmentBreakdown || [],
        createdDate: new Date().toLocaleDateString('en-GB'),
        containers: formData.containers && formData.containers.length > 0
          ? formData.containers.map((c, idx) => ({
              id: c.id || `C${idx + 1}`,
              sr: c.sr || idx + 1,
              no: c.containerNo || c.contNo || c.no || `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`,
              containerNo: c.containerNo || c.contNo || c.no || `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`,
              size: c.size || "40'",
              type: c.type || 'HC',
              sizeType: c.sizeType || '40HC',
              tare: Number(c.tareWeight || c.tare || 3820),
              tareWeight: Number(c.tareWeight || c.tare || 3820),
              cargo: Number(c.cargoWeight || c.cargo || 24500),
              cargoWeight: Number(c.cargoWeight || c.cargo || 24500),
              gross: Number(c.grossWeight || c.gross || 28320),
              grossWeight: Number(c.grossWeight || c.gross || 28320),
              seal: c.sealNo || c.seal || `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`,
              sealNo: c.sealNo || c.seal || `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`,
              truck: c.truckNo || c.vehicleNo || c.truck || '',
              truckNo: c.truckNo || c.vehicleNo || c.truck || '',
              gr: c.grNo || c.grNumber || c.gr || '',
              grNo: c.grNo || c.grNumber || c.gr || '',
              grNumber: c.grNo || c.grNumber || c.gr || '',
              grDate: c.grDate || null,
              driverName: c.driverName || '',
              driverMobile: c.driverMobile || '',
              status: c.status || 'ALLOTTED'
            }))
          : Array.from({ length: Number(formData.containersCount || 1) }, (_, idx) => ({
              id: `C${idx + 1}`,
              sr: idx + 1,
              no: `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`,
              containerNo: `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`,
              size: "40'",
              type: 'HC',
              sizeType: '40HC',
              tare: 3820,
              tareWeight: 3820,
              gross: 28320,
              grossWeight: 28320,
              cargo: 24500,
              cargoWeight: 24500,
              seal: `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`,
              sealNo: `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`,
              truck: '',
              truckNo: '',
              gr: '',
              grNo: '',
              grNumber: '',
              grDate: null,
              driverName: '',
              driverMobile: '',
              status: 'ALLOTTED'
            }))
      };

      // Always persist to local state & localStorage!
      setJobs(prevJobs => {
        const updated = [payload, ...prevJobs.filter(j => j.id !== payload.id && j.joNo !== payload.joNo)];
        try {
          localStorage.setItem('forwarder_jobs', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setSelectedJobId(payload.id);

      // Attempt async backend push to PostgreSQL & refresh live jobs
      try {
        await api.createBooking(payload);
        const refreshedBookings = await api.getBookings();
        if (refreshedBookings?.data) {
          setJobs(refreshedBookings.data.map(j => ({
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
            status: j.status,
            sellFreight: j.sellFreight,
            buyFreight: j.buyFreight,
            containersCount: j.containersCount,
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
              gr: c.grNumber || '',
              grNumber: c.grNumber || '',
              grDate: c.grDate,
              truck: c.truckNo || '',
              truckNo: c.truckNo || '',
              driverName: c.driverName || '',
              driverMobile: c.driverMobile || '',
              status: c.status || 'ALLOTTED'
            }))
          })));
        }
      } catch (apiErr) {
        console.warn('[PostgreSQL Sync] Running in offline/Vercel state, saved to browser persistence:', apiErr);
      }

      return payload;
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
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Apple "Hello" Signature Script Transition Overlay on each page change */}
        <AppleHelloPageTransition activeView={activeView} />

        {/* Apple iOS-Style "Welcome to Version 2.O" Greeting Modal */}
        <AppleWelcomeModal
          isOpen={showWelcomeModal}
          onClose={handleDismissWelcome}
        />

        {/* Top Header with Universal Search & Amazon-Style 'All' Button */}
        <Header
          userRole={userRole}
          setUserRole={setUserRole}
          onVesselClick={() => setActiveView('VesselPlanDetails')}
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
          onOpenWelcome={() => setShowWelcomeModal(true)}
        />

        {/* Central Dynamic View Container */}
        <main className={`flex-1 ${activeView === 'ContainerBooking' ? 'p-2 sm:px-3 sm:py-2' : 'p-6 pb-20 md:pb-8'}`}>
          <ViewErrorBoundary key={activeView}>
          {/* 1. Login Page */}
          {activeView === 'Login' && (
            <LoginView
              userRole={userRole}
              setUserRole={setUserRole}
              onLoginSuccess={() => {
                setShowWelcomeModal(true);
                setActiveView('Dashboard');
              }}
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
              commodities={commodities}
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

          {/* 20: Trip Pendency */}
          {activeView === 'TripPendency' && (
            <TripPendencyView
              jobs={jobs}
              onUpdateContainerGR={handleUpdateContainerGR}
              onNewBookingClick={() => setActiveView('ContainerBooking')}
            />
          )}

          {/* 21: GR Generation */}
          {activeView === 'GrGeneration' && (
            <GrGenerationView
              jobs={jobs}
              initialGrData={selectedGrForEdit}
              onClearInitialGr={() => setSelectedGrForEdit(null)}
              onUpdateContainerGR={handleUpdateContainerGR}
              onNavigateToTripPendency={() => setActiveView('TripPendency')}
              onNavigateToGrSearching={() => setActiveView('GrSearching')}
            />
          )}

          {/* GR Searching */}
          {activeView === 'GrSearching' && (
            <GrSearchingView
              onExit={() => setActiveView('GrGeneration')}
              onSelectGr={(gr) => {
                setSelectedGrForEdit(gr);
                setActiveView('GrGeneration');
              }}
            />
          )}

          {/* 22 & 23: Vehicle Running Position & Trip Close */}
          {['RunningPosition', 'TripClose'].includes(activeView) && (
            <FleetMovementView
              jobs={jobs}
              activeSubPage={activeView}
            />
          )}

          {/* 26: Unified Vessel Intelligence & Planning Hub (Ocean Radar + Booking Planning Tabs) */}
          {activeView === 'VesselPlanDetails' && (
            <VesselIntelligenceHubView initialTab="RADAR" />
          )}

          {/* 24 to 34: Shipment Lifecycle & Customs Hub */}
          {['EdiUpdate', 'RailOutStatus', 'SobUpdate', 'BlStatusUpdate', 'TelexStatusUpdate', 'TrUpdate', 'HandoverUpdate', 'EgmUpdate', 'ShipmentDischargeStatus'].includes(activeView) && (
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
