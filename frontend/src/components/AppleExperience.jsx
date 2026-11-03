import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Anchor,
  Receipt,
  Building2,
  UserCheck,
  Truck,
  TrendingUp,
  FileCheck,
  Send,
  Train,
  Ship,
  FileText,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  Box,
  Clock,
  Navigation,
  CheckCircle2,
  Sparkles,
  X,
  ArrowRight,
  KeyRound,
  MapPin
} from 'lucide-react';

// View catalog mapping for icons, friendly titles & categories
export const VIEW_METADATA = {
  Dashboard: { label: 'Executive Dashboard', subtitle: 'Real-time KPIs & Volume Analytics', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
  Login: { label: 'Authentication & Security', subtitle: 'Role-Based Access Control', icon: KeyRound, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ContainerBooking: { label: 'Container Booking (JO)', subtitle: 'Single-Screen Full Route Dispatch', icon: PlusCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  VesselPlanDetails: { label: 'Vessel Plan & Gateway Port', subtitle: 'Live Ocean Schedules & Cut-offs', icon: Anchor, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ShipmentStatus: { label: 'Shipment Lifecycle Hub', subtitle: 'End-to-End Milestone Tracking', icon: Navigation, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  RateTariff: { label: 'Rate Tariff Master', subtitle: 'Commercial Buy & Sell Freight Rates', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  RateApproval: { label: 'Rate Approval Workflow', subtitle: 'Commercial Quotations & Sign-offs', icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  EmptyBooking: { label: 'Empty Container Booking', subtitle: 'Depot & Yard Allotment Orders', icon: Box, color: 'text-slate-600', bg: 'bg-slate-50' },
  EmptyInventory: { label: 'Empty Depot Inventory', subtitle: 'Live Container Yard Stock', icon: Box, color: 'text-slate-600', bg: 'bg-slate-50' },
  TripPendency: { label: 'Trip Pendency Ledger', subtitle: 'Awaiting Driver & Vehicle Dispatch', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  GrGeneration: { label: 'GR Generation (Lorry Receipt)', subtitle: 'E-Way & Consignment Notes', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
  RunningPosition: { label: 'Live Vehicle GPS Tracking', subtitle: 'Highway Checkpoints & Route Status', icon: Navigation, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  TripClose: { label: 'Trip Close & Settlement', subtitle: 'Driver Diesel & Toll Reconciliation', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  EdiUpdate: { label: 'EDI Transmission Update', subtitle: 'Customs & Port Terminal EDI Filing', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
  RailOutStatus: { label: 'Rail Out Status', subtitle: 'CONCOR Rake Loading & Departure', icon: Train, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  SobUpdate: { label: 'Shipped On Board (SOB)', subtitle: 'Ocean Vessel Sailing Confirmation', icon: Ship, color: 'text-blue-600', bg: 'bg-blue-50' },
  DocumentUpdate: { label: 'Document & Shipping Bill', subtitle: 'Customs LEO & Shipping Bills', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
  BlStatusUpdate: { label: 'Bill of Lading (BL) Status', subtitle: 'OBL / Seaway Bill Release', icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  TelexStatusUpdate: { label: 'Telex Release Update', subtitle: 'Destination Cargo Surrender', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  TrUpdate: { label: 'Terminal TR Update', subtitle: 'Port Container Gate In & Out', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  HandoverUpdate: { label: 'Customs Handover Update', subtitle: 'CFS & Terminal Port Handover', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
  EgmUpdate: { label: 'EGM Filing Status', subtitle: 'Export General Manifest Finalization', icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  ShipmentDischargeStatus: { label: 'Shipment Discharge Status', subtitle: 'Destination Port Unloading ETA', icon: Ship, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  Invoice: { label: 'Tax Invoice (IRN / GST)', subtitle: 'Automated E-Invoice Generation', icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' },
  CreditDebitNotes: { label: 'Credit & Debit Notes', subtitle: 'Financial Ledger Adjustments', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
  CommercialReports: { label: 'Commercial P&L Reports', subtitle: 'Shipment Margin & Profit Ledger', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  DSRReport: { label: 'Daily Status Report (DSR)', subtitle: 'Container Movement Export Ledger', icon: FileSpreadsheet, color: 'text-blue-600', bg: 'bg-blue-50' },
  CompanyMaster: { label: 'Company Master', subtitle: 'Branches, Legal Entities & PAN', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50' },
  CustomerMaster: { label: 'Customer Master', subtitle: 'Shippers, Consignees & Exporters', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  VendorMaster: { label: 'Vendor Master', subtitle: 'Shipping Lines, CFS & Transporters', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50' },
  TerminalMaster: { label: 'Terminal Master', subtitle: 'ICD, CFS & Gateway Sea Ports', icon: MapPin, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  TaxHead: { label: 'Tax Head Master', subtitle: 'HSN/SAC Codes & GST Slabs', icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50' },
  TaxHeadGroup: { label: 'Tax Head Group', subtitle: 'Freight & Handling Charge Groups', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  ServiceMaster: { label: 'Service Master', subtitle: 'Tariff Service Line Items', icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' },
  UomMaster: { label: 'Unit of Measure (UOM)', subtitle: 'Measurement Standard Codes', icon: Box, color: 'text-slate-600', bg: 'bg-slate-50' },
  CommodityMaster: { label: 'Commodity Master', subtitle: 'Reefer & Dry Cargo Classifications', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  BankMaster: { label: 'Bank Master', subtitle: 'Company Remittance & Accounts', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50' },
  PortMaster: { label: 'Location & Port Master', subtitle: 'UN/LOCODE Master Registry', icon: MapPin, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  DriverMaster: { label: 'Driver Master', subtitle: 'Trailer Drivers & License KYC', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  VehicleMaster: { label: 'Vehicle Master', subtitle: 'GPS Fleet Trailer Inventory', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' }
};

/**
 * Apple iOS-Style Dynamic Island Floating Pill
 * Displays when any page opens/changes, with frosted glassmorphism & fluid spring animation
 */
export function AppleDynamicIsland({ activeView }) {
  const [visible, setVisible] = useState(false);
  const [currentMeta, setCurrentMeta] = useState(null);

  useEffect(() => {
    if (!activeView) return;
    const meta = VIEW_METADATA[activeView] || {
      label: activeView.replace(/([A-Z])/g, ' $1').trim(),
      subtitle: 'SPJ Logistics Operating System',
      icon: LayoutDashboard,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    };

    setCurrentMeta(meta);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2400);

    return () => clearTimeout(timer);
  }, [activeView]);

  if (!visible || !currentMeta) return null;

  const Icon = currentMeta.icon || LayoutDashboard;

  return (
    <div
      onClick={() => setVisible(false)}
      className="fixed top-3 sm:top-3.5 left-1/2 -translate-x-1/2 z-[100] cursor-pointer select-none transition-all duration-300"
      title="Click to dismiss"
    >
      <div className="apple-dynamic-island apple-glass px-4 py-2 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-3 max-w-[90vw] hover:scale-105 active:scale-95 transition-transform duration-200 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
        {/* Apple Squircle Icon Badge */}
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${currentMeta.bg} ${currentMeta.color} flex items-center justify-center shrink-0 border border-black/5 shadow-2xs`}>
          <Icon className="w-4 h-4 stroke-[2.2]" />
        </div>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col text-left pr-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-[13px] font-black text-slate-900 tracking-tight truncate font-sans">
              {currentMeta.label}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[9px] font-mono font-extrabold border border-blue-200">
              <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse"></span>
              v2.O
            </span>
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-medium text-slate-500 truncate -mt-0.5">
            {currentMeta.subtitle}
          </span>
        </div>

        {/* Apple Subtle Glow Indicator */}
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0 ml-1"></div>
      </div>
    </div>
  );
}

/**
 * Apple iOS-Style "Welcome to Version 2.O" Greeting Modal
 * Appears when logging in or opening the platform, with iconic Apple glassmorphism
 */
export function AppleWelcomeModal({ isOpen, onClose, username = 'Rishabh' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in font-sans">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative apple-welcome-card apple-glass w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)] border border-white/80 overflow-hidden">
        {/* Apple subtle ambient gradient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Apple-style Logo & Sparkle Header */}
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-white/80">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-black tracking-widest uppercase text-blue-600 font-mono">
              SPJ GROUP OF COMPANIES
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 apple-shimmer-text">
              Welcome to Version 2.O
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto font-medium">
              Next-generation freight forwarding, single-screen container booking, and real-time ocean intelligence.
            </p>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-2 relative z-10 pt-1">
          <div className="p-2.5 rounded-2xl bg-white/70 border border-white/80 shadow-2xs space-y-0.5">
            <div className="text-[11px] font-black text-slate-900">⚡ Single-Screen</div>
            <div className="text-[9.5px] text-slate-500">Fast Container JO</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/70 border border-white/80 shadow-2xs space-y-0.5">
            <div className="text-[11px] font-black text-slate-900">🚢 Live Sailings</div>
            <div className="text-[9.5px] text-slate-500">Auto Schedule Sync</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/70 border border-white/80 shadow-2xs space-y-0.5">
            <div className="text-[11px] font-black text-slate-900">⚖️ Auto Gross</div>
            <div className="text-[9.5px] text-slate-500">Tare + Cargo = Gross</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer select-none"
          >
            <span>Continue to Version 2.O</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="text-[10px] text-slate-400 font-mono mt-2">
            Press ESC or click anywhere to start
          </div>
        </div>
      </div>
    </div>
  );
}
