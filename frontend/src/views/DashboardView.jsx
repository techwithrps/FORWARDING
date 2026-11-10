import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ship,
  FileText,
  Truck,
  Train,
  FileCheck,
  Anchor,
  Layers,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
  Filter,
  ArrowUpRight,
  Activity,
  Check,
  Building2,
  Box,
  RotateCcw
} from 'lucide-react';

// Form Completion Calculator: Evaluates how much of the operational form/lifecycle has been filled
function calculateJobCompletion(job) {
  let score = 0;
  const checks = [];

  // 1. Job Order Specification (25 pts)
  const hasConsignor = !!(job.consignor || job.customer || job.customerName);
  const hasLine = !!(job.shippingLine || job.shippingLineName || job.line);
  const hasRoute = !!((job.origin || job.fromLocation) && (job.pod || job.toLocation));
  const hasBkgNo = !!(job.bookingNo || job.lineBookingNo);
  const joPoints = (hasConsignor ? 7 : 0) + (hasLine ? 6 : 0) + (hasRoute ? 6 : 0) + (hasBkgNo ? 6 : 0);
  score += joPoints;
  checks.push({ key: 'JO', label: 'Job Order Spec', complete: joPoints >= 19, weight: 25 });

  // 2. Equipment & Commodity (20 pts)
  const hasEquipment = Array.isArray(job.equipmentBreakdown) && job.equipmentBreakdown.length > 0;
  const hasCommodity = !!(job.commodity || (hasEquipment && job.equipmentBreakdown[0]?.commodity));
  const eqPoints = (hasEquipment ? 12 : 6) + (hasCommodity ? 8 : 4);
  score += eqPoints;
  checks.push({ key: 'EQ', label: 'Equipment & Cargo', complete: eqPoints >= 15, weight: 20 });

  // 3. Container Allotment / Manifest (20 pts)
  const containers = job.containers || [];
  const hasContainers = containers.length > 0 && containers.some(c => c.containerNo || c.contNo || c.no);
  const hasWeights = containers.length > 0 && containers.some(c => Number(c.grossWeight || c.gross || c.cargoWeight || c.cargo) > 0);
  const contPoints = (hasContainers ? 12 : 0) + (hasWeights ? 8 : 0);
  score += contPoints;
  checks.push({ key: 'MF', label: 'Container Manifest', complete: contPoints >= 15, weight: 20 });

  // 4. Trip Pendency & GR Allotment (20 pts)
  const hasVehicle = containers.some(c => c.truckNo || c.vehicleNo || c.truck);
  const hasDriver = containers.some(c => c.driverName);
  const hasGr = containers.some(c => c.grNo || c.grNumber || (c.gr && c.gr !== 'PENDING'));
  const grPoints = (hasVehicle ? 7 : 0) + (hasDriver ? 6 : 0) + (hasGr ? 7 : 0);
  score += grPoints;
  checks.push({ key: 'GR', label: 'Vehicle & GR Allotment', complete: grPoints >= 14, weight: 20 });

  // 5. Movement, SOB & Invoicing (15 pts)
  const isStuffed = job.status === 'STUFFED' || job.status === 'RAIL_OUT' || job.status === 'COMPLETED' || job.status === 'INVOICED';
  const hasSobOrVessel = !!(job.vessel && job.voyage);
  const hasInvoice = !!(job.partyInvoiceNo || job.blNo || job.status === 'INVOICED');
  const movPoints = (isStuffed ? 6 : 0) + (hasSobOrVessel ? 4 : 0) + (hasInvoice ? 5 : 0);
  score += movPoints;
  checks.push({ key: 'DOC', label: 'Movement & Docs', complete: movPoints >= 10, weight: 15 });

  const percentage = Math.min(100, Math.max(15, Math.round(score)));
  return { percentage, checks };
}

