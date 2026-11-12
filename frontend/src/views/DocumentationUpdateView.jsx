import React, { useState, useEffect } from 'react';
import spjLogo from '../assets/spjLogoBase64.js';
import {
  FileText,
  Search,
  CheckCircle2,
  Zap,
  Save,
  Download,
  Printer,
  CheckSquare,
  Eye,
  ShieldCheck,
  ArrowRight,
  Building,
  Truck,
  Train,
  Ship,
  Anchor,
  MapPin,
  Barcode
} from 'lucide-react';

export default function DocumentationUpdateView({ jobs = [], onUpdateJob }) {
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'collective'
  const [searchTerm, setSearchTerm] = useState('');
  const [shipperFilter, setShipperFilter] = useState('ALL');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [docRows, setDocRows] = useState([]);
  const [selectedDossierIndex, setSelectedDossierIndex] = useState(0);
  const [modalDossier, setModalDossier] = useState(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setModalDossier(null);
    };
    window.addEventListener('keydown', handleKeyDown);
  
  const renderDossierSheet = (dossier) => {
    if (!dossier) return null;
    return (
<div
            id="a4-printable-dossier"
            className="bg-white p-6 sm:p-9 rounded-2xl border border-slate-300 shadow-xl max-w-[210mm] mx-auto text-slate-900 font-sans print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full"
          >
            {/* 1. Official Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={spjLogo}
                  alt="SPJ Group of Companies"
                  className="h-12 w-auto object-contain select-none mix-blend-multiply"
                />
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    SPJ GROUP OF COMPANIES
                  </h1>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">
                    Multi-Modal Logistics Operating System &bull; Licensed Customs Broker (CHA) &bull; DTO / MTO Fleet
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Regd Hub: ICD Dadri, Gautam Buddha Nagar, UP-203207 &bull; Nhava Sheva Sea Port, Maharashtra
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-[10px] space-y-0.5 shrink-0">
                <div className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  DOSSIER DOCKET: #{dossier.jobId}-{dossier.contNo}
                </div>
                <div className="text-slate-600 font-semibold">
                  AUDIT DATE: {new Date().toLocaleDateString('en-GB')}
                </div>
                <div className="text-slate-500">
                  STATUS: <strong className="text-emerald-700">PRE-SAILING VERIFIED</strong>
                </div>
              </div>
            </div>

            {/* Title Banner */}
            <div className="my-3 py-1.5 px-3 bg-slate-900 text-white rounded text-center">
              <h2 className="text-xs sm:text-sm font-black tracking-widest uppercase">
                MASTER SHIPMENT VERIFICATION DOSSIER &bull; COMPREHENSIVE OPERATIONAL RECORD
              </h2>
              <p className="text-[9px] text-slate-300 uppercase tracking-wider">
                Cross-Check Audit Sheet for Physical Forms, ICEGATE Shipping Bill &amp; Bill of Lading Finalization
              </p>
            </div>

            {/* 2. Structured 6-Lifecycle Sections Grid */}
            <div className="space-y-3 text-[11px]">
              {/* SECTION 1: Booking & Commercial Contracting */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 font-black text-slate-800 text-[10.5px] uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-700" />
                    1. Booking &amp; Commercial Contracting Details
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-500">Form 01 &bull; Booking Wizard</span>
                </div>
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Job Order (JO) No</span>
                    <span className="font-mono font-bold text-blue-800">{dossier.jobId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Booking Date</span>
                    <span className="font-mono font-semibold">{dossier.jobDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Shipper (Consignor)</span>
                    <span className="font-bold text-slate-900 truncate block">{dossier.shipper}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Foreign Consignee (Buyer)</span>
                    <span className="font-medium text-slate-800 truncate block">{dossier.consignee}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Customs Broker (CHA)</span>
                    <span className="font-medium text-slate-800 truncate block">{dossier.cha}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Transporter / Fleet</span>
                    <span className="font-medium text-slate-800 truncate block">{dossier.transporter}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Equipment & Cargo Specification */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 font-black text-slate-800 text-[10.5px] uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    2. Container Equipment &amp; Cargo Specifications
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-500">Form 02 &bull; Container Allotment</span>
                </div>
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Container Number</span>
                    <span className="font-bold text-blue-800 text-xs">{dossier.contNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Size &amp; Type</span>
                    <span className="font-bold text-slate-900">{dossier.size}ft {dossier.type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Container Tare Wt</span>
                    <span>{dossier.tareWeight}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Cargo Gross Weight (VGM)</span>
                    <span className="font-bold text-slate-900">{dossier.grossWeight}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">High Security Seal No</span>
                    <span className="font-bold text-emerald-800">{dossier.sealNo}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Commodity Description</span>
                    <span className="font-sans font-semibold text-slate-900 truncate block">{dossier.commodity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Reefer Temp / Vent</span>
                    <span className="font-bold text-cyan-800">{dossier.tempSetting}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Road Movement & Bilty (GR) */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 font-black text-slate-800 text-[10.5px] uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-700" />
                    3. Road Transit &amp; Goods Receipt (Bilty / GR)
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-500">Page 17 &bull; GR Generation</span>
                </div>
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Goods Receipt (GR) No</span>
                    <span className="font-bold text-slate-900">{dossier.grNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">GR Issue Date</span>
                    <span>{dossier.grDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Vehicle / Trailer No</span>
                    <span className="font-bold text-blue-800">{dossier.truckNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Driver Name &amp; Contact</span>
                    <span className="font-sans text-[10.5px] font-semibold text-slate-800">{dossier.driverName} ({dossier.driverMobile})</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Customs ICEGATE Clearance & EDI */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 font-black text-slate-800 text-[10.5px] uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    4. Customs ICEGATE Clearance &amp; Shipping Bill EDI
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-500">Page 24 &bull; EDI Transmission</span>
                </div>
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Shipping Bill (SB) No</span>
                    <span className="font-bold text-blue-800 text-xs">{dossier.sbNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Shipping Bill Date</span>
                    <span className="font-semibold">{dossier.sbDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Exporter Invoice No</span>
                    <span className="font-bold text-slate-900">{dossier.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Invoice Date &amp; FOB</span>
                    <span className="font-semibold text-slate-800">{dossier.invoiceDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">LEO (Let Export Order) Status</span>
                    <span className="font-bold text-emerald-800 font-sans">{dossier.leoDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">ICEGATE Transmission</span>
                    <span className="font-bold text-blue-700 font-sans">{dossier.ediStatus}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Rail Out & Terminal Movement */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 font-black text-slate-800 text-[10.5px] uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Train className="w-3.5 h-3.5 text-blue-700" />
                    5. Rail Out &amp; Corridor Terminal Movement
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-500">Page 25 &bull; Rail Out Status</span>
                </div>
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Train / Rake Number</span>
                    <span className="font-bold text-slate-900">{dossier.trainNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Wagon Number</span>
                    <span className="font-bold text-slate-900">{dossier.wagonNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Deck Position (Tier)</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${dossier.deckTier === 'UPPER' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {dossier.deckTier === 'UPPER' ? '▲ UPPER DECK' : '▼ LOWER DECK'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Rail Departure Date</span>
                    <span className="font-bold text-blue-800">{dossier.railDate}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 6: Ocean Vessel & Shipped On Board (SOB) */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 border-b border-slate-300 font-black text-slate-800 text-[10.5px] uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-blue-700" />
                    6. Ocean Vessel Schedule &amp; Shipped On Board (SOB)
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-500">Page 26 &bull; Vessel Plan &amp; Page 27 &bull; SOB</span>
                </div>
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Shipping Line</span>
                    <span className="font-sans font-bold text-slate-900 truncate block">{dossier.line}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Ocean Vessel &amp; Voyage</span>
                    <span className="font-bold text-slate-900">{dossier.planVessel} ({dossier.voyage})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Port of Loading (POL)</span>
                    <span className="font-bold text-slate-800">{dossier.pol}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Port of Discharge (POD)</span>
                    <span className="font-bold text-blue-800">{dossier.pod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Port Cut-off Deadline</span>
                    <span className="text-slate-700">{dossier.portCutDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Vessel Sailing ETD</span>
                    <span className="font-bold text-slate-900">{dossier.etd}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Shipped On Board (SOB) Confirmed</span>
                    <span className="font-bold text-emerald-800 text-xs">
                      ⚓ SOB DATE: {dossier.sobDate} (VERIFIED ON BOARD)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Document Audit Verification Checklist */}
            <div className="mt-3.5 p-3 rounded-lg border border-slate-300 bg-slate-50/70 text-[10.5px]">
              <div className="font-bold text-slate-900 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verification &amp; Cross-Check Audit Criteria</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-medium text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Commercial Invoice &amp; Packing List matched with ICEGATE SB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Container Tare, Gross &amp; VGM matched with weighbridge ticket</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Customs LEO (Let Export Order) cleared on ICEGATE portal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Rail Out train departure confirmed by CONCOR / DFC Terminal</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Shipping Line draft B/L approved &amp; SOB confirmed by carrier notice</span>
                </div>
              </div>
            </div>

            {/* 4. Official Sign-off & Stamp Section */}
            <div className="mt-4 pt-3 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-center text-[10px]">
              <div className="space-y-6">
                <div className="text-slate-500 uppercase font-bold">Prepared By</div>
                <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
                <div className="font-semibold text-slate-700">Documentation Executive</div>
              </div>

              <div className="space-y-6">
                <div className="text-slate-500 uppercase font-bold">Verified By</div>
                <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
                <div className="font-semibold text-slate-700">Operations Controller / CHA Lead</div>
              </div>

              <div className="p-2 border-2 border-dashed border-slate-400 rounded-lg space-y-1">
                <div className="font-extrabold text-blue-900 uppercase text-[9.5px]">
                  SPJ GROUP OF COMPANIES
                </div>
                <div className="text-[8.5px] text-emerald-800 font-bold uppercase tracking-wider">
                  ★ APPROVED FOR B/L RELEASE ★
                </div>
                <div className="text-[8px] text-slate-400 font-mono">
                  OPERATIONAL CLEARANCE STAMP
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-3 text-center text-[8.5px] text-slate-400 font-mono border-t border-slate-200 pt-1.5">
              CONFIDENTIAL &bull; GENERATED BY SPJ eLOGIFREIGHT OPERATING SYSTEM &bull; VALID WITHOUT HANDWRITTEN SIGNATURE IF DIGITALLY APPROVED
            </div>
          </div>
    );
  };

  return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Stamping States
  const [quickSb, setQuickSb] = useState('');
  const [quickSbDate, setQuickSbDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickInv, setQuickInv] = useState('');
  const [quickInvDate, setQuickInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickStampNotice, setQuickStampNotice] = useState('');

  // Flatten containers across bookings with their documentation attributes
  useEffect(() => {
    const rows = [];
    jobs.forEach((job) => {
      (job.containers || []).forEach((c, idx) => {
        rows.push({
          id: (job.id || 'job') + '-' + idx,
          jobId: job.id || job.joNo,
          sr: rows.length + 1,
          jobDate: job.joDate || '2026-11-04',
          shipper: job.customer || job.consignor || 'Al-Falah Agro Exports Ltd',
          consignee: job.consignee || 'Gulf Food Distribution LLC, Dubai',
          notifyParty: job.notifyParty || 'Same as Consignee',
          cha: job.chaParty || 'SPJ Logistics Clearing & Forwarding Agency',
          transporter: job.transporter || 'SPJ Dedicated Fleet / Prime Roadlines',
          contNo: c.no || c.containerNo || 'MSCU7456431',
          size: c.size || '40',
          type: c.type || 'HC Reef',
          sealNo: c.sealNo || 'SPJ-992810',
          tareWeight: c.tareWeight || '4,280 KG',
          grossWeight: c.grossWeight || '28,450 KG',
          cargoWeight: c.cargoWeight || '24,170 KG',
          commodity: c.commodity || job.commodity || 'Frozen Boneless Buffalo Meat',
          tempSetting: c.tempSetting || '-18.0°C / Vent Closed',
          grNo: job.grNo || 'GR-88291',
          grDate: job.grDate || '2026-11-05',
          truckNo: job.truckNo || job.vehicleNo || 'UP-81-BT-9942',
          driverName: job.driverName || 'Rameshwar Yadav',
          driverMobile: job.driverMobile || '+91 98971-22410',
          advancePaid: job.advancePaid || '₹14,500',
          invoiceNo: c.invoiceNo || job.partyInvoiceNo || 'EXP/2026/1049',
          invoiceDate: c.invoiceDate || job.partyInvoiceDate || '2026-11-04',
          fobValue: job.fobValue || 'USD $48,200 (₹40,48,800)',
          sbNo: c.sbNo || job.sbNo || 'SB-9281720',
          sbDate: c.sbDate || job.sbDate || '2026-11-05',
          leoDate: job.leoDate || '2026-11-06 (LEO GRANTED)',
          ediStatus: c.ediStatus || job.ediStatus || 'SUCCESS - ICES 1.5 TRANSMITTED',
          trainNo: c.trainNo || job.trainNo || 'CONCOR DFC RAKE #8812',
          wagonNo: c.wagonNo || 'CR-104928',
          deckTier: c.deckTier || 'LOWER',
          railDate: c.rakeDate || job.rakeDate || '2026-11-07',
          bookingNo: job.bookingNo || 'IN00554005',
          bookingDate: job.bookingDate || '2026-11-02',
          siCutDate: job.siCutDate || '2026-11-10 18:00',
          portCutDate: job.cutOffDate || '2026-11-11 20:00',
          line: job.line || job.shippingLine || 'MSC MEDITERRANEAN SHIPPING CO',
          cfs: 'Dadri CFS Terminal Hub',
          pol: job.origin || job.fromLocation || 'NHAVA SHEVA (INNSA1)',
          pod: job.pod || job.toLocation || 'JEBEL ALI (AEJEA)',
          planVessel: job.vessel || 'MSC JAVELIN IX (2604W)',
          voyage: job.voyage || '2604W',
          etd: job.etdDate || '2026-11-13',
          sobDate: c.sobDate || job.sobDate || '2026-11-13',
          docType: c.docType || 'Checklist Approved',
          remark: c.remark || 'All original physical forms verified with ICEGATE LEO'
        });
      });
    });

    // Provide default fallback records if empty
    if (rows.length === 0) {
      rows.push(
        {
          id: 'demo-1',
          jobId: 'JO-94280',
          sr: 1,
          jobDate: '2026-11-04',
          shipper: 'International Agro Foods Pvt Ltd',
          consignee: 'Lucky Frozen Sdn Bhd, Port Klang',
          notifyParty: 'Fatric Sdn Bhd, Malaysia',
          cha: 'SPJ Clearing & Forwarding Services Ltd',
          transporter: 'SPJ Logistics Fleet Pvt Ltd',
          contNo: 'MEDU9004289',
          size: '40',
          type: 'HC Reef',
          sealNo: 'SPJ-99214',
          tareWeight: '4,280 KG',
          grossWeight: '28,500 KG',
          cargoWeight: '24,220 KG',
          commodity: 'Frozen Boneless Buffalo Meat',
          tempSetting: '-18.0°C / Vent 0 CBM',
          grNo: 'GR-94012',
          grDate: '2026-11-05',
          truckNo: 'UP-81-BT-4019',
          driverName: 'Mohd Aslam',
          driverMobile: '+91 98971-88491',
          advancePaid: '₹15,000',
          invoiceNo: 'IAF/2026/884',
          invoiceDate: '2026-11-04',
          fobValue: 'USD $54,800 (₹46,03,200)',
          sbNo: '5108291',
          sbDate: '2026-11-05',
          leoDate: '2026-11-06 (LEO GRANTED)',
          ediStatus: 'ICES 1.5 TRANSMITTED',
          trainNo: 'DFC RAKE TR-8812',
          wagonNo: 'WAG-55029',
          deckTier: 'LOWER',
          railDate: '2026-11-07',
          bookingNo: 'MSC-EXP-99210',
          bookingDate: '2026-11-02',
          siCutDate: '2026-11-10 18:00',
          portCutDate: '2026-11-11 20:00',
          line: 'MSC GROUP (INDIA)',
          cfs: 'Dadri ICD Hub',
          pol: 'NHAVA SHEVA - BMCT',
          pod: 'PORT KLANG (MYPKG)',
          planVessel: 'MSC JAVELIN IX',
          voyage: '2604W',
          etd: '2026-11-13',
          sobDate: '2026-11-13',
          docType: 'Final BL Approved',
          remark: 'Pre-sailing checklist cross-verified with ICEGATE LEO'
        },
        {
          id: 'demo-2',
          jobId: 'JO-94175',
          sr: 2,
          jobDate: '2026-11-03',
          shipper: 'HMA Agro Industries Ltd',
          consignee: 'Lat Krabang Cold Storage, Bangkok',
          notifyParty: 'Siam Agro Trading Co Ltd',
          cha: 'SPJ Clearing & Forwarding Services Ltd',
          transporter: 'SPJ Prime Trailers',
          contNo: 'EMCU5388133',
          size: '40',
          type: 'HC Reef',
          sealNo: 'EGLV-44810',
          tareWeight: '4,300 KG',
          grossWeight: '28,100 KG',
          cargoWeight: '23,800 KG',
          commodity: 'Frozen Halal Boneless Meat',
          tempSetting: '-18.5°C',
          grNo: 'GR-93882',
          grDate: '2026-11-04',
          truckNo: 'HR-38-Z-1049',
          driverName: 'Surinder Singh',
          driverMobile: '+91 94120-44910',
          advancePaid: '₹14,000',
          invoiceNo: 'HMA/EXP/2026/410',
          invoiceDate: '2026-11-03',
          fobValue: 'USD $51,200 (₹43,00,800)',
          sbNo: '5108442',
          sbDate: '2026-11-04',
          leoDate: '2026-11-05 (LEO GRANTED)',
          ediStatus: 'ICES 1.5 TRANSMITTED',
          trainNo: 'DFC RAKE TR-9040',
          wagonNo: 'WAG-44102',
          deckTier: 'UPPER',
          railDate: '2026-11-06',
          bookingNo: 'EGLV-BK-11029',
          bookingDate: '2026-11-01',
          siCutDate: '2026-11-09 18:00',
          portCutDate: '2026-11-10 20:00',
          line: 'EVERGREEN GROUP',
          cfs: 'Dadri ICD Hub',
          pol: 'NHAVA SHEVA - GTIL',
          pod: 'LAT KRABANG (THLKR)',
          planVessel: 'EVER LIFTING',
          voyage: '066E',
          etd: '2026-11-12',
          sobDate: '2026-11-12',
          docType: 'Checklist Approved',
          remark: 'Upper deck allocation, wagon verified'
        }
      );
    }

    setDocRows(rows);
  }, [jobs]);

  const handleQuickStampAll = () => {
    if (!quickSb && !quickInv) {
      alert('Please enter a Shipping Bill No or Exporter Invoice No!');
      return;
    }

    setDocRows((prev) =>
      prev.map((r) => ({
        ...r,
        sbNo: quickSb || r.sbNo,
        sbDate: quickSbDate || r.sbDate,
        invoiceNo: quickInv || r.invoiceNo,
        invoiceDate: quickInvDate || r.invoiceDate
      }))
    );

    setQuickStampNotice('⚡ Shipping Bill & Invoice stamped across all container rows in 1-Click!');
    setTimeout(() => setQuickStampNotice(''), 3500);
  };

  const handleFieldChange = (id, field, value) => {
    setDocRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveAll = async () => {
    if (onUpdateJob) {
      for (const row of docRows) {
        try {
          await onUpdateJob(row.jobId, {
            sbNo: row.sbNo,
            sbDate: row.sbDate,
            partyInvoiceNo: row.invoiceNo,
            partyInvoiceDate: row.invoiceDate
          });
        } catch (err) {
          console.error('Error saving doc row:', err);
        }
      }
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Safe search and filtering
  const filteredRows = docRows.filter((r) => {
    if (shipperFilter !== 'ALL' && r.shipper !== shipperFilter) return false;
    if (lineFilter !== 'ALL' && r.line !== lineFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const jid = String(r.jobId || '').toLowerCase();
    const cno = String(r.contNo || '').toLowerCase();
    const shp = String(r.shipper || '').toLowerCase();
    const sb = String(r.sbNo || '').toLowerCase();
    const inv = String(r.invoiceNo || '').toLowerCase();
    return jid.includes(q) || cno.includes(q) || shp.includes(q) || sb.includes(q) || inv.includes(q);
  });

  const uniqueShippers = Array.from(new Set(docRows.map((r) => r.shipper).filter(Boolean)));
  const uniqueLines = Array.from(new Set(docRows.map((r) => r.line).filter(Boolean)));

  const currentDossier = docRows[selectedDossierIndex] || docRows[0] || {};

  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="space-y-5 w-full font-sans">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #a4-printable-dossier, #a4-printable-dossier * {
            visibility: visible;
          }
          #a4-printable-dossier {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

      {/* Top Header & Tab Toggle Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              28. Document Update &amp; Verification Dossier
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold font-mono">
              Page 28
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Collective lifecycle documentation &bull; ICEGATE Shipping Bills &bull; A4 Verification Sheet for Audit
          </p>
        </div>

        {/* View Mode Toggle: Grid vs Collective Dossier */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document Entry Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('collective')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'collective'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Collective A4 Master Dossier &amp; Print</span>
            </button>
          </div>

          {activeTab === 'grid' && (
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save All Rows</span>
            </button>
          )}

          {activeTab === 'collective' && (
            <button
              type="button"
              onClick={handlePrintA4}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-100" />
              <span>🖨️ Print / Save A4 PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FAST DOCUMENTATION ENTRY GRID & QUICK STAMP                        */}
      {/* ========================================================================= */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Shipper, Cont No, SB, Inv..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <select
                  value={shipperFilter}
                  onChange={(e) => setShipperFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Shippers (Consignors)</option>
                  {uniqueShippers.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={lineFilter}
                  onChange={(e) => setLineFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Shipping Lines</option>
                  {uniqueLines.map((l, idx) => (
                    <option key={idx} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end text-xs text-slate-500 font-mono">
                Total Records: <span className="font-bold text-[rgb(25,40,57)] ml-1">{filteredRows.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Bulk Stamp Bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>⚡ 1-Click Fast Bulk Stamp (Shipping Bill &amp; Invoice)</span>
              </div>
              {quickStampNotice && (
                <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                  {quickStampNotice}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              <input
                type="text"
                placeholder="Shipping Bill No (e.g. SB-91823)"
                value={quickSb}
                onChange={(e) => setQuickSb(e.target.value.toUpperCase())}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />

              <input
                type="date"
                value={quickSbDate}
                onChange={(e) => setQuickSbDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />

              <input
                type="text"
                placeholder="Exporter Inv No (e.g. EXP-1049)"
                value={quickInv}
                onChange={(e) => setQuickInv(e.target.value.toUpperCase())}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />

              <input
                type="date"
                value={quickInvDate}
                onChange={(e) => setQuickInvDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />

              <button
                type="button"
                onClick={handleQuickStampAll}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Apply to All Rows</span>
              </button>
            </div>
          </div>

          {/* Grid Table */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-heading text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 font-semibold text-center w-10">Sr.</th>
                    <th className="p-2.5 font-semibold min-w-[130px]">Shipper</th>
                    <th className="p-2.5 font-semibold min-w-[120px]">Cont No</th>
                    <th className="p-2.5 font-semibold min-w-[110px]">Invoice No</th>
                    <th className="p-2.5 font-semibold min-w-[100px]">Invoice Date</th>
                    <th className="p-2.5 font-semibold min-w-[110px]">SB No.</th>
                    <th className="p-2.5 font-semibold min-w-[100px]">SB Date</th>
                    <th className="p-2.5 font-semibold min-w-[110px]">Booking No.</th>
                    <th className="p-2.5 font-semibold min-w-[100px]">Line</th>
                    <th className="p-2.5 font-semibold min-w-[80px]">POL</th>
                    <th className="p-2.5 font-semibold min-w-[80px]">POD</th>
                    <th className="p-2.5 font-semibold min-w-[120px]">Plan Vessel</th>
                    <th className="p-2.5 font-semibold min-w-[120px]">Doc Type</th>
                    <th className="p-2.5 font-semibold min-w-[130px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-8 text-center text-slate-400 font-sans">
                        No documentation records pending. Create a Container Booking to begin documentation.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, idx) => (
                      <tr key={r.id} onClick={() => setModalDossier(r)} className="hover:bg-blue-50/70 transition-colors font-sans cursor-pointer group" title="Click to open complete A4 Verification Form / Dossier">
                        <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-2 font-medium text-[rgb(25,40,57)]">{r.shipper}</td>
                        <td className="p-2 font-mono font-bold text-blue-700">{r.contNo || 'TBA'}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. INV-1049"
                            value={r.invoiceNo || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleFieldChange(r.id, 'invoiceNo', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={r.invoiceDate || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleFieldChange(r.id, 'invoiceDate', e.target.value)}
                            className="w-full px-1.5 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. SB-9281720"
                            value={r.sbNo || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleFieldChange(r.id, 'sbNo', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={r.sbDate || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleFieldChange(r.id, 'sbDate', e.target.value)}
                            className="w-full px-1.5 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2 font-mono text-slate-700">{r.bookingNo || '-'}</td>
                        <td className="p-2 text-slate-700">{r.line}</td>
                        <td className="p-2 font-mono text-slate-700">{r.pol}</td>
                        <td className="p-2 font-mono text-slate-700">{r.pod}</td>
                        <td className="p-2 text-slate-700">{r.planVessel || 'TBA'}</td>
                        <td className="p-2">
                          <select
                            value={r.docType || 'Checklist Approved'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleFieldChange(r.id, 'docType', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="Checklist Approved">Checklist Approved</option>
                            <option value="Draft BL Sent">Draft BL Sent</option>
                            <option value="Final BL Approved">Final BL Approved</option>
                            <option value="Original BL Released">Original BL Released</option>
                            <option value="Waybill / Seaway">Waybill / Seaway</option>
                          </select>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalDossier(r);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
                            title="Open complete A4 Verification Form / Dossier"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-200" />
                            <span>📄 Open A4 Form &rarr;</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COLLECTIVE MASTER VERIFICATION DOSSIER & A4 PRINTABLE PDF           */}
      {/* ========================================================================= */}
      {activeTab === 'collective' && (
        <div className="space-y-4">
          {/* Dossier Selector Bar (No-Print) */}
          <div className="no-print p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide shrink-0">
                Select Shipment / Container to Audit:
              </span>
              <select
                value={selectedDossierIndex}
                onChange={(e) => setSelectedDossierIndex(Number(e.target.value))}
                className="flex-1 sm:w-96 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-xs text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {docRows.map((r, idx) => (
                  <option key={r.id || idx} value={idx}>
                    Cont: {r.contNo} &bull; Job: {r.jobId} &bull; {r.shipper} ({r.pol} &rarr; {r.pod})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audit Ready (All 6 Stages Documented)</span>
              </span>

              <button
                type="button"
                onClick={handlePrintA4}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-100" />
                <span>🖨️ Print / Save A4 PDF</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* THE MASTER A4 PRINTABLE VERIFICATION DOSSIER SHEET                   */}
          {/* ===================================================================== */}
          {renderDossierSheet(currentDossier)}
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: COMPLETE A4 VERIFICATION FORM / DOSSIER                     */}
      {/* ========================================================================= */}
      {modalDossier && (
        <div className="fixed inset-0 z-[120] bg-slate-900/85 backdrop-blur-xs overflow-y-auto flex flex-col items-center p-3 sm:p-6 animate-fade-in">
          {/* Floating Control Toolbar */}
          <div className="no-print sticky top-2 z-[130] w-full max-w-[215mm] mb-4 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-xs text-xs">
                A4
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-blue-300 text-sm">{modalDossier.contNo}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                    {modalDossier.size}ft {modalDossier.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate max-w-xs">
                  {modalDossier.shipper} &bull; JO #{modalDossier.jobId}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const idx = filteredRows.findIndex(r => r.id === modalDossier.id);
                  const prev = idx > 0 ? filteredRows[idx - 1] : filteredRows[filteredRows.length - 1];
                  if (prev) setModalDossier(prev);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                &larr; Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = filteredRows.findIndex(r => r.id === modalDossier.id);
                  const next = idx < filteredRows.length - 1 ? filteredRows[idx + 1] : filteredRows[0];
                  if (next) setModalDossier(next);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Next &rarr;
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Printer className="w-4 h-4 text-emerald-100" />
                <span>🖨️ Print / Save A4 PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setModalDossier(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition"
                title="Close (ESC)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Master A4 Sheet Container */}
          <div className="w-full max-w-[215mm] pb-12">
            {renderDossierSheet(modalDossier)}
          </div>
        </div>
      )}
    </div>
  );
}
