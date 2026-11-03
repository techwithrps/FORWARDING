import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Ship,
  FileText,
  Receipt,
  FileSpreadsheet,
  Settings2,
  ChevronDown,
  ChevronRight,
  Building2,
  Clock,
  Box,
  CreditCard,
  TrendingUp,
  UserCheck,
  Truck,
  MapPin,
  KeyRound,
  FileCheck,
  ShieldCheck,
  Train,
  Anchor,
  Send,
  Navigation,
  CheckCircle2,
  X,
  User,
  Search
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  currentBranch,
  setCurrentBranch,
  userRole
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // 34-Page Freight Forwarding Sitemap organized by Categories
  const navSections = [
    {
      key: 'DASHBOARD',
      title: 'Trending & Overview',
      items: [
        { id: 'Dashboard', pageNo: '★', label: 'Executive Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      key: 'AUTH',
      title: 'Authentication',
      items: [
        { id: 'Login', pageNo: '1', label: 'Login Page', icon: KeyRound }
      ]
    },
    {
      key: 'MASTERS',
      title: 'Master Data (13 Masters)',
      items: [
        { id: 'CompanyMaster', pageNo: '2', label: 'Company Master', icon: Building2 },
        { id: 'TaxHead', pageNo: '3', label: 'Tax Head', icon: Receipt },
        { id: 'TaxHeadGroup', pageNo: '4', label: 'Tax Head Group', icon: FileText },
        { id: 'ServiceMaster', pageNo: '5', label: 'Service Master', icon: Receipt },
        { id: 'CustomerMaster', pageNo: '6', label: 'Customer Master', icon: UserCheck },
        { id: 'VendorMaster', pageNo: '7', label: 'Vendor Master', icon: Building2 },
        { id: 'TerminalMaster', pageNo: '8', label: 'Terminal Master', icon: MapPin },
        { id: 'UomMaster', pageNo: '9', label: 'UOM (Unit of Measure)', icon: Box },
        { id: 'CommodityMaster', pageNo: '10', label: 'Commodity Master', icon: ShieldCheck },
        { id: 'BankMaster', pageNo: '11', label: 'Bank Master', icon: Building2 },
        { id: 'PortMaster', pageNo: '12', label: 'Location Master', icon: MapPin },
        { id: 'DriverMaster', pageNo: '13', label: 'Driver Master', icon: UserCheck },
        { id: 'VehicleMaster', pageNo: '14', label: 'Vehicle Master', icon: Truck }
      ]
    },
    {
      key: 'COMMERCIAL',
      title: 'Commercial & Tariffs',
      items: [
        { id: 'RateTariff', pageNo: '15', label: 'Rate Tariff', icon: TrendingUp },
        { id: 'RateApproval', pageNo: '16', label: 'Rate Approval', icon: FileCheck }
      ]
    },
    {
      key: 'EMPTY',
      title: 'Empty Containers',
      items: [
        { id: 'EmptyBooking', pageNo: '17', label: 'Empty Booking', icon: Box },
        { id: 'EmptyInventory', pageNo: '18', label: 'Empty Inventory', icon: Box }
      ]
    },
    {
      key: 'BOOKINGS',
      title: 'Booking & Planning',
      items: [
        { id: 'ContainerBooking', pageNo: '19', label: 'Container Booking (JO)', icon: PlusCircle }
      ]
    },
    {
      key: 'FLEET',
      title: 'Fleet & Transport Operations',
      items: [
        { id: 'TripPendency', pageNo: '20', label: 'Trip Pendency', icon: Clock },
        { id: 'GrGeneration', pageNo: '21', label: 'GR Generation', icon: Truck },
        { id: 'RunningPosition', pageNo: '22', label: 'Running Position', icon: Navigation },
        { id: 'TripClose', pageNo: '23', label: 'Trip Close', icon: CheckCircle2 }
      ]
    },
    {
      key: 'LIFECYCLE',
      title: 'Shipment Lifecycle',
      items: [
        { id: 'EdiUpdate', pageNo: '24', label: 'EDI Update', icon: Send },
        { id: 'RailOutStatus', pageNo: '25', label: 'Rail Out Status', icon: Train },
        { id: 'VesselPlanDetails', pageNo: '26', label: 'Vessel Plan Details', icon: Anchor },
        { id: 'SobUpdate', pageNo: '27', label: 'SOB Update', icon: Ship },
        { id: 'DocumentUpdate', pageNo: '28', label: 'Document Update', icon: FileText },
        { id: 'BlStatusUpdate', pageNo: '29', label: 'BL Status Update', icon: FileCheck },
        { id: 'TelexStatusUpdate', pageNo: '30', label: 'Telex Status Update', icon: Send },
        { id: 'TrUpdate', pageNo: '31', label: 'TR Update', icon: ShieldCheck },
        { id: 'HandoverUpdate', pageNo: '32', label: 'Handover Update', icon: FileText },
        { id: 'EgmUpdate', pageNo: '33', label: 'EGM Update', icon: FileCheck },
        { id: 'ShipmentDischargeStatus', pageNo: '34', label: 'Shipment Discharge', icon: Ship }
      ]
    },
    {
      key: 'BILLING',
      title: 'Billing & Accounts',
      items: [
        { id: 'Invoice', pageNo: '35', label: 'Tax Invoice (IRN)', icon: Receipt },
        { id: 'CreditDebitNotes', pageNo: '36', label: 'Credit & Debit Notes', icon: CreditCard },
        { id: 'CommercialReports', pageNo: '37', label: 'Commercial P&L Reports', icon: TrendingUp },
        { id: 'DSRReport', pageNo: '38', label: 'Movement DSR Ledger', icon: FileSpreadsheet }
      ]
    }
  ];

  if (!isOpen) {
    return null;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-[150] flex animate-fade-in font-sans">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Floating Close Button outside drawer */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-2 left-[315px] max-sm:left-auto max-sm:right-2 z-[160] w-8 h-8 flex items-center justify-center text-white border-2 border-white/80 rounded hover:bg-white/10 transition-all cursor-pointer shadow-lg select-none"
        title="Close"
      >
        <X className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* High-Density Compact Slide-Out Drawer (305px width) */}
      <div className="relative w-[305px] max-w-[85vw] h-full bg-white z-[151] shadow-2xl flex flex-col text-slate-800 animate-slide-right overflow-hidden">
        {/* Compact Header: #232f3e dark banner */}
        <div className="bg-[#232f3e] text-white px-4 py-2.5 flex items-center justify-between shrink-0 select-none border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-white/80 flex items-center justify-center text-white shrink-0">
              <User className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight leading-none">
                Hello, Rishabh
              </div>
              <div className="text-[10px] text-slate-300 font-mono mt-0.5 leading-none">
                elogisol Technologies
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
            {userRole}
          </span>
        </div>

        {/* Compact Branch & Search Row */}
        <div className="p-2 bg-slate-50 border-b border-slate-200/80 space-y-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md border border-slate-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={currentBranch}
              onChange={(e) => setCurrentBranch(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-[11px] w-full"
            >
              <option value="Dadri ICD (INICD6)">Dadri ICD (INICD6)</option>
              <option value="Mundra Port (INMUN1)">Mundra Port (INMUN1)</option>
              <option value="Nhava Sheva (INNSA1)">Nhava Sheva (INNSA1)</option>
              <option value="Pipavav Port (INPAV1)">Pipavav Port (INPAV1)</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search 34 modules or page no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md pl-6 pr-2 py-1 text-[11px] text-slate-800 outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* High-Density Category-Wise List (Compact padding & line height for maximum visibility) */}
        <div className="flex-1 overflow-y-auto py-1">
          {navSections.map((sec, idx) => {
            const filteredItems = normalizedSearch
              ? sec.items.filter(it =>
                  it.label.toLowerCase().includes(normalizedSearch) ||
                  it.pageNo.toLowerCase().includes(normalizedSearch) ||
                  it.id.toLowerCase().includes(normalizedSearch)
                )
              : sec.items;

            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.key} className="py-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-4 pt-1 pb-0.5">
                  {sec.title}
                </div>
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveView(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-4 py-1.5 text-xs transition-colors cursor-pointer text-left ${
                          isActive
                            ? 'bg-blue-50 text-blue-900 font-bold border-l-3 border-blue-600'
                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] w-4 text-slate-400 font-bold shrink-0">
                            {item.pageNo}.
                          </span>
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="truncate text-[12px]">{item.label}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                      </button>
                    );
                  })}
                </div>
                {idx < navSections.length - 1 && (
                  <div className="border-b border-slate-100 my-1 mx-3" />
                )}
              </div>
            );
          })}
        </div>

        {/* Compact Footer */}
        <div className="py-1.5 px-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Online · {currentBranch.split(' ')[0]}</span>
          </div>
          <span className="font-mono text-slate-400">v2.0 LIVE</span>
        </div>
      </div>
    </div>
  );
}
