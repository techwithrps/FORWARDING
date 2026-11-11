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
  RotateCcw,
  BarChart3
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
  checks.push({ key: 'JO', label: 'Job Order Spec', shortLabel: 'Job', complete: joPoints >= 19, weight: 25 });

  // 2. Equipment & Commodity (20 pts)
  const hasEquipment = Array.isArray(job.equipmentBreakdown) && job.equipmentBreakdown.length > 0;
  const hasCommodity = !!(job.commodity || (hasEquipment && job.equipmentBreakdown[0]?.commodity));
  const eqPoints = (hasEquipment ? 12 : 6) + (hasCommodity ? 8 : 4);
  score += eqPoints;
  checks.push({ key: 'EQ', label: 'Equipment & Cargo', shortLabel: 'Cargo', complete: eqPoints >= 15, weight: 20 });

  // 3. Container Allotment / Manifest (20 pts)
  const containers = job.containers || [];
  const hasContainers = containers.length > 0 && containers.some(c => c.containerNo || c.contNo || c.no);
  const hasWeights = containers.length > 0 && containers.some(c => Number(c.grossWeight || c.gross || c.cargoWeight || c.cargo) > 0);
  const contPoints = (hasContainers ? 12 : 0) + (hasWeights ? 8 : 0);
  score += contPoints;
  checks.push({ key: 'MF', label: 'Container Manifest', shortLabel: 'Cont', complete: contPoints >= 15, weight: 20 });

  // 4. Trip Pendency & GR Allotment (20 pts)
  const hasVehicle = containers.some(c => c.truckNo || c.vehicleNo || c.truck);
  const hasDriver = containers.some(c => c.driverName);
  const hasGr = containers.some(c => c.grNo || c.grNumber || (c.gr && c.gr !== 'PENDING'));
  const grPoints = (hasVehicle ? 7 : 0) + (hasDriver ? 6 : 0) + (hasGr ? 7 : 0);
  score += grPoints;
  checks.push({ key: 'GR', label: 'Vehicle & GR Allotment', shortLabel: 'GR Bilty', complete: grPoints >= 14, weight: 20 });

  // 5. Movement, SOB & Invoicing (15 pts)
  const isStuffed = job.status === 'STUFFED' || job.status === 'RAIL_OUT' || job.status === 'COMPLETED' || job.status === 'INVOICED';
  const hasSobOrVessel = !!(job.vessel && job.voyage);
  const hasInvoice = !!(job.partyInvoiceNo || job.blNo || job.status === 'INVOICED');
  const movPoints = (isStuffed ? 6 : 0) + (hasSobOrVessel ? 4 : 0) + (hasInvoice ? 5 : 0);
  score += movPoints;
  checks.push({ key: 'DOC', label: 'Movement & Docs', shortLabel: 'Invoice', complete: movPoints >= 10, weight: 15 });

  const percentage = Math.min(100, Math.max(15, Math.round(score)));

  let nextAction = '✅ 100% Complete & Ready';
  if (!checks[0].complete) nextAction = '👉 Complete Booking Details';
  else if (!checks[1].complete) nextAction = '👉 Set Equipment & Cargo';
  else if (!checks[2].complete) nextAction = '👉 Enter Container Numbers';
  else if (!checks[3].complete) nextAction = '👉 Allot Vehicle & Generate GR';
  else if (!checks[4].complete) nextAction = '👉 Update Rail Out & Invoice';

  return { percentage, checks, nextAction };
}

