import React, { useState, useRef, useEffect, useMemo } from 'react';
import spjLogo from '../assets/spjLogoBase64.js';
import {
  Search,
  Bell,
  PlusCircle,
  Menu,
  X,
  UserCheck,
  Building2,
  Receipt,
  Truck,
  Box,
  TrendingUp,
  CreditCard,
  Send,
  Train,
  Anchor,
  Ship,
  FileText,
  FileCheck,
  CheckCircle2,
  Navigation,
  FileSpreadsheet,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  History,
  Sparkles
} from 'lucide-react';

export default function Header({
  onVesselClick,
  onRecentClick,
  userRole,
  setUserRole,
  onOpenCommandPalette,
  onNewBookingClick,
  onToggleSidebar,
  onSelectView,
  onOpenPartyModal,
  jobs = [],
  parties = [],
  onSelectJob,
  onOpenWelcome,
  onToggleCopilot
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Actions, Pages & Operations Catalog
  const searchCatalog = useMemo(() => [
    // 1. Quick Creates & Actions
    { id: 'create_booking', title: 'Create Job Order / Booking', subtitle: 'Start new container export/import booking wizard', category: 'Action', type: 'create', view: 'ContainerBooking', icon: PlusCircle, badge: '+ Create' },
    { id: 'add_customer', title: 'Add New Customer / Shipper', subtitle: 'Onboard shipper with GSTIN, credit limits', category: 'Action', type: 'create', view: 'CustomerMaster', icon: UserCheck, action: 'party_modal', badge: '+ Create' },
    { id: 'add_vendor', title: 'Add New Vendor / Transporter', subtitle: 'Add shipping line, CFS, or fleet vendor', category: 'Action', type: 'create', view: 'VendorMaster', icon: Building2, badge: '+ Create' },
    { id: 'create_invoice', title: 'Create Sales Tax Invoice (IRN)', subtitle: 'Generate GST compliant invoice with e-Way & IRN', category: 'Action', type: 'create', view: 'Invoice', icon: Receipt, badge: '+ Create' },
    { id: 'create_gr', title: 'Generate GR (Goods Receipt)', subtitle: 'Issue lorry receipt / container gate pass', category: 'Action', type: 'create', view: 'GrGeneration', icon: Truck, badge: '+ Create' },
    { id: 'empty_booking', title: 'Create Empty Container Booking', subtitle: 'Book empty pick-up from yard or port depot', category: 'Action', type: 'create', view: 'EmptyBooking', icon: Box, badge: '+ Create' },
    { id: 'add_tariff', title: 'Add Commercial Rate Tariff', subtitle: 'Configure buy/sell freight rates & slab tariffs', category: 'Action', type: 'create', view: 'RateTariff', icon: TrendingUp, badge: '+ Create' },
    { id: 'create_credit_note', title: 'Create Credit / Debit Note', subtitle: 'Issue financial adjustment note for invoice', category: 'Action', type: 'create', view: 'CreditDebitNotes', icon: CreditCard, badge: '+ Create' },
    { id: 'add_driver', title: 'Add Driver Master', subtitle: 'Register truck driver license and phone', category: 'Action', type: 'create', view: 'DriverMaster', icon: UserCheck, badge: '+ Create' },
    { id: 'add_vehicle', title: 'Add Vehicle Master', subtitle: 'Register container trailer / GPS truck', category: 'Action', type: 'create', view: 'VehicleMaster', icon: Truck, badge: '+ Create' },

    // 2. Operations & Lifecycle Updates
    { id: 'edi_update', title: 'Update EDI Transmission', subtitle: 'Customs & port terminal EDI file update', category: 'Operations', type: 'edit', view: 'EdiUpdate', icon: Send, badge: 'Edit' },
    { id: 'rail_out', title: 'Update Rail Out Status', subtitle: 'Train wagon rake loading and departure update', category: 'Operations', type: 'edit', view: 'RailOutStatus', icon: Train, badge: 'Edit' },
    { id: 'vessel_plan', title: 'Update Vessel Plan & Cut-offs', subtitle: 'Gateway port vessel schedule and cut-off dates', category: 'Operations', type: 'edit', view: 'VesselPlanDetails', icon: Anchor, badge: 'Edit' },
    { id: 'sob_update', title: 'Update Shipped on Board (SOB)', subtitle: 'Record onboard date and ocean mate receipt', category: 'Operations', type: 'edit', view: 'SobUpdate', icon: Ship, badge: 'Edit' },
    { id: 'bl_update', title: 'Update Bill of Lading (BL) Status', subtitle: 'OBL / Seaway bill surrender & release', category: 'Operations', type: 'edit', view: 'BlStatusUpdate', icon: FileCheck, badge: 'Edit' },
    { id: 'telex_update', title: 'Telex Release Update', subtitle: 'Destination port cargo release authorization', category: 'Operations', type: 'edit', view: 'TelexStatusUpdate', icon: Send, badge: 'Edit' },
    { id: 'handover_update', title: 'Customs Handover Update', subtitle: 'LEO copy, shipping bill & port handover', category: 'Operations', type: 'edit', view: 'HandoverUpdate', icon: FileText, badge: 'Edit' },
    { id: 'egm_update', title: 'EGM Filing Status', subtitle: 'Export General Manifest submission update', category: 'Operations', type: 'edit', view: 'EgmUpdate', icon: FileCheck, badge: 'Edit' },
    { id: 'trip_close', title: 'Trip Close & Settlement', subtitle: 'Finalize trip mileage, diesel & driver advance', category: 'Operations', type: 'edit', view: 'TripClose', icon: CheckCircle2, badge: 'Edit' },
    { id: 'running_pos', title: 'Vehicle Live Running Position', subtitle: 'GPS tracking and road checkpoint status', category: 'Operations', type: 'edit', view: 'RunningPosition', icon: Navigation, badge: 'Tracking' },
    { id: 'dsr_ledger', title: 'Movement DSR Ledger Report', subtitle: 'Daily status report ledger & Excel export', category: 'Report', type: 'view', view: 'DSRReport', icon: FileSpreadsheet, badge: 'Report' },
    { id: 'pnl_report', title: 'Commercial P&L Reports', subtitle: 'Profit & loss margin analytics per job', category: 'Report', type: 'view', view: 'CommercialReports', icon: TrendingUp, badge: 'Report' },

    // 3. Navigation Pages & Masters
    { id: 'nav_dashboard', title: 'Executive Dashboard', subtitle: 'Terminal operations & volume KPIs overview', category: 'Page', view: 'Dashboard', icon: LayoutDashboard },
    { id: 'nav_company', title: 'Company Master', subtitle: 'Manage company branches, PAN & GST numbers', category: 'Master', view: 'CompanyMaster', icon: Building2 },
    { id: 'nav_customer', title: 'Customer Master', subtitle: 'Shippers, consignees & party master', category: 'Master', view: 'CustomerMaster', icon: UserCheck },
    { id: 'nav_vendor', title: 'Vendor Master', subtitle: 'Shipping lines, transporters & CHA vendors', category: 'Master', view: 'VendorMaster', icon: Building2 },
    { id: 'nav_terminal', title: 'Terminal Master', subtitle: 'ICDs, CFSs, and gateway sea ports', category: 'Master', view: 'TerminalMaster', icon: MapPin },
    { id: 'nav_tax_head', title: 'Tax Head Master', subtitle: 'HSN/SAC codes, CGST, SGST, IGST rates', category: 'Master', view: 'TaxHead', icon: Receipt },
    { id: 'nav_tax_group', title: 'Tax Head Group', subtitle: 'Grouping for freight, local & handling charges', category: 'Master', view: 'TaxHeadGroup', icon: FileText },
    { id: 'nav_service', title: 'Service Master', subtitle: 'Billing charge heads and ocean service items', category: 'Master', view: 'ServiceMaster', icon: Receipt },
    { id: 'nav_uom', title: 'UOM (Unit of Measurement)', subtitle: 'Units of measurement: MT, TEU, CBM, KGS', category: 'Master', view: 'UomMaster', icon: Box },
    { id: 'nav_commodity', title: 'Commodity Master', subtitle: 'Hazardous, reefer, dry & general cargo specs', category: 'Master', view: 'CommodityMaster', icon: ShieldCheck },
    { id: 'nav_bank', title: 'Bank Master', subtitle: 'Company & party bank accounts for RTGS/NEFT', category: 'Master', view: 'BankMaster', icon: Building2 },
    { id: 'nav_location', title: 'Location / Port Master', subtitle: 'Global UN/LOCODE sea ports & inland depots', category: 'Master', view: 'PortMaster', icon: MapPin },
    { id: 'nav_driver', title: 'Driver Master', subtitle: 'Commercial drivers roster and police verification', category: 'Master', view: 'DriverMaster', icon: UserCheck },
    { id: 'nav_vehicle', title: 'Vehicle Master', subtitle: 'Trailer registration, RC, fitness & insurance', category: 'Master', view: 'VehicleMaster', icon: Truck },
    { id: 'nav_tariff', title: 'Commercial Rate Tariff', subtitle: 'Line freight, haulage & stuffing rate cards', category: 'Master', view: 'RateTariff', icon: TrendingUp },
    { id: 'nav_approval', title: 'Rate Approval Workflow', subtitle: 'Commercial GM discount & credit approval', category: 'Master', view: 'RateApproval', icon: FileCheck },
    { id: 'nav_empty_inv', title: 'Empty Container Inventory', subtitle: 'Live empty box balance across ICD yards', category: 'Master', view: 'EmptyInventory', icon: Box },
    { id: 'nav_trip_pendency', title: 'Trip Pendency Desk', subtitle: 'Pending lorry dispatch & driver allocation', category: 'Master', view: 'TripPendency', icon: Clock },
    { id: 'nav_discharge', title: 'Shipment Discharge Status', subtitle: 'Destination port vessel discharge and delivery', category: 'Master', view: 'ShipmentDischargeStatus', icon: Ship },
  ], []);

  // Filter Catalog & Live Data based on Search Query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Matched Actions & Pages
    const matchedActions = !q
      ? searchCatalog.slice(0, 8)
      : searchCatalog.filter(item =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        ).slice(0, 10);

    // Matched Live Jobs / Shipments
    const matchedJobs = !q
      ? []
      : jobs.filter(j =>
          (j.joNo && j.joNo.toLowerCase().includes(q)) ||
          (j.bookingNo && j.bookingNo.toLowerCase().includes(q)) ||
          (j.customer && j.customer.toLowerCase().includes(q)) ||
          (j.vessel && j.vessel.toLowerCase().includes(q)) ||
          (j.containers && j.containers.some(c => c.containerNo && c.containerNo.toLowerCase().includes(q)))
        ).slice(0, 5);

    // Matched Parties / Customers
    const matchedParties = !q
      ? []
      : parties.filter(p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.gstin && p.gstin.toLowerCase().includes(q))
        ).slice(0, 4);

    return {
      actions: matchedActions,
      jobs: matchedJobs,
      parties: matchedParties,
      total: matchedActions.length + matchedJobs.length + matchedParties.length
    };
  }, [query, searchCatalog, jobs, parties]);

  const handleExecute = (item) => {
    if (item.action === 'party_modal' && onOpenPartyModal) {
      onOpenPartyModal();
    } else if (item.isJob && onSelectJob) {
      onSelectJob(item.id);
    } else if (item.view && onSelectView) {
      onSelectView(item.view);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-4 shadow-xs font-sans">
      {/* Left: Brand Logo + Amazon-style "All" Button */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232f3e] hover:bg-[#131921] active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-slate-700 select-none shrink-0"
          title="Open All Navigation Categories"
        >
          <Menu className="w-4 h-4 text-amber-400 shrink-0" />
          <span>All</span>
        </button>

        {/* Brand: SPJ GROUP OF COMPANIES Logo + Apple-Style Version 2.O Badge */}
        <div className="flex items-center gap-2 pr-3 sm:pr-4 border-r border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onSelectView) onSelectView('Dashboard');
            }}
            className="flex items-center select-none cursor-pointer hover:opacity-85 active:scale-95 transition shrink-0"
            title="SPJ Group of Companies - Go to Dashboard"
          >
            <img
              src={spjLogo}
              alt="SPJ Group of Companies"
              className="h-9 sm:h-10 md:h-11 w-auto object-contain max-w-[210px] sm:max-w-[260px] drop-shadow-2xs mix-blend-multiply"
            />
          </button>

          {/* Apple-style Frosted Glass Version 2.O Tag */}
          <button
            type="button"
            onClick={() => {
              if (onOpenWelcome) onOpenWelcome();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/[0.04] hover:bg-slate-900/[0.08] active:scale-95 border border-slate-300/70 shadow-2xs backdrop-blur-md transition-all select-none cursor-pointer group"
            title="Click to view Version 2.O Welcome details"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 animate-pulse"></span>
            <span className="text-[10.5px] font-black tracking-wider uppercase bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              Version 2.O
            </span>
          </button>
        </div>
      </div>

      {/* Center: Universal Interactive Search Bar */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-lg">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border transition-all ${
            isOpen ? 'bg-white border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search anything... pages, +create, edit, jobs, containers, masters (⌘K)"
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-slate-400 border border-slate-200 shadow-2xs hidden xs:inline select-none">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Floating Universal Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col animate-scale-in">
            {/* Quick Header */}
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{query ? `Results for "${query}"` : 'Quick Actions, Masters & Search'}</span>
              <span>ESC to close</span>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {/* 1. Matched Live Jobs & Shipments */}
              {filteredResults.jobs.length > 0 && (
                <div className="p-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 px-2 py-1">
                    Live Shipments & Job Orders ({filteredResults.jobs.length})
                  </div>
                  {filteredResults.jobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => handleExecute({ isJob: true, id: job.id })}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          JO
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-blue-700">{job.joNo}</span>
                            <span className="text-[10px] text-slate-500 truncate">({job.customer})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                            <span>{job.origin} ➔ {job.pod}</span>
                            <span>•</span>
                            <span className="font-mono">{job.vessel || 'Vessel TBA'}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase group-hover:bg-blue-200 group-hover:text-blue-900 transition shrink-0 ml-2">
                        View Job
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Matched Customers / Parties */}
              {filteredResults.parties.length > 0 && (
                <div className="p-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 px-2 py-1">
                    Parties & Customers ({filteredResults.parties.length})
                  </div>
                  {filteredResults.parties.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleExecute({ view: 'CustomerMaster' })}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50 text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {p.type?.charAt(0) || 'P'}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs text-slate-800 truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            GSTIN: {p.gstin || 'N/A'} · {p.city}
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 group-hover:bg-emerald-200 group-hover:text-emerald-900 transition shrink-0 ml-2">
                        Master Vault
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 3. Actions, Create Commands, Pages & Masters */}
              {filteredResults.actions.length > 0 && (
                <div className="p-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Actions, Pages & Masters ({filteredResults.actions.length})
                  </div>
                  {filteredResults.actions.map((item) => {
                    const Icon = item.icon || PlusCircle;
                    const isCreate = item.type === 'create';
                    const isEdit = item.type === 'edit';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleExecute(item)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                              isCreate
                                ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition'
                                : isEdit
                                ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition truncate">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span
                                  className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                    isCreate
                                      ? 'bg-blue-100 text-blue-800'
                                      : isEdit
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.2">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0 ml-2 transition" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {filteredResults.total === 0 && (
                <div className="p-8 text-center text-slate-500 space-y-1">
                  <p className="text-xs font-semibold">No direct matches found for "{query}"</p>
                  <p className="text-[11px] text-slate-400">
                    Try searching for "booking", "customer", "invoice", "tariff", "GR", "container", or page numbers.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Footer */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between px-3">
              <span>Press ↵ to select · ESC to cancel</span>
              <span className="font-mono">elogisol Omnibox v2.0</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* AI Copilot Button (Shifted on top after search option as requested) */}
        <button
          type="button"
          onClick={onToggleCopilot}
          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer select-none"
          title="Open AI Logistics Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Copilot</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Compact Vessel Plan Button */}
        <button
          type="button"
          onClick={onVesselClick}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer select-none"
          title="Open Vessel Plan & Gateway Tracking"
        >
          <Ship className="w-3.5 h-3.5 text-cyan-300" />
          <span>Vessel Plan</span>
        </button>


        {/* Compact Booking Button */}
        <button
          type="button"
          onClick={onNewBookingClick}
          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer select-none"
          title="Create New Container Booking"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Booking</span>
        </button>

        {/* Notifications */}
        <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition shadow-xs cursor-pointer">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