// 8 Operational Lifecycle Stages
const PIPELINE_STAGES = [
  {
    step: '01',
    id: 'vessel-plan',
    title: 'Vessel Plan & Booking',
    subtitle: 'Ocean line booking, schedules & cut-offs',
    category: 'Planning',
    icon: Ship,
    accent: 'blue',
    targetView: 'VesselPlanDetails',
    badgeText: 'Line Booking'
  },
  {
    step: '02',
    id: 'job-creation',
    title: 'Job Order Creation',
    subtitle: 'Shipper, consignee & equipment types',
    category: 'Booking',
    icon: FileText,
    accent: 'indigo',
    targetView: 'ContainerBooking',
    badgeText: 'Job Wizard'
  },
  {
    step: '03',
    id: 'trip-pendency',
    title: 'Trip Pendency',
    subtitle: 'Vehicle trailer matching (40*1 or 20*2)',
    category: 'Dispatch Queue',
    icon: Clock,
    accent: 'amber',
    targetView: 'TripPendency',
    badgeText: 'Capacity Check'
  },
  {
    step: '04',
    id: 'gr-generation',
    title: 'GR Generation',
    subtitle: 'Bilty, driver allotment & trip advances',
    category: 'Lorry Receipt',
    icon: Truck,
    accent: 'emerald',
    targetView: 'GrGeneration',
    badgeText: 'Goods Receipt'
  },
  {
    step: '05',
    id: 'edi-customs',
    title: 'EDI & Customs Filing',
    subtitle: 'Shipping bill submission & LEO clearance',
    category: 'Clearance',
    icon: FileCheck,
    accent: 'cyan',
    targetView: 'ShipmentStatus',
    badgeText: 'Customs LEO'
  },
  {
    step: '06',
    id: 'rail-out',
    title: 'Rail Out Movement',
    subtitle: 'ICD Dadri/Patli rake loading & transit',
    category: 'Movement',
    icon: Train,
    accent: 'purple',
    targetView: 'ShipmentStatus',
    badgeText: 'Rake Movement'
  },
  {
    step: '07',
    id: 'sob-update',
    title: 'Plan Change / SOB Update',
    subtitle: 'Vessel delay shifts & Shipped On Board',
    category: 'Gate & Ocean',
    icon: Anchor,
    accent: 'rose',
    targetView: 'VesselPlanDetails',
    badgeText: 'SOB Date'
  },
  {
    step: '08',
    id: 'documentation',
    title: 'Docs & Invoicing',
    subtitle: 'Bill of Lading, IRN & Sales Tax Invoicing',
    category: 'Finance & Close',
    icon: Layers,
    accent: 'teal',
    targetView: 'Invoice',
    badgeText: 'Tax Invoicing'
  }
];

