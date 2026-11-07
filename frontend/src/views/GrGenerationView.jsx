import React, { useState, useEffect, useMemo } from 'react';
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
import api from '../services/api.js';

export default function GrGenerationView({
  jobs = [],
  initialGrData = null,
  onClearInitialGr,
  onUpdateContainerGR,
  onNavigateToTripPendency,
  onNavigateToGrSearching,
  onSave
}) {
  const todayDateStr = new Date().toISOString().split('T')[0];

  const [liveContainers, setLiveContainers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Extract containers from DB pending list + jobs with fallback presets
  const containerOptions = React.useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. First add real containers fetched from DB
    (liveContainers || []).forEach((c) => {
      const cNo = c.cont_no || c.contNo;
      if (cNo && !seen.has(cNo.toUpperCase())) {
        seen.add(cNo.toUpperCase());
        list.push({
          contNo: cNo,
          displayLabel: c.display_label || `${cNo} - ${c.jo_no || 'JO'}`,
          size: String(c.size || '40'),
          type: String(c.type || 'HC'),
          weight: String(c.weight || '24500'),
          joNo: String(c.jo_no || ''),
          joDate: c.jo_date || todayDateStr,
          consignor: c.consignor || 'Fair Exports (India) Pvt Ltd',
          consignee: c.consignee || 'ASIAN PERAL MYANMAR CO. LTD.',
          fromLocation: c.from_location || 'TRANSWORLD-DADRI',
          toLocation: c.to_location || 'ADANI-PATLI',
          transporter: c.transporter || 'AJINKYA TRANSPORT',
          vehicleNo: c.vehicle_no || '',
          commodity: c.commodity || 'FROZEN BUFFALO BONELESS MEAT',
          handoverLocation: c.handover_location || 'ADANI-PATLI',
          grNo: c.gr_no || ''
        });
      }
    });

    // 2. Add containers from parent jobs prop if not already listed
    (jobs || []).forEach((job) => {
      (job.containers || []).forEach((c) => {
        const cNo = c.no || c.contNo || c.containerNo || c.container_number;
        if (cNo && cNo !== 'TBA' && !seen.has(cNo.toUpperCase())) {
          seen.add(cNo.toUpperCase());
          list.push({
            contNo: cNo,
            displayLabel: `${cNo} - ${job.id || job.joNo || job.jobNumber || ''}`,
            size: c.size || (c.sizeType?.includes('20') ? '20' : '40') || '40',
            type: c.type || (c.sizeType?.includes('GP') ? 'GP' : 'HC') || 'HC',
            weight: String(c.cargoWeight || c.weight || c.cargo_weight || '24500'),
            joNo: job.id || job.joNo || job.jobNumber || job.job_number || '',
            joDate: job.date || job.joDate || (job.createdAt ? job.createdAt.split('T')[0] : '') || todayDateStr,
            consignor: job.customer || job.consignor || job.customerName || job.customer_name || '',
            consignee: job.consignee || job.consigneeName || job.consignee_name || '',
            fromLocation: job.fromLocation || job.origin || job.origin_port_name || '',
            toLocation: job.toLocation || job.pod || job.pod_port_name || '',
            transporter: job.transporter || 'AJINKYA TRANSPORT',
            vehicleNo: (c.truck && c.truck !== 'TBA' ? c.truck : '') || c.vehicleNo || c.truck_number || '',
            commodity: job.commodity || 'FROZEN BUFFALO BONELESS MEAT',
            handoverLocation: job.handoverLocation || 'ADANI-PATLI',
            grNo: c.gr || c.grNo || c.gr_number || ''
          });
        }
      });
    });

    return list;
  }, [liveContainers, jobs, todayDateStr]);

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
    workshop: '',
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

  // Sync form when opening an existing GR from GR Searching
  useEffect(() => {
    if (initialGrData && (initialGrData.gr_no || initialGrData.grNo)) {
      setForm({
        contNo: initialGrData.cont_no || initialGrData.contNo || '',
        size: String(initialGrData.cont_size || initialGrData.size || '40'),
        type: String(initialGrData.cont_type || initialGrData.type || 'HC'),
        weight: String(initialGrData.weight || '24500'),
        commodity: initialGrData.commodity || 'FROZEN BUFFALO BONELESS MEAT',
        joNo: String(initialGrData.jo_no || initialGrData.joNo || ''),
        joDate: initialGrData.jo_date || initialGrData.joDate || todayDateStr,
        grNo: String(initialGrData.gr_no || initialGrData.grNo || ''),
        grDate: initialGrData.gr_date_iso || initialGrData.gr_date || todayDateStr,
        cGr: String(initialGrData.c_gr || initialGrData.cGr || ''),
        consignor: initialGrData.customer || initialGrData.consignor || '',
        consignee: initialGrData.consignee || 'ASIAN PERAL MYANMAR CO. LTD.',
        transporter: initialGrData.transporter || 'AJINKYA TRANSPORT',
        fromLocation: initialGrData.from_location || initialGrData.fromLocation || '',
        toLocation: initialGrData.to_location || initialGrData.toLocation || '',
        handoverLocation: initialGrData.factory_location || initialGrData.handoverLocation || '',
        vehicleNo: initialGrData.vehicle_no || initialGrData.vehicleNo || '',
        driver: initialGrData.driver_name || initialGrData.driver || '',
        driverContactNo: initialGrData.driver_mobile || initialGrData.driverContactNo || '',
        licenseValidity: initialGrData.license_validity || initialGrData.licenseValidity || '',
        workshop: initialGrData.workshop || '',
        joFor: initialGrData.jo_for || 'Shifting',
        surveyBy: initialGrData.survey_by || '',
        vehicleType: initialGrData.vh_type || initialGrData.vehicleType || 'T40',
        oilVendor: initialGrData.oil_vendor || initialGrData.oilVendor || '',
        slipNo: initialGrData.slip_no || initialGrData.slipNo || '',
        remarks: initialGrData.remarks || initialGrData.gr_remark || '',
        cash: String(initialGrData.advance || initialGrData.cash || '0'),
        oil: String(initialGrData.oil_advance || initialGrData.oil || '0'),
        others: String(initialGrData.other_advance || initialGrData.others || '0'),
        balance: '0',
        total: String((parseFloat(initialGrData.advance || initialGrData.cash) || 0) + (parseFloat(initialGrData.oil_advance || initialGrData.oil) || 0) + (parseFloat(initialGrData.other_advance || initialGrData.others) || 0)),
        otherAdvance: '',
        grId: String(initialGrData.gr_id || initialGrData.grId || '')
      });
      setIsEditing(true);
      setSuccessMessage(`Viewing details for Goods Receipt #${initialGrData.gr_no || initialGrData.grNo}`);
    }
  }, [initialGrData, todayDateStr]);

  const handleResetToNew = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setFormError('');
    setSuccessMessage('');
    if (onClearInitialGr) onClearInitialGr();
  };

  const handleCancelGR = async () => {
    if (!form.grNo && !form.grId) {
      setFormError('No Goods Receipt selected to cancel.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to CANCEL Goods Receipt #${form.grNo || form.grId}?\n\nThis will mark the GR as cancelled and release Container ${form.contNo || ''} back to the Pending list.`
    );
    if (!confirmed) return;

    try {
      const res = await api.cancelGR({
        grId: form.grId,
        grNo: form.grNo,
        contNo: form.contNo
      });
      if (res && res.success) {
        setSuccessMessage(`✓ Goods Receipt #${form.grNo || form.grId} has been successfully CANCELLED.`);
        setIsEditing(false);
        if (api.getPendingGrContainers) {
          api.getPendingGrContainers().then((r) => {
            if (r?.data) setLiveContainers(r.data);
          });
        }
      } else {
        setFormError(res?.message || 'Failed to cancel Goods Receipt.');
      }
    } catch (err) {
      setFormError(err.message || 'Error communicating with server.');
    }
  };

  const handleUpdateGR = async () => {
    setFormError('');
    setSuccessMessage('');
    if (!form.driver.trim()) {
      setFormError('Please provide Driver Name (Required).');
      return;
    }

    try {
      const res = await api.updateGR(form);
      if (res && res.success) {
        setSuccessMessage(`✓ Goods Receipt #${form.grNo || form.grId} updated successfully!`);
      } else {
        setFormError(res?.message || 'Failed to update Goods Receipt.');
      }
    } catch (err) {
      setFormError(err.message || 'Error updating GR.');
    }
  };

  // Dropdown presets for inputs with dropdown
  const vehicleBadges = [
    { truckNo: 'HR47D5200', driverName: 'AAFTAB', driverMobile: '8800710980', licenseValidity: '2026-12-31', type: 'T40' },
    { truckNo: 'HR55AN2094', driverName: 'Ramesh Kumar', driverMobile: '9876543210', licenseValidity: '2028-04-15', type: 'T40' },
    { truckNo: 'UP16BT4820', driverName: 'Suresh Yadav', driverMobile: '9811223344', licenseValidity: '2027-09-30', type: 'T40' },
    { truckNo: 'NL01AD8941', driverName: 'Balwant Singh', driverMobile: '9711882233', licenseValidity: '2026-12-31', type: 'T20' },
    { truckNo: 'MH46AR7712', driverName: 'Mohd. Irfan', driverMobile: '9955443322', licenseValidity: '2029-01-20', type: 'T40' }
  ];
  const workshopPresets = ['EICHER', 'ASHOK LEYLAND', 'MAHINDRA', 'PVT', 'TATA MOTORS', 'SPJ IN-HOUSE YARD (DADRI)'];
  const joForPresets = ['Shifting', 'Factory Stuffing', 'Port Delivery / Gate-in', 'Empty Pickup / Return', 'Maintenance', 'Repair', 'Recall'];
  const vehicleTypePresets = ['T40', 'T20', '40ft Multi-Axle Trailer', '20ft Skeletal Trailer', 'Heavy Duty Low-Bed'];
  
  const driverPresets = [
    { name: 'AAFTAB', phone: '8800710980', license: '2026-12-31', vehicle: 'HR47D5200' },
    { name: 'Ramesh Kumar', phone: '9876543210', license: '2028-04-15', vehicle: 'HR55AN2094' },
    { name: 'Suresh Yadav', phone: '9811223344', license: '2027-09-30', vehicle: 'UP16BT4820' },
    { name: 'Balwant Singh', phone: '9711882233', license: '2026-12-31', vehicle: 'NL01AD8941' },
    { name: 'Mohd. Irfan', phone: '9955443322', license: '2029-01-20', vehicle: 'MH46AR7712' }
  ];

  const oilVendorPresets = [
    'RAGHUNANDAN PRASAD AND SONS',
    'BP PUMP PADGHA',
    'GANGA SHREE PETROLEUM',
    'HINDUSTAN DOCKYARD PVT. LTD.'
  ];

  // Default location presets aligned with SPJ operational data
  const defaultFromLocations = [
    'TRANSWORLD-DADRI',
    'ALBATROSS',
    'ADANI-PATLI',
    'DADRI-CONCOR',
    'DADRI-ALLCARGO',
    'DADRI-CMA-CGM',
    'KANPUR-JRY',
    'KANPUR-PANKI',
    'NHAVA SHEVA',
    'NHAVA SHEVA-DELHI',
    'NHAVA SHEVA MH',
    'ICD PALWAL',
    'ICD KHURJA',
    'ICD TUGHLAKABAD',
    'PIPAVAV',
    'MUNDRA',
    'HAZIRA',
    'KOLKATA',
    'SONIPAT',
    'SILIGURI',
    'CHENNAI',
    'TUTUCORIN'
  ];

  const defaultToLocations = [
    'DASNA',
    'UNNAO',
    'BAREILLY',
    'DERABASSI',
    'ALIGARH',
    'AGRA',
    'NUH',
    'BIHAR',
    'BIHAR (ARARIA)',
    'SAHIBABAD',
    'SAMBHAL',
    'CONCOR',
    'TALOJA',
    'KHURJA',
    'VASHI',
    'SAHARANPUR',
    'MEERUT',
    'HAPUR',
    'KAIRANA',
    'GOA',
    'RAMPUR',
    'JHANSI',
    'PALWAL',
    'SASNI',
    'KASHIPUR',
    'KOLKATA',
    'MUMBAI',
    'LUDHIANA',
    'AMRITSAR'
  ];

  const defaultHandoverLocations = [
    'ADANI-PATLI',
    'TRANSWORLD-DADRI',
    'ALBATROSS',
    'DADRI-CONCOR',
    'DADRI-ALLCARGO',
    'DADRI-CMA-CGM',
    'NHAVA SHEVA',
    'NHAVA SHEVA-DELHI',
    'KANPUR-JRY',
    'KANPUR-PANKI',
    'ICD PALWAL',
    'ICD KHURJA',
    'ICD TUGHLAKABAD',
    'PIPAVAV',
    'MUNDRA',
    'HAZIRA',
    'KOLKATA',
    'CHENNAI',
    'TUTUCORIN'
  ];

  const locationPresets = defaultHandoverLocations;

  const transporterPresets = [
    'AJINKYA TRANSPORT',
    'SPJ Fleet Logistics',
    'Dadri Express Logistics',
    'Transworld Logistics',
    'CONCOR Multimodal Logistics',
    'Adani Logistics',
    'Navkar Corporation Ltd'
  ];

  const consignorPresets = [
    'Fair Exports (India) Pvt Ltd',
    'Marhaba Frozen Foods',
    'Allanasons Private Limited',
    'Al Sameer Exports Pvt Ltd',
    'Deepmala Foods',
    'Deccan Edibles Pvt Ltd',
    'SPJ CARGO PVT LTD.'
  ];

  const consigneePresets = [
    'ASIAN PERAL MYANMAR CO. LTD.',
    'Al Maya Trading LLC (Dubai, UAE)',
    'EuroMeat B.V. (Rotterdam, Netherlands)',
    'Al-Shaikh Trading Co. (Jeddah, KSA)',
    'Gulf Import Corp (Dammam, KSA)'
  ];

  // Dynamic fleet lists fetched from DB API with fallback presets
  const [liveDrivers, setLiveDrivers] = useState(driverPresets);
  const [liveVehicles, setLiveVehicles] = useState(vehicleBadges);
  const [liveOilVendors, setLiveOilVendors] = useState(oilVendorPresets);
  const [liveWorkshops, setLiveWorkshops] = useState(workshopPresets);
  const [liveConsignors, setLiveConsignors] = useState(consignorPresets);
  const [liveConsignees, setLiveConsignees] = useState(consigneePresets);
  const [liveTransporters, setLiveTransporters] = useState(transporterPresets);
  const [fromLocationList, setFromLocationList] = useState(defaultFromLocations);
  const [toLocationList, setToLocationList] = useState(defaultToLocations);
  const [handoverLocationList, setHandoverLocationList] = useState(defaultHandoverLocations);

  useEffect(() => {
    let isMounted = true;

    // 1. Pending Containers from DB
    if (api.getPendingGrContainers) {
      api.getPendingGrContainers()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveContainers(res.data);
          }
        })
        .catch((err) => console.warn('Could not fetch pending GR containers from API:', err));
    }

    // 2. Drivers from DB
    api.getDrivers()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          setLiveDrivers(
            res.data.map((d) => ({
              name: d.name,
              phone: d.mobile || '',
              license: d.validity || '',
              vehicle: d.vehicle || ''
            }))
          );
        }
      })
      .catch((err) => console.warn('Could not fetch drivers from API:', err));

    // 3. Vehicles from DB
    api.getVehicles()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          const list = res.data.map((v) => ({
            truckNo: v.truck_no,
            driverName: v.driver_name || '',
            driverMobile: v.driver_mobile || '',
            licenseValidity: v.license_validity || '',
            type: v.type || 'T40',
            model: v.model || 'Trailer'
          })).filter((v) => Boolean(v.truckNo));
          if (list.length > 0) setLiveVehicles(list);
        }
      })
      .catch((err) => console.warn('Could not fetch vehicles from API:', err));

    // 4. Oil Vendors from DB
    if (api.getOilVendors) {
      api.getOilVendors()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveOilVendors(res.data.map((v) => v.name || v));
          }
        })
        .catch((err) => console.warn('Could not fetch oil vendors:', err));
    }

    // 5. Workshops from DB
    if (api.getWorkshops) {
      api.getWorkshops()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveWorkshops(res.data.map((w) => w.name || w));
          }
        })
        .catch((err) => console.warn('Could not fetch workshops:', err));
    }

    // 6. Categorized Locations from DB (FLEET_GR_MAPPING & TERMINAL_MASTER)
    if (api.getLocations) {
      api.getLocations()
        .then((res) => {
          if (isMounted && res?.data) {
            if (res.data.fromLocations && res.data.fromLocations.length > 0) {
              setFromLocationList(res.data.fromLocations);
            }
            if (res.data.toLocations && res.data.toLocations.length > 0) {
              setToLocationList(res.data.toLocations);
            }
            if (res.data.handoverLocations && res.data.handoverLocations.length > 0) {
              setHandoverLocationList(res.data.handoverLocations);
            }
          }
        })
        .catch((err) => console.warn('Could not fetch locations from API:', err));
    }

    // 7. Consignors from DB
    if (api.getConsignors) {
      api.getConsignors()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveConsignors(res.data);
          }
        })
        .catch((err) => console.warn('Could not fetch consignors from API:', err));
    }

    // 8. Consignees from DB
    if (api.getConsignees) {
      api.getConsignees()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveConsignees(res.data);
          }
        })
        .catch((err) => console.warn('Could not fetch consignees from API:', err));
    }

    // 9. Transporters from DB
    if (api.getTransporters) {
      api.getTransporters()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveTransporters(res.data);
          }
        })
        .catch((err) => console.warn('Could not fetch transporters from API:', err));
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const commodityList = [
    'FROZEN BUFFALO BONELSS MEAT',
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
    const matched = containerOptions.find(
      (c) => c.contNo?.toUpperCase() === selectedContNo?.toUpperCase()
    );
    if (matched) {
      setForm((prev) => ({
        ...prev,
        contNo: matched.contNo,
        size: matched.size || prev.size,
        type: matched.type || prev.type,
        weight: matched.weight || prev.weight,
        joNo: matched.joNo || prev.joNo,
        joDate: matched.joDate || prev.joDate || todayDateStr,
        grNo: matched.grNo || prev.grNo || `GR-2026-${String(matched.contNo ? matched.contNo.slice(-4) : Math.floor(1000 + Math.random() * 9000))}`,
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

  // Vehicle change auto-fills driver, contact, license validity, and vehicle type (aligned with SPJ 2 LogiPark)
  const handleVehicleChange = (truckNo) => {
    setFormError('');
    setForm((prev) => {
      const updated = { ...prev, vehicleNo: truckNo };
      const v = (liveVehicles || []).find(
        (item) => (item.truckNo || item) === truckNo
      );
      if (v && typeof v === 'object') {
        if (v.driverName) {
          updated.driver = v.driverName;
          updated.driverContactNo = v.driverMobile || '';
          updated.licenseValidity = v.licenseValidity || '';
        } else {
          // Check if any driver has this vehicle assigned
          const matchedDriver = (liveDrivers || []).find(
            (d) => d.vehicle && d.vehicle.toUpperCase() === truckNo.toUpperCase()
          );
          if (matchedDriver) {
            updated.driver = matchedDriver.name;
            updated.driverContactNo = matchedDriver.phone || '';
            updated.licenseValidity = matchedDriver.license || '';
          }
        }
        if (v.type) {
          updated.vehicleType = v.type;
        }
      }
      return updated;
    });
  };

  // Driver change auto-fills contact, license validity, and vehicle if mapped (aligned with SPJ 2 LogiPark)
  const handleDriverChange = (driverName) => {
    setFormError('');
    const matchedDriver = (liveDrivers || []).find(
      (d) => d.name.toLowerCase() === driverName.toLowerCase()
    );
    if (matchedDriver) {
      setForm((prev) => ({
        ...prev,
        driver: matchedDriver.name,
        driverContactNo: matchedDriver.phone || prev.driverContactNo,
        licenseValidity: matchedDriver.license || prev.licenseValidity,
        vehicleNo: matchedDriver.vehicle || prev.vehicleNo
      }));
    } else {
      setForm((prev) => ({ ...prev, driver: driverName }));
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

    // Validations: Cont No, Driver, Commodity (Oil Vendor is optional)
    if (!form.contNo) {
      setFormError('Please select or specify Cont No (Required).');
      return;
    }
    if (!form.driver.trim()) {
      setFormError('Please provide Driver Name (Required).');
      return;
    }
    if (!form.commodity.trim()) {
      setFormError('Please provide Commodity (Required).');
      return;
    }

    const grPayload = {
      containerId: form.contNo,
      contNo: form.contNo,
      truckNo: form.vehicleNo,
      vehicleNo: form.vehicleNo,
      driverName: form.driver,
      driver: form.driver,
      driverMobile: form.driverContactNo,
      driverContactNo: form.driverContactNo,
      grNo: form.grNo,
      grDate: form.grDate || todayDateStr,
      cGr: form.cGr,
      consignor: form.consignor,
      consignee: form.consignee,
      transporter: form.transporter,
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      handoverLocation: form.handoverLocation,
      licenseValidity: form.licenseValidity,
      workshop: form.workshop,
      joFor: form.joFor,
      surveyBy: form.surveyBy,
      vehicleType: form.vehicleType,
      oilVendor: form.oilVendor,
      slipNo: form.slipNo,
      remarks: form.remarks,
      cash: form.cash,
      advance: form.cash,
      oil: form.oil,
      oilAdvance: form.oil,
      others: form.others,
      otherAdvance: form.others,
      total: form.total,
      commodity: form.commodity,
      size: form.size,
      type: form.type,
      weight: form.weight,
      joNo: form.joNo,
      joDate: form.joDate
    };

    if (api.generateGR) {
      api.generateGR(grPayload).then(res => {
        if (res?.grNumber) {
          setForm(prev => ({ ...prev, grNo: res.grNumber }));
        }
      }).catch(e => console.warn('generateGR API error:', e));
    }

    if (onUpdateContainerGR) {
      onUpdateContainerGR(grPayload);
    }

    if (onSave) {
      onSave(grPayload);
    }

    setSuccessMessage(`✓ Goods Receipt ${form.grNo ? form.grNo + ' ' : ''}saved successfully with complete advance & routing!`);
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

      {/* Edit & Cancellation Mode Banner */}
      {isEditing && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 font-black text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
              GR
            </span>
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Goods Receipt #{form.grNo || form.grId}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  Edit &amp; Cancellation Active
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Truck: <strong className="font-mono text-slate-800">{form.vehicleNo || 'N/A'}</strong> &bull; Container: <strong className="font-mono text-slate-800">{form.contNo || 'N/A'}</strong> &bull; Driver: <strong className="text-slate-800">{form.driver || 'N/A'}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelGR}
              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-black text-xs border border-rose-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="Cancel this Goods Receipt and release container back to pending"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cancel this GR</span>
            </button>

            <button
              type="button"
              onClick={handleResetToNew}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition cursor-pointer"
            >
              + Create New GR
            </button>
          </div>
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
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select Container ({containerOptions.length} Pending) --</option>
                {containerOptions.map((c) => (
                  <option key={c.contNo} value={c.contNo}>
                    {c.displayLabel || `${c.contNo} - ${c.joNo || 'JO'}`} ({c.size}{c.type || ''} • {c.consignor ? c.consignor.slice(0, 20) : 'Standard'})
                  </option>
                ))}
                {form.contNo && !containerOptions.some(c => c.contNo === form.contNo) && (
                  <option value={form.contNo}>{form.contNo}</option>
                )}
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
              <select
                value={form.consignor}
                onChange={(e) => setForm({ ...form, consignor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select Consignor --</option>
                {liveConsignors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {form.consignor && !liveConsignors.includes(form.consignor) && (
                  <option value={form.consignor}>{form.consignor}</option>
                )}
              </select>
            </div>

            {/* Consignee */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Consignee
              </label>
              <select
                value={form.consignee}
                onChange={(e) => setForm({ ...form, consignee: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select Consignee --</option>
                {liveConsignees.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {form.consignee && !liveConsignees.includes(form.consignee) && (
                  <option value={form.consignee}>{form.consignee}</option>
                )}
              </select>
            </div>

            {/* Transporter */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Transporter
              </label>
              <select
                value={form.transporter}
                onChange={(e) => setForm({ ...form, transporter: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select Transporter --</option>
                {liveTransporters.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                {form.transporter && !liveTransporters.includes(form.transporter) && (
                  <option value={form.transporter}>{form.transporter}</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-100">
            {/* From Location */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                From Location
              </label>
              <select
                value={form.fromLocation}
                onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select From Location --</option>
                {fromLocationList.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                {form.fromLocation && !fromLocationList.includes(form.fromLocation) && (
                  <option value={form.fromLocation}>{form.fromLocation}</option>
                )}
              </select>
            </div>

            {/* To Location */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                To Location
              </label>
              <select
                value={form.toLocation}
                onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select To Location --</option>
                {toLocationList.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                {form.toLocation && !toLocationList.includes(form.toLocation) && (
                  <option value={form.toLocation}>{form.toLocation}</option>
                )}
              </select>
            </div>

            {/* Handover Location */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Handover Location
              </label>
              <select
                value={form.handoverLocation}
                onChange={(e) => setForm({ ...form, handoverLocation: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select Handover Location --</option>
                {handoverLocationList.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                {form.handoverLocation && !handoverLocationList.includes(form.handoverLocation) && (
                  <option value={form.handoverLocation}>{form.handoverLocation}</option>
                )}
              </select>
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
            {/* Vehicle No (Dropdown Selector with Auto-Fill Driver, Contact & License) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Vehicle No
              </label>
              <select
                value={form.vehicleNo}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- SELECT VEHICLE NO --</option>
                {liveVehicles.map((v) => {
                  const tNo = typeof v === 'object' ? v.truckNo : v;
                  return (
                    <option key={tNo} value={tNo}>
                      {tNo}
                    </option>
                  );
                })}
                {form.vehicleNo && !liveVehicles.some(v => (v.truckNo || v) === form.vehicleNo) && (
                  <option value={form.vehicleNo}>{form.vehicleNo}</option>
                )}
              </select>
            </div>

            {/* Driver (Dropdown Selector with Auto-Fill Contact & License, Required *) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Driver <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.driver}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all truncate"
              >
                <option value="">-- Select Driver --</option>
                {liveDrivers.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
                {form.driver && !liveDrivers.some(d => d.name === form.driver) && (
                  <option value={form.driver}>{form.driver}</option>
                )}
              </select>
            </div>

            {/* Driver Contact No */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Driver Contact No {form.driver && form.driverContactNo && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
              </label>
              <input
                type="text"
                placeholder="10-digit Mobile No"
                value={form.driverContactNo}
                onChange={(e) => setForm({ ...form, driverContactNo: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* License Validity */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                License Validity {form.driver && form.licenseValidity && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
              </label>
              <input
                type="date"
                value={form.licenseValidity}
                onChange={(e) => setForm({ ...form, licenseValidity: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Row 2: Workshop, Jo For, Survey By, Vehicle Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1.5 border-t border-slate-100">
            {/* Workshop (Dropdown with live DB list) */}
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
                {liveWorkshops.map((w) => {
                  const val = typeof w === 'object' ? w.name : w;
                  return <option key={val} value={val}>{val}</option>;
                })}
                {form.workshop && !liveWorkshops.map(w => typeof w === 'object' ? w.name : w).includes(form.workshop) && (
                  <option value={form.workshop}>{form.workshop}</option>
                )}
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
            {/* Oil Vendor (Optional) */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Oil Vendor
              </label>
              <select
                value={form.oilVendor}
                onChange={(e) => setForm({ ...form, oilVendor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
              >
                <option value="">---Select Oil Vendor---</option>
                {liveOilVendors.map((ov) => {
                  const val = typeof ov === 'object' ? ov.name : ov;
                  return <option key={val} value={val}>{val}</option>;
                })}
                {form.oilVendor && !liveOilVendors.map(ov => typeof ov === 'object' ? ov.name : ov).includes(form.oilVendor) && (
                  <option value={form.oilVendor}>{form.oilVendor}</option>
                )}
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
            * Fields marked with red asterisk are mandatory
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelGR}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-black text-xs border border-rose-300 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Cancel GR</span>
                </button>

                <button
                  type="button"
                  onClick={handleUpdateGR}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update GR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Generate GR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
