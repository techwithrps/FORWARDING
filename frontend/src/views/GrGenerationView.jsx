import React, { useState } from 'react';
import {
  Truck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight,
  Layers,
  Building2,
  Search,
  Clock
} from 'lucide-react';

export default function GrGenerationView({
  jobs = [],
  onUpdateContainerGR,
  onNavigateToTripPendency,
  onNavigateToGrSearching,
  onSave
}) {
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Extract containers from jobs with fallback mock list
  const containerOptions = React.useMemo(() => {
    const list = [];
    (jobs || []).forEach((job) => {
      (job.containers || []).forEach((c) => {
        const cNo = c.no || c.contNo;
        if (cNo && cNo !== 'TBA') {
          list.push({
            contNo: cNo,
            size: c.size || (c.sizeType?.includes('20') ? '20' : '40') || '40',
            type: c.type || (c.sizeType?.includes('GP') ? 'GP' : 'HC') || 'HC',
            weight: String(c.cargoWeight || c.weight || '24500'),
            joNo: job.id || job.joNo || '',
            joDate: job.date || job.joDate || '',
            consignor: job.customer || job.consignor || '',
            consignee: job.consignee || '',
            fromLocation: job.fromLocation || job.origin || '',
            toLocation: job.toLocation || job.pod || '',
            transporter: job.transporter || 'Dadri Express Logistics',
            vehicleNo: c.truck && c.truck !== 'TBA' ? c.truck : '',
            commodity: job.commodity || 'Frozen Buffalo Meat',
            handoverLocation: job.handoverLocation || 'Dadri ICD CFS Complex'
          });
        }
      });
    });

    if (list.length === 0) {
      return [
        {
          contNo: 'MSKU9821043',
          size: '40',
          type: 'HC',
          weight: '24500',
          joNo: 'JO-2026-0041',
          joDate: '',
          consignor: 'Fair Exports (India) Pvt Ltd',
          consignee: 'Al Maya Trading LLC (Dubai, UAE)',
          fromLocation: 'Fair Exports Processing Plant, Dadri',
          toLocation: 'Nhava Sheva-NSFT (INNSA1)',
          transporter: 'Dadri Express Logistics',
          vehicleNo: 'HR55AN2094',
          commodity: 'Frozen Buffalo Meat',
          handoverLocation: 'Dadri ICD CFS Complex'
        },
        {
          contNo: 'MEDU7845120',
          size: '40',
          type: 'HC',
          weight: '26000',
          joNo: 'JO-2026-0042',
          joDate: '',
          consignor: 'Marhaba Frozen Foods',
          consignee: 'EuroMeat B.V. (Rotterdam, Netherlands)',
          fromLocation: 'Marhaba Cold Chain Facility, Piyala',
          toLocation: 'Mundra Port-MDCC (INMUN1)',
          transporter: 'SPJ Fleet Logistics',
          vehicleNo: 'UP16BT4820',
          commodity: 'Basmati Rice',
          handoverLocation: 'Piyala ICD CFS Complex'
        },
        {
          contNo: 'CMAU6521904',
          size: '20',
          type: 'GP',
          weight: '21500',
          joNo: 'JO-2026-0043',
          joDate: '',
          consignor: 'Allanasons Private Limited',
          consignee: 'Al-Shaikh Trading Co. (Jeddah, KSA)',
          fromLocation: 'Aligarh Processing Complex',
          toLocation: 'Nhava Sheva-BMCT (INNSA1)',
          transporter: 'Dadri Express Logistics',
          vehicleNo: 'NL01AD8941',
          commodity: 'Frozen Fish & Seafood',
          handoverLocation: 'Dadri ICD Buffer Yard'
        }
      ];
    }
    return list;
  }, [jobs]);

  // Initial Form State
  const initialFormState = {
    // 1. Main Form Fields
    contNo: '',
    size: '',
    type: '',
    weight: '',
    joNo: '',
    joDate: '',
    grNo: '',
    grDate: todayDateStr,
    cGr: '',
    consignor: '',
    consignee: '',
    fromLocation: '',
    toLocation: '',
    transporter: '',
    handoverLocation: '',
    vehicleNo: '',
    driver: '',
    driverContactNo: '',
    licenseValidity: '',
    workshop: 'EICHER',
    joFor: 'Shifting',
    surveyBy: '',
    vehicleType: 'T40',
    oilVendor: '',
    slipNo: '',
    remarks: '',
    commodity: '',

    // 2. Trip Advance Details Section (Default 0 as specified)
    cash: '0',
    oil: '0',
    balance: '0',
    total: '0',
    otherAdvance: '',
    others: '0'
  };

  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dropdown presets for inputs with dropdown
  const vehicleBadges = ['HR55AN2094', 'UP16BT4820', 'NL01AD8941', 'MH46AR7712', 'DL1AA3901'];
  const workshopPresets = ['EICHER', 'TATA MOTORS', 'ASHOK LEYLAND', 'BHARATBENZ', 'MAHINDRA', 'SPJ IN-HOUSE YARD (DADRI)'];
  const joForPresets = ['Shifting', 'Factory Stuffing', 'Port Delivery / Gate-in', 'Empty Pickup / Return', 'Breakdown-ICD / Repair'];
  const vehicleTypePresets = ['T40', 'T20', '40ft Multi-Axle Trailer', '20ft Skeletal Trailer', 'Heavy Duty Low-Bed'];
  const driverPresets = [
    { name: 'Ramesh Kumar', phone: '9876543210' },
    { name: 'Suresh Yadav', phone: '9811223344' },
    { name: 'Balwant Singh', phone: '9711882233' },
    { name: 'Mohd. Irfan', phone: '9955443322' }
  ];
  const commodityList = [
    'Frozen Buffalo Meat',
    'Basmati Rice',
    'Frozen Fish & Seafood',
    'Spices & Oleoresins',
    'Fresh Fruits & Vegetables',
    'Garments & Textiles',
    'Machinery & Engineering Goods',
    'Chemicals (Non-Haz)',
    'Pharmaceuticals',
    'General Cargo (FAK)'
  ];

  // Auto-fill when container is selected
  const handleContNoChange = (selectedContNo) => {
    setFormError('');
    const matched = containerOptions.find((c) => c.contNo === selectedContNo);
    if (matched) {
      setForm((prev) => ({
        ...prev,
        contNo: matched.contNo,
        size: matched.size || prev.size,
        type: matched.type || prev.type,
        weight: matched.weight || prev.weight,
        joNo: matched.joNo || prev.joNo,
        joDate: matched.joDate || prev.joDate,
        consignor: matched.consignor || prev.consignor,
        consignee: matched.consignee || prev.consignee,
        fromLocation: matched.fromLocation || prev.fromLocation,
        toLocation: matched.toLocation || prev.toLocation,
        transporter: matched.transporter || prev.transporter,
        vehicleNo: matched.vehicleNo || prev.vehicleNo,
        commodity: matched.commodity || prev.commodity,
        handoverLocation: matched.handoverLocation || prev.handoverLocation
      }));
    } else {
      setForm((prev) => ({ ...prev, contNo: selectedContNo }));
    }
  };

  // Recalculate advance total when cash, oil, or others change
  const handleAdvanceChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (['cash', 'oil', 'others'].includes(field)) {
        const c = parseFloat(field === 'cash' ? value : prev.cash) || 0;
        const o = parseFloat(field === 'oil' ? value : prev.oil) || 0;
        const oth = parseFloat(field === 'others' ? value : prev.others) || 0;
        const tot = c + o + oth;
        updated.total = String(tot);
      }
      return updated;
    });
  };

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    // Validations: Cont No, Driver, Oil Vendor, Commodity
    if (!form.contNo) {
      setFormError('Please select or specify Cont No (Required).');
      return;
    }
    if (!form.driver.trim()) {
      setFormError('Please provide Driver Name (Required).');
      return;
    }
    if (!form.oilVendor) {
      setFormError('Please select an Oil Vendor (Required).');
      return;
    }
    if (!form.commodity.trim()) {
      setFormError('Please provide Commodity (Required).');
      return;
    }

    if (onUpdateContainerGR) {
      onUpdateContainerGR(
        form.joNo,
        form.contNo,
        form.vehicleNo,
        form.driver,
        form.driverContactNo
      );
    }

    if (onSave) {
      onSave(form);
    }

    setSuccessMessage(`✓ Goods Receipt ${form.grNo ? form.grNo + ' ' : ''}saved successfully for ${form.contNo}!`);
  };

  return (
    <div className="space-y-2.5 w-full font-sans pb-1">
      {/* 1. Header with Compact Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/90 pb-2 mb-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span>GR Generation</span>
          </h1>
          {form.grNo && (
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold border border-blue-200 shadow-2xs">
              {form.grNo}
            </span>
          )}
          <span className="hidden lg:inline-block text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
            Goods Receipt generation &bull; Trip advance allotment
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {successMessage && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[260px]">{successMessage}</span>
            </span>
          )}

          {/* Quick Navigation to GR Searching if available */}
          {onNavigateToGrSearching && (
            <button
              type="button"
              onClick={onNavigateToGrSearching}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-extrabold text-[11px] flex items-center gap-1 border border-slate-300 shadow-2xs transition cursor-pointer select-none"
              title="Navigate to GR Searching"
            >
              <Search className="w-3 h-3 text-blue-600" />
              <span>GR Searching</span>
            </button>
          )}

          {/* Quick Navigation to Trip Pendency if available */}
          {onNavigateToTripPendency && (
            <button
              type="button"
              onClick={onNavigateToTripPendency}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-extrabold text-[11px] flex items-center gap-1 border border-slate-300 shadow-2xs transition cursor-pointer select-none"
              title="View Trip Pendency"
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Trip Pendency</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold">{formError}</span>
        </div>
      )}

      {/* FORM UI */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* CARD 1: Container & Order Logistics */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Container &amp; Job Order Details
              </h2>
            </div>
          </div>

          {/* Row 1: Cont No, Size/Type, Weight, Commodity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Cont No */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Cont No <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.contNo}
                onChange={(e) => handleContNoChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              >
                <option value="">-- Select Container --</option>
                {containerOptions.map((c) => (
                  <option key={c.contNo} value={c.contNo}>
                    {c.contNo} {c.size ? `(${c.size}${c.type || ''})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Size/Type (Split/Multi-box) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Size/Type
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Size (e.g. 40)"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all text-center"
                />
                <span className="text-slate-400 font-bold text-xs select-none">/</span>
                <input
                  type="text"
                  placeholder="Type (e.g. HC)"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all text-center"
                />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Weight
              </label>
              <input
                type="text"
                placeholder="e.g. 24,500 kg"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Commodity */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Commodity <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="commodity-options"
                  placeholder="e.g. Frozen Buffalo Meat"
                  value={form.commodity}
                  onChange={(e) => setForm({ ...form, commodity: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
                />
                <datalist id="commodity-options">
                  {commodityList.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 2: Jo No, Jo Date, GR No, GR Date, C.GR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1.5 border-t border-slate-100">
            {/* Jo No */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Jo No
              </label>
              <input
                type="text"
                placeholder="JO-2026-XXXX"
                value={form.joNo}
                onChange={(e) => setForm({ ...form, joNo: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Jo Date */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Jo Date
              </label>
              <input
                type="date"
                value={form.joDate}
                onChange={(e) => setForm({ ...form, joDate: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* GR No */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                GR No
              </label>
              <input
                type="text"
                placeholder="GR-2026-XXXX"
                value={form.grNo}
                onChange={(e) => setForm({ ...form, grNo: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold outline-none bg-white border border-slate-200 text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* GR Date */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                GR Date
              </label>
              <input
                type="date"
                value={form.grDate}
                onChange={(e) => setForm({ ...form, grDate: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* C.GR */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                C.GR
              </label>
              <input
                type="text"
                placeholder="Consignor / Customer GR"
                value={form.cGr}
                onChange={(e) => setForm({ ...form, cGr: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: Consignor, Consignee & Route Locations */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Consignment &amp; Route Logistics
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Consignor */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Consignor
              </label>
              <input
                type="text"
                placeholder="Consignor / Shipper Name"
                value={form.consignor}
                onChange={(e) => setForm({ ...form, consignor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Consignee */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Consignee
              </label>
              <input
                type="text"
                placeholder="Consignee / Receiver Name"
                value={form.consignee}
                onChange={(e) => setForm({ ...form, consignee: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Transporter */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Transporter
              </label>
              <input
                type="text"
                placeholder="Transporter Name"
                value={form.transporter}
                onChange={(e) => setForm({ ...form, transporter: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-100">
            {/* From Location */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                From Location
              </label>
              <input
                type="text"
                placeholder="Origin / Stuffing Location"
                value={form.fromLocation}
                onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* To Location */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                To Location
              </label>
              <input
                type="text"
                placeholder="Destination / Port Terminal"
                value={form.toLocation}
                onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Handover Location */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Handover Location
              </label>
              <textarea
                rows={2}
                placeholder="Handover Location / ICD / CFS Complex"
                value={form.handoverLocation}
                onChange={(e) => setForm({ ...form, handoverLocation: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: Vehicle, Driver, Oil & Remarks */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Truck className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Vehicle, Driver &amp; Fuel Specifications
              </h2>
            </div>
          </div>

          {/* Row 1: Vehicle No, Driver, Driver Contact No, License Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Vehicle No (Text Input with Dropdown) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Vehicle No
              </label>
              <input
                type="text"
                list="vehicle-presets"
                placeholder="e.g. HR55AN2094"
                value={form.vehicleNo}
                onChange={(e) => setForm({ ...form, vehicleNo: e.target.value.toUpperCase() })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
              <datalist id="vehicle-presets">
                {vehicleBadges.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>

            {/* Driver (Text Input with Dropdown, Required *) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Driver <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                list="driver-presets"
                placeholder="Driver Full Name"
                value={form.driver}
                onChange={(e) => setForm({ ...form, driver: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
              <datalist id="driver-presets">
                {driverPresets.map((d) => (
                  <option key={d.name} value={d.name} />
                ))}
              </datalist>
            </div>

            {/* Driver Contact No */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Driver Contact No
              </label>
              <input
                type="text"
                placeholder="10-digit Mobile No"
                value={form.driverContactNo}
                onChange={(e) => setForm({ ...form, driverContactNo: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* License Validity */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                License Validity
              </label>
              <input
                type="date"
                value={form.licenseValidity}
                onChange={(e) => setForm({ ...form, licenseValidity: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Row 2: Workshop, Jo For, Survey By, Vehicle Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1.5 border-t border-slate-100">
            {/* Workshop (Dropdown with presets) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Workshop
              </label>
              <select
                value={form.workshop}
                onChange={(e) => setForm({ ...form, workshop: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              >
                <option value="">---Select Workshop---</option>
                {workshopPresets.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Jo For (Dropdown with presets) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Jo For
              </label>
              <select
                value={form.joFor}
                onChange={(e) => setForm({ ...form, joFor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              >
                <option value="">---Select Purpose---</option>
                {joForPresets.map((jf) => (
                  <option key={jf} value={jf}>{jf}</option>
                ))}
              </select>
            </div>

            {/* Survey By */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Survey By
              </label>
              <input
                type="text"
                placeholder="Surveyor / Inspector Name"
                value={form.surveyBy}
                onChange={(e) => setForm({ ...form, surveyBy: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Vehicle Type
              </label>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              >
                {vehicleTypePresets.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Oil Vendor, Slip No, Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-100">
            {/* Oil Vendor (Required *) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Oil Vendor <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.oilVendor}
                onChange={(e) => setForm({ ...form, oilVendor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              >
                <option value="">---Select---</option>
                <option value="Indian Oil Corporation (IOCL)">Indian Oil Corporation (IOCL)</option>
                <option value="Bharat Petroleum (BPCL)">Bharat Petroleum (BPCL)</option>
                <option value="Hindustan Petroleum (HPCL)">Hindustan Petroleum (HPCL)</option>
                <option value="Reliance Petroleum">Reliance Petroleum</option>
                <option value="Shell India">Shell India</option>
                <option value="Nayara Energy">Nayara Energy</option>
              </select>
            </div>

            {/* Slip No */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Slip No
              </label>
              <input
                type="text"
                placeholder="Fuel Slip / Token No"
                value={form.slipNo}
                onChange={(e) => setForm({ ...form, slipNo: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Enter transport remarks, handling instructions..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* CARD 4: Trip Advance Details Section */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-600/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Trip Advance Details
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">
              Advance allotment &bull; Auto-calculates total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Cash(Rs) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Cash(Rs)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.cash}
                onChange={(e) => handleAdvanceChange('cash', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none bg-white border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Oil(Rs) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Oil(Rs)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.oil}
                onChange={(e) => handleAdvanceChange('oil', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none bg-white border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Other Advance (Dropdown ---Select---) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Other Advance
              </label>
              <select
                value={form.otherAdvance}
                onChange={(e) => setForm({ ...form, otherAdvance: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              >
                <option value="">---Select---</option>
                <option value="Toll / FASTag">Toll / FASTag</option>
                <option value="Loading / Hamali">Loading / Hamali</option>
                <option value="Driver Daily Bhatta">Driver Daily Bhatta</option>
                <option value="Maintenance / En-route Repair">Maintenance / En-route Repair</option>
                <option value="Border / RTO Checkpost">Border / RTO Checkpost</option>
                <option value="Depot / Port Gate Pass">Depot / Port Gate Pass</option>
              </select>
            </div>

            {/* Others(Rs) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Others(Rs)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.others}
                onChange={(e) => handleAdvanceChange('others', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none bg-white border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Total(Rs) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Total(Rs)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-black outline-none bg-slate-50 border border-slate-200 text-emerald-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Balance(Rs) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Balance(Rs)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-black outline-none bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* FORM FOOTER / ACTION BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <div className="text-[10px] text-slate-400 font-medium">
            * Fields marked with red asterisk are mandatory for GR Generation
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Generate GR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