export default function DashboardView({
  jobs = [],
  onNavigate,
  onSelectJob,
  onNewBookingClick,
  onOpenShipmentStatus,
  onEditJobInWizard
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState('ALL');
  const [completionFilter, setCompletionFilter] = useState('ALL'); // 'ALL' | 'INCOMPLETE' | 'IN_TRANSIT' | 'READY'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // 4 cards per row x 3 rows

  // Enhance each job with its calculated completion percentage & stage check
  const enhancedJobs = useMemo(() => {
    return jobs.map((job) => {
      const completion = calculateJobCompletion(job);
      return {
        ...job,
        completion
      };
    });
  }, [jobs]);

  // Filter based on search query, completion band, and pipeline stage
  const filteredJobs = useMemo(() => {
    return enhancedJobs.filter((j) => {
      // 1. Text Search
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const id = String(j.id || j.joNo || '').toLowerCase();
        const cust = String(j.customer || j.consignor || j.customerName || '').toLowerCase();
        const ves = String(j.vessel || j.vesselName || '').toLowerCase();
        const route = String((j.origin || j.fromLocation || '') + ' ' + (j.pod || j.toLocation || '')).toLowerCase();
        const conts = (j.containers || []).map(c => c.containerNo || c.contNo || '').join(' ').toLowerCase();
        const matches = id.includes(q) || cust.includes(q) || ves.includes(q) || route.includes(q) || conts.includes(q);
        if (!matches) return false;
      }

      // 2. Completion Band Filter
      if (completionFilter === 'INCOMPLETE' && j.completion.percentage >= 50) return false;
      if (completionFilter === 'IN_TRANSIT' && (j.completion.percentage < 50 || j.completion.percentage >= 80)) return false;
      if (completionFilter === 'READY' && j.completion.percentage < 80) return false;

      // 3. Stage Filter
      if (activeStageFilter !== 'ALL') {
        if (activeStageFilter === 'vessel-plan' && (!j.vessel || j.vessel === 'Vessel TBA')) return false;
        if (activeStageFilter === 'job-creation' && !j.consignor) return false;
        if (activeStageFilter === 'trip-pendency' && (!j.containers || j.containers.length === 0)) return false;
        if (activeStageFilter === 'gr-generation' && !(j.containers || []).some(c => c.grNo || c.grNumber)) return false;
        if (activeStageFilter === 'rail-out' && j.status !== 'RAIL_OUT' && j.status !== 'STUFFED') return false;
        if (activeStageFilter === 'sob-update' && !j.sobDate) return false;
        if (activeStageFilter === 'documentation' && !j.partyInvoiceNo) return false;
      }

      return true;
    });
  }, [enhancedJobs, searchTerm, completionFilter, activeStageFilter]);

  // Pagination calculation
  const totalItems = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
  const currentCards = filteredJobs.slice(startIdx, endIdx);

  // Change page handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 w-full font-sans pb-10">
      {/* 1. Header with Direct Operational Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
              Freight Operations Flow &amp; Booking Cockpit
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Live interactive shipment lifecycle pipeline • Visual form completion readiness • Grid booking overview
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate('TripPendency') : null}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Trip Pendency</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate ? onNavigate('GrGeneration') : null}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>GR Generation</span>
          </button>

          <button
            type="button"
            onClick={onNewBookingClick}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>+ New Container Booking</span>
          </button>
        </div>
      </div>

      {/* 2. Motion Graphics Operational Lifecycle Pipeline (8 Stages) */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4 sm:p-5 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Animated background ambient glow dots */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
              <Activity className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Interactive Freight Lifecycle Pipeline
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  8 Operation Steps
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Click any operational stage to jump into that module or filter the shipments grid below
              </p>
            </div>
          </div>

          {activeStageFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setActiveStageFilter('ALL')}
              className="text-[11px] font-bold text-amber-300 hover:text-white px-2.5 py-1 rounded bg-white/10 border border-amber-300/30 flex items-center gap-1 transition self-start cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Stage Filter</span>
            </button>
          )}
        </div>

        {/* Horizontal Motion Steps Track */}
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-stretch gap-2.5 min-w-[1040px] relative z-10">
            {PIPELINE_STAGES.map((st, idx) => {
              const IconComp = st.icon;
              const isSelected = activeStageFilter === st.id;
              return (
                <motion.div
                  key={st.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => {
                    setActiveStageFilter(activeStageFilter === st.id ? 'ALL' : st.id);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 min-w-[124px] p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-blue-600/30 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Step Number & Category Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono font-black text-cyan-300 bg-white/10 px-1.5 py-0.5 rounded">
                        {st.step}
                      </span>
                      <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase truncate">
                        {st.category}
                      </span>
                    </div>

                    {/* Step Icon & Title */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-white/10 text-cyan-300 group-hover:bg-cyan-500/20'
                      }`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-black tracking-tight text-white group-hover:text-cyan-300 line-clamp-1">
                        {st.title}
                      </h3>
                    </div>

                    <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                      {st.subtitle}
                    </p>
                  </div>

                  {/* Jump Action */}
                  <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-cyan-300">
                    <span className="font-mono text-[9px] font-semibold opacity-80">{st.badgeText}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) onNavigate(st.targetView);
                      }}
                      className="hover:text-white flex items-center gap-0.5 underline font-bold cursor-pointer"
                      title={`Open ${st.title} Module`}
                    >
                      <span>Open</span>
                      <ArrowUpRight className="w-3 h-3 inline" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Grid Controls: Search, Filters & Completion Bands */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Job No (JO-94289), Shipper, Route, Vessel, Cont..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-400 hover:text-slate-600 absolute right-2.5 top-2 cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Completion Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">
              Form Progress:
            </span>
            <button
              type="button"
              onClick={() => { setCompletionFilter('ALL'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                completionFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({enhancedJobs.length})
            </button>

            <button
              type="button"
              onClick={() => { setCompletionFilter('INCOMPLETE'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                completionFilter === 'INCOMPLETE'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Draft (&lt;50%)</span>
            </button>

            <button
              type="button"
              onClick={() => { setCompletionFilter('IN_TRANSIT'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                completionFilter === 'IN_TRANSIT'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>In Progress (50-80%)</span>
            </button>

            <button
              type="button"
              onClick={() => { setCompletionFilter('READY'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                completionFilter === 'READY'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Ready (&gt;80%)</span>
            </button>
          </div>
        </div>

        {/* 4. 4-Column Grid (4 Cards per row x N rows) */}
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">No Bookings Found</div>
              <p className="text-xs text-slate-500 mt-0.5">
                No job orders matched your search or stage filter. Try resetting filters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setCompletionFilter('ALL'); setActiveStageFilter('ALL'); }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {currentCards.map((j) => {
              const { percentage, checks } = j.completion;
              const isHigh = percentage >= 80;
              const isMed = percentage >= 50 && percentage < 80;

              return (
                <motion.div
                  key={j.id || j.joNo}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all p-3.5 flex flex-col justify-between group space-y-3"
                >
                  {/* Card Header: Job No & Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        {j.id || j.joNo || 'JO-94289'}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        j.status === 'COMPLETED' || j.status === 'INVOICED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : j.status === 'RAIL_OUT' || j.status === 'STUFFED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : j.status === 'ALLOTTED'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {j.status || 'BOOKED'}
                      </span>
                    </div>

                    {/* Shipper (Consignor) Name */}
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <h4 className="text-xs font-black text-slate-800 truncate leading-tight group-hover:text-blue-600 transition" title={j.customer || j.consignor}>
                        {j.customer || j.consignor || 'Fair Exports (India) Pvt Ltd'}
                      </h4>
                    </div>

                    {/* Route: POL ➔ POD */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mb-2 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{j.origin || j.fromLocation || 'Dadri ICD'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700 truncate">{j.pod || j.toLocation || 'Jebel Ali'}</span>
                    </div>

                    {/* Vessel & Voyage */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <Ship className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate font-semibold text-slate-700">{j.vessel || 'MAERSK COLOMBO'}</span>
                      <span>({j.voyage || '2604W'})</span>
                    </div>
                  </div>

                  {/* Form Completion Graph & Milestone Progress Ring */}
                  <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {/* SVG Circular Progress Ring */}
                      <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                        <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200"
                            strokeWidth="3.2"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={
                              isHigh ? 'text-emerald-500' :
                              isMed ? 'text-blue-500' : 'text-amber-500'
                            }
                            strokeDasharray={`${percentage}, 100`}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-mono font-black text-slate-800">
                          {percentage}%
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-600 uppercase">Form Filled</span>
                          <span className={isHigh ? 'text-emerald-700' : isMed ? 'text-blue-700' : 'text-amber-700'}>
                            {isHigh ? 'Ready' : isMed ? 'In Progress' : 'Incomplete'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {checks.filter(c => c.complete).length} of 5 Checks Pass
                        </div>
                      </div>
                    </div>

                    {/* Segmented Milestone Progress Dots */}
                    <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-200/60">
                      {checks.map((chk) => (
                        <div
                          key={chk.key}
                          title={`${chk.label}: ${chk.complete ? 'Completed' : 'Pending'}`}
                          className={`h-1.5 rounded-full transition-all ${
                            chk.complete
                              ? isHigh ? 'bg-emerald-500' : 'bg-blue-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Equipment & Dates summary */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-0.5">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Box className="w-3 h-3 text-slate-400" />
                      <span>{j.containersCount || (j.containers ? j.containers.length : 1)}x Units</span>
                    </span>
                    <span>JO: {j.joDate || j.date || j.bookingDate || '11/10/26'}</span>
                  </div>

                  {/* Card Actions: Edit Form & Open Cockpit */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (onEditJobInWizard) {
                          onEditJobInWizard(j);
                        } else if (onSelectJob && onNavigate) {
                          onSelectJob(j.id || j.joNo);
                          onNavigate('ContainerBooking');
                        }
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer select-none"
                      title="Edit this booking inside Job Order Wizard"
                    >
                      <span>✏️ Edit Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectJob) onSelectJob(j.id || j.joNo);
                        if (onOpenShipmentStatus) onOpenShipmentStatus(j.id || j.joNo);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center gap-0.5 cursor-pointer select-none"
                      title="View Tracking & Cockpit"
                    >
                      <span>Status</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 5. Pagination Bar (Next / Previous & Page Jumps) */}
        {filteredJobs.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs mt-4">
            <div className="text-xs text-slate-500 font-mono">
              Showing <strong className="text-slate-800">{startIdx + 1}</strong> &ndash; <strong className="text-slate-800">{endIdx}</strong> of <strong className="text-slate-800">{totalItems}</strong> Bookings
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Items Per Page Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
                <span className="text-[11px] font-bold">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={8}>8 (2 rows)</option>
                  <option value={12}>12 (3 rows)</option>
                  <option value={16}>16 (4 rows)</option>
                  <option value={24}>24 (6 rows)</option>
                </select>
              </div>

              {/* Prev Button */}
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  safeCurrentPage === 1
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {/* Page Number Indicators */}
              <div className="flex items-center gap-1 font-mono text-xs">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (safeCurrentPage <= 3) {
                    pageNum = i + 1;
                  } else if (safeCurrentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = safeCurrentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                        safeCurrentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && safeCurrentPage < totalPages - 2 && (
                  <span className="px-1 text-slate-400 font-bold">&hellip;</span>
                )}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  safeCurrentPage === totalPages
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xs cursor-pointer'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