// 8 Operational Lifecycle Stages
const PIPELINE_STAGES = [
  {
    step: '1',
    id: 'vessel-plan',
    title: 'Vessel Plan',
    desc: 'Liner & Schedules',
    icon: Ship,
    targetView: 'VesselPlanDetails'
  },
  {
    step: '2',
    id: 'job-creation',
    title: 'Job Booking',
    desc: 'Equipment & Spec',
    icon: FileText,
    targetView: 'ContainerBooking'
  },
  {
    step: '3',
    id: 'trip-pendency',
    title: 'Trip Pendency',
    desc: 'Trailer Matching (40/20)',
    icon: Clock,
    targetView: 'TripPendency'
  },
  {
    step: '4',
    id: 'gr-generation',
    title: 'GR Bilty',
    desc: 'Driver & Advances',
    icon: Truck,
    targetView: 'GrGeneration'
  },
  {
    step: '5',
    id: 'edi-customs',
    title: 'EDI Customs',
    desc: 'Shipping Bill & LEO',
    icon: FileCheck,
    targetView: 'EdiUpdate'
  },
  {
    step: '6',
    id: 'rail-out',
    title: 'Rail Out',
    desc: 'ICD Train Transit',
    icon: Train,
    targetView: 'ShipmentStatus'
  },
  {
    step: '7',
    id: 'sob-update',
    title: 'SOB Update',
    desc: 'Shipped On Board',
    icon: Anchor,
    targetView: 'VesselPlanDetails'
  },
  {
    step: '8',
    id: 'documentation',
    title: 'Invoicing',
    desc: 'Tax Invoices & Close',
    icon: Layers,
    targetView: 'Invoice'
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

  // Overall Form Completion Fleet Stats for Visual Distribution Graph
  const draftCount = useMemo(() => enhancedJobs.filter(j => j.completion.percentage < 50).length, [enhancedJobs]);
  const progressCount = useMemo(() => enhancedJobs.filter(j => j.completion.percentage >= 50 && j.completion.percentage < 80).length, [enhancedJobs]);
  const readyCount = useMemo(() => enhancedJobs.filter(j => j.completion.percentage >= 80).length, [enhancedJobs]);

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
      <div className="border-b border-slate-200/80 pb-3">
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

      {/* 2. Simple, Crystal Clear Shipment Operational Lifecycle Flow */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Shipment Operational Lifecycle
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  8 Step Flow
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Step-by-step process &bull; Click any step to filter bookings or open module
              </p>
            </div>
          </div>

          {activeStageFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setActiveStageFilter('ALL')}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All Bookings</span>
            </button>
          )}
        </div>

        {/* Stepper Flow Ribbon */}
        <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex items-center gap-1.5 min-w-[960px]">
            {PIPELINE_STAGES.map((st, idx) => {
              const IconComp = st.icon;
              const isSelected = activeStageFilter === st.id;
              const isLast = idx === PIPELINE_STAGES.length - 1;

              return (
                <React.Fragment key={st.id}>
                  <div
                    onClick={() => {
                      setActiveStageFilter(activeStageFilter === st.id ? 'ALL' : st.id);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 min-w-[105px] p-2.5 rounded-xl border transition-all cursor-pointer select-none group relative ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-200 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Step Number + Icon Row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center font-mono ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}>
                        {st.step}
                      </span>

                      <div className={`p-1 rounded-md ${
                        isSelected ? 'text-blue-600 bg-blue-100' : 'text-slate-400 group-hover:text-blue-600'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Title & Simple Descriptor */}
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">
                      {st.title}
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-slate-600 truncate mt-0.5">
                      {st.desc}
                    </div>

                    {/* Quick Jump Link on hover / active */}
                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className={`font-semibold ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-400'}`}>
                        {isSelected ? 'Active' : 'Filter'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) onNavigate(st.targetView);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                        title={`Open ${st.title} Module`}
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Connecting Chevron Arrow */}
                  {!isLast && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Grid Controls: Search, Filters & Fleet Analytics Graph */}
      <div className="space-y-3">
        {/* Fleet Form Completion Analytics Graph Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-slate-800">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Form Completion Analytics Graph ({enhancedJobs.length} Bookings)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap">
              <button
                type="button"
                onClick={() => { setCompletionFilter(completionFilter === 'INCOMPLETE' ? 'ALL' : 'INCOMPLETE'); setCurrentPage(1); }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer ${
                  completionFilter === 'INCOMPLETE'
                    ? 'bg-amber-500 text-white border-amber-600 font-bold'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Draft: {draftCount} ({Math.round((draftCount / Math.max(1, enhancedJobs.length)) * 100)}%)</span>
              </button>

              <button
                type="button"
                onClick={() => { setCompletionFilter(completionFilter === 'IN_TRANSIT' ? 'ALL' : 'IN_TRANSIT'); setCurrentPage(1); }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer ${
                  completionFilter === 'IN_TRANSIT'
                    ? 'bg-blue-600 text-white border-blue-700 font-bold'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>In Progress: {progressCount} ({Math.round((progressCount / Math.max(1, enhancedJobs.length)) * 100)}%)</span>
              </button>

              <button
                type="button"
                onClick={() => { setCompletionFilter(completionFilter === 'READY' ? 'ALL' : 'READY'); setCurrentPage(1); }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer ${
                  completionFilter === 'READY'
                    ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ready: {readyCount} ({Math.round((readyCount / Math.max(1, enhancedJobs.length)) * 100)}%)</span>
              </button>
            </div>
          </div>

          {/* Multi-Segment Stacked Progress Graph Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden shadow-inner cursor-pointer" title="Click any band to filter bookings">
            <div
              onClick={() => { setCompletionFilter(completionFilter === 'INCOMPLETE' ? 'ALL' : 'INCOMPLETE'); setCurrentPage(1); }}
              title={`Draft (<50%): ${draftCount} bookings`}
              style={{ width: `${(draftCount / Math.max(1, enhancedJobs.length)) * 100}%` }}
              className="bg-amber-400 hover:bg-amber-500 transition-all h-full"
            />
            <div
              onClick={() => { setCompletionFilter(completionFilter === 'IN_TRANSIT' ? 'ALL' : 'IN_TRANSIT'); setCurrentPage(1); }}
              title={`In Progress (50-80%): ${progressCount} bookings`}
              style={{ width: `${(progressCount / Math.max(1, enhancedJobs.length)) * 100}%` }}
              className="bg-blue-500 hover:bg-blue-600 transition-all h-full"
            />
            <div
              onClick={() => { setCompletionFilter(completionFilter === 'READY' ? 'ALL' : 'READY'); setCurrentPage(1); }}
              title={`Ready (>80%): ${readyCount} bookings`}
              style={{ width: `${(readyCount / Math.max(1, enhancedJobs.length)) * 100}%` }}
              className="bg-emerald-500 hover:bg-emerald-600 transition-all h-full"
            />
          </div>
        </div>

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

                  {/* Visual Form Completion Progress Graph */}
                  <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-2">
                    {/* Graph Title & Percentage */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px]">Form Progress</span>
                      </div>
                      <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md border ${
                        isHigh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isMed ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {percentage}%
                      </span>
                    </div>

                    {/* Visual Horizontal Progress Bar Graph */}
                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHigh ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                          isMed ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                          'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* 5 Milestone Steps Graph with Labels */}
                    <div className="grid grid-cols-5 gap-0.5 pt-1 text-center">
                      {checks.map((chk) => (
                        <div key={chk.key} className="flex flex-col items-center">
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black mb-0.5 ${
                            chk.complete
                              ? 'bg-emerald-500 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-400'
                          }`}>
                            {chk.complete ? '✓' : '•'}
                          </span>
                          <span className={`text-[8px] font-bold truncate max-w-[44px] ${
                            chk.complete ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {chk.shortLabel}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actionable Next Step Callout */}
                    <div className="text-[10px] font-semibold text-slate-600 pt-1.5 border-t border-slate-200/70 truncate flex items-center gap-1">
                      <span className="truncate">{j.completion.nextAction}</span>
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
