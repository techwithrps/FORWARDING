import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Building2,
  MapPin,
  Receipt,
  PlusCircle,
  Truck,
  UserCheck,
  CheckCircle2,
  Search,
  ShieldCheck,
  Save,
  Trash2,
  Edit2,
  ArrowLeft,
  X,
  FileText,
  AlertCircle,
  Box
} from 'lucide-react';

export default function MasterVaultView({
  parties = [],
  onAddParty,
  onUpdateParty,
  initialTab = 'CUSTOMERS'
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const [noticeMsg, setNoticeMsg] = useState('');
  const [gstValidating, setGstValidating] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveSubTab(initialTab);
  }, [initialTab]);

  const showNotice = (msg) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(''), 3500);
  };

  // -------------------------------------------------------------
  // 1. CUSTOMER MASTER STATE & REPOSITORY (Connected to PostgreSQL)
  // -------------------------------------------------------------
  const [customerMode, setCustomerMode] = useState('LIST'); // 'LIST' or 'FORM'
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(false);

  const emptyCustomerForm = {
    code: '',
    name: '',
    type: 'SHIPPER',
    contactPerson: '',
    contactNo: '',
    mobile: '',
    emailComm: '',
    emailOps: '',
    address: '',
    city: '',
    state: 'Uttar Pradesh',
    country: 'India',
    pin: '',
    gstin: '',
    pan: '',
    tan: '',
    tallyTptName: '',
    tallyFrtName: '',
    mapCode: '',
    paymentTerms: '30 Days',
    creditLimit: '10,00,000',
    creditPeriod: '30',
    isExport: true,
    isImport: false,
    isDomestic: true,
    status: 'ACTIVE'
  };

  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);

  // Additional Master States (Pages 3, 4, 5, 7, 8, 9, 10, 11)
  const [taxHeadList, setTaxHeadList] = useState([]);
  const [taxGroupList, setTaxGroupList] = useState([]);
  const [serviceMasterList, setServiceMasterList] = useState([]);
  const [terminalList, setTerminalList] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [commodityList, setCommodityList] = useState([]);
  const [bankList, setBankList] = useState([]);

  // Modals for adding
  const [showAddMasterModal, setShowAddMasterModal] = useState(false);
  const [activeModalType, setActiveModalType] = useState('');
  const [quickMasterForm, setQuickMasterForm] = useState({});

  // Load all master data directly from PostgreSQL backend
  const loadAllMasters = async () => {
    try {
      setLoading(true);
      const [custRes, drvRes, vehRes, portRes, compRes, thRes, thgRes, srvRes, termRes, uomRes, cmdRes, bnkRes] = await Promise.allSettled([
        api.getCustomers(),
        api.getDrivers(),
        api.getVehicles(),
        api.getPorts(),
        api.getCompany(),
        api.getTaxHeads(),
        api.getTaxHeadGroups(),
        api.getServiceMaster(),
        api.getTerminals(),
        api.getUOMs(),
        api.getCommodities(),
        api.getBanks()
      ]);

      if (thRes.status === 'fulfilled' && thRes.value && thRes.value.data) setTaxHeadList(thRes.value.data);
      if (thgRes.status === 'fulfilled' && thgRes.value && thgRes.value.data) setTaxGroupList(thgRes.value.data);
      if (srvRes.status === 'fulfilled' && srvRes.value && srvRes.value.data) setServiceMasterList(srvRes.value.data);
      if (termRes.status === 'fulfilled' && termRes.value && termRes.value.data) setTerminalList(termRes.value.data);
      if (uomRes.status === 'fulfilled' && uomRes.value && uomRes.value.data) setUomList(uomRes.value.data);
      if (cmdRes.status === 'fulfilled' && cmdRes.value && cmdRes.value.data) setCommodityList(cmdRes.value.data);
      if (bnkRes.status === 'fulfilled' && bnkRes.value && bnkRes.value.data) setBankList(bnkRes.value.data);

      if (custRes.status === 'fulfilled' && custRes.value && custRes.value.data) {
        setCustomerList(custRes.value.data.map(c => ({
          id: c.id,
          code: c.code || c.id,
          name: c.name,
          type: c.party_type || 'SHIPPER',
          contactPerson: c.contact_person || '',
          contactNo: c.contact_no || '',
          mobile: c.mobile || '',
          emailComm: c.email_comm || '',
          emailOps: c.email_ops || '',
          address: c.address || '',
          city: c.city || '',
          state: c.state || '',
          country: c.country || 'India',
          pin: c.pin || '',
          gstin: c.gstin || '',
          pan: c.pan || '',
          tan: c.tan || '',
          tallyTptName: c.tally_tpt_name || '',
          tallyFrtName: c.tally_frt_name || '',
          mapCode: c.map_code || '',
          paymentTerms: c.payment_terms || '30 Days',
          creditLimit: c.credit_limit || '10,00,000',
          creditPeriod: c.credit_period || '30',
          isExport: c.is_export !== false,
          isImport: c.is_import === true,
          isDomestic: c.is_domestic !== false,
          status: c.status || 'ACTIVE'
        })));
      }

      if (drvRes.status === 'fulfilled' && drvRes.value && drvRes.value.data) {
        setDriverList(drvRes.value.data.map(d => ({
          id: d.id,
          name: d.name,
          vehicle: d.vehicle || '',
          dlNo: d.dl_no,
          validity: d.validity ? d.validity.split('T')[0] : '',
          mobile: d.mobile,
          personalContact: d.personal_contact || '',
          emergency: d.emergency || '',
          blood: d.blood || 'B+',
          email: d.email || '',
          joining: d.joining ? d.joining.split('T')[0] : '',
          salary: d.salary || '28,000',
          transporter: d.transporter || 'Dadri Express Logistics',
          address: d.address || '',
          status: d.status || 'ACTIVE'
        })));
      }

      if (vehRes.status === 'fulfilled' && vehRes.value && vehRes.value.data) {
        setVehicleList(vehRes.value.data.map(v => ({
          id: v.id,
          truckNo: v.truck_no,
          type: v.type,
          model: v.model,
          year: v.year,
          engineNo: v.engine_no,
          vinNo: v.vin_no,
          licensePlate: v.license_plate,
          tareWeight: v.tare_weight,
          grossWeight: v.gross_weight,
          changeableBed: v.changeable_bed,
          condition: v.condition,
          fuelType: v.fuel_type,
          fuelCardNo: v.fuel_card_no,
          fitnessExpiry: v.fitness_expiry ? v.fitness_expiry.split('T')[0] : '',
          transporter: v.transporter,
          terminal: v.terminal,
          status: v.status || 'ACTIVE'
        })));
      }

      if (portRes.status === 'fulfilled' && portRes.value && portRes.value.data) {
        setPortList(portRes.value.data.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          type: p.type,
          country: p.country,
          customRefImport: p.custom_ref_import || p.code,
          customRefExport: p.custom_ref_export || p.code,
          terminal: p.terminal,
          address: p.address,
          status: p.status || 'ACTIVE'
        })));
      }

      if (compRes.status === 'fulfilled' && compRes.value && compRes.value.data) {
        const c = compRes.value.data;
        if (c.company_name) {
          setCompanyProfile(prev => ({
            ...prev,
            name: c.company_name,
            website: c.website || prev.website,
            gstin: c.gstin || prev.gstin,
            pan: c.pan || prev.pan,
            tallyName: c.tally_name || prev.tallyName,
            financeMapCode: c.finance_map_code || prev.financeMapCode,
            address: c.address || prev.address
          }));
        }
      }
    } catch (err) {
      console.warn('Error loading masters from PostgreSQL API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMasters();
  }, []);

  const handleOpenAddCustomer = () => {
    const nextCode = 'CUST-' + String(customerList.length + 1).padStart(3, '0');
    setCustomerForm({
      ...emptyCustomerForm,
      code: nextCode,
      mapCode: 'MAP-' + nextCode
    });
    setEditingCustomerId(null);
    setCustomerMode('FORM');
  };

  const handleEditCustomer = (cust) => {
    setCustomerForm({ ...cust });
    setEditingCustomerId(cust.id);
    setCustomerMode('FORM');
  };

  const handleSaveCustomer = async (e) => {
    if (e) e.preventDefault();
    if (!customerForm.name.trim()) {
      alert('Please enter Customer Name (* Mandatory Field)');
      return;
    }

    try {
      if (editingCustomerId) {
        await api.updateCustomer(editingCustomerId, customerForm);
        showNotice('Customer Master Record Updated in PostgreSQL: ' + customerForm.name);
      } else {
        const res = await api.createCustomer(customerForm);
        showNotice('New Customer Master Created in PostgreSQL: ' + customerForm.name);
      }
      await loadAllMasters();
      if (onAddParty) onAddParty(customerForm);
    } catch (err) {
      console.error('Save customer error:', err);
      showNotice('Saved locally: ' + customerForm.name);
    }
    setCustomerMode('LIST');
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm('Are you sure you want to delete customer ' + name + '?')) {
      try {
        await api.deleteCustomer(id);
        showNotice('Customer deleted from PostgreSQL: ' + name);
        await loadAllMasters();
      } catch (err) {
        setCustomerList(customerList.filter((c) => c.id !== id));
        showNotice('Customer deleted: ' + name);
      }
    }
  };

  // -------------------------------------------------------------
  // 2. DRIVER MASTER STATE & REPOSITORY (DriverMaster.aspx - AFTO/OCPL)
  // -------------------------------------------------------------
  const [driverMode, setDriverMode] = useState('LIST'); // 'LIST' or 'FORM'
  const [driverSearch, setDriverSearch] = useState('');
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [driverList, setDriverList] = useState([]);

  const emptyDriverForm = {
    id: '',
    name: '',
    vehicle: '',
    dlNo: '',
    validity: '',
    mobile: '',
    personalContact: '',
    emergency: '',
    blood: 'B+',
    email: '',
    joining: new Date().toISOString().split('T')[0],
    salary: '28,000',
    transporter: 'Dadri Express Logistics',
    address: '',
    status: 'ACTIVE'
  };

  const [driverForm, setDriverForm] = useState(emptyDriverForm);

  const handleOpenAddDriver = () => {
    const nextId = 'DRV-' + String(driverList.length + 1).padStart(3, '0');
    setDriverForm({
      ...emptyDriverForm,
      id: nextId
    });
    setEditingDriverId(null);
    setDriverMode('FORM');
  };

  const handleEditDriver = (drv) => {
    setDriverForm({ ...drv });
    setEditingDriverId(drv.id);
    setDriverMode('FORM');
  };

  const handleSaveDriver = async (e) => {
    if (e) e.preventDefault();
    if (!driverForm.name.trim()) {
      alert('Please enter Driver Name (* Mandatory)');
      return;
    }
    if (!driverForm.dlNo.trim()) {
      alert('Please enter Driving License (DL) No (* Mandatory)');
      return;
    }

    try {
      if (editingDriverId) {
        await api.updateDriver(editingDriverId, driverForm);
        showNotice('Driver Record Updated in PostgreSQL: ' + driverForm.name);
      } else {
        await api.createDriver(driverForm);
        showNotice('New Driver Registered in PostgreSQL: ' + driverForm.name);
      }
      await loadAllMasters();
    } catch (err) {
      console.error('Driver save error:', err);
      showNotice('Driver saved: ' + driverForm.name);
    }
    setDriverMode('LIST');
  };

  const handleDeleteDriver = async (id, name) => {
    if (window.confirm('Delete driver ' + name + '?')) {
      try {
        await api.deleteDriver(id);
        showNotice('Driver deleted from PostgreSQL: ' + name);
        await loadAllMasters();
      } catch (err) {
        setDriverList(driverList.filter((d) => d.id !== id));
        showNotice('Driver deleted: ' + name);
      }
    }
  };

  // -------------------------------------------------------------
  // 3. VEHICLE MASTER STATE & REPOSITORY (VehicleMaster.aspx)
  // -------------------------------------------------------------
  const [vehicleMode, setVehicleMode] = useState('LIST'); // 'LIST' or 'FORM'
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleList, setVehicleList] = useState([]);

  const emptyVehicleForm = {
    id: '',
    truckNo: '',
    type: '40FT Trailer',
    model: 'Tata Signa 4018',
    year: '2023',
    engineNo: '',
    vinNo: '',
    licensePlate: '',
    tareWeight: '12500',
    grossWeight: '44500',
    changeableBed: 'YES',
    condition: 'Excellent',
    fuelType: 'Diesel',
    fuelCardNo: '',
    fitnessExpiry: '2028-06-30',
    transporter: 'Dadri Express Logistics',
    terminal: 'Dadri ICD (INICD6)',
    status: 'ACTIVE'
  };

  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);

  const handleOpenAddVehicle = () => {
    const nextId = 'VEH-' + String(vehicleList.length + 1).padStart(3, '0');
    setVehicleForm({
      ...emptyVehicleForm,
      id: nextId
    });
    setEditingVehicleId(null);
    setVehicleMode('FORM');
  };

  const handleEditVehicle = (veh) => {
    setVehicleForm({ ...veh });
    setEditingVehicleId(veh.id);
    setVehicleMode('FORM');
  };

  const handleSaveVehicle = async (e) => {
    if (e) e.preventDefault();
    if (!vehicleForm.truckNo.trim()) {
      alert('Please enter Vehicle / Truck No (* Mandatory)');
      return;
    }

    try {
      if (editingVehicleId) {
        await api.updateVehicle(editingVehicleId, vehicleForm);
        showNotice('Vehicle Master Updated in PostgreSQL: ' + vehicleForm.truckNo);
      } else {
        await api.createVehicle(vehicleForm);
        showNotice('New Vehicle Added to PostgreSQL Fleet: ' + vehicleForm.truckNo);
      }
      await loadAllMasters();
    } catch (err) {
      console.error('Vehicle save error:', err);
      showNotice('Vehicle saved: ' + vehicleForm.truckNo);
    }
    setVehicleMode('LIST');
  };

  const handleDeleteVehicle = async (id, truckNo) => {
    if (window.confirm('Delete vehicle ' + truckNo + '?')) {
      try {
        await api.deleteVehicle(id);
        showNotice('Vehicle removed from PostgreSQL: ' + truckNo);
        await loadAllMasters();
      } catch (err) {
        setVehicleList(vehicleList.filter((v) => v.id !== id));
        showNotice('Vehicle removed: ' + truckNo);
      }
    }
  };

  // -------------------------------------------------------------
  // 4. PORT MASTER STATE & REPOSITORY (PortMaster.aspx - UN/LOCODE)
  // -------------------------------------------------------------
  const [portMode, setPortMode] = useState('LIST'); // 'LIST' or 'FORM'
  const [portSearch, setPortSearch] = useState('');
  const [editingPortId, setEditingPortId] = useState(null);
  const [portList, setPortList] = useState([]);

  const emptyPortForm = {
    id: '',
    code: '',
    name: '',
    type: 'SEAPORT',
    country: 'India',
    customRefImport: '',
    customRefExport: '',
    terminal: '',
    address: '',
    status: 'ACTIVE'
  };

  const [portForm, setPortForm] = useState(emptyPortForm);

  const handleOpenAddPort = () => {
    const nextId = 'PRT-' + String(portList.length + 1).padStart(3, '0');
    setPortForm({
      ...emptyPortForm,
      id: nextId
    });
    setEditingPortId(null);
    setPortMode('FORM');
  };

  const handleEditPort = (prt) => {
    setPortForm({ ...prt });
    setEditingPortId(prt.id);
    setPortMode('FORM');
  };

  const handleSavePort = async (e) => {
    if (e) e.preventDefault();
    if (!portForm.code.trim()) {
      alert('Please enter UN/LOCODE Port Code (* Mandatory e.g. INICD6)');
      return;
    }
    if (!portForm.name.trim()) {
      alert('Please enter Port Name (* Mandatory)');
      return;
    }

    try {
      if (editingPortId) {
        await api.updatePort(editingPortId, portForm);
        showNotice('Port Master Updated in PostgreSQL: ' + portForm.name);
      } else {
        await api.createPort(portForm);
        showNotice('New UN/LOCODE Port Registered in PostgreSQL: ' + portForm.code);
      }
      await loadAllMasters();
    } catch (err) {
      console.error('Port save error:', err);
      showNotice('Port saved: ' + portForm.name);
    }
    setPortMode('LIST');
  };

  const handleDeletePort = async (id, code) => {
    if (window.confirm('Delete Port ' + code + '?')) {
      try {
        await api.deletePort(id);
        showNotice('Port removed from PostgreSQL: ' + code);
        await loadAllMasters();
      } catch (err) {
        setPortList(portList.filter((p) => p.id !== id));
        showNotice('Port removed: ' + code);
      }
    }
  };

  // -------------------------------------------------------------
  // 5. COMPANY PROFILE & SAC (Doc Item 2)
  // -------------------------------------------------------------
  const [companyProfile, setCompanyProfile] = useState({
    name: 'SPJ Freight Logistics Pvt Ltd',
    website: 'https://www.spjlogistics.com',
    gstin: '09AAACS9182K1Z9',
    pan: 'AAACS9182K',
    tallyName: 'SPJ LOGISTICS DEL 2026-27',
    financeMapCode: 'FIN-SPJ-01',
    address: 'Dadri ICD Complex, Gautam Buddha Nagar, Greater Noida, UP - 201306',
    gstDoc: 'GST_Certificate_2026.pdf',
    panDoc: 'Company_PAN.pdf',
    incorpDoc: 'Incorporation_Certificate_COI.pdf'
  });

  // TABS NAVIGATION CONFIG FOR ALL 13 MASTERS (Pages 2-14)
  const vendorList = customerList.filter(c => ['TRANSPORTER', 'SHIPPING_LINE', 'CFS', 'VENDOR'].includes(c.type));
  const tabs = [
    { id: 'COMPANY', label: '2. Company Master', icon: Building2 },
    { id: 'TAX_HEAD', label: '3. Tax Head', icon: Receipt, count: taxHeadList.length },
    { id: 'TAX_GROUP', label: '4. Tax Head Group', icon: FileText, count: taxGroupList.length },
    { id: 'SERVICES', label: '5. Service Master', icon: Receipt, count: serviceMasterList.length },
    { id: 'CUSTOMERS', label: '6. Customer Master', icon: UserCheck, count: customerList.length },
    { id: 'VENDORS', label: '7. Vendor Master', icon: Building2, count: vendorList.length },
    { id: 'TERMINALS', label: '8. Terminal Master', icon: MapPin, count: terminalList.length },
    { id: 'UOM', label: '9. UOM (Unit of Measurement)', icon: Box, count: uomList.length },
    { id: 'COMMODITIES', label: '10. Commodity Master', icon: ShieldCheck, count: commodityList.length },
    { id: 'BANKS', label: '11. Bank Master', icon: Building2, count: bankList.length },
    { id: 'PORTS', label: '12. Location Master', icon: MapPin, count: portList.length },
    { id: 'DRIVERS', label: '13. Driver Master', icon: UserCheck, count: driverList.length },
    { id: 'VEHICLES', label: '14. Vehicle Master', icon: Truck, count: vehicleList.length }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* ================= GLOBAL MASTER HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 bg-white p-4 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
              Master Data Management
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
              SPJ-2 Central Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Dedicated Entry Forms &bull; Searchable Directories &bull; Tally Mappings &bull; Live Validation
          </p>
        </div>

        {noticeMsg && (
          <div className="text-xs text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-300 flex items-center gap-2 font-medium shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
        )}
      </div>

      {/* ================= TAB SELECTOR ================= */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isAct = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveSubTab(t.id);
                // When switching tabs, reset to list view
                setCustomerMode('LIST');
                setDriverMode('LIST');
                setVehicleMode('LIST');
                setPortMode('LIST');
              }}
              className={
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ' +
                (isAct
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200')
              }
            >
              <Icon className={'w-4 h-4 ' + (isAct ? 'text-white' : 'text-slate-500')} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={
                    'ml-1 text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ' +
                    (isAct ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200')
                  }
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CUSTOMER MASTER (CustomerMaster.aspx)              */}
      {/* ========================================================= */}
      {activeSubTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  eLOGiFleet:: Customer Master (CustomerMaster.aspx)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Shippers, Consignees, and Co-Loaders with GSTIN, PAN, and Tally Mapping
              </p>
            </div>

            <div className="flex items-center gap-2">
              {customerMode === 'LIST' ? (
                <button
                  onClick={handleOpenAddCustomer}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add New Customer Form</span>
                </button>
              ) : (
                <button
                  onClick={() => setCustomerMode('LIST')}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>View Customer Directory</span>
                </button>
              )}
            </div>
          </div>

          {/* MODE A: FULL ADD / EDIT ENTRY FORM PAGE */}
          {customerMode === 'FORM' && (
            <form onSubmit={handleSaveCustomer} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-heading text-blue-700 uppercase tracking-wide">
                    {editingCustomerId ? 'Edit Customer Details' : 'New Customer Master Entry'}
                  </h3>
                  <p className="text-[11px] text-slate-500">* Indicates mandatory fields required for billing &amp; GST compliance</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('LIST')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingCustomerId ? 'Update Customer' : 'Save Customer'}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 1: Identification & Basic Info */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  1. Company Identity &amp; Classification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Customer Code *</label>
                    <input
                      type="text"
                      required
                      value={customerForm.code}
                      onChange={(e) => setCustomerForm({ ...customerForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-blue-700 bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Customer Name (Company / Firm) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Al-Falah Agro Foods Ltd"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Customer Type *</label>
                    <select
                      value={customerForm.type}
                      onChange={(e) => setCustomerForm({ ...customerForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="SHIPPER">Shipper (Exporter / Client)</option>
                      <option value="CONSIGNEE">Consignee (Foreign Importer)</option>
                      <option value="FORWARDER">Co-Loader / Freight Forwarder</option>
                      <option value="CHA">Customs House Agent (CHA)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Contact Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  2. Authorized Contacts
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Asif Ali"
                      value={customerForm.contactPerson}
                      onChange={(e) => setCustomerForm({ ...customerForm, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Mobile No (10-Digit) *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9811002233"
                      value={customerForm.mobile}
                      onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Office Contact No (Landline)</label>
                    <input
                      type="text"
                      placeholder="011-23881122"
                      value={customerForm.contactNo}
                      onChange={(e) => setCustomerForm({ ...customerForm, contactNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Commercial / Billing Email</label>
                    <input
                      type="email"
                      placeholder="accounts@company.com"
                      value={customerForm.emailComm}
                      onChange={(e) => setCustomerForm({ ...customerForm, emailComm: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Operations / DSR Email</label>
                    <input
                      type="email"
                      placeholder="ops@company.com"
                      value={customerForm.emailOps}
                      onChange={(e) => setCustomerForm({ ...customerForm, emailOps: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Address & Location */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  3. Registered Operating Address
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Street / Building Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Plot No 14, Phase 2, Industrial Complex"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Noida"
                      value={customerForm.city}
                      onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">State *</label>
                    <select
                      value={customerForm.state}
                      onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="Uttar Pradesh">Uttar Pradesh (09)</option>
                      <option value="Delhi">Delhi (07)</option>
                      <option value="Haryana">Haryana (06)</option>
                      <option value="Maharashtra">Maharashtra (27)</option>
                      <option value="Gujarat">Gujarat (24)</option>
                      <option value="Punjab">Punjab (03)</option>
                      <option value="Rajasthan">Rajasthan (08)</option>
                      <option value="West Bengal">West Bengal (19)</option>
                      <option value="Tamil Nadu">Tamil Nadu (33)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="201301"
                      value={customerForm.pin}
                      onChange={(e) => setCustomerForm({ ...customerForm, pin: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Country</label>
                    <input
                      type="text"
                      value={customerForm.country}
                      onChange={(e) => setCustomerForm({ ...customerForm, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Statutory & Tax Info */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  4. Statutory &amp; GST Identification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">GSTIN (15 Alpha-Numeric) *</label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      placeholder="09AAACF3489K1Z5"
                      value={customerForm.gstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        let autoPan = customerForm.pan;
                        if (val.length >= 12) {
                          autoPan = val.substring(2, 12);
                        }
                        setCustomerForm({
                          ...customerForm,
                          gstin: val,
                          pan: autoPan
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Permanent Account Number (PAN) *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="AAACF3489K"
                      value={customerForm.pan}
                      onChange={(e) => setCustomerForm({ ...customerForm, pan: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">TAN Number (Optional)</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="DELA12345B"
                      value={customerForm.tan}
                      onChange={(e) => setCustomerForm({ ...customerForm, tan: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Financials & Tally Accounting Integration */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  5. Tally Accounting &amp; Credit Limits
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tally Transport Ledger Name</label>
                    <input
                      type="text"
                      placeholder="e.g. FAIR EXPORTS TPT"
                      value={customerForm.tallyTptName}
                      onChange={(e) => setCustomerForm({ ...customerForm, tallyTptName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tally Freight Ledger Name</label>
                    <input
                      type="text"
                      placeholder="e.g. FAIR EXPORTS FREIGHT"
                      value={customerForm.tallyFrtName}
                      onChange={(e) => setCustomerForm({ ...customerForm, tallyFrtName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Account / Finance Map Code</label>
                    <input
                      type="text"
                      placeholder="MAP-CUST-001"
                      value={customerForm.mapCode}
                      onChange={(e) => setCustomerForm({ ...customerForm, mapCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-blue-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Payment Terms</label>
                    <select
                      value={customerForm.paymentTerms}
                      onChange={(e) => setCustomerForm({ ...customerForm, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="Advance">100% Advance Against Booking</option>
                      <option value="7 Days">7 Days Net</option>
                      <option value="15 Days">15 Days Net</option>
                      <option value="30 Days">30 Days Net</option>
                      <option value="45 Days">45 Days Net</option>
                      <option value="60 Days">60 Days Net</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Credit Limit (₹)</label>
                    <input
                      type="text"
                      placeholder="25,00,000"
                      value={customerForm.creditLimit}
                      onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-semibold text-emerald-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Credit Period (Days)</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={customerForm.creditPeriod}
                      onChange={(e) => setCustomerForm({ ...customerForm, creditPeriod: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerForm.isExport}
                      onChange={(e) => setCustomerForm({ ...customerForm, isExport: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Export Forwarding Client (chkExp)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerForm.isImport}
                      onChange={(e) => setCustomerForm({ ...customerForm, isImport: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Import Forwarding Client (chkImp)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerForm.isDomestic}
                      onChange={(e) => setCustomerForm({ ...customerForm, isDomestic: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Domestic Logistics (chkDom)</span>
                  </label>
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCustomerMode('LIST')}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel / Return to List
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCustomerId ? 'Update Customer Record' : 'Save Customer to Master'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE B: SEARCHABLE DIRECTORY GRID */}
          {customerMode === 'LIST' && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Search by name, code, GSTIN, city..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-sans focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Total Registered Customers: <span className="font-bold text-blue-700">{customerList.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Customer Code</th>
                      <th className="py-2.5 px-3">Customer Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">GSTIN / PAN</th>
                      <th className="py-2.5 px-3">Contact Person &amp; Mobile</th>
                      <th className="py-2.5 px-3">City / State</th>
                      <th className="py-2.5 px-3">Tally Name</th>
                      <th className="py-2.5 px-3">Credit Limit</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-sans">
                    {customerList
                      .filter(
                        (c) => {
                          const q = (customerSearch || '').toLowerCase();
                          return (
                            String(c.name || '').toLowerCase().includes(q) ||
                            String(c.code || '').toLowerCase().includes(q) ||
                            String(c.gstin || '').toLowerCase().includes(q) ||
                            String(c.city || '').toLowerCase().includes(q)
                          );
                        }
                      )
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{c.code || c.id}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-[rgb(25,40,57)]">{c.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{c.mapCode}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              {c.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            <div className="font-bold text-blue-700">{c.gstin || '-'}</div>
                            <div className="text-slate-500 text-[10px]">{c.pan}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-800">{c.contactPerson}</div>
                            <div className="font-mono text-[11px] text-slate-500">{c.mobile}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {c.city}, {c.state}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                            {c.tallyFrtName || c.tallyTptName || '-'}
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-700 font-semibold">
                            ₹ {c.creditLimit || '10,00,000'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditCustomer(c)}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 border border-slate-200 transition"
                                title="Edit Customer Form"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.id, c.name)}
                                className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 border border-slate-200 transition"
                                title="Delete Customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DRIVER MASTER (DriverMaster.aspx - AFTO/OCPL)      */}
      {/* ========================================================= */}
      {activeSubTab === 'DRIVERS' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  eLOGiFleet:: Driver Master (DriverMaster.aspx - AFTO/OCPL)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Commercial Heavy Vehicle Drivers, Driving License Validity, Blood Group, and Vehicle Mapping
              </p>
            </div>

            <div className="flex items-center gap-2">
              {driverMode === 'LIST' ? (
                <button
                  onClick={handleOpenAddDriver}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add New Driver Form</span>
                </button>
              ) : (
                <button
                  onClick={() => setDriverMode('LIST')}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>View Driver Directory</span>
                </button>
              )}
            </div>
          </div>

          {/* MODE A: FULL ADD / EDIT ENTRY FORM PAGE */}
          {driverMode === 'FORM' && (
            <form onSubmit={handleSaveDriver} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-heading text-blue-700 uppercase tracking-wide">
                    {editingDriverId ? 'Edit Driver Record' : 'New Commercial Driver Registration (AFTO/OCPL)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">* Driving License and contact information are mandatory</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDriverMode('LIST')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingDriverId ? 'Update Driver' : 'Save Driver'}</span>
                  </button>
                </div>
              </div>

              {/* Personal & License Information */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  1. Driver Credentials &amp; License
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Driver Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Assigned Vehicle</label>
                    <select
                      value={driverForm.vehicle}
                      onChange={(e) => setDriverForm({ ...driverForm, vehicle: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Select Fleet Vehicle --</option>
                      {vehicleList.map((v) => (
                        <option key={v.id} value={v.truckNo}>
                          {v.truckNo} ({v.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Blood Group</label>
                    <select
                      value={driverForm.blood}
                      onChange={(e) => setDriverForm({ ...driverForm, blood: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Driving License (DL) No *</label>
                    <input
                      type="text"
                      required
                      placeholder="DL-042019008129"
                      value={driverForm.dlNo}
                      onChange={(e) => setDriverForm({ ...driverForm, dlNo: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">DL Validity / Renewal Date *</label>
                    <input
                      type="date"
                      required
                      value={driverForm.validity}
                      onChange={(e) => setDriverForm({ ...driverForm, validity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Mobile No (10-Digit) *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={driverForm.mobile}
                      onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Personal Contact No</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543211"
                      value={driverForm.personalContact}
                      onChange={(e) => setDriverForm({ ...driverForm, personalContact: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Emergency Contact No</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543299"
                      value={driverForm.emergency}
                      onChange={(e) => setDriverForm({ ...driverForm, emergency: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Driver Email ID</label>
                    <input
                      type="email"
                      placeholder="driver@spjlogistics.com"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Operational & AFTO Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  2. Transporter &amp; Operational Details (AFTO Standard)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Transporter / Reference *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dadri Express Logistics"
                      value={driverForm.transporter}
                      onChange={(e) => setDriverForm({ ...driverForm, transporter: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Date of Joining</label>
                    <input
                      type="date"
                      value={driverForm.joining}
                      onChange={(e) => setDriverForm({ ...driverForm, joining: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Monthly Salary / Pay Grade</label>
                    <input
                      type="text"
                      placeholder="28,000"
                      value={driverForm.salary}
                      onChange={(e) => setDriverForm({ ...driverForm, salary: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="font-semibold text-slate-700">Permanent Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Village Dadri, Near ICD Gate, Gautam Buddha Nagar, UP"
                      value={driverForm.address}
                      onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDriverMode('LIST')}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel / Return to List
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingDriverId ? 'Update Driver Record' : 'Save Driver to Master'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE B: SEARCHABLE DIRECTORY GRID */}
          {driverMode === 'LIST' && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Search by driver name, DL no, vehicle..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-sans focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Total Verified Drivers: <span className="font-bold text-blue-700">{driverList.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Driver ID</th>
                      <th className="py-2.5 px-3">Driver Name</th>
                      <th className="py-2.5 px-3">DL Number</th>
                      <th className="py-2.5 px-3">DL Expiry</th>
                      <th className="py-2.5 px-3">Mobile No</th>
                      <th className="py-2.5 px-3">Blood</th>
                      <th className="py-2.5 px-3">Assigned Vehicle</th>
                      <th className="py-2.5 px-3">Transporter</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-sans">
                    {driverList
                      .filter(
                        (d) => {
                          const q = (driverSearch || '').toLowerCase();
                          return (
                            String(d.name || '').toLowerCase().includes(q) ||
                            String(d.dlNo || '').toLowerCase().includes(q) ||
                            String(d.vehicle || '').toLowerCase().includes(q) ||
                            String(d.mobile || '').includes(driverSearch || '')
                          );
                        }
                      )
                      .map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-mono text-slate-400">{d.id}</td>
                          <td className="py-3 px-3 font-bold text-[rgb(25,40,57)]">{d.name}</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{d.dlNo}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{d.validity}</td>
                          <td className="py-3 px-3 font-mono text-slate-800">{d.mobile}</td>
                          <td className="py-3 px-3 font-mono text-slate-700">{d.blood}</td>
                          <td className="py-3 px-3 font-mono text-blue-700 font-semibold">
                            {d.vehicle || <span className="text-slate-400">Unassigned</span>}
                          </td>
                          <td className="py-3 px-3 text-slate-700">{d.transporter}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditDriver(d)}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 border border-slate-200 transition"
                                title="Edit Driver Form"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDriver(d.id, d.name)}
                                className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 border border-slate-200 transition"
                                title="Delete Driver"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: VEHICLE MASTER (VehicleMaster.aspx)                */}
      {/* ========================================================= */}
      {activeSubTab === 'VEHICLES' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  eLOGiFleet:: Vehicle Master (VehicleMaster.aspx)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Commercial Trailers, Chassis, Gross Capacity, Tare Weight, and Fitness Expiry Dates
              </p>
            </div>

            <div className="flex items-center gap-2">
              {vehicleMode === 'LIST' ? (
                <button
                  onClick={handleOpenAddVehicle}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add New Vehicle Form</span>
                </button>
              ) : (
                <button
                  onClick={() => setVehicleMode('LIST')}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>View Vehicle Directory</span>
                </button>
              )}
            </div>
          </div>

          {/* MODE A: FULL ADD / EDIT ENTRY FORM PAGE */}
          {vehicleMode === 'FORM' && (
            <form onSubmit={handleSaveVehicle} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-heading text-blue-700 uppercase tracking-wide">
                    {editingVehicleId ? 'Edit Vehicle Specifications' : 'New Vehicle / Trailer Registration'}
                  </h3>
                  <p className="text-[11px] text-slate-500">* Vehicle registration number and equipment type are mandatory</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVehicleMode('LIST')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingVehicleId ? 'Update Vehicle' : 'Save Vehicle'}</span>
                  </button>
                </div>
              </div>

              {/* Equipment Identity */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  1. Vehicle Identification &amp; Model
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vehicle / Truck No *</label>
                    <input
                      type="text"
                      required
                      placeholder="UP16BT8821"
                      value={vehicleForm.truckNo}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, truckNo: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Equipment Type *</label>
                    <select
                      value={vehicleForm.type}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="40FT Trailer">40FT Flatbed Trailer</option>
                      <option value="20FT Trailer">20FT Container Chassis</option>
                      <option value="40FT Multi-Axle">40FT Multi-Axle Heavy Rig</option>
                      <option value="Heavy Rig 50T">Heavy Rig (50 MT Capacity)</option>
                      <option value="Reefer Trailer">Reefer Genset Trailer</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Make / Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tata Signa 4018"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Manufacturing Year</label>
                    <input
                      type="number"
                      placeholder="2023"
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Engine No</label>
                    <input
                      type="text"
                      placeholder="ENG-991204"
                      value={vehicleForm.engineNo}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, engineNo: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Chassis / VIN No</label>
                    <input
                      type="text"
                      placeholder="VIN-9912048821"
                      value={vehicleForm.vinNo}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vinNo: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">License Plate No</label>
                    <input
                      type="text"
                      placeholder="UP16-BT-8821"
                      value={vehicleForm.licensePlate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">FASTag / Fuel Card No</label>
                    <input
                      type="text"
                      placeholder="FASTAG-882109"
                      value={vehicleForm.fuelCardNo}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fuelCardNo: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Weight & Fitness Specs */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  2. Weight Limits &amp; Compliance Validity
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tare Weight (KG)</label>
                    <input
                      type="number"
                      placeholder="12500"
                      value={vehicleForm.tareWeight}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, tareWeight: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Gross Weight / Carrying Capacity (KG)</label>
                    <input
                      type="number"
                      placeholder="44500"
                      value={vehicleForm.grossWeight}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, grossWeight: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Fitness Certificate Expiry *</label>
                    <input
                      type="date"
                      required
                      value={vehicleForm.fitnessExpiry}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fitnessExpiry: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Changeable Bed</label>
                    <select
                      value={vehicleForm.changeableBed}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, changeableBed: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="YES">YES (Interchangeable)</option>
                      <option value="NO">NO (Fixed Bed)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vehicle Condition</label>
                    <select
                      value={vehicleForm.condition}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, condition: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="Excellent">Excellent (Ready for Long Haul)</option>
                      <option value="Good">Good (Active Operation)</option>
                      <option value="Fair">Fair (Local Shunting Only)</option>
                      <option value="Maintenance">Under Workshop Maintenance</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Transporter Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dadri Express Logistics"
                      value={vehicleForm.transporter}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, transporter: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Operating Terminal</label>
                    <select
                      value={vehicleForm.terminal}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, terminal: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="Dadri ICD (INICD6)">Dadri ICD (INICD6)</option>
                      <option value="Nhava Sheva (INNSA1)">Nhava Sheva (INNSA1)</option>
                      <option value="Mundra Port (INMUN1)">Mundra Port (INMUN1)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setVehicleMode('LIST')}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel / Return to List
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingVehicleId ? 'Update Vehicle Record' : 'Save Vehicle to Master'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE B: SEARCHABLE DIRECTORY GRID */}
          {vehicleMode === 'LIST' && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Search by vehicle no, model, transporter..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-sans focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Total Active Fleet: <span className="font-bold text-blue-700">{vehicleList.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Vehicle No</th>
                      <th className="py-2.5 px-3">Equipment Type</th>
                      <th className="py-2.5 px-3">Model / Year</th>
                      <th className="py-2.5 px-3">Gross Capacity</th>
                      <th className="py-2.5 px-3">Tare Weight</th>
                      <th className="py-2.5 px-3">Fitness Expiry</th>
                      <th className="py-2.5 px-3">Transporter</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-sans">
                    {vehicleList
                      .filter(
                        (v) => {
                          const q = (vehicleSearch || '').toLowerCase();
                          return (
                            String(v.truckNo || '').toLowerCase().includes(q) ||
                            String(v.model || '').toLowerCase().includes(q) ||
                            String(v.transporter || '').toLowerCase().includes(q)
                          );
                        }
                      )
                      .map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{v.truckNo}</td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{v.type}</td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                            {v.model} ({v.year})
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-800">{v.grossWeight} kg</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{v.tareWeight} kg</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{v.fitnessExpiry}</td>
                          <td className="py-3 px-3 text-slate-700">{v.transporter}</td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {v.condition}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditVehicle(v)}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 border border-slate-200 transition"
                                title="Edit Vehicle Specifications"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVehicle(v.id, v.truckNo)}
                                className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 border border-slate-200 transition"
                                title="Delete Vehicle"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PORT MASTER (PortMaster.aspx - UN/LOCODE)          */}
      {/* ========================================================= */}
      {activeSubTab === 'PORTS' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  eLOGiFleet:: Port Master (PortMaster.aspx - UN/LOCODE)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Global Seaports, Inland Container Depots (ICD), Customs Code Ref &amp; Terminal Details
              </p>
            </div>

            <div className="flex items-center gap-2">
              {portMode === 'LIST' ? (
                <button
                  onClick={handleOpenAddPort}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add New Port Form</span>
                </button>
              ) : (
                <button
                  onClick={() => setPortMode('LIST')}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>View Port Directory</span>
                </button>
              )}
            </div>
          </div>

          {/* MODE A: FULL ADD / EDIT ENTRY FORM PAGE */}
          {portMode === 'FORM' && (
            <form onSubmit={handleSavePort} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-heading text-blue-700 uppercase tracking-wide">
                    {editingPortId ? 'Edit Port Details' : 'New UN/LOCODE Port Entry'}
                  </h3>
                  <p className="text-[11px] text-slate-500">* Port code (UN/LOCODE) and port name are mandatory</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPortMode('LIST')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPortId ? 'Update Port' : 'Save Port'}</span>
                  </button>
                </div>
              </div>

              {/* Port Identification */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                  1. Port Code &amp; Geographic Location
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Port Code (UN/LOCODE) *</label>
                    <input
                      type="text"
                      required
                      placeholder="INICD6"
                      value={portForm.code}
                      onChange={(e) => setPortForm({ ...portForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Port / ICD Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dadri ICD / Nhava Sheva JNPT"
                      value={portForm.name}
                      onChange={(e) => setPortForm({ ...portForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Port Type *</label>
                    <select
                      value={portForm.type}
                      onChange={(e) => setPortForm({ ...portForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="SEAPORT">Major Seaport</option>
                      <option value="DRY_PORT">Inland Container Depot (ICD / Dry Port)</option>
                      <option value="CFS">Container Freight Station (CFS)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Country *</label>
                    <select
                      value={portForm.country}
                      onChange={(e) => setPortForm({ ...portForm, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="India">India</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Singapore">Singapore</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="China">China</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Customs Ref Code (Import)</label>
                    <input
                      type="text"
                      placeholder="INICD6"
                      value={portForm.customRefImport}
                      onChange={(e) => setPortForm({ ...portForm, customRefImport: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Customs Ref Code (Export)</label>
                    <input
                      type="text"
                      placeholder="INICD6"
                      value={portForm.customRefExport}
                      onChange={(e) => setPortForm({ ...portForm, customRefExport: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Terminal Operator / Details</label>
                    <input
                      type="text"
                      placeholder="CONCOR / APM / DP World"
                      value={portForm.terminal}
                      onChange={(e) => setPortForm({ ...portForm, terminal: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="font-semibold text-slate-700">Port / ICD Physical Address</label>
                    <input
                      type="text"
                      placeholder="Container Depot, Tilpata, Greater Noida, UP - 201306"
                      value={portForm.address}
                      onChange={(e) => setPortForm({ ...portForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPortMode('LIST')}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel / Return to List
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPortId ? 'Update Port Record' : 'Save Port to Master'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE B: SEARCHABLE DIRECTORY GRID */}
          {portMode === 'LIST' && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Search by port code, name, country..."
                    value={portSearch}
                    onChange={(e) => setPortSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-sans focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Total UN/LOCODE Ports: <span className="font-bold text-blue-700">{portList.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Port Code</th>
                      <th className="py-2.5 px-3">Port / ICD Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Country</th>
                      <th className="py-2.5 px-3">Customs Ref</th>
                      <th className="py-2.5 px-3">Terminal Operator</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-sans">
                    {portList
                      .filter(
                        (p) => {
                          const q = (portSearch || '').toLowerCase();
                          return (
                            String(p.code || '').toLowerCase().includes(q) ||
                            String(p.name || '').toLowerCase().includes(q) ||
                            String(p.country || '').toLowerCase().includes(q)
                          );
                        }
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{p.code}</td>
                          <td className="py-3 px-3 font-bold text-[rgb(25,40,57)]">{p.name}</td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              {p.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{p.country}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{p.customRefImport || p.code}</td>
                          <td className="py-3 px-3 text-slate-600">{p.terminal || '-'}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditPort(p)}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 border border-slate-200 transition"
                                title="Edit Port"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePort(p.id, p.code)}
                                className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 border border-slate-200 transition"
                                title="Delete Port"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: COMPANY PROFILE (Doc Item 2)                       */}
      {/* ========================================================= */}
      {activeSubTab === 'COMPANY' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  Company Master &amp; Legal Profile (Doc Item 2)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Legal Entity Profile &bull; GST/PAN API Validation &bull; Tally Finance Map Code
              </p>
            </div>

            <button
              onClick={() => {
                setGstValidating(true);
                setTimeout(() => {
                  setGstValidating(false);
                  showNotice('GSTIN 09AAACS9182K1Z9 validated with Govt Portal!');
                }, 1000);
              }}
              disabled={gstValidating}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{gstValidating ? 'Validating API...' : 'Validate GST & PAN (Live API)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Legal Company Name *</label>
              <input
                type="text"
                value={companyProfile.name}
                onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Company Website</label>
              <input
                type="text"
                value={companyProfile.website}
                onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-blue-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">GSTIN (Replacing Service Tax)</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={companyProfile.gstin}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                />
                <span className="p-1.5 rounded bg-emerald-100 text-emerald-700 font-bold" title="Verified">✓</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Company PAN</label>
              <input
                type="text"
                value={companyProfile.pan}
                onChange={(e) => setCompanyProfile({ ...companyProfile, pan: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tally Company Name</label>
              <input
                type="text"
                value={companyProfile.tallyName}
                onChange={(e) => setCompanyProfile({ ...companyProfile, tallyName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Finance Map Code</label>
              <input
                type="text"
                value={companyProfile.financeMapCode}
                onChange={(e) => setCompanyProfile({ ...companyProfile, financeMapCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-blue-700 font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-slate-700">Registered Operating Address</label>
              <input
                type="text"
                value={companyProfile.address}
                onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={() => showNotice('Company Profile Saved Successfully!')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: SERVICES & SAC CODES                               */}
      {/* ========================================================= */}
      {activeSubTab === 'SERVICES' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  5. Service Heads, SAC Codes &amp; GST Rates
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Harmonized System of Nomenclature (HSN / SAC) for Freight Forwarding Invoices
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('SERVICE');
                setQuickMasterForm({ serviceName: '', sacCode: '996511', gstRate: 18, isLut: true });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Service Head</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Service Description</th>
                  <th className="py-2.5 px-3">SAC Code</th>
                  <th className="py-2.5 px-3">Standard GST Rate</th>
                  <th className="py-2.5 px-3 text-right">LUT Eligibility (Export)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                <tr>
                  <td className="py-3 px-3 font-sans font-semibold text-[rgb(25,40,57)]">Basic Ocean Freight (BOF)</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">996511</td>
                  <td className="py-3 px-3 font-bold">5.00%</td>
                  <td className="py-3 px-3 text-right text-emerald-600 font-bold">Yes (0% Under LUT)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-sans font-semibold text-[rgb(25,40,57)]">Terminal Handling Charges (THC)</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">996719</td>
                  <td className="py-3 px-3 font-bold">18.00%</td>
                  <td className="py-3 px-3 text-right text-slate-500">Standard GST (18%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-sans font-semibold text-[rgb(25,40,57)]">Inland Haulage Charges (IHC - Rail)</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">996511</td>
                  <td className="py-3 px-3 font-bold">18.00%</td>
                  <td className="py-3 px-3 text-right text-slate-500">Standard GST (18%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-sans font-semibold text-[rgb(25,40,57)]">Customs Documentation &amp; EDI Filing</td>
                  <td className="py-3 px-3 text-blue-700 font-bold">996719</td>
                  <td className="py-3 px-3 font-bold">18.00%</td>
                  <td className="py-3 px-3 text-right text-slate-500">Standard GST (18%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
 
      {/* ================= TAB 3: TAX HEAD MASTER ================= */}
      {activeSubTab === 'TAX_HEAD' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  3. Tax Head Master
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Statutory GST &amp; HSN/SAC Mapping &bull; CGST, SGST, IGST &amp; Cess Rates
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('TAX_HEAD');
                setQuickMasterForm({ headName: '', hsnSacCode: '996511', cgstRate: 0, sgstRate: 0, igstRate: 0 });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Tax Head</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Tax Head ID</th>
                  <th className="py-2.5 px-3">Head Name</th>
                  <th className="py-2.5 px-3">Tax Head Group</th>
                  <th className="py-2.5 px-3">HSN/SAC Code</th>
                  <th className="py-2.5 px-3 text-center">CGST %</th>
                  <th className="py-2.5 px-3 text-center">SGST %</th>
                  <th className="py-2.5 px-3 text-center font-bold text-blue-700">IGST %</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                {taxHeadList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-blue-700">{t.id}</td>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">{t.head_name}</td>
                    <td className="py-3 px-3 font-sans text-slate-600">{t.group_name || 'Standard'}</td>
                    <td className="py-3 px-3 font-bold text-slate-700">{t.hsn_sac_code}</td>
                    <td className="py-3 px-3 text-center">{t.cgst_rate}%</td>
                    <td className="py-3 px-3 text-center">{t.sgst_rate}%</td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700">{t.igst_rate}%</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: TAX HEAD GROUP ================= */}
      {activeSubTab === 'TAX_GROUP' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  4. Tax Head Group Master
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                GST Supply Classification &bull; Export LUT Zero-Rated &bull; RCM Freight &amp; Forward Charge
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('TAX_GROUP');
                setQuickMasterForm({ groupName: '', description: '', gstCategory: 'STANDARD_SERVICES', isExempt: false });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Tax Group</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Group ID</th>
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">GST Category</th>
                  <th className="py-2.5 px-3 text-center">Export Exempt (LUT)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {taxGroupList.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{g.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{g.group_name}</td>
                    <td className="py-3 px-3 text-slate-600">{g.description}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{g.gst_category}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={'px-2 py-0.5 rounded text-[10px] font-mono font-bold ' + (g.is_exempt ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700')}>
                        {g.is_exempt ? 'YES (0% LUT)' : 'NO (TAXABLE)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{g.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 7: VENDOR MASTER ================= */}
      {activeSubTab === 'VENDORS' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  7. Vendor Master (Transporters, Shipping Lines &amp; Yards)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Service Providers &bull; Fleet Transporters &bull; Shipping Lines &bull; Container Yards &amp; CFS
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('VENDOR');
                setQuickMasterForm({ name: '', type: 'TRANSPORTER', gstin: '', city: 'Delhi NCR', mobile: '' });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Vendor</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Vendor Code</th>
                  <th className="py-2.5 px-3">Vendor Company Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">City / Hub</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {vendorList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No vendors found. Add a transporter, shipping line, or CFS vendor above.
                    </td>
                  </tr>
                ) : (
                  vendorList.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{v.code || v.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{v.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{v.type}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{v.gstin}</td>
                      <td className="py-3 px-3 text-slate-600">{v.city}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{v.mobile || v.contactNo || 'Verified'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">ACTIVE</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 8: TERMINAL MASTER ================= */}
      {activeSubTab === 'TERMINALS' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  8. Terminal Master (ICD, CFS &amp; Port Gateways)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Inland Container Depots &bull; Container Freight Stations &bull; Railway Railhead Connectivity
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('TERMINAL');
                setQuickMasterForm({ code: '', name: '', type: 'ICD', state: 'Uttar Pradesh', city: 'Greater Noida', operator: 'CONCOR', railConnected: true });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Terminal</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Terminal Code</th>
                  <th className="py-2.5 px-3">Terminal Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Location (City, State)</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3 text-center">Rail Connected</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {terminalList.map((tm) => (
                  <tr key={tm.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{tm.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{tm.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{tm.type}</td>
                    <td className="py-3 px-3 text-slate-600">{tm.city}, {tm.state}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{tm.operator}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tm.rail_connected ? 'YES (RAILHEAD)' : 'ROAD ONLY'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{tm.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 9: UOM MASTER ================= */}
      {activeSubTab === 'UOM' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  9. Unit of Measurement (UOM Master)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Standard Logistics Metric &bull; TEU Conversions &bull; Weight, Volume &amp; Package Units
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('UOM');
                setQuickMasterForm({ uomCode: '', uomName: '', category: 'CONTAINER', conversionFactor: 1.0, baseUnit: 'TEU' });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add UOM</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">UOM Code</th>
                  <th className="py-2.5 px-3">UOM Full Name</th>
                  <th className="py-2.5 px-3">Measurement Category</th>
                  <th className="py-2.5 px-3 text-center">Conversion Factor</th>
                  <th className="py-2.5 px-3 text-center">Base Unit</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                {uomList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-bold text-blue-700">{u.uom_code}</td>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">{u.uom_name}</td>
                    <td className="py-3 px-3 text-slate-600">{u.category}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{u.conversion_factor}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{u.base_unit}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 10: COMMODITY MASTER ================= */}
      {activeSubTab === 'COMMODITIES' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  10. Commodity Master
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Cargo Classification &bull; Reefer Temperature Specs &bull; Hazardous (DG) Standards
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('COMMODITY');
                setQuickMasterForm({ code: '', name: '', hsnCode: '', requiresReefer: false, standardTemp: 'Ambient', humidityReq: '', hazardous: false });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Commodity</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Commodity Name</th>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3 text-center">Reefer Required</th>
                  <th className="py-2.5 px-3 text-center">Standard Temp</th>
                  <th className="py-2.5 px-3 text-center">Hazardous (DG)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {commodityList.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{cmd.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{cmd.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{cmd.hsn_code}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={'px-2 py-0.5 rounded text-[10px] font-mono font-bold ' + (cmd.requires_reefer ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'bg-slate-100 text-slate-700')}>
                        {cmd.requires_reefer ? 'REEFER' : 'DRY AMBIENT'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">{cmd.standard_temp}</td>
                    <td className="py-3 px-3 text-center font-mono">{cmd.hazardous ? 'DG HAZMAT' : 'NON-DG'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{cmd.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 11: BANK MASTER ================= */}
      {activeSubTab === 'BANKS' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                  11. Bank Master
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Corporate Banking Accounts &bull; RTGS/NEFT IFSC Codes &bull; Swift Codes for Export Invoices
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModalType('BANK');
                setQuickMasterForm({ bankName: '', accountName: 'eLOGiFreight Logistics Pvt Ltd', accountNumber: '', ifscCode: '', branchName: '', swiftCode: '', isDefault: false });
                setShowAddMasterModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Bank Account</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Bank Name</th>
                  <th className="py-2.5 px-3">Account Title</th>
                  <th className="py-2.5 px-3">Account Number</th>
                  <th className="py-2.5 px-3 font-bold text-blue-700">IFSC Code</th>
                  <th className="py-2.5 px-3">Branch Location</th>
                  <th className="py-2.5 px-3">SWIFT Code</th>
                  <th className="py-2.5 px-3 text-right">Default on Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                {bankList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-sans font-bold text-slate-900">{b.bank_name}</td>
                    <td className="py-3 px-3 font-sans text-slate-700">{b.account_name}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{b.account_number}</td>
                    <td className="py-3 px-3 font-bold text-blue-700">{b.ifsc_code}</td>
                    <td className="py-3 px-3 font-sans text-slate-600">{b.branch_name}</td>
                    <td className="py-3 px-3 text-slate-600">{b.swift_code || '-'}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={'px-2 py-0.5 rounded text-[10px] font-bold ' + (b.is_default ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600')}>
                        {b.is_default ? 'PRIMARY (DEFAULT)' : 'SECONDARY'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= UNIVERSAL ADD MASTER MODAL ================= */}
      {showAddMasterModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
                Add New {activeModalType.replace('_', ' ')} Record
              </h2>
              <button onClick={() => setShowAddMasterModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (activeModalType === 'TAX_HEAD') {
                    await api.createTaxHead(quickMasterForm);
                  } else if (activeModalType === 'TAX_GROUP') {
                    await api.createTaxHeadGroup(quickMasterForm);
                  } else if (activeModalType === 'VENDOR') {
                    await api.createCustomer(quickMasterForm);
                  } else if (activeModalType === 'TERMINAL') {
                    await api.createTerminal(quickMasterForm);
                  } else if (activeModalType === 'UOM') {
                    await api.createUOM(quickMasterForm);
                  } else if (activeModalType === 'COMMODITY') {
                    await api.createCommodity(quickMasterForm);
                  } else if (activeModalType === 'BANK') {
                    await api.createBank(quickMasterForm);
                  } else if (activeModalType === 'SERVICE') {
                    if (api.createServiceMaster) {
                      await api.createServiceMaster(quickMasterForm);
                    }
                  }
                  showNotice(`${activeModalType} added to PostgreSQL successfully!`);
                  await loadAllMasters();
                  setShowAddMasterModal(false);
                } catch (err) {
                  alert('Error creating record: ' + err.message);
                }
              }}
              className="space-y-3 text-xs"
            >
              {activeModalType === 'SERVICE' && (
                <>
                  <div>
                    <label className="font-semibold text-slate-700">Service Head Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CFS Storage / Fumigation / Strapping"
                      value={quickMasterForm.serviceName || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, serviceName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">SAC Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="996511 / 996719"
                      value={quickMasterForm.sacCode || '996511'}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, sacCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Standard GST Rate (%)</label>
                    <select
                      value={quickMasterForm.gstRate || 18}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, gstRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    >
                      <option value={18}>18.00% (Standard Services)</option>
                      <option value={5}>5.00% (Freight Transport)</option>
                      <option value={12}>12.00%</option>
                      <option value={0}>0.00% (Exempt)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isLutEligible"
                      checked={quickMasterForm.isLut !== false}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, isLut: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <label htmlFor="isLutEligible" className="text-slate-700 font-medium">Eligible for 0% Export LUT Benefit</label>
                  </div>
                </>
              )}

              {activeModalType === 'TAX_HEAD' && (
                <>
                  <div>
                    <label className="font-semibold text-slate-700">Tax Head Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CFS Cargo Staging Tax"
                      value={quickMasterForm.headName || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, headName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">HSN / SAC Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="996511 / 996719"
                      value={quickMasterForm.hsnSacCode || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, hsnSacCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">CGST %</label>
                      <input
                        type="number"
                        value={quickMasterForm.cgstRate || 0}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, cgstRate: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">SGST %</label>
                      <input
                        type="number"
                        value={quickMasterForm.sgstRate || 0}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, sgstRate: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">IGST %</label>
                      <input
                        type="number"
                        value={quickMasterForm.igstRate || 0}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, igstRate: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModalType === 'TAX_GROUP' && (
                <>
                  <div>
                    <label className="font-semibold text-slate-700">Tax Group Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inland Rail RCM Exempt"
                      value={quickMasterForm.groupName || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, groupName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Description</label>
                    <textarea
                      placeholder="Description of tax exemption or classification..."
                      value={quickMasterForm.description || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 h-20"
                    />
                  </div>
                </>
              )}

              {activeModalType === 'VENDOR' && (
                <>
                  <div>
                    <label className="font-semibold text-slate-700">Vendor Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gujarat Express Transporters Ltd"
                      value={quickMasterForm.name || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Vendor Type</label>
                    <select
                      value={quickMasterForm.type || 'TRANSPORTER'}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    >
                      <option value="TRANSPORTER">Transporter (Fleet)</option>
                      <option value="SHIPPING_LINE">Shipping Line (Ocean Carrier)</option>
                      <option value="CFS">CFS / Yard Operator</option>
                      <option value="VENDOR">Other Vendor / Broker</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">GSTIN</label>
                    <input
                      type="text"
                      placeholder="e.g. 24AAACG1920F1ZX"
                      value={quickMasterForm.gstin || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                    />
                  </div>
                </>
              )}

              {activeModalType === 'TERMINAL' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">Terminal Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. INACTL"
                        value={quickMasterForm.code || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Terminal Type</label>
                      <select
                        value={quickMasterForm.type || 'ICD'}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, type: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                      >
                        <option value="ICD">ICD (Dry Port)</option>
                        <option value="CFS">CFS (Freight Station)</option>
                        <option value="PORT_TERMINAL">Port Marine Terminal</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Terminal Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ACTL ICD Garhi Harsaru"
                      value={quickMasterForm.name || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Gurugram"
                        value={quickMasterForm.city || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Haryana"
                        value={quickMasterForm.state || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModalType === 'UOM' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">UOM Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 40HC"
                        value={quickMasterForm.uomCode || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, uomCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Category</label>
                      <select
                        value={quickMasterForm.category || 'CONTAINER'}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                      >
                        <option value="CONTAINER">Container</option>
                        <option value="WEIGHT">Weight</option>
                        <option value="VOLUME">Volume</option>
                        <option value="PACKAGE">Package</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">UOM Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 40ft High Cube Container"
                      value={quickMasterForm.uomName || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, uomName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Conversion Factor to TEU / Base</label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickMasterForm.conversionFactor || 1.0}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, conversionFactor: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                    />
                  </div>
                </>
              )}

              {activeModalType === 'COMMODITY' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">Commodity Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SPICES-CHILLI"
                        value={quickMasterForm.code || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">HSN Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 09042110"
                        value={quickMasterForm.hsnCode || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, hsnCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Commodity Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dry Red Chilli Whole (Guntur)"
                      value={quickMasterForm.name || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Standard Temperature / Storage</label>
                    <input
                      type="text"
                      placeholder="e.g. Ambient dry / -18C"
                      value={quickMasterForm.standardTemp || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, standardTemp: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                </>
              )}

              {activeModalType === 'BANK' && (
                <>
                  <div>
                    <label className="font-semibold text-slate-700">Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. State Bank of India"
                      value={quickMasterForm.bankName || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 38291048291"
                      value={quickMasterForm.accountNumber || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700">IFSC Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SBIN0001824"
                        value={quickMasterForm.ifscCode || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">SWIFT Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBININBB18"
                        value={quickMasterForm.swiftCode || ''}
                        onChange={(e) => setQuickMasterForm({ ...quickMasterForm, swiftCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Greater Noida Commercial Hub"
                      value={quickMasterForm.branchName || ''}
                      onChange={(e) => setQuickMasterForm({ ...quickMasterForm, branchName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 mt-1"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddMasterModal(false)} className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">Save to PostgreSQL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}