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

// View catalog mapping with Apple script friendly names and icons
export const VIEW_METADATA = {
  Dashboard: {
    helloText: 'dashboard',
    label: 'Executive Dashboard',
    subtitle: 'Real-time KPIs & Volume Analytics',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  Login: {
    helloText: 'welcome',
    label: 'Authentication & Security',
    subtitle: 'Role-Based Access Control',
    icon: KeyRound,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  ContainerBooking: {
    helloText: 'container booking',
    label: 'Container Booking (JO)',
    subtitle: 'Single-Screen Full Route Chain',
    icon: PlusCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  VesselPlanDetails: {
    helloText: 'vessel plan',
    label: 'Vessel Plan & Gateway Port',
    subtitle: 'Live Ocean Schedules & Cut-offs',
    icon: Anchor,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  ShipmentStatus: {
    helloText: 'shipment lifecycle',
    label: 'Shipment Lifecycle Hub',
    subtitle: 'End-to-End Milestone Tracking',
    icon: Navigation,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  RateTariff: {
    helloText: 'rate tariff',
    label: 'Rate Tariff Master',
    subtitle: 'Commercial Buy & Sell Freight Rates',
    icon: TrendingUp,
    color: 'text-violet-600',
    bg: 'bg-violet-50'
  },
  RateApproval: {
    helloText: 'rate approval',
    label: 'Rate Approval Workflow',
    subtitle: 'Commercial Quotations & Sign-offs',
    icon: FileCheck,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  EmptyBooking: {
    helloText: 'empty booking',
    label: 'Empty Container Booking',
    subtitle: 'Depot & Yard Allotment Orders',
    icon: Box,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  EmptyInventory: {
    helloText: 'empty inventory',
    label: 'Empty Depot Inventory',
    subtitle: 'Live Container Yard Stock',
    icon: Box,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  TripPendency: {
    helloText: 'trip pendency',
    label: 'Trip Pendency Ledger',
    subtitle: 'Awaiting Driver & Vehicle Dispatch',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  GrGeneration: {
    helloText: 'goods receipt',
    label: 'GR Generation (Lorry Receipt)',
    subtitle: 'E-Way & Consignment Notes',
    icon: Truck,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  RunningPosition: {
    helloText: 'live tracking',
    label: 'Live Vehicle GPS Tracking',
    subtitle: 'Highway Checkpoints & Route Status',
    icon: Navigation,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  TripClose: {
    helloText: 'trip close',
    label: 'Trip Close & Settlement',
    subtitle: 'Driver Diesel & Toll Reconciliation',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  EdiUpdate: {
    helloText: 'edi update',
    label: 'EDI Transmission Update',
    subtitle: 'Customs & Port Terminal EDI Filing',
    icon: Send,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  RailOutStatus: {
    helloText: 'rail out',
    label: 'Rail Out Status',
    subtitle: 'CONCOR Rake Loading & Departure',
    icon: Train,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  SobUpdate: {
    helloText: 'shipped on board',
    label: 'Shipped On Board (SOB)',
    subtitle: 'Ocean Vessel Sailing Confirmation',
    icon: Ship,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  DocumentUpdate: {
    helloText: 'documentation',
    label: 'Document & Shipping Bill',
    subtitle: 'Customs LEO & Shipping Bills',
    icon: FileText,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  BlStatusUpdate: {
    helloText: 'bill of lading',
    label: 'Bill of Lading (BL) Status',
    subtitle: 'OBL / Seaway Bill Release',
    icon: FileCheck,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  TelexStatusUpdate: {
    helloText: 'telex release',
    label: 'Telex Release Update',
    subtitle: 'Destination Cargo Surrender',
    icon: Send,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  TrUpdate: {
    helloText: 'terminal update',
    label: 'Terminal TR Update',
    subtitle: 'Port Container Gate In & Out',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  HandoverUpdate: {
    helloText: 'customs handover',
    label: 'Customs Handover Update',
    subtitle: 'CFS & Terminal Port Handover',
    icon: FileText,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  EgmUpdate: {
    helloText: 'egm manifest',
    label: 'EGM Filing Status',
    subtitle: 'Export General Manifest Finalization',
    icon: FileCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  ShipmentDischargeStatus: {
    helloText: 'cargo discharge',
    label: 'Shipment Discharge Status',
    subtitle: 'Destination Port Unloading ETA',
    icon: Ship,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  Invoice: {
    helloText: 'tax invoice',
    label: 'Tax Invoice (IRN / GST)',
    subtitle: 'Automated E-Invoice Generation',
    icon: Receipt,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  CreditDebitNotes: {
    helloText: 'credit & debit',
    label: 'Credit & Debit Notes',
    subtitle: 'Financial Ledger Adjustments',
    icon: CreditCard,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  CommercialReports: {
    helloText: 'p&l reports',
    label: 'Commercial P&L Reports',
    subtitle: 'Shipment Margin & Profit Ledger',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  DSRReport: {
    helloText: 'dsr ledger',
    label: 'Daily Status Report (DSR)',
    subtitle: 'Container Movement Export Ledger',
    icon: FileSpreadsheet,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  CompanyMaster: {
    helloText: 'company master',
    label: 'Company Master',
    subtitle: 'Branches, Legal Entities & PAN',
    icon: Building2,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  CustomerMaster: {
    helloText: 'customer master',
    label: 'Customer Master',
    subtitle: 'Shippers, Consignees & Exporters',
    icon: UserCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  VendorMaster: {
    helloText: 'vendor master',
    label: 'Vendor Master',
    subtitle: 'Shipping Lines, CFS & Transporters',
    icon: Building2,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  TerminalMaster: {
    helloText: 'terminal master',
    label: 'Terminal Master',
    subtitle: 'ICD, CFS & Gateway Sea Ports',
    icon: MapPin,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  TaxHead: {
    helloText: 'tax head',
    label: 'Tax Head Master',
    subtitle: 'HSN/SAC Codes & GST Slabs',
    icon: Receipt,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  TaxHeadGroup: {
    helloText: 'tax group',
    label: 'Tax Head Group',
    subtitle: 'Freight & Handling Charge Groups',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  ServiceMaster: {
    helloText: 'service master',
    label: 'Service Master',
    subtitle: 'Tariff Service Line Items',
    icon: Receipt,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  UomMaster: {
    helloText: 'unit of measure',
    label: 'Unit of Measure (UOM)',
    subtitle: 'Measurement Standard Codes',
    icon: Box,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  CommodityMaster: {
    helloText: 'commodity master',
    label: 'Commodity Master',
    subtitle: 'Reefer & Dry Cargo Classifications',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  BankMaster: {
    helloText: 'bank master',
    label: 'Bank Master',
    subtitle: 'Company Remittance & Accounts',
    icon: Building2,
    color: 'text-slate-600',
    bg: 'bg-slate-50'
  },
  PortMaster: {
    helloText: 'port master',
    label: 'Location & Port Master',
    subtitle: 'UN/LOCODE Master Registry',
    icon: MapPin,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  DriverMaster: {
    helloText: 'driver master',
    label: 'Driver Master',
    subtitle: 'Trailer Drivers & License KYC',
    icon: UserCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  VehicleMaster: {
    helloText: 'vehicle master',
    label: 'Vehicle Master',
    subtitle: 'GPS Fleet Trailer Inventory',
    icon: Truck,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  }
};

/**
 * Apple "Hello" Signature Script Transition Overlay
 * Appears when ANY page opens, writing that page's name in iconic Apple "hello" cursive script
 * over a frosted glassmorphism background, then seamlessly dissolves.
 */
export function AppleHelloPageTransition({ activeView }) {
  const [visible, setVisible] = useState(false);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!activeView) return;

    const current = VIEW_METADATA[activeView] || {
      helloText: activeView.replace(/([A-Z])/g, ' $1').toLowerCase().trim(),
      label: activeView.replace(/([A-Z])/g, ' $1').trim(),
      subtitle: 'SPJ Logistics Operating System',
      icon: LayoutDashboard,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    };

    setMeta(current);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 1300);

    return () => clearTimeout(timer);
  }, [activeView]);

  if (!visible || !meta) return null;

  const Icon = meta.icon || LayoutDashboard;

  return (
    <div
      onClick={() => setVisible(false)}
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-xl transition-all cursor-pointer select-none"
      title="Click to skip animation"
    >
      <div className="apple-hello-card apple-glass px-8 py-7 sm:px-12 sm:py-9 rounded-3xl text-center space-y-3.5 max-w-lg shadow-[0_25px_70px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden relative">
        {/* Subtle iridescent glow orb */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-violet-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* SPJ Group of Companies Official Logo */}
        <div className="flex justify-center items-center relative z-10">
          <img
            src="/spj-logo.png"
            alt="SPJ Group of Companies"
            className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs"
          />
        </div>

        {/* The Iconic Apple "hello" Style Cursive Script */}
        <div className="relative z-10 space-y-1">
          <h1 className="font-apple-script text-5xl sm:text-6xl md:text-7xl font-bold apple-shimmer-text tracking-wide drop-shadow-xs lowercase">
            {meta.helloText}
          </h1>
          <div className="text-xs sm:text-sm font-black text-slate-800 tracking-tight font-sans">
            {meta.label}
          </div>
        </div>

        {/* Apple Subtitle Pill */}
        <div className="relative z-10 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/[0.05] border border-slate-300/60 text-[10.5px] font-mono font-extrabold text-slate-700 tracking-wide uppercase shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Version 2.O &bull; SPJ Group of Companies
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Apple iOS-Style "Welcome to Version 2.O" Greeting Modal
 * Appears when logging in or opening the platform
 */
export function AppleWelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl animate-fade-in font-sans">
      <div className="fixed inset-0" onClick={onClose} />

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

        {/* Official SPJ Group of Companies Logo */}
        <div className="flex justify-center items-center pt-2 relative z-10">
          <img
            src="/spj-logo.png"
            alt="SPJ Group of Companies"
            className="h-11 sm:h-13 w-auto object-contain drop-shadow-xs"
          />
        </div>

        <div className="space-y-1.5 relative z-10">
          {/* The iconic Apple cursive "hello" text */}
          <div className="font-apple-script text-5xl sm:text-6xl font-bold apple-shimmer-text tracking-wide lowercase">
            hello
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Welcome to Version 2.O
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto font-medium">
            Next-generation freight forwarding, single-screen container booking, and real-time ocean intelligence.
          </p>
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
