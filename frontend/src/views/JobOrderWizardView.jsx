import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import defaultSchedulesData from '../data/panvayaDefaultSchedules.json';
import defaultCommodities from '../data/defaultCommodities.json';
import {
  Building2,
  MapPin,
  Ship,
  PlusCircle,
  Search,
  History,
  Copy,
  ChevronRight,
  AlertCircle,
  Save,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Zap,
  Clipboard,
  UploadCloud,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Calendar,
  Anchor,
  Clock,
  Route,
  Box,
  Layers
} from 'lucide-react';

export default function JobOrderWizardView({
  parties,
  jobs = [],
  commodities = [],
  onOpenQuickAddShipper,
  onCreateJob,
  onSelectJob,
  onOpenShipmentStatus,
  openRecentDirectly = false,
  onResetRecentDirectly,
  copilotFillData = null,
  onResetCopilotFill,
  copilotClearTrigger = 0
}) {
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayDateStr();

  const [liveConsignors, setLiveConsignors] = useState([]);
  const [liveConsignees, setLiveConsignees] = useState([]);
  const [liveTransporters, setLiveTransporters] = useState([]);

  // Dynamic Shippers from Local PostgreSQL (falls back to defaults)
  const shippersList = useMemo(() => {
    if (liveConsignors.length > 0) return liveConsignors;
    if (parties && parties.length > 0) {
      const list = parties
        .filter(p => !p.type || p.type === 'SHIPPER' || p.type === 'FORWARDER')
        .map(p => p.name);
      if (list.length > 0) return list;
    }
    return [
      'Fair Exports (India) Pvt Ltd',
      'SPJ CARGO PVT LTD.',
      'HMA FOOD EXPORT PVT LTD',
      'HMA AGRO INDUSTRIES LTD',
      'Marhaba Frozen Foods',
      'Allanasons Private Limited',
      'Al Sameer Exports Pvt Ltd',
      'Deepmala Foods',
      'Deccan Edibles Pvt Ltd'
    ];
  }, [liveConsignors, parties]);

  const consigneesList = useMemo(() => {
    if (liveConsignees.length > 0) return liveConsignees;
    if (parties && parties.length > 0) {
      const list = parties
        .filter(p => p.type === 'CONSIGNEE')
        .map(p => p.name);
      if (list.length > 0) return list;
    }
    return [
      'FAIR EXPORTS (INDIA) PVT LTD',
      'HMA AGRO INDUSTRIES LTD',
      'IFF INDIA FROZEN FOODS PRIVATE LIMITED',
      'RUSTAM FOODS PVT.LTD.',
      'MARHABA FROZEN FOODS',
      'AL AMMAR FROZEN FOOD EXPORTS PVT LTD',
      'AL-NASIR EXPORTS PVT LTD',
      'INTERNATIONAL AGRO FOODS',
      'INDIA FROZEN FOODS',
      'ASIAN PERAL MYANMAR CO. LTD.',
      'Al Maya Trading LLC (Dubai, UAE)'
    ];
  }, [liveConsignees, parties]);

  const transportersList = useMemo(() => {
    if (liveTransporters.length > 0) return liveTransporters;
    if (parties && parties.length > 0) {
      const list = parties
        .filter(p => !p.type || p.type === 'TRANSPORTER' || p.type === 'VENDOR' || p.type === 'FORWARDER')
        .map(p => p.name);
      if (list.length > 0) return list;
    }
    return [
      'AJINKYA TRANSPORT',
      'SPJ CARGO PVT. LTD',
      'S.J. CARGO MOVERS',
      'Shipper\'s Transportation',
      'GREEN INDIA CARGO MOVERS',
      'CONSIGNEE TRANSPORT',
      'ASHIRVAD TRANSPORT',
      'AVINASH CARGO PVT LTD',
      'CONCOR CORPORTATION'
    ];
  }, [liveTransporters, parties]);

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

  const [fromLocationList, setFromLocationList] = useState(defaultFromLocations);
  const [toLocationList, setToLocationList] = useState(defaultToLocations);
  const [handoverLocationList, setHandoverLocationList] = useState(defaultHandoverLocations);

  useEffect(() => {
    let isMounted = true;
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

    if (api.getConsignors) {
      api.getConsignors()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveConsignors(res.data);
          }
        })
        .catch((err) => console.warn('Could not fetch consignors:', err));
    }

    if (api.getConsignees) {
      api.getConsignees()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveConsignees(res.data);
          }
        })
        .catch((err) => console.warn('Could not fetch consignees:', err));
    }

    if (api.getTransporters) {
      api.getTransporters()
        .then((res) => {
          if (isMounted && res?.data && res.data.length > 0) {
            setLiveTransporters(res.data);
          }
        })
        .catch((err) => console.warn('Could not fetch transporters:', err));
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const locationList = Array.from(new Set([...fromLocationList, ...toLocationList, ...handoverLocationList]));

  const chaList = useMemo(() => {
    if (parties && parties.length > 0) {
      const list = parties
        .filter(p => p.type === 'CHA' || p.type === 'FORWARDER')
        .map(p => p.name);
      if (list.length > 0) return list;
    }
    return [
      'Jeena & Company (CHA)',
      'DHL Global Forwarding (CHA)',
      'Total Logistics (CHA)',
      'Fair Clear Services (CHA)'
    ];
  }, [parties]);

  const linesList = [
    'ABM AVIATION AND LOGISTICS LLP',
    'Maersk Line India Pvt Ltd',
    'Mediterranean Shipping Co (MSC)',
    'CMA CGM Agencies India',
    'Cosco Shipping Lines',
    'Ocean Network Express (ONE)',
    'Evergreen Shipping Agency',
    'Hapag-Lloyd India',
    'Wan Hai Lines',
    'KMTC Line',
    'Interasia Shipping Lines',
    'Arkas Container Transport',
    'Yang Ming Line',
    'ZIM Integrated Shipping',
    'Goodrich Maritime Pvt Ltd',
    'Navio Shipping Private Limited'
  ];

  const polList = [
    { code: 'INNSA1', shortCode: 'INNSA', name: 'Nhava Sheva - JNPT (INNSA1)', flag: '🇮🇳' },
    { code: 'INMUN1', shortCode: 'INMUN', name: 'Mundra Port (INMUN1)', flag: '🇮🇳' },
    { code: 'INPAV1', shortCode: 'INPAV', name: 'Pipavav Port (INPAV1)', flag: '🇮🇳' },
    { code: 'INHZR1', shortCode: 'INHZR', name: 'Hazira Port, Surat (INHZR1)', flag: '🇮🇳' },
    { code: 'INMAA1', shortCode: 'INMAA', name: 'Chennai Port (INMAA1)', flag: '🇮🇳' },
    { code: 'INTUT1', shortCode: 'INTUT', name: 'Tuticorin / VOC (INTUT1)', flag: '🇮🇳' },
    { code: 'INCOK1', shortCode: 'INCOK', name: 'Cochin / ICTT (INCOK1)', flag: '🇮🇳' },
    { code: 'INCCU1', shortCode: 'INCCU', name: 'Kolkata Port (INCCU1)', flag: '🇮🇳' },
    { code: 'INVTZ1', shortCode: 'INVTZ', name: 'Visakhapatnam (INVTZ1)', flag: '🇮🇳' },
    { code: 'INKAT1', shortCode: 'INKAT', name: 'Kattupalli Port (INKAT1)', flag: '🇮🇳' },
    { code: 'INIXY1', shortCode: 'INIXY', name: 'Kandla / Deendayal (INIXY1)', flag: '🇮🇳' },
    { code: 'INMRM1', shortCode: 'INMRM', name: 'Mormugao / Goa (INMRM1)', flag: '🇮🇳' }
  ];

  const podList = [
    { code: 'AEJEA', name: 'JEBEL ALI, UAE (AEJEA)', flag: '🇦🇪' },
    { code: 'USNYC', name: 'NEW YORK / NJ, USA (USNYC)', flag: '🇺🇸' },
    { code: 'NLRTM', name: 'ROTTERDAM, NETHERLANDS (NLRTM)', flag: '🇳🇱' },
    { code: 'SAJED', name: 'JEDDAH, SAUDI ARABIA (SAJED)', flag: '🇸🇦' },
    { code: 'SADMM', name: 'DAMMAM, SAUDI ARABIA (SADMM)', flag: '🇸🇦' },
    { code: 'SGSIN', name: 'SINGAPORE (SGSIN)', flag: '🇸🇬' },
    { code: 'DEHAM', name: 'HAMBURG, GERMANY (DEHAM)', flag: '🇩🇪' },
    { code: 'BEANR', name: 'ANTWERP, BELGIUM (BEANR)', flag: '🇧🇪' },
    { code: 'ITGOA', name: 'GENOA, ITALY (ITGOA)', flag: '🇮🇹' },
    { code: 'MYPKG', name: 'PORT KLANG, MALAYSIA (MYPKG)', flag: '🇲🇾' },
    { code: 'KRPUS', name: 'BUSAN, SOUTH KOREA (KRPUS)', flag: '🇰🇷' },
    { code: 'VNHPH', name: 'HAIPHONG, VIETNAM (VNHPH)', flag: '🇻🇳' },
    { code: 'EGALY', name: 'ALEXANDRIA, EGYPT (EGALY)', flag: '🇪🇬' },
    { code: 'TRMER', name: 'MERSIN, TURKEY (TRMER)', flag: '🇹🇷' },
    { code: 'GEPTI', name: 'POTI, GEORGIA (GEPTI)', flag: '🇬🇪' },
    { code: 'ROCND', name: 'CONSTANTA, ROMANIA (ROCND)', flag: '🇷🇴' },
    { code: 'GBFXT', name: 'FELIXSTOWE, UK (GBFXT)', flag: '🇬🇧' },
    { code: 'PLGDY', name: 'GDANSK, POLAND (PLGDY)', flag: '🇵🇱' },
    { code: 'IDJKT', name: 'JAKARTA, INDONESIA (IDJKT)', flag: '🇮🇩' },
    { code: 'GHNTM', name: 'TEMA, GHANA (GHNTM)', flag: '🇬🇭' },
    { code: 'LTKLJ', name: 'KLAIPEDA, LITHUANIA (LTKLJ)', flag: '🇱🇹' },
    { code: 'DJIBOUTI', name: 'DJIBOUTI (DJIBOUTI)', flag: '🇩🇯' }
  ];



  // Fresh Blank Form State
  const [form, setForm] = useState({
    joNo: `JO-2026-${String(jobs.length + 1).padStart(4, '0')}`,
    joDate: todayStr,
    joType: 'Export',
    modeOfShipment: 'SEA Export',
    servicesRequired: ['Transport', 'Clearance', 'Rail', 'Forwarding'],
    consignor: '',
    consignee: '',
    shippingLine: '',
    lineBookingNo: '',
    bookingDate: todayStr,
    bookingValidity: '',
    bookingReValidity: '',
    emptyPickupLocation: '',
    fromLocation: '',
    toLocation: '',
    pol: '',
    pod: '',
    vesselName: '',
    voyage: '',
    etdDate: '',
    etaDate: '',
    siCutDate: '',
    portCutDate: '',
    temperature: '',
    transporter: '',
    handoverLocation: '',
    chaName: '',
    onAccount: '',
    packageType: 'Cartons',
    cartons: '',
    cbm: '',
    fpod: '',
    hblNo: '',
    boeNo: '',
    noOfCont: 1,
    size: '',
    type: '',
    remarks: '',
    sellRate: '',
    buyRate: ''
  });

  // Blank Container Unit
  const [containers, setContainers] = useState([
    {
      sr: 1,
      contNo: '',
      size: '',
      type: '',
      tareWeight: '',
      cargoWeight: '',
      grossWeight: '',
      sealNo: '',
      agentSeal: '',
      vehicleNo: '',
      grNo: '',
      grDate: todayStr,
      remarks: ''
    }
  ]);

  const [formError, setFormError] = useState('');
  const [recentSearch, setRecentSearch] = useState('');
  const [showRecentModal, setShowRecentModal] = useState(openRecentDirectly);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [quickFillNotice, setQuickFillNotice] = useState('');

  // Active Sailing Schedules & Smart Auto-Fill Picker State
  const [showSailingPicker, setShowSailingPicker] = useState(false);
  const [sailingSearch, setSailingSearch] = useState('');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('ALL');
  const [routeFilterOnly, setRouteFilterOnly] = useState(true);
  const [autoFilledToast, setAutoFilledToast] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [isScheduleLocked, setIsScheduleLocked] = useState(false);

  // Dynamic Commodities from PostgreSQL Database (Instant fallback bundled)
  const [dbCommodities, setDbCommodities] = useState(() => (commodities && commodities.length > 0 ? commodities : defaultCommodities));
  useEffect(() => {
    if (commodities && commodities.length > 0) {
      setDbCommodities(commodities);
    } else {
      api.getCommodities().then(res => {
        if (res && res.data && res.data.length > 0) setDbCommodities(res.data);
      }).catch(() => {});
    }
  }, [commodities]);

  // Live Next Sequential Job Order Number from PostgreSQL Sequence
  useEffect(() => {
    api.getNextJoNo().then(res => {
      if (res && res.nextJoNo) {
        setForm(prev => {
          if (!prev.joNo || prev.joNo.startsWith('JO-2026-')) {
            return { ...prev, joNo: res.nextJoNo };
          }
          return prev;
        });
      }
    }).catch(() => {});
  }, []);

  // Clean, high-end enterprise input styling (No colored boxes / clean uniform border)
  const getFieldClass = () => {
    return 'bg-white border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all duration-150';
  };

  const allSailings = defaultSchedulesData?.sailings || [];

  // Match POL & POD helpers
  const cleanPolCode = (form.pol || 'INNSA1').slice(0, 5).toUpperCase();
  const cleanPodCode = (form.pod || '').trim().toUpperCase();

  const isPolMatch = (s) => {
    if (!form.pol) return true;
    const sPol = (s.originLocode || s.origin || '').toUpperCase();
    return sPol.startsWith(cleanPolCode);
  };

  const isPodMatch = (s) => {
    if (!cleanPodCode) return true;
    const sPod = (s.destinationLocode || s.destination || '').toUpperCase();
    return sPod.startsWith(cleanPodCode) || cleanPodCode.startsWith(sPod);
  };

  // Sailings strictly matching selected POL & POD
  const routeMatchingSailings = allSailings.filter(s => isPolMatch(s) && isPodMatch(s));

  // Determine active dataset: if routeFilterOnly is true and POD is selected, show route sailings;
  // if 0 route sailings found, user can toggle or it falls back cleanly
  const basePool = (routeFilterOnly && cleanPodCode && routeMatchingSailings.length > 0)
    ? routeMatchingSailings
    : (routeFilterOnly && cleanPodCode && routeMatchingSailings.length === 0)
      ? []
      : allSailings;

  const uniqueCarriers = ['ALL', ...Array.from(new Set(basePool.map(s => s.carrier).filter(Boolean)))];

  const mapCarrierToShippingLine = (carrier) => {
    if (!carrier) return '';
    const c = carrier.toUpperCase();
    if (c.includes('MAERSK')) return 'Maersk Line India Pvt Ltd';
    if (c.includes('MSC') || c.includes('MEDITERRANEAN')) return 'Mediterranean Shipping Co (MSC)';
    if (c.includes('CMA')) return 'CMA CGM Agencies India';
    if (c.includes('COSCO')) return 'Cosco Shipping Lines';
    if (c.includes('ONE') || c.includes('OCEAN NETWORK')) return 'Ocean Network Express (ONE)';
    if (c.includes('EVERGREEN')) return 'Evergreen Shipping Agency';
    if (c.includes('HAPAG')) return 'Hapag-Lloyd India';
    if (c.includes('WAN HAI')) return 'Wan Hai Lines';
    if (c.includes('KMTC')) return 'KMTC Line';
    if (c.includes('ARKAS')) return 'Arkas Container Transport';
    if (c.includes('YANG MING')) return 'Yang Ming Line';
    if (c.includes('ZIM')) return 'ZIM Integrated Shipping';
    return carrier;
  };

  const filteredSailings = basePool.filter(s => {
    const matchesCarrier = selectedCarrierFilter === 'ALL' || s.carrier === selectedCarrierFilter;
    const q = sailingSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      (s.vesselName && s.vesselName.toLowerCase().includes(q)) ||
      (s.voyageNo && s.voyageNo.toLowerCase().includes(q)) ||
      (s.carrier && s.carrier.toLowerCase().includes(q)) ||
      (s.service && s.service.toLowerCase().includes(q)) ||
      (s.destinationName && s.destinationName.toLowerCase().includes(q));
    return matchesCarrier && matchesSearch;
  });

  const handleSelectSailing = (sailing) => {
    const mappedLine = mapCarrierToShippingLine(sailing.carrier);
    const portCut = sailing.cutOffs?.containerYard ? sailing.cutOffs.containerYard.split(' ')[0] : (sailing.departure || '');
    const siCut = sailing.cutOffs?.shippingInstructions ? sailing.cutOffs.shippingInstructions.split(' ')[0] : portCut;
    const etd = sailing.departure || '';
    const eta = sailing.arrival || '';

    const sPol = sailing.originLocode || sailing.origin || '';
    const sPod = sailing.destinationLocode || sailing.destination || '';
    const matchedPol = polList.find(p => p.shortCode === sPol || p.code === sPol);

    setForm(prev => ({
      ...prev,
      shippingLine: mappedLine || prev.shippingLine,
      vesselName: sailing.vesselName || prev.vesselName,
      voyage: sailing.voyageNo || prev.voyage,
      etdDate: etd,
      etaDate: eta,
      portCutDate: portCut,
      siCutDate: siCut,
      pol: matchedPol ? matchedPol.code : prev.pol,
      pod: sPod || prev.pod
    }));

    setIsScheduleLocked(true);

    setAutoFilledFields({
      shippingLine: Boolean(mappedLine),
      vesselName: Boolean(sailing.vesselName),
      voyage: Boolean(sailing.voyageNo),
      etdDate: Boolean(etd),
      etaDate: Boolean(eta),
      portCutDate: Boolean(portCut),
      siCutDate: Boolean(siCut),
      pod: Boolean(sPod),
      pol: Boolean(matchedPol)
    });

    setFormError('');
    setShowSailingPicker(false);
    setAutoFilledToast(`⚡ Auto-filled: ${sailing.vesselName} (${sailing.voyageNo}) · ${mappedLine || sailing.carrier} · ETD & Cut-offs set! (Auto)`);
    setTimeout(() => setAutoFilledToast(null), 4500);
  };

  // When POD is selected, automatically open live vessel sailings list matching POL & POD
  const handlePodChange = (val) => {
    setFormError('');
    setForm(prev => ({ ...prev, pod: val }));
    if (val) {
      setRouteFilterOnly(true);
      setSelectedCarrierFilter('ALL');
      setSailingSearch('');
      setShowSailingPicker(true);
    }
  };

  // Multiple Equipment & Commercial Rates Lines ("+ button rakho taki multiple add krsake")
  const [equipmentLines, setEquipmentLines] = useState([
    { id: 1, noOfCont: 1, size: "" }
  ]);

  const syncContainersFromEquipment = (lines) => {
    const newContainers = [];
    let sr = 1;
    lines.forEach((l) => {
      const count = parseInt(l.noOfCont, 10) || 1;
      for (let i = 0; i < count; i++) {
        newContainers.push({
          sr: sr++,
          contNo: "",
          size: l.size || "40",
          type: l.size === "20" ? "GP" : "HC",
          tareWeight: l.size === "20" ? 2280 : 3820,
          cargoWeight: "",
          grossWeight: "",
          sealNo: "",
          vehicleNo: "",
          grNo: "",
          grDate: todayStr,
          remarks: ""
        });
      }
    });
    setContainers(newContainers);
    setForm(prev => ({
      ...prev,
      noOfCont: newContainers.length
    }));
  };

  const handleAddEquipmentLine = () => {
    const newLine = {
      id: Date.now(),
      noOfCont: 1,
      size: "20"
    };
    const updated = [...equipmentLines, newLine];
    setEquipmentLines(updated);
    syncContainersFromEquipment(updated);
  };

  const handleRemoveEquipmentLine = (id) => {
    if (equipmentLines.length <= 1) return;
    const updated = equipmentLines.filter(l => l.id !== id);
    setEquipmentLines(updated);
    syncContainersFromEquipment(updated);
  };

  const handleEquipmentLineChange = (idx, field, value) => {
    const updated = [...equipmentLines];
    updated[idx][field] = value;

    if (field === "commodity") {
      const matched = dbCommodities.find(c => c.name === value || c.code === value);
      if (matched) {
        if (matched.requires_reefer) {
          updated[idx].type = "RF";
          setForm(prev => ({
            ...prev,
            commodity: matched.name,
            temperature: matched.standard_temp || "-18°C"
          }));
        } else {
          updated[idx].type = "HC";
          setForm(prev => ({
            ...prev,
            commodity: matched.name,
            temperature: "Ambient"
          }));
        }
      } else {
        setForm(prev => ({ ...prev, commodity: value }));
      }
      syncContainersFromEquipment(updated);
    }

    setEquipmentLines(updated);
    if (field === "noOfCont" || field === "size" || field === "type") {
      syncContainersFromEquipment(updated);
    }
  };

  useEffect(() => {
    if (openRecentDirectly) {
      setShowRecentModal(true);
      if (onResetRecentDirectly) onResetRecentDirectly();
    }
  }, [openRecentDirectly]);

  // AI Copilot Live Form Fill Listener
  useEffect(() => {
    if (copilotFillData && copilotFillData.form) {
      setForm(prev => ({
        ...prev,
        ...copilotFillData.form
      }));
      if (copilotFillData.equipmentLines && copilotFillData.equipmentLines.length > 0) {
        setEquipmentLines(copilotFillData.equipmentLines);
        syncContainersFromEquipment(copilotFillData.equipmentLines);
      }
      setQuickFillNotice("✨ AI Copilot ne form live fill kar diya!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (onResetCopilotFill) onResetCopilotFill();
    }
  }, [copilotFillData]);

  useEffect(() => {
    if (copilotClearTrigger > 0) {
      handleClearForm();
    }
  }, [copilotClearTrigger]);

  // Handle Consignor change
  const handleConsignorChange = (shipperName) => {
    setFormError("");
    setForm(prev => ({ ...prev, consignor: shipperName }));
  };

  // ⚡ 1-Click Complete Auto-Fill
  const handleAutoFillSample = () => {
    setForm(prev => ({
      ...prev,
      joType: 'Export',
      modeOfShipment: 'SEA Export',
      consignor: shippersList[0] || 'Fair Exports (India) Pvt Ltd',
      consignee: 'ASIAN PERAL MYANMAR CO. LTD.',
      shippingLine: 'ABM AVIATION AND LOGISTICS LLP',
      lineBookingNo: 'BK-982104',
      bookingDate: todayStr,
      bookingValidity: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      bookingReValidity: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      emptyPickupLocation: 'TRANSWORLD-DADRI',
      fromLocation: 'TRANSWORLD-DADRI',
      toLocation: 'ADANI-PATLI',
      handoverLocation: 'ADANI-PATLI',
      pol: 'INNSA1',
      pod: 'AEJEA',
      vesselName: 'MAERSK COLOMBO',
      voyage: '2604W',
      etdDate: todayStr,
      etaDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      siCutDate: todayStr,
      portCutDate: todayStr,
      temperature: '-18°C',
      transporter: 'AJINKYA TRANSPORT',
      noOfCont: 1,
      size: '40',
      type: 'HC'
    }));
    setEquipmentLines([{ id: 1, noOfCont: 1, size: '40' }]);
    setContainers([
      {
        sr: 1,
        contNo: 'MSKU1234567',
        size: '40',
        type: 'HC',
        tareWeight: '3820',
        cargoWeight: '24500',
        grossWeight: '28320',
        sealNo: 'ML-IN-938210',
        vehicleNo: 'HR55AN2094',
        grNo: 'GR-2026-084',
        grDate: todayStr,
        remarks: ''
      }
    ]);
    setFormError('');
    setQuickFillNotice('⚡ Form Auto-Filled with complete booking details!');
    setTimeout(() => setQuickFillNotice(''), 3500);
  };

  // Clear Form for fresh blank entry
  const handleClearForm = () => {
    const today = getTodayDateStr();
    setForm({
      joNo: `JO-2026-${String(jobs.length + 1).padStart(4, '0')}`,
      joDate: today,
      joType: 'Export',
      modeOfShipment: 'SEA Export',
      servicesRequired: ['Transport', 'Clearance', 'Rail', 'Forwarding'],
      consignor: '',
      consignee: '',
      shippingLine: '',
      lineBookingNo: '',
      bookingDate: today,
      bookingValidity: '',
      bookingReValidity: '',
      emptyPickupLocation: '',
      fromLocation: '',
      toLocation: '',
      pol: '',
      pod: '',
      vesselName: '',
      voyage: '',
      etdDate: '',
      etaDate: '',
      siCutDate: '',
      portCutDate: '',
      temperature: '',
      transporter: '',
      handoverLocation: '',
      noOfCont: 1,
      size: '',
      type: '',
      remarks: '',
      sellRate: '',
      buyRate: ''
    });
    setContainers([
      {
        sr: 1,
        contNo: '',
        size: '',
        type: '',
        tareWeight: '',
        cargoWeight: '',
        grossWeight: '',
        sealNo: '',
        vehicleNo: '',
        grNo: '',
        grDate: today,
        remarks: ''
      }
    ]);
    setEquipmentLines([{ id: 1, noOfCont: 1, size: '' }]);
    setIsScheduleLocked(false);
    setFormError('');
    setQuickFillNotice('Form cleared for blank entry.');
    setTimeout(() => setQuickFillNotice(''), 2500);
  };

  // Load Previous Booking for Edit
  const handleLoadForEdit = (prevJob) => {
    const today = getTodayDateStr();
    let svcReq = ['Transport', 'Clearance', 'Rail', 'Forwarding'];
    if (prevJob.services_required) {
      svcReq = typeof prevJob.services_required === 'string'
        ? prevJob.services_required.split(',').map(s => s.trim())
        : prevJob.services_required;
    } else if (prevJob.servicesRequired) {
      svcReq = Array.isArray(prevJob.servicesRequired) ? prevJob.servicesRequired : [prevJob.servicesRequired];
    }
    setForm({
      joNo: prevJob.joNo || prevJob.id || form.joNo,
      joDate: prevJob.joDate || prevJob.date || today,
      joType: prevJob.joType || 'Export FCL',
      modeOfShipment: prevJob.modeOfShipment || 'Multimodal (Rail + Road)',
      servicesRequired: svcReq,
      consignor: prevJob.customer || prevJob.consignor || prevJob.customerName || '',
      consignee: prevJob.consignee || prevJob.consigneeName || consigneesList[0],
      shippingLine: prevJob.shippingLine || prevJob.shippingLineName || prevJob.line || linesList[0],
      lineBookingNo: prevJob.bookingNo || prevJob.lineBookingNo || '',
      bookingDate: prevJob.bookingDate || prevJob.joDate || todayStr,
      bookingValidity: prevJob.bookingValidity || '',
      bookingReValidity: prevJob.bookingReValidity || prevJob.bookingRevalidity || '',
      emptyPickupLocation: prevJob.emptyPickupLocation || 'TRANSWORLD-DADRI',
      fromLocation: prevJob.fromLocation || prevJob.origin || 'Dadri ICD (INICD6)',
      toLocation: prevJob.toLocation || prevJob.podPort || 'Nhava Sheva-NSFT (INNSA1)',
      handoverLocation: prevJob.handoverLocation || 'ADANI-PATLI',
      pol: prevJob.pol || 'INNSA1',
      pod: prevJob.podCode || prevJob.pod || 'AEJEA',
      vesselName: prevJob.vesselName || prevJob.vessel || 'MAERSK COLOMBO',
      voyage: prevJob.voyage || '2604W',
      etdDate: prevJob.etdDate || '',
      etaDate: prevJob.etaDate || '',
      siCutDate: prevJob.siCutDate || '',
      portCutDate: prevJob.portCutDate || '',
      temperature: prevJob.temperature || '',
      transporter: prevJob.transporter || 'AJINKYA TRANSPORT',
      chaName: prevJob.chaName || '',
      onAccount: prevJob.onAccount || '',
      packageType: prevJob.packageType || 'Cartons',
      cartons: prevJob.cartons !== undefined && prevJob.cartons !== null ? String(prevJob.cartons) : '',
      cbm: prevJob.cbm !== undefined && prevJob.cbm !== null ? String(prevJob.cbm) : '',
      fpod: prevJob.fpod || '',
      hblNo: prevJob.hblNo || '',
      boeNo: prevJob.boeNo || '',
      commodity: prevJob.commodity || '',
      noOfCont: prevJob.containersCount || (prevJob.containers ? prevJob.containers.length : 1),
      sellRate: String(prevJob.sellRate || prevJob.sellFreight || '145000'),
      buyRate: String(prevJob.buyRate || prevJob.buyFreight || '118000'),
      remarks: prevJob.remarks || ''
    });

    if (prevJob.containers && prevJob.containers.length > 0) {
      setContainers(
        prevJob.containers.map((c, idx) => ({
          sr: idx + 1,
          contNo: c.containerNo || c.contNo || c.no || '',
          size: c.size || (c.sizeType?.includes('20') ? '20' : '40'),
          type: c.type || (c.sizeType?.includes('GP') ? 'GP' : 'HC'),
          tareWeight: c.tareWeight || c.tare || 3820,
          cargoWeight: c.cargoWeight || c.cargo || '24500',
          grossWeight: c.grossWeight || c.gross || '28320',
          sealNo: c.sealNo || c.seal || '',
          agentSeal: c.agentSeal || c.customSeal || '',
          vehicleNo: c.truckNo || c.vehicleNo || c.truck || '',
          grNo: c.grNo || c.grNumber || c.gr || '',
          grDate: c.grDate ? (typeof c.grDate === 'string' && c.grDate.includes('T') ? c.grDate.split('T')[0] : c.grDate) : todayStr,
          remarks: c.remarks || c.grRemarks || ''
        }))
      );
    }

    setShowRecentModal(false);
    setQuickFillNotice(`Loaded ${prevJob.id || prevJob.joNo} into form for editing.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Container Count Change
  const handleContCountChange = (val) => {
    const count = parseInt(val, 10) || 1;
    setForm({ ...form, noOfCont: count });
    const currentLen = containers.length;
    if (count > currentLen) {
      const added = [];
      for (let i = currentLen; i < count; i++) {
        added.push({
          sr: i + 1,
          contNo: `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`,
          size: form.size,
          type: form.type,
          tareWeight: 3820,
          cargoWeight: '24500',
          grossWeight: '28320',
          sealNo: `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`,
          agentSeal: `CS-${Math.floor(100000 + Math.random() * 900000)}`,
          vehicleNo: `HR55AN${Math.floor(1000 + Math.random() * 9000)}`,
          grNo: `GR-2026-0${Math.floor(10 + Math.random() * 90)}`,
          grDate: todayStr,
          remarks: ''
        });
      }
      setContainers([...containers, ...added]);
    } else if (count < currentLen) {
      setContainers(containers.slice(0, count));
    }
  };

  const handleContainerRowChange = (idx, field, value) => {
    const updated = [...containers];
    updated[idx][field] = value;
    if (field === 'cargoWeight' || field === 'tareWeight') {
      const cargo = parseFloat(updated[idx].cargoWeight) || 0;
      const tare = parseFloat(updated[idx].tareWeight) || 0;
      if (cargo > 0 || tare > 0) {
        updated[idx].grossWeight = (cargo + tare).toString();
      } else {
        updated[idx].grossWeight = '';
      }
    }
    setContainers(updated);
  };

  const handleApplyPastedContainers = () => {
    const rawTokens = pasteText
      .split(/[\n,\s\t]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length >= 4);

    if (rawTokens.length === 0) return;

    const parsedRows = rawTokens.map((num, i) => ({
      sr: i + 1,
      contNo: num,
      size: form.size || '40',
      type: form.type || 'HC',
      tareWeight: 3820,
      cargoWeight: '24500',
      grossWeight: '28320',
      sealNo: `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleNo: `HR55AN${Math.floor(1000 + Math.random() * 9000)}`,
      grNo: '',
      grDate: todayStr,
      remarks: 'Bulk Pasted Unit'
    }));

    setContainers(parsedRows);
    setForm(prev => ({ ...prev, noOfCont: parsedRows.length }));
    setShowPasteModal(false);
    setPasteText('');
    setQuickFillNotice(`✓ Parsed & Generated ${parsedRows.length} Container Units!`);
    setTimeout(() => setQuickFillNotice(''), 3000);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      const rows = [];
      lines.forEach((line) => {
        const parts = line.split(',');
        const cont = (parts[0] || '').trim().toUpperCase();
        if (cont && !cont.includes('CONTAINER')) {
          rows.push({
            sr: rows.length + 1,
            contNo: cont,
            size: (parts[1] || form.size || '40').trim(),
            type: (parts[2] || form.type || 'HC').trim(),
            tareWeight: 3820,
            cargoWeight: (parts[3] || '24500').trim(),
            grossWeight: (parts[4] || '28320').trim(),
            sealNo: (parts[5] || `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`).trim(),
            vehicleNo: (parts[6] || `HR55AN${Math.floor(1000 + Math.random() * 9000)}`).trim(),
            grNo: '',
            grDate: todayStr,
            remarks: 'Imported from CSV'
          });
        }
      });
      if (rows.length > 0) {
        setContainers(rows);
        setForm(prev => ({ ...prev, noOfCont: rows.length }));
        setQuickFillNotice(`✓ Imported ${rows.length} containers from CSV!`);
        setTimeout(() => setQuickFillNotice(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.consignor) {
      setFormError('Please select Consignor (Shipper)');
      return;
    }
    if (!form.shippingLine) {
      setFormError('Please select Shipping Line');
      return;
    }
    if (!form.pod) {
      setFormError('Please select POD (Port of Discharge)');
      return;
    }

    setFormError('');
    const newJobPayload = {
      id: form.joNo,
      joNo: form.joNo,
      joDate: form.joDate || todayStr,
      joType: form.joType,
      modeOfShipment: form.modeOfShipment,
      servicesRequired: Array.isArray(form.servicesRequired) ? form.servicesRequired.join(', ') : (form.servicesRequired || 'Transport, Clearance, Rail, Forwarding'),
      transporter: form.transporter || 'AJINKYA TRANSPORT',
      bookingDate: form.bookingDate || form.joDate || todayStr,
      bookingValidity: form.bookingValidity,
      bookingReValidity: form.bookingReValidity || form.bookingValidity || '',
      customer: form.consignor,
      customerName: form.consignor,
      consignor: form.consignor,
      consignee: form.consignee || 'ASIAN PERAL MYANMAR CO. LTD.',
      line: form.shippingLine,
      shippingLine: form.shippingLine,
      shippingLineName: form.shippingLine,
      bookingNo: form.lineBookingNo,
      lineBookingNo: form.lineBookingNo,
      emptyPickupLocation: form.emptyPickupLocation || 'TRANSWORLD-DADRI',
      fromLocation: form.fromLocation || 'TRANSWORLD-DADRI',
      origin: form.fromLocation || 'TRANSWORLD-DADRI',
      handoverLocation: form.handoverLocation || 'ADANI-PATLI',
      toLocation: form.toLocation || 'ADANI-PATLI',
      pol: form.pol || 'INNSA1',
      pod: form.pod,
      podCode: form.pod,
      podPort: form.pod,
      vessel: form.vesselName || 'MAERSK COLOMBO',
      vesselName: form.vesselName || 'MAERSK COLOMBO',
      voyage: form.voyage || '2604W',
      etdDate: form.etdDate,
      etaDate: form.etaDate,
      portCutDate: form.portCutDate,
      siCutDate: form.siCutDate,
      chaName: form.chaName || '',
      onAccount: form.onAccount || '',
      packageType: form.packageType || 'Cartons',
      cartons: Number(form.cartons) || 0,
      cbm: Number(form.cbm) || 0,
      fpod: form.fpod || '',
      hblNo: form.hblNo || '',
      boeNo: form.boeNo || '',
      containersCount: totalContainersCount,
      equipmentBreakdown: equipmentLines,
      status: "STUFFED",
      sellFreight: totalSellVal,
      buyFreight: totalBuyVal,
      margin: totalMarginVal,
      containers: containers.map((c, idx) => ({
        id: `C${idx + 1}`,
        sr: c.sr || idx + 1,
        containerNo: c.contNo || `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`,
        sizeType: `${c.size}${c.type}`,
        size: c.size,
        type: c.type,
        tareWeight: Number(c.tareWeight) || 3820,
        cargoWeight: Number(c.cargoWeight) || 24500,
        grossWeight: Number(c.grossWeight) || 28320,
        sealNo: c.sealNo || `ML-IN-${Math.floor(100000 + Math.random() * 900000)}`,
        agentSeal: c.agentSeal || `CS-${Math.floor(100000 + Math.random() * 900000)}`,
        truckNo: c.vehicleNo || 'HR55AN2094',
        grNo: c.grNo || `GR-2026-084${idx + 1}`
      }))
    };

    if (onCreateJob) {
      onCreateJob(newJobPayload);
      setAutoFilledToast(`✅ Booking ${newJobPayload.id} Successfully Saved with complete route!`);
      setTimeout(() => setAutoFilledToast(null), 4000);
    }
  };

  const filteredPrevious = jobs.filter((j) => {
    if (!recentSearch.trim()) return true;
    const q = (recentSearch || '').toLowerCase();
    const jid = String(j.id || j.joNo || '').toLowerCase();
    const cst = String(j.customer || j.consignor || '').toLowerCase();
    const vsl = String(j.vessel || '').toLowerCase();
    return jid.includes(q) || cst.includes(q) || vsl.includes(q);
  });

  const totalContainersCount = equipmentLines.reduce((acc, l) => acc + (parseInt(l.noOfCont, 10) || 1), 0);
  const totalSellVal = equipmentLines.reduce((acc, l) => acc + ((Number(l.sellRate) || 0) * (parseInt(l.noOfCont, 10) || 1)), 0);
  const totalBuyVal = equipmentLines.reduce((acc, l) => acc + ((Number(l.buyRate) || 0) * (parseInt(l.noOfCont, 10) || 1)), 0);
  const totalMarginVal = totalSellVal - totalBuyVal;

  return (
    <div className="space-y-2.5 w-full font-sans pb-1">
      {/* 1. Header with Compact Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/90 pb-2 mb-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span>Job Order / Container Booking</span>
          </h1>
          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold border border-blue-200 shadow-2xs">
            {form.joNo}
          </span>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">JO Date:</span>
            <input
              type="date"
              value={form.joDate ? (form.joDate.includes('T') ? form.joDate.split('T')[0] : (form.joDate.includes('/') ? form.joDate.split('/').reverse().join('-') : form.joDate)) : todayStr}
              onChange={(e) => setForm({ ...form, joDate: e.target.value })}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 outline-none cursor-pointer"
            />
          </div>
          <span className="hidden lg:inline-block text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
            Fast single-screen container booking &bull; Auto-calculates gross weight
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {quickFillNotice && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[200px]">{quickFillNotice}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearForm}
            className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-bold text-[11px] border border-slate-200 flex items-center gap-1 transition cursor-pointer"
            title="Clear form fields"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>

          {/* Compact Recent Bookings Button - at the very last (far right) */}
          <button
            type="button"
            onClick={() => setShowRecentModal(true)}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-extrabold text-[11px] flex items-center gap-1 border border-slate-300 shadow-2xs transition cursor-pointer select-none"
            title="View Recent Bookings & Load for Edit"
          >
            <History className="w-3 h-3 text-blue-600" />
            <span>Recent Bookings</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-mono font-bold">
              {jobs.length}
            </span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold">{formError}</span>
        </div>
      )}

      {/* 3. Compact High-Density Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* CARD 1: Routing & Shipment Type */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Route className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Routing &amp; Shipment Specification
              </h2>
            </div>
          </div>

          {/* Row 1: Shipment Specs & Initial Movement (Job Type -> Mode of Transportation -> Transporter -> From Location) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Job Type <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.joType}
                onChange={(e) => setForm({ ...form, joType: e.target.value })}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none ${getFieldClass('joType', true, form.joType)}`}
              >
                <option value="">-- Select --</option>
                <option value="Export">Export</option>
                <option value="Import">Import</option>
                <option value="Export FCL">Export FCL (Laden)</option>
                <option value="Import FCL">Import FCL (Delivery)</option>
                <option value="Domestic Movement">Domestic Movement</option>
                <option value="Custom Clearance">Custom Clearance (CHA)</option>
                <option value="Empty Return">Empty Return / Depot</option>
                <option value="Back To Town">Back To Town (BTT)</option>
                <option value="Re Export">Re Export</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Mode of Transportation <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.modeOfShipment}
                onChange={(e) => setForm({ ...form, modeOfShipment: e.target.value })}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none ${getFieldClass('modeOfShipment', true, form.modeOfShipment)}`}
              >
                <option value="">-- Select --</option>
                <option value="SEA Export">SEA Export</option>
                <option value="SEA Import">SEA Import</option>
                <option value="Multimodal (Rail + Road)">Multimodal (Rail + Road / Both)</option>
                <option value="By Rail">By Rail (CONCOR Rake)</option>
                <option value="By Road">By Road (Trailer / Direct)</option>
                <option value="AIR">AIR Export</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Transporter <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="live-job-transporter-list"
                  placeholder="Type or select Transporter..."
                  value={form.transporter}
                  onChange={(e) => setForm({ ...form, transporter: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none ${getFieldClass('transporter', false, form.transporter)}`}
                />
                <datalist id="live-job-transporter-list">
                  {transportersList.map((t, i) => (
                    <option key={i} value={t} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                From Location <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="live-job-from-list"
                  placeholder="Type or select From Location..."
                  value={form.fromLocation}
                  onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none ${getFieldClass('fromLocation', false, form.fromLocation)}`}
                />
                <datalist id="live-job-from-list">
                  {fromLocationList.map((loc, i) => (
                    <option key={i} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 2: To Location -> Handover Location -> POL -> POD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1.5 border-t border-slate-100">
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                To Location <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="live-job-to-list"
                  placeholder="Type or select To Location..."
                  value={form.toLocation}
                  onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none ${getFieldClass('toLocation', false, form.toLocation)}`}
                />
                <datalist id="live-job-to-list">
                  {toLocationList.map((loc, i) => (
                    <option key={i} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Handover Location <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="live-job-handover-list"
                  placeholder="Type or select Handover Location..."
                  value={form.handoverLocation}
                  onChange={(e) => setForm({ ...form, handoverLocation: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none ${getFieldClass('handoverLocation', false, form.handoverLocation)}`}
                />
                <datalist id="live-job-handover-list">
                  {handoverLocationList.map((loc, i) => (
                    <option key={i} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                POL (Port of Loading) <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="live-job-pol-list"
                  placeholder="Type or select POL..."
                  value={form.pol}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, pol: val });
                    setRouteFilterOnly(true);
                    setSelectedCarrierFilter('ALL');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none ${getFieldClass('pol', true, form.pol)}`}
                />
                <datalist id="live-job-pol-list">
                  {polList.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.flag} {p.name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                  POD (Port of Discharge) <span className="text-rose-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRouteFilterOnly(true);
                    setSelectedCarrierFilter('ALL');
                    setShowSailingPicker(true);
                  }}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                  title="Browse matching sailings for this Route"
                >
                  <Ship className="w-2.5 h-2.5 text-blue-600" />
                  <span>
                    {form.pod && routeMatchingSailings.length > 0
                      ? `${routeMatchingSailings.length} Sailings (${form.pod})`
                      : `${allSailings.length} Sailings`}
                  </span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  list="live-job-pod-list"
                  placeholder="Type or select POD..."
                  value={form.pod}
                  onChange={(e) => handlePodChange(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none ${getFieldClass('pod', true, form.pod)}`}
                />
                <datalist id="live-job-pod-list">
                  {podList.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 3: Service Required (Point 14) */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/70">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <span>Service Required:</span>
                <span className="text-rose-500 font-bold">*</span>
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">(Multiple Selection Supported)</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['Transport', 'Clearance', 'Rail', 'Forwarding'].map((svc, idx) => {
                const isChecked = form.servicesRequired?.includes(svc);
                return (
                  <label
                    key={svc}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const prev = form.servicesRequired || [];
                        const updated = e.target.checked
                          ? [...prev, svc]
                          : prev.filter(s => s !== svc);
                        setForm({ ...form, servicesRequired: updated });
                      }}
                      className="hidden"
                    />
                    <span>{idx + 1}) {svc}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 2: Stakeholders, Liner & Vessel Schedule */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 flex-wrap gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Ship className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Stakeholders, Liner &amp; Vessel Schedule
              </h2>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                Route: {polList.find(p => p.code === form.pol)?.name || form.pol} ➔ {form.pod ? (podList.find(p => p.code === form.pod)?.name || form.pod) : 'Select POD'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Row 1: Consignor -> Consignee -> CHA Agent -> On Account (4 Cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Consignor (Shipper) <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="live-job-consignor-list"
                    placeholder="Type or select Consignor..."
                    value={form.consignor}
                    onChange={(e) => handleConsignorChange(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none truncate ${getFieldClass('consignor', true, form.consignor)}`}
                  />
                  <datalist id="live-job-consignor-list">
                    {shippersList.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Consignee</label>
                <div className="relative">
                  <input
                    type="text"
                    list="live-job-consignee-list"
                    placeholder="Type or select Consignee..."
                    value={form.consignee}
                    onChange={(e) => setForm({ ...form, consignee: e.target.value })}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs outline-none truncate font-semibold ${getFieldClass(form.consignee)}`}
                  />
                  <datalist id="live-job-consignee-list">
                    {consigneesList.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Customs CHA Agent
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="live-job-cha-list"
                    placeholder="Optional / Direct Shipper"
                    value={form.chaName || ''}
                    onChange={(e) => setForm({ ...form, chaName: e.target.value })}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none truncate ${getFieldClass(form.chaName)}`}
                  />
                  <datalist id="live-job-cha-list">
                    {chaList.map((cha, i) => (
                      <option key={i} value={cha} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  On Account Of (Third Party)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="live-job-onaccount-list"
                    placeholder="Optional / Direct Shipper"
                    value={form.onAccount || ''}
                    onChange={(e) => setForm({ ...form, onAccount: e.target.value })}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none truncate ${getFieldClass(form.onAccount)}`}
                  />
                  <datalist id="live-job-onaccount-list">
                    {shippersList.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Row 2: Shipping Line -> Line Booking No -> Booking Date -> Booking Re-Validity (4 Cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1.5 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Shipping Line <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="live-job-shippingline-list"
                    placeholder="Type or select Shipping Line..."
                    value={form.shippingLine}
                    onChange={(e) => {
                      setForm({ ...form, shippingLine: e.target.value });
                      setFormError('');
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none truncate ${getFieldClass('shippingLine', true, form.shippingLine)}`}
                  />
                  <datalist id="live-job-shippingline-list">
                    {linesList.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Line Booking No</label>
                <input
                  type="text"
                  placeholder="Optional / Leave Blank"
                  value={form.lineBookingNo}
                  onChange={(e) => setForm({ ...form, lineBookingNo: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${getFieldClass('lineBookingNo', false, form.lineBookingNo)}`}
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Booking Date</label>
                <input
                  type="date"
                  value={form.bookingDate ? (form.bookingDate.includes('T') ? form.bookingDate.split('T')[0] : (form.bookingDate.includes('/') ? form.bookingDate.split('/').reverse().join('-') : form.bookingDate)) : todayStr}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${getFieldClass('bookingDate', false, form.bookingDate)}`}
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Booking Re-Validity</label>
                <input
                  type="date"
                  value={form.bookingValidity || ''}
                  onChange={(e) => setForm({ ...form, bookingValidity: e.target.value, bookingReValidity: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${getFieldClass('bookingValidity', false, form.bookingValidity)}`}
                />
              </div>
            </div>

            {/* Row 3: Vessel Name -> Voyage -> ETD -> ETA -> Port Cut-off -> SI Cut-off (6 Cols Compact Line) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1.5 border-t border-slate-100 bg-slate-50/70 p-2 rounded-lg border border-slate-200/60">
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Vessel Name {isScheduleLocked && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
                </label>
                <input
                  type="text"
                  placeholder="e.g. MAERSK COLOMBO"
                  readOnly={isScheduleLocked}
                  tabIndex={isScheduleLocked ? -1 : 0}
                  value={form.vesselName}
                  onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none ${
                    isScheduleLocked
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed select-none'
                      : getFieldClass('vesselName', false, form.vesselName)
                  }`}
                  title={isScheduleLocked ? "Auto-filled from verified ocean schedule (Locked)" : ""}
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Voyage {isScheduleLocked && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2604W"
                  readOnly={isScheduleLocked}
                  tabIndex={isScheduleLocked ? -1 : 0}
                  value={form.voyage}
                  onChange={(e) => setForm({ ...form, voyage: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${
                    isScheduleLocked
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed select-none'
                      : getFieldClass('voyage', false, form.voyage)
                  }`}
                  title={isScheduleLocked ? "Auto-filled from verified ocean schedule (Locked)" : ""}
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  ETD (Departure) {isScheduleLocked && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
                </label>
                <input
                  type="date"
                  readOnly={isScheduleLocked}
                  tabIndex={isScheduleLocked ? -1 : 0}
                  value={form.etdDate}
                  onChange={(e) => setForm({ ...form, etdDate: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${
                    isScheduleLocked
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed select-none'
                      : getFieldClass('etdDate', false, form.etdDate)
                  }`}
                  title={isScheduleLocked ? "Auto-filled from verified ocean schedule (Locked)" : ""}
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  ETA (Arrival) {isScheduleLocked && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
                </label>
                <input
                  type="date"
                  readOnly={isScheduleLocked}
                  tabIndex={isScheduleLocked ? -1 : 0}
                  value={form.etaDate || ''}
                  onChange={(e) => setForm({ ...form, etaDate: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${
                    isScheduleLocked
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed select-none'
                      : getFieldClass('etaDate', false, form.etaDate)
                  }`}
                  title={isScheduleLocked ? "Auto-filled from verified ocean schedule (Locked)" : ""}
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Port Cut-off {isScheduleLocked && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
                </label>
                <input
                  type="date"
                  readOnly={isScheduleLocked}
                  tabIndex={isScheduleLocked ? -1 : 0}
                  value={form.portCutDate}
                  onChange={(e) => setForm({ ...form, portCutDate: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${
                    isScheduleLocked
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed select-none'
                      : getFieldClass('portCutDate', false, form.portCutDate)
                  }`}
                  title={isScheduleLocked ? "Auto-filled from verified ocean schedule (Locked)" : ""}
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  SI Cut-off {isScheduleLocked && <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>}
                </label>
                <input
                  type="date"
                  readOnly={isScheduleLocked}
                  tabIndex={isScheduleLocked ? -1 : 0}
                  value={form.siCutDate}
                  onChange={(e) => setForm({ ...form, siCutDate: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none ${
                    isScheduleLocked
                      ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed select-none'
                      : getFieldClass('siCutDate', false, form.siCutDate)
                  }`}
                  title={isScheduleLocked ? "Auto-filled from verified ocean schedule (Locked)" : ""}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Equipment Count & Size Allotment (Type & Rates removed) */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Box className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Equipment Count &amp; Container Sizes
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                {totalContainersCount} Units Total
              </span>
            </div>

            {/* + ADD EQUIPMENT LINE BUTTON */}
            <button
              type="button"
              onClick={handleAddEquipmentLine}
              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[10px] shadow-2xs flex items-center gap-1 transition cursor-pointer select-none"
              title="Add another container size line"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Add Line</span>
            </button>
          </div>

          <div className="space-y-2">
            {equipmentLines.map((line, idx) => (
              <div key={line.id} className="flex items-center gap-3 bg-slate-50/70 p-2 rounded-lg border border-slate-200/80">
                <div className="w-32 sm:w-36">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                    No Of Cont <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={line.noOfCont}
                    onChange={(e) => handleEquipmentLineChange(idx, "noOfCont", e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold outline-none ${getFieldClass(line.noOfCont)}`}
                  />
                </div>

                <div className="w-56 sm:w-64">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Size</label>
                  <select
                    value={line.size}
                    onChange={(e) => handleEquipmentLineChange(idx, "size", e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold outline-none ${getFieldClass(line.size)}`}
                  >
                    <option value="">-- Select --</option>
                    <option value="40">40' (High Cube / Standard)</option>
                    <option value="20">20' (Standard Box)</option>
                    <option value="45">45' (High Cube)</option>
                  </select>
                </div>

                <div className="w-64 sm:w-72">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                    Commodity <span className="text-blue-500 font-mono text-[9px]">({dbCommodities.length} in DB)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list={`live-commodity-list-${idx}`}
                      placeholder="Type to search Commodity..."
                      value={line.commodity || ''}
                      onChange={(e) => handleEquipmentLineChange(idx, "commodity", e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold outline-none ${getFieldClass(line.commodity)}`}
                    />
                    <datalist id={`live-commodity-list-${idx}`}>
                      {dbCommodities.map((cmd) => (
                        <option key={cmd.id || cmd.code} value={cmd.name}>
                          {cmd.requires_reefer ? '❄️ Reefer (-18°C)' : '📦 Dry Box'}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="w-36 sm:w-40">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                    Set Temp <span className="text-blue-600 font-mono text-[9px] font-bold">(Auto)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={form.temperature || 'Ambient'}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-extrabold bg-slate-100 text-slate-700 border border-slate-200 cursor-not-allowed select-none outline-none"
                    title="Auto-set based on selected Commodity (Locked)"
                  />
                </div>

                {equipmentLines.length > 1 && (
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipmentLine(line.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete this equipment line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CARD 4: Container Details Table (Compact Repeater) */}
        <div className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-1.5 gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900">
                Container Allotment &amp; Manifest ({containers.length} Units)
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] border border-blue-200 flex items-center gap-1 cursor-pointer transition"
              >
                <Clipboard className="w-3 h-3" />
                <span>Quick Paste</span>
              </button>

              <label className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-200 flex items-center gap-1 cursor-pointer transition">
                <UploadCloud className="w-3 h-3" />
                <span>Import CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[9.5px] uppercase font-extrabold">
                <tr>
                  <th className="py-2 px-2.5 w-8 text-center">#</th>
                  <th className="py-2 px-2.5 min-w-[130px]">
                    Container No <span className="text-rose-500 font-bold">*</span>
                  </th>
                  <th className="py-2 px-2.5 min-w-[70px] whitespace-nowrap">Size/Type</th>
                  <th className="py-2 px-2.5 min-w-[85px]">Tare (Auto)</th>
                  <th className="py-2 px-2.5 min-w-[95px]">
                    Cargo (kg) <span className="text-rose-500 font-bold">*</span>
                  </th>
                  <th className="py-2 px-2.5 min-w-[95px]">Gross (Auto)</th>
                  <th className="py-2 px-2.5 min-w-[130px]">Vehicle No (Optional)</th>
                  <th className="py-2 px-2.5 min-w-[130px]">GR No (Optional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-xs">
                {containers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 text-slate-400 font-bold text-center">{c.sr}</td>

                    <td className="py-1.5 px-2.5">
                      <input
                        type="text"
                        value={c.contNo}
                        onChange={(e) => handleContainerRowChange(idx, 'contNo', e.target.value.toUpperCase())}
                        className={`w-full px-2.5 py-1.5 rounded-lg font-bold text-xs uppercase outline-none ${getFieldClass(c.contNo)}`}
                      />
                    </td>

                    <td className="py-1.5 px-2.5 text-slate-700 font-bold whitespace-nowrap">
                      {c.size ? `${c.size}'${c.type || ''}` : '-'}
                    </td>

                    <td className="py-1.5 px-2.5">
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={c.tareWeight ? `${c.tareWeight} kg` : ''}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none outline-none text-right pr-2"
                        title="ISO Standard Tare Weight (Auto-filled from Size)"
                      />
                    </td>

                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        value={c.cargoWeight}
                        onChange={(e) => handleContainerRowChange(idx, 'cargoWeight', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs outline-none ${getFieldClass(c.cargoWeight)}`}
                      />
                    </td>

                    <td className="py-1.5 px-2.5">
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={c.grossWeight ? `${c.grossWeight} kg` : ''}
                        className="w-full px-2.5 py-1.5 rounded-lg font-mono font-extrabold text-xs bg-slate-100 text-slate-800 border border-slate-200 cursor-not-allowed select-none outline-none text-right pr-2"
                        title="Auto-calculated (Tare + Cargo) - Locked"
                      />
                    </td>

                    <td className="py-1.5 px-2.5">
                      <input
                        type="text"
                        value={c.vehicleNo || ''}
                        onChange={(e) => handleContainerRowChange(idx, 'vehicleNo', e.target.value.toUpperCase())}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase outline-none ${getFieldClass(c.vehicleNo)}`}
                        placeholder="e.g. HR55AN2094"
                        title="Vehicle / Truck No (Optional)"
                      />
                    </td>

                    <td className="py-1.5 px-2.5">
                      <input
                        type="text"
                        value={c.grNo || ''}
                        onChange={(e) => handleContainerRowChange(idx, 'grNo', e.target.value.toUpperCase())}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase text-emerald-700 outline-none ${getFieldClass(c.grNo)}`}
                        placeholder="e.g. GR-2026-084"
                        title="GR / Consignment Note No (Optional)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Action Save Button Bar */}
        <div className="flex items-center justify-between pt-1.5 pb-1">
          <div className="text-[10px] text-slate-400 font-medium">
            * Mandatory fields marked with red asterisk are required for booking
          </div>

          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Container Booking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* ================= ACTIVE OCEAN SAILINGS PICKER MODAL ================= */}
      {showSailingPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans">
          <div className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      Active Ocean Sailings &amp; Schedules
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-semibold border border-blue-500/30">
                      {filteredSailings.length} {routeFilterOnly && cleanPodCode ? 'Route Sailings' : 'Total Sailings'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                    <span>Route:</span>
                    <span className="text-amber-300 font-bold">{form.pol === 'INMUN1' ? 'Mundra (INMUN)' : 'Nhava Sheva (INNSA)'}</span>
                    <span>➔</span>
                    <span className="text-emerald-300 font-bold">{form.pod ? (podList.find(p => p.code === form.pod)?.name || form.pod) : 'All Global Destinations'}</span>
                    <span>&bull;</span>
                    <span className="text-slate-400">Click any sailing to 1-click auto-fill Line, Vessel &amp; Cut-offs</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSailingPicker(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
              {/* Route Matching Filter Toggle & Quick Port Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                <div className="flex items-center gap-1.5 bg-slate-200/80 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setRouteFilterOnly(true);
                      setSelectedCarrierFilter('ALL');
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      routeFilterOnly && cleanPodCode
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🎯 Selected Route ({routeMatchingSailings.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRouteFilterOnly(false);
                      setSelectedCarrierFilter('ALL');
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      !routeFilterOnly || !cleanPodCode
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🌐 All Global Sailings ({allSailings.length})</span>
                  </button>
                </div>

                {/* Instant POD dropdown selector inside modal */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-600">POD (Discharge):</span>
                  <select
                    value={form.pod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, pod: val });
                      setRouteFilterOnly(true);
                      setSelectedCarrierFilter('ALL');
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 max-w-[200px] truncate"
                  >
                    <option value="">-- All Ports --</option>
                    {podList.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.flag} {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search & Carrier Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Vessel Name, Voyage, Carrier (e.g. CNC TIGER, MAERSK, 0UW4JW1MA)..."
                    value={sailingSearch}
                    onChange={(e) => setSailingSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                  {sailingSearch && (
                    <button
                      onClick={() => setSailingSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-medium text-slate-500 shrink-0">
                  Showing <strong className="text-slate-800">{filteredSailings.length}</strong> of {basePool.length} sailings
                </div>
              </div>

              {/* Carrier Filter Pills */}
              {uniqueCarriers.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Carrier:</span>
                  {uniqueCarriers.map((carrier) => (
                    <button
                      key={carrier}
                      type="button"
                      onClick={() => setSelectedCarrierFilter(carrier)}
                      className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition cursor-pointer text-[10px] ${
                        selectedCarrierFilter === carrier
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-200/80 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {carrier} {carrier !== 'ALL' && `(${basePool.filter(s => s.carrier === carrier).length})`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sailings List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[60vh] bg-slate-100/50">
              {filteredSailings.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Ship className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      No pre-cached sailings found for {polList.find(p => p.code === form.pol)?.name || form.pol} ➔ {form.pod ? (podList.find(p => p.code === form.pod)?.name || form.pod) : 'selected port'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try selecting another POD or view all 31 pre-cached sailings across global routes.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRouteFilterOnly(false);
                        setSelectedCarrierFilter('ALL');
                        setSailingSearch('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                    >
                      Show All 31 Global Sailings
                    </button>
                  </div>
                </div>
              ) : (
                filteredSailings.map((sailing, idx) => {
                  const portCut = sailing.cutOffs?.containerYard ? sailing.cutOffs.containerYard.split(' ')[0] : sailing.departure;
                  const siCut = sailing.cutOffs?.shippingInstructions ? sailing.cutOffs.shippingInstructions.split(' ')[0] : portCut;

                  const isMaersk = sailing.carrier?.includes('MAERSK');
                  const isMSC = sailing.carrier?.includes('MSC');
                  const isCMA = sailing.carrier?.includes('CMA');
                  const isEvergreen = sailing.carrier?.includes('EVERGREEN');
                  const isONE = sailing.carrier?.includes('ONE');
                  const isHapag = sailing.carrier?.includes('HAPAG');

                  const carrierBadgeClass = isMaersk
                    ? 'bg-sky-100 text-sky-800 border-sky-300'
                    : isMSC
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : isCMA
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : isEvergreen
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : isONE
                    ? 'bg-pink-100 text-pink-800 border-pink-300'
                    : isHapag
                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                    >
                      {/* Vessel & Carrier Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${carrierBadgeClass}`}>
                            {sailing.carrier}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 flex items-center gap-1.5">
                            <Ship className="w-3.5 h-3.5 text-blue-600" />
                            <span>{sailing.vesselName}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Voy: {sailing.voyageNo}
                          </span>
                          <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            {sailing.originLocode || 'INNSA'} ➔ {sailing.destinationLocode || 'AEJEA'}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {sailing.routingType || (sailing.direct ? 'Direct' : 'Transshipment')} &bull; {sailing.transitTime || '4-5 Days'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-500">Service: {sailing.service || 'Ocean Express'}</span>
                          <span>&bull;</span>
                          <span>Port Cut-Off: <strong className="text-slate-800 font-mono">{portCut}</strong></span>
                          <span>&bull;</span>
                          <span>SI Cut-Off: <strong className="text-slate-800 font-mono">{siCut}</strong></span>
                        </div>
                      </div>

                      {/* Dates & Quick Select Button */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-right text-[11px] space-y-0.5">
                          <div className="text-slate-500 text-[10px] font-bold uppercase">ETD Departure</div>
                          <div className="text-xs font-bold font-mono text-blue-700">{sailing.departure}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectSailing(sailing)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer group-hover:bg-blue-700"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Select &amp; Auto-Fill</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pre-cached schedule pool active (0 API credits consumed)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSailingPicker(false)}
                className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Auto-Filled Success Toast */}
      {autoFilledToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in backdrop-blur-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Sailing &amp; Dates Auto-Filled!</div>
            <div className="text-[11px] text-slate-300 font-mono">{autoFilledToast}</div>
          </div>
        </div>
      )}


      {/* ================= RECENT BOOKINGS MODAL (FULL LIST & EDIT) ================= */}
      {showRecentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#232f3e] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    Recent Container Bookings ({jobs.length})
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Click "✏️ Edit in Form" to load booking back into form for editing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRecentModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Filter Search */}
            <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Job No, Shipper, Vessel, POD..."
                  value={recentSearch}
                  onChange={(e) => setRecentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Showing {filteredPrevious.length} of {jobs.length} Bookings
              </span>
            </div>

            {/* Bookings List / Table */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {filteredPrevious.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No bookings found matching your search.
                </div>
              ) : (
                filteredPrevious.map((job) => (
                  <div
                    key={job.id}
                    className="py-3 px-3 hover:bg-slate-50 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-xs">
                          {job.id || job.joNo}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {job.status || "BOOKED"}
                        </span>
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {job.joType || "Export FCL"}
                        </span>
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {(job.modeOfShipment || "Multimodal (Rail + Road)").includes("Multimodal") ? "🚂 🚛 Multimodal" : (job.modeOfShipment || "").includes("Road") ? "🚛 Road" : "🚂 Rail"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 truncate">
                          {job.customer || job.consignor}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>{job.origin || job.fromLocation || "Dadri ICD"} ➔ <strong className="text-slate-700">{job.pod || job.toLocation || "Jebel Ali"}</strong></span>
                        <span>•</span>
                        <span>{job.vessel || "Vessel TBA"} ({job.voyage || "2604W"})</span>
                        <span>•</span>
                        <span>{job.containersCount || 1}x 40HC</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2 hidden sm:block">
                        <div className="font-mono font-bold text-emerald-600 text-xs">
                          ₹ {Number(job.margin !== undefined ? job.margin : ((job.sellFreight || 145000) - (job.buyFreight || 118000))).toLocaleString("en-IN")}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">Net Margin</span>
                      </div>

                      {/* Primary Action: Load back into form for Edit! */}
                      <button
                        type="button"
                        onClick={() => handleLoadForEdit(job)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer select-none"
                        title="Load this booking into form to edit"
                      >
                        <span>✏️ Edit in Form</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowRecentModal(false);
                          if (onSelectJob) onSelectJob(job.id);
                          if (onOpenShipmentStatus) onOpenShipmentStatus();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer select-none"
                        title="Open Status Cockpit"
                      >
                        <span>Cockpit</span>
                        <ChevronRight className="w-3.5 h-3.5 inline" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 px-5 shrink-0">
              <span>Tip: Click <strong>"✏️ Edit in Form"</strong> to populate all fields and update.</span>
              <button
                type="button"
                onClick={() => setShowRecentModal(false)}
                className="px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold cursor-pointer hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUICK PASTE CONTAINERS MODAL ================= */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-5 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold font-heading text-[rgb(25,40,57)] flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-blue-600" />
                <span>Quick Paste Container Numbers</span>
              </h2>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 font-sans">
                WhatsApp, Email ya Excel se container numbers copy karein aur yahan paste karein:
              </p>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="MSKU7829102\nMSKU8910293\nMEDU8819201"
                className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPastedContainers}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Generate Container Rows &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
