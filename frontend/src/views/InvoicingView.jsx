import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import TaxDocumentPdfView from '../components/TaxDocumentPdfView.jsx';
import spjLogo from '../assets/spjLogoBase64.js';
import {
  Receipt,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Download,
  PlusCircle,
  FileText,
  AlertCircle,
  Printer,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Filter,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  ShieldCheck,
  UserCheck,
  Sparkles,
  X,
  ChevronRight,
  Hash,
  Phone,
  Mail,
  MapPin,
  Layers,
  FileSpreadsheet,
  Save,
  Clock
} from 'lucide-react';

export default function InvoicingView({ jobs = [], job = null, triggerGenerateInvoice = 0 }) {
  // Navigation tabs: 'create' (Billing Creator), 'history' (Past Invoices Ledger), 'pdf' (Printable Tax Invoice)
  const [activeTab, setActiveTab] = useState('create');

  // Master Data States
  const [servicesMaster, setServicesMaster] = useState([]);
  const [taxHeads, setTaxHeads] = useState([]);
  const [taxHeadGroups, setTaxHeadGroups] = useState([]);
  const [partiesList, setPartiesList] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [pastInvoices, setPastInvoices] = useState([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Form Notice & Action Feedback
  const [notice, setNotice] = useState(null);
  const [copiedIrn, setCopiedIrn] = useState('');

  // Selected / Linked Job Order
  const [selectedJobId, setSelectedJobId] = useState(job?.id || (jobs[0]?.id || ''));

  // Invoice Form State
  const [invoiceType, setInvoiceType] = useState('TAX INVOICE');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [lutEligible, setLutEligible] = useState(true);
  const [remarks, setRemarks] = useState('Export consignment billed under LUT rule 96A.');

  // Party / Customer State (Auto-fetched from Customer Master)
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [partySearchTerm, setPartySearchTerm] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [partyName, setPartyName] = useState('Fair Exports (India) Pvt Ltd');
  const [partyGstin, setPartyGstin] = useState('09AAACF9128M1Z8');
  const [partyAddress, setPartyAddress] = useState('Plot 4, Ecotech-II, Udyog Vihar, Greater Noida, UP - 201306');
  const [partyState, setPartyState] = useState('Uttar Pradesh');
  const [partyStateCode, setPartyStateCode] = useState('09');
  const [placeOfSupply, setPlaceOfSupply] = useState('09-Uttar Pradesh');
  const [partyEmail, setPartyEmail] = useState('');
  const [partyContact, setPartyContact] = useState('');

  // Shipment Details (Auto-fetched from selected Job or manual)
  const [jobNumber, setJobNumber] = useState('JO-2026-0001');
  const [origin, setOrigin] = useState('Dadri ICD (INICD6)');
  const [pod, setPod] = useState('Jebel Ali (AEJEA)');
  const [shippingLine, setShippingLine] = useState('Maersk Line India Pvt Ltd');
  const [vessel, setVessel] = useState('MAERSK COLOMBO');
  const [voyage, setVoyage] = useState('2604W');
  const [blNo, setBlNo] = useState('BL-2026-DXB-981');
  const [sbNo, setSbNo] = useState('SB-7891240');
  const [sbDate, setSbDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [containerCount, setContainerCount] = useState(1);
  const [containerNos, setContainerNos] = useState('MSKU-8291024');

  // Itemized Service Charges (Master-driven)
  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: 'item-1',
      serviceId: 'SRV-01',
      serviceCode: 'BOF',
      taxHeadId: 'TH-01',
      chargeName: 'Basic Ocean Freight (BOF)',
      sacCode: '996511',
      quantity: 1,
      uom: '40HC',
      rate: 135000,
      gstRate: 0,
      isLut: true
    },
    {
      id: 'item-2',
      serviceId: 'SRV-02',
      serviceCode: 'THC-EXP',
      taxHeadId: 'TH-03',
      chargeName: 'Terminal Handling Charges (THC)',
      sacCode: '996719',
      quantity: 1,
      uom: 'CONTAINER',
      rate: 12500,
      gstRate: 18,
      isLut: false
    },
    {
      id: 'item-3',
      serviceId: 'SRV-03',
      serviceCode: 'IHC-RAIL',
      taxHeadId: 'TH-02',
      chargeName: 'Inland Haulage Charges (Rail CONCOR)',
      sacCode: '996511',
      quantity: 1,
      uom: 'CONTAINER',
      rate: 34000,
      gstRate: 18,
      isLut: false
    }
  ]);

  // Selected Service to Quick-Add
  const [selectedQuickServiceId, setSelectedQuickServiceId] = useState('');

  // Generated IRN / Preview State
  const [activeInvoicePreview, setActiveInvoicePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingIrn, setIsGeneratingIrn] = useState(false);

  // Past Invoices Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL'); // ALL, PAID, UNPAID, LUT

  // Auto-notification helper
  const showNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // 1. Initial Load of Masters & Past Invoices
  useEffect(() => {
    loadAllMasterData();
    loadPastInvoices();
  }, []);

  const loadAllMasterData = async () => {
    setIsLoadingMasters(true);
    try {
      const [srvRes, thRes, thgRes, custRes, compRes] = await Promise.all([
        api.getServiceMaster().catch(() => ({ data: [] })),
        api.getTaxHeads().catch(() => ({ data: [] })),
        api.getTaxHeadGroups().catch(() => ({ data: [] })),
        api.getCustomers().catch(() => ({ data: [] })),
        api.getCompany().catch(() => ({ data: {} }))
      ]);

      setServicesMaster(srvRes.data || []);
      setTaxHeads(thRes.data || []);
      setTaxHeadGroups(thgRes.data || []);
      setPartiesList(custRes.data || []);
      setCompanyProfile(compRes.data || null);
    } catch (err) {
      console.warn('Error loading billing masters:', err);
    } finally {
      setIsLoadingMasters(false);
    }
  };

  const loadPastInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const res = await api.getInvoices();
      if (res.success && Array.isArray(res.data)) {
        setPastInvoices(res.data);
      }
    } catch (err) {
      console.warn('Error loading invoices history:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  // 2. Auto-Populate When a Job Order is Selected
  useEffect(() => {
    if (!selectedJobId || jobs.length === 0) return;
    const targetJob = jobs.find(j => (j.id === selectedJobId || j.joNo === selectedJobId));
    if (!targetJob) return;

    // Shipment details
    setJobNumber(targetJob.id || targetJob.joNo || 'JO-94280');
    setOrigin(targetJob.origin || targetJob.fromLocation || 'Dadri ICD');
    setPod(targetJob.pod || targetJob.toLocation || 'Jebel Ali');
    setShippingLine(targetJob.shippingLine || targetJob.line || 'Maersk Line');
    setVessel(targetJob.vessel || targetJob.vesselName || 'MAERSK COLOMBO');
    setVoyage(targetJob.voyage || '2604W');
    setBlNo(targetJob.blNo || ('BL-' + Math.floor(100000 + Math.random() * 900000)));
    setSbNo(targetJob.sbNo || ('SB-' + Math.floor(1000000 + Math.random() * 9000000)));

    const cnt = targetJob.containersCount || (targetJob.containers ? targetJob.containers.length : 1);
    setContainerCount(cnt);
    if (targetJob.containers && targetJob.containers.length > 0) {
      setContainerNos(targetJob.containers.map(c => c.containerNumber || c.containerNo).join(', '));
    }

    // Party details from job
    const pName = targetJob.customer || targetJob.consignor || targetJob.partyName;
    if (pName) {
      setPartyName(pName);
      // Try finding party in loaded parties
      const match = partiesList.find(p => p.name?.toLowerCase() === pName.toLowerCase());
      if (match) {
        applyPartyDetails(match);
      }
    }

    // Auto-update freight item rate if specified in job
    if (targetJob.sellFreight) {
      setInvoiceItems(prev => prev.map(item => {
        if (item.serviceCode === 'BOF' || item.sacCode === '996511') {
          return { ...item, rate: Number(targetJob.sellFreight), quantity: cnt };
        }
        return { ...item, quantity: cnt };
      }));
    }
  }, [selectedJobId, jobs, partiesList]);

  // Apply Party Details from Master
  const applyPartyDetails = (party) => {
    setSelectedPartyId(party.id);
    setPartyName(party.name || '');
    setPartyGstin(party.gstin || '');
    setPartyAddress(party.address || '');
    const st = party.state || 'Delhi';
    setPartyState(st);
    const code = party.state_code || party.stateCode || (party.gstin ? party.gstin.slice(0, 2) : '07');
    setPartyStateCode(code);
    setPlaceOfSupply(`${code}-${st}`);
    setPartyEmail(party.email_comm || party.email_ops || '');
    setPartyContact(party.contact_person || party.mobile || '');
    setShowPartyDropdown(false);
    showNotice(`✓ Party details auto-fetched for "${party.name}"`);
  };

  // Determine if Inter-State (IGST) or Intra-State (CGST + SGST)
  const isInterState = useMemo(() => {
    const compStateCode = '07'; // Company head office is Delhi (07)
    if (!partyStateCode) return true;
    return partyStateCode.trim() !== compStateCode;
  }, [partyStateCode]);

  // Handle Quick Add Service From Master
  const handleAddServiceFromMaster = (srvId) => {
    if (!srvId) return;
    const srv = servicesMaster.find(s => s.id === srvId);
    if (!srv) return;

    // Determine GST % from linked tax head or group
    let defaultGst = 18;
    if (srv.tax_head_id) {
      const th = taxHeads.find(t => t.id === srv.tax_head_id);
      if (th) {
        defaultGst = Number(th.igst_rate) || (Number(th.cgst_rate || 0) + Number(th.sgst_rate || 0)) || 18;
      }
    } else if (srv.sac_code === '996511') {
      defaultGst = lutEligible ? 0 : 5;
    }

    const newItem = {
      id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      serviceId: srv.id,
      serviceCode: srv.service_code,
      taxHeadId: srv.tax_head_id || null,
      chargeName: srv.service_name,
      sacCode: srv.sac_code || '996511',
      quantity: containerCount || 1,
      uom: srv.uom || 'CONTAINER',
      rate: Number(srv.default_sell_rate) || 0,
      gstRate: lutEligible && srv.sac_code === '996511' ? 0 : defaultGst,
      isLut: lutEligible && srv.sac_code === '996511'
    };

    setInvoiceItems(prev => [...prev, newItem]);
    setSelectedQuickServiceId('');
    showNotice(`✓ Added charge "${srv.service_name}" from Service Master!`);
  };

  // Add Blank Custom Line Item
  const handleAddCustomLine = () => {
    const newItem = {
      id: 'item-' + Date.now(),
      serviceId: null,
      serviceCode: 'CUSTOM',
      taxHeadId: null,
      chargeName: 'Other Logistics Charges',
      sacCode: '996719',
      quantity: 1,
      uom: 'JOB',
      rate: 5000,
      gstRate: 18,
      isLut: false
    };
    setInvoiceItems(prev => [...prev, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (id) => {
    setInvoiceItems(prev => prev.filter(i => i.id !== id));
  };

  // Update Item Property
  const handleUpdateItem = (id, field, value) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'rate' || field === 'quantity') {
          updated.rate = Number(field === 'rate' ? value : updated.rate) || 0;
          updated.quantity = Number(field === 'quantity' ? value : updated.quantity) || 1;
        }
        if (field === 'gstRate') {
          updated.gstRate = Number(value) || 0;
        }
        return updated;
      }
      return item;
    }));
  };

  // Synchronize LUT changes to items
  useEffect(() => {
    setInvoiceItems(prev => prev.map(it => {
      if (it.sacCode === '996511') {
        return {
          ...it,
          gstRate: lutEligible ? 0 : (it.gstRate || 5),
          isLut: lutEligible
        };
      }
      return it;
    }));
  }, [lutEligible]);

  // Dynamic Calculation of Totals
  const totals = useMemo(() => {
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    invoiceItems.forEach(item => {
      const lineTaxable = (Number(item.quantity) || 1) * (Number(item.rate) || 0);
      taxable += lineTaxable;

      const effectiveGstRate = (lutEligible && (item.sacCode === '996511' || item.isLut)) ? 0 : (Number(item.gstRate) || 0);

      if (effectiveGstRate > 0) {
        if (isInterState) {
          igst += (lineTaxable * effectiveGstRate) / 100;
        } else {
          cgst += (lineTaxable * (effectiveGstRate / 2)) / 100;
          sgst += (lineTaxable * (effectiveGstRate / 2)) / 100;
        }
      }
    });

    const totalTax = cgst + sgst + igst;
    const grandTotal = taxable + totalTax;

    return {
      taxable,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal: Math.round(grandTotal)
    };
  }, [invoiceItems, lutEligible, isInterState]);

  // AI Copilot End-to-End Invoice Trigger
  useEffect(() => {
    if (triggerGenerateInvoice > 0) {
      handleSaveAndGenerateInvoice(true);
    }
  }, [triggerGenerateInvoice]);

  // Save / Generate Invoice to PostgreSQL DB
  const handleSaveAndGenerateInvoice = async (generateIrn = false) => {
    if (!partyName.trim()) {
      alert('Please select or specify a Billed-To Party / Customer.');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Please add at least one line item to the invoice.');
      return;
    }

    setIsSaving(true);
    if (generateIrn) setIsGeneratingIrn(true);

    try {
      const invSeq = String(pastInvoices.length + 1).padStart(4, '0');
      const invNo = `INV-2026-${invSeq}`;
      const irnNum = generateIrn || lutEligible
        ? ('8492' + Math.floor(100000000000 + Math.random() * 900000000000))
        : null;
      const ackNo = generateIrn ? ('122610' + Math.floor(10000 + Math.random() * 90000)) : null;

      const payload = {
        invoiceNumber: invNo,
        invoiceType: invoiceType,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        jobId: selectedJobId || null,
        jobNumber: jobNumber || null,
        partyId: selectedPartyId || null,
        partyName: partyName,
        partyGstin: partyGstin,
        partyState: partyState,
        partyAddress: partyAddress,
        placeOfSupply: placeOfSupply,
        posStateCode: partyStateCode,
        isLut: lutEligible,
        taxableAmount: totals.taxable,
        cgstAmount: totals.cgst,
        sgstAmount: totals.sgst,
        igstAmount: totals.igst,
        totalTax: totals.totalTax,
        grandTotal: totals.grandTotal,
        irnNumber: irnNum,
        ackNo: ackNo,
        ackDate: invoiceDate,
        origin: origin,
        pod: pod,
        line: shippingLine,
        vessel: vessel,
        voyage: voyage,
        blNo: blNo,
        sbNo: sbNo,
        sbDate: sbDate,
        containerCount: containerCount,
        containerNos: containerNos,
        remarks: remarks,
        items: invoiceItems.map(it => {
          const itemTaxable = (Number(it.quantity) || 1) * (Number(it.rate) || 0);
          const effectiveGstRate = (lutEligible && (it.sacCode === '996511' || it.isLut)) ? 0 : (Number(it.gstRate) || 0);
          const itemCgst = isInterState ? 0 : (itemTaxable * (effectiveGstRate / 2)) / 100;
          const itemSgst = isInterState ? 0 : (itemTaxable * (effectiveGstRate / 2)) / 100;
          const itemIgst = isInterState ? (itemTaxable * effectiveGstRate) / 100 : 0;
          return {
            serviceId: it.serviceId,
            serviceCode: it.serviceCode,
            taxHeadId: it.taxHeadId,
            chargeName: it.chargeName,
            sacCode: it.sacCode,
            rate: it.rate,
            quantity: it.quantity,
            uom: it.uom,
            amount: itemTaxable,
            gstRate: effectiveGstRate,
            cgstAmount: itemCgst,
            sgstAmount: itemSgst,
            igstAmount: itemIgst,
            totalAmount: itemTaxable + itemCgst + itemSgst + itemIgst,
            isLut: lutEligible && it.sacCode === '996511'
          };
        })
      };

      const res = await api.createInvoice(payload);
      if (res.success && res.data) {
        showNotice(`✓ Invoice ${res.data.invoice_number} created & saved to PostgreSQL!`);
        await loadPastInvoices();

        // Prepare preview object
        setActiveInvoicePreview({
          docNumber: res.data.invoice_number,
          docDate: res.data.invoice_date || invoiceDate,
          irnStatus: {
            irn: res.data.irn_number,
            ackNo: res.data.ack_no,
            ackDate: res.data.ack_date || invoiceDate
          },
          customer: {
            name: partyName,
            address: partyAddress,
            gstin: partyGstin,
            state: `${partyStateCode} - ${partyState}`,
            pos: placeOfSupply
          },
          shipment: {
            jobNo: jobNumber,
            origin: origin,
            pod: pod,
            line: shippingLine,
            vessel: vessel,
            voyage: voyage,
            blNo: blNo,
            sbNo: sbNo,
            sbDate: sbDate,
            containersCount: containerCount,
            size: "40' HC"
          },
          items: invoiceItems.map(it => ({
            head: it.chargeName,
            sac: it.sacCode,
            qty: it.quantity,
            rate: it.rate,
            taxRate: it.gstRate,
            is_lut: it.isLut
          })),
          taxableTotal: totals.taxable,
          taxTotal: totals.totalTax,
          grandTotal: totals.grandTotal,
          isLut: lutEligible
        });

        // Auto-switch to PDF preview
        setActiveTab('pdf');
      }
    } catch (err) {
      alert('Error saving invoice: ' + err.message);
    } finally {
      setIsSaving(false);
      setIsGeneratingIrn(false);
    }
  };

  // Load a Past Invoice into Form or Preview
  const handleLoadPastInvoice = (inv, mode = 'preview') => {
    const previewObj = {
      docNumber: inv.invoice_number,
      docDate: inv.invoice_date || new Date(inv.created_at).toLocaleDateString('en-GB'),
      irnStatus: {
        irn: inv.irn_number,
        ackNo: inv.ack_no || '122610' + String(inv.id).slice(-5),
        ackDate: inv.ack_date || inv.invoice_date
      },
      customer: {
        name: inv.party_name,
        address: inv.party_address || 'Registered Commercial Address, India',
        gstin: inv.party_gstin || '09AAACF9128M1Z8',
        state: inv.party_state || '09-Uttar Pradesh',
        pos: inv.place_of_supply || inv.party_state || '09-Uttar Pradesh'
      },
      shipment: {
        jobNo: inv.job_number || 'JO-2026-0001',
        origin: inv.origin || 'Dadri ICD (INICD6)',
        pod: inv.pod || 'Jebel Ali (AEJEA)',
        line: inv.line || 'Maersk Line India Pvt Ltd',
        vessel: inv.vessel || 'MAERSK COLOMBO',
        voyage: inv.voyage || '2604W',
        blNo: inv.bl_no || 'BL-2026-DXB-981',
        sbNo: inv.sb_no || 'SB-7891240',
        sbDate: inv.sb_date || inv.invoice_date,
        containersCount: inv.container_count || 1,
        size: "40' HC"
      },
      items: (inv.items && inv.items.length > 0) ? inv.items.map(it => ({
        head: it.charge_name || it.chargeName,
        sac: it.sac_code || it.sacCode || '996511',
        qty: Number(it.quantity) || 1,
        rate: Number(it.rate) || 0,
        taxRate: Number(it.gst_rate) || 0,
        is_lut: it.is_lut || inv.is_lut
      })) : [
        {
          head: 'Ocean Freight & Logistics Services',
          sac: '996511',
          qty: 1,
          rate: Number(inv.taxable_amount) || 125000,
          taxRate: inv.is_lut ? 0 : 18,
          is_lut: inv.is_lut
        }
      ],
      taxableTotal: Number(inv.taxable_amount) || 0,
      taxTotal: Number(inv.total_tax) || 0,
      grandTotal: Number(inv.grand_total) || 0,
      isLut: inv.is_lut === true
    };

    setActiveInvoicePreview(previewObj);

    if (mode === 'preview') {
      setActiveTab('pdf');
    } else if (mode === 'edit') {
      // Load back into creator form
      setPartyName(inv.party_name || '');
      setPartyGstin(inv.party_gstin || '');
      setPartyAddress(inv.party_address || '');
      setPartyState(inv.party_state || '');
      setPlaceOfSupply(inv.place_of_supply || '');
      setJobNumber(inv.job_number || '');
      setLutEligible(inv.is_lut === true);
      setInvoiceType(inv.invoice_type || 'TAX INVOICE');
      setRemarks(inv.remarks || '');
      if (inv.items && inv.items.length > 0) {
        setInvoiceItems(inv.items.map((it, idx) => ({
          id: 'item-edit-' + idx,
          serviceId: it.service_id,
          serviceCode: it.service_code || 'SRV',
          taxHeadId: it.tax_head_id,
          chargeName: it.charge_name,
          sacCode: it.sac_code || '996511',
          quantity: Number(it.quantity) || 1,
          uom: it.uom || 'CONTAINER',
          rate: Number(it.rate) || 0,
          gstRate: Number(it.gst_rate) || 0,
          isLut: it.is_lut === true
        })));
      }
      setActiveTab('create');
      showNotice(`✓ Loaded invoice ${inv.invoice_number} into form editor!`);
    }
  };

  // Toggle Payment Status
  const handleTogglePaymentStatus = async (inv) => {
    const newStatus = inv.payment_status === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      await api.updateInvoicePaymentStatus(inv.id, newStatus);
      showNotice(`✓ Invoice ${inv.invoice_number} marked as ${newStatus}!`);
      loadPastInvoices();
    } catch (err) {
      alert('Error updating payment status: ' + err.message);
    }
  };

  // Filtered Past Invoices
  const filteredPastInvoices = useMemo(() => {
    return pastInvoices.filter(inv => {
      // Filter status
      if (historyFilter === 'PAID' && inv.payment_status !== 'PAID') return false;
      if (historyFilter === 'UNPAID' && inv.payment_status === 'PAID') return false;
      if (historyFilter === 'LUT' && !inv.is_lut) return false;

      // Search
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchesNo = String(inv.invoice_number || '').toLowerCase().includes(q);
        const matchesParty = String(inv.party_name || '').toLowerCase().includes(q);
        const matchesJob = String(inv.job_number || '').toLowerCase().includes(q);
        const matchesIrn = String(inv.irn_number || '').toLowerCase().includes(q);
        return matchesNo || matchesParty || matchesJob || matchesIrn;
      }
      return true;
    });
  }, [pastInvoices, historyFilter, historySearch]);

  // Aggregate Stats for Past Invoices
  const historyStats = useMemo(() => {
    const totalCount = pastInvoices.length;
    const totalBilled = pastInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
    const totalTax = pastInvoices.reduce((sum, i) => sum + (Number(i.total_tax) || 0), 0);
    const unpaidCount = pastInvoices.filter(i => i.payment_status !== 'PAID').length;
    const unpaidAmount = pastInvoices
      .filter(i => i.payment_status !== 'PAID')
      .reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);

    return { totalCount, totalBilled, totalTax, unpaidCount, unpaidAmount };
  }, [pastInvoices]);

  // Filtered Customer Parties for Dropdown Search
  const filteredParties = useMemo(() => {
    if (!partySearchTerm.trim()) return partiesList.slice(0, 40);
    const q = partySearchTerm.toLowerCase();
    return partiesList.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.gstin && p.gstin.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [partiesList, partySearchTerm]);

  return (
    <div className="space-y-4 w-full font-sans pb-12">
      {/* Action Notification Toast */}
      {notice && (
        <div className="no-print fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl bg-slate-900 text-white border border-slate-700 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{notice.msg}</span>
        </div>
      )}

      {/* Top Header & Main Navigation Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                <span>Commercial Invoicing &amp; Billing System</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  GST &bull; E-Invoice NIC
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Create custom freight invoices with master-fetched charge heads, tax groups, party KYC &amp; view complete bills ledger
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create / Edit Bill</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                loadPastInvoices();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Past Invoices Ledger</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
                {pastInvoices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!activeInvoicePreview) {
                  // Generate preview from current form
                  setActiveInvoicePreview({
                    docNumber: `INV-2026-${String(pastInvoices.length + 1).padStart(4, '0')}`,
                    docDate: invoiceDate,
                    irnStatus: {
                      irn: '8492019481029481029481029481029481029481029481029',
                      ackNo: '12261084920',
                      ackDate: invoiceDate
                    },
                    customer: {
                      name: partyName,
                      address: partyAddress,
                      gstin: partyGstin,
                      state: `${partyStateCode} - ${partyState}`,
                      pos: placeOfSupply
                    },
                    shipment: {
                      jobNo: jobNumber,
                      origin: origin,
                      pod: pod,
                      line: shippingLine,
                      vessel: vessel,
                      voyage: voyage,
                      blNo: blNo,
                      sbNo: sbNo,
                      sbDate: sbDate,
                      containersCount: containerCount,
                      size: "40' HC"
                    },
                    items: invoiceItems.map(it => ({
                      head: it.chargeName,
                      sac: it.sacCode,
                      qty: it.quantity,
                      rate: it.rate,
                      taxRate: it.gstRate,
                      is_lut: it.isLut
                    })),
                    taxableTotal: totals.taxable,
                    taxTotal: totals.totalTax,
                    grandTotal: totals.grandTotal,
                    isLut: lutEligible
                  });
                }
                setActiveTab('pdf');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Printable Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CREATE / EDIT TAX INVOICE (BILLING CREATOR)                        */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <div className="space-y-5">
          {/* Top Quick-Link Bar: Link to Job Order & Reset */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Auto-Fill from Job Order:</span>
              </span>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs bg-slate-50 focus:bg-white focus:border-blue-500 font-bold text-slate-800"
              >
                <option value="">-- Direct Standalone Invoice (No Job) --</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id || j.joNo}>
                    {j.id || j.joNo} &bull; {j.customer || j.consignor || 'Direct Shipper'} ({j.pod || j.toLocation || 'FCL'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedJobId('');
                  setPartyName('');
                  setPartyGstin('');
                  setPartyAddress('');
                  setInvoiceItems([]);
                  showNotice('Invoice form cleared for fresh bill.');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAndGenerateInvoice(false)}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Draft Invoice'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAndGenerateInvoice(true)}
                disabled={isGeneratingIrn}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingIrn ? 'Generating IRN...' : 'Generate Invoice & NIC IRN'}</span>
              </button>
            </div>
          </div>

          {/* Section 1: Party KYC Details (Auto-Fetch from Customer Master) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Billed-To Party Details (Customer Master)</h2>
                  <p className="text-[11px] text-slate-500">Pick party from Customer Master to auto-populate GSTIN, address, state and place of supply</p>
                </div>
              </div>

              {/* Master Search Dropdown */}
              <div className="relative min-w-[300px]">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 focus-within:border-blue-500 focus-within:bg-white transition text-xs">
                  <Search className="w-4 h-4 text-blue-600 shrink-0" />
                  <input
                    type="text"
                    value={partySearchTerm}
                    onChange={(e) => {
                      setPartySearchTerm(e.target.value);
                      setShowPartyDropdown(true);
                    }}
                    onFocus={() => setShowPartyDropdown(true)}
                    placeholder="Search Customer Master (Name / GSTIN)..."
                    className="w-full bg-transparent focus:outline-none text-slate-900 font-medium"
                  />
                  {partySearchTerm && (
                    <button type="button" onClick={() => setPartySearchTerm('')} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Options */}
                {showPartyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl z-30 divide-y divide-slate-100 text-xs">
                    <div className="p-2 bg-slate-50 font-bold text-slate-500 text-[10px] uppercase flex justify-between items-center">
                      <span>Available Customers ({partiesList.length})</span>
                      <button type="button" onClick={() => setShowPartyDropdown(false)} className="text-slate-400 hover:text-slate-700">
                        Close &times;
                      </button>
                    </div>
                    {filteredParties.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPartyDetails(p)}
                        className="w-full text-left p-2.5 hover:bg-blue-50 transition flex items-start justify-between gap-2 cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            GSTIN: <span className="text-blue-700 font-bold">{p.gstin || 'UNREGISTERED'}</span> &bull; {p.state || 'Delhi'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                          {p.code || p.party_type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields: Party */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Party / Customer Legal Name *</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Fair Exports (India) Pvt Ltd"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">GSTIN / UIN</label>
                <input
                  type="text"
                  value={partyGstin}
                  onChange={(e) => setPartyGstin(e.target.value)}
                  placeholder="e.g. 09AAACF9128M1Z8"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Invoice Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-800"
                >
                  <option value="TAX INVOICE">TAX INVOICE (Rule 46)</option>
                  <option value="EXPORT INVOICE">EXPORT TAX INVOICE (LUT)</option>
                  <option value="COMMERCIAL INVOICE">COMMERCIAL INVOICE</option>
                  <option value="PROFORMA INVOICE">PROFORMA INVOICE</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Registered Office Address</label>
                <input
                  type="text"
                  value={partyAddress}
                  onChange={(e) => setPartyAddress(e.target.value)}
                  placeholder="Plot / Street / City / Pincode"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">State &amp; State Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={partyStateCode}
                    onChange={(e) => setPartyStateCode(e.target.value)}
                    placeholder="09"
                    className="w-16 px-2.5 py-2 rounded-lg border border-slate-300 font-mono text-center font-bold text-slate-800"
                    title="2-digit State Code"
                  />
                  <input
                    type="text"
                    value={partyState}
                    onChange={(e) => setPartyState(e.target.value)}
                    placeholder="Uttar Pradesh"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Place of Supply (POS)</label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  placeholder="09-Uttar Pradesh"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lutEligible}
                    onChange={(e) => setLutEligible(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-emerald-950">Export Supply under LUT (Rule 96A)</span>
                    <p className="text-[11px] text-emerald-700">Zero-rated export freight without payment of IGST (ARN: AD070324001928K)</p>
                  </div>
                </label>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${lutEligible ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {lutEligible ? 'LUT ACTIVE (0% GST)' : 'NORMAL GST'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Shipment & Logistics References */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Shipment &amp; Container Specifications</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Linked Job: <strong className="text-slate-800">{jobNumber}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Job No</label>
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Origin / POL</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Destination / POD</label>
                <input
                  type="text"
                  value={pod}
                  onChange={(e) => setPod(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Shipping Line</label>
                <input
                  type="text"
                  value={shippingLine}
                  onChange={(e) => setShippingLine(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Vessel / Voyage</label>
                <input
                  type="text"
                  value={`${vessel} / ${voyage}`}
                  onChange={(e) => {
                    const parts = e.target.value.split('/');
                    setVessel(parts[0]?.trim() || '');
                    setVoyage(parts[1]?.trim() || '');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">Containers (Qty)</label>
                <input
                  type="number"
                  value={containerCount}
                  onChange={(e) => {
                    const c = Number(e.target.value) || 1;
                    setContainerCount(c);
                    setInvoiceItems(prev => prev.map(it => ({ ...it, quantity: c })));
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">BL Number</label>
                <input
                  type="text"
                  value={blNo}
                  onChange={(e) => setBlNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-semibold text-blue-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">SB Number</label>
                <input
                  type="text"
                  value={sbNo}
                  onChange={(e) => setSbNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-medium">SB Date</label>
                <input
                  type="date"
                  value={sbDate}
                  onChange={(e) => setSbDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <div className="col-span-2 sm:col-span-3 space-y-1">
                <label className="text-slate-600 font-medium">Container Numbers</label>
                <input
                  type="text"
                  value={containerNos}
                  onChange={(e) => setContainerNos(e.target.value)}
                  placeholder="e.g. MSKU-8291024, CMAU-1902847"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Itemized Service Charges (Master-Driven) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Itemized Service Charges &bull; Tax Specifications</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Pick charges from <strong>Service Master</strong>, <strong>Tax Head</strong> &amp; <strong>Tax Head Group</strong> or add custom line items
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Master Service Picker */}
                <select
                  value={selectedQuickServiceId}
                  onChange={(e) => handleAddServiceFromMaster(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50/60 font-medium text-xs text-blue-900 focus:bg-white focus:border-blue-500 cursor-pointer max-w-[280px]"
                >
                  <option value="">+ Add from Service Master ({servicesMaster.length})...</option>
                  {servicesMaster.map(srv => (
                    <option key={srv.id} value={srv.id}>
                      [{srv.service_code}] {srv.service_name} &bull; SAC {srv.sac_code} (₹{(Number(srv.default_sell_rate) || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddCustomLine}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Custom Line</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-2 w-8">#</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Charge Description</th>
                    <th className="py-2.5 px-2 text-center w-24">SAC Code</th>
                    <th className="py-2.5 px-2 text-center w-20">Qty</th>
                    <th className="py-2.5 px-2 text-center w-24">UOM</th>
                    <th className="py-2.5 px-3 text-right w-32">Rate (₹)</th>
                    <th className="py-2.5 px-2 text-center w-24">GST %</th>
                    <th className="py-2.5 px-3 text-right w-32">Taxable (₹)</th>
                    <th className="py-2.5 px-3 text-right w-32">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center w-12">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-sans italic">
                        No service charges added yet. Click &quot;Add from Service Master&quot; or &quot;+ Custom Line&quot; above.
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, idx) => {
                      const lineTaxable = (Number(item.quantity) || 1) * (Number(item.rate) || 0);
                      const effectiveGstRate = (lutEligible && (item.sacCode === '996511' || item.isLut)) ? 0 : (Number(item.gstRate) || 0);
                      const lineTax = (lineTaxable * effectiveGstRate) / 100;
                      const lineTotal = lineTaxable + lineTax;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2 px-2 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.chargeName}
                              onChange={(e) => handleUpdateItem(item.id, 'chargeName', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 font-sans font-medium text-slate-900 bg-transparent"
                            />
                            {item.serviceCode && (
                              <span className="text-[10px] text-blue-600 font-mono block">
                                Code: {item.serviceCode}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="text"
                              value={item.sacCode}
                              onChange={(e) => handleUpdateItem(item.id, 'sacCode', e.target.value)}
                              className="w-20 px-1.5 py-1 text-center rounded border border-slate-200 focus:border-blue-500 font-mono font-bold text-slate-700 bg-white"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                              className="w-16 px-1 py-1 text-center rounded border border-slate-200 focus:border-blue-500 font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600 text-[11px]">
                            <input
                              type="text"
                              value={item.uom || 'CONTAINER'}
                              onChange={(e) => handleUpdateItem(item.id, 'uom', e.target.value)}
                              className="w-20 px-1 py-1 text-center rounded border border-slate-200 text-slate-700 bg-white font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                              className="w-28 px-2 py-1 text-right rounded border border-slate-200 focus:border-blue-500 font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <select
                              value={effectiveGstRate}
                              onChange={(e) => handleUpdateItem(item.id, 'gstRate', e.target.value)}
                              className="px-1.5 py-1 rounded border border-slate-200 font-mono font-bold text-slate-700 bg-white text-xs cursor-pointer"
                            >
                              <option value="0">0% (LUT / Exempt)</option>
                              <option value="5">5% (Transport)</option>
                              <option value="12">12% (Forwarding)</option>
                              <option value="18">18% (Standard Services)</option>
                              <option value="28">28% (Luxury)</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            ₹ {lineTaxable.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-950">
                            ₹ {Math.round(lineTotal).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation Banner */}
            <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                <p>
                  <strong>Tax Supply Mode: </strong>
                  <span className={isInterState ? 'text-indigo-700 font-bold' : 'text-blue-700 font-bold'}>
                    {isInterState ? 'Inter-State (IGST Applicable)' : 'Intra-State (CGST 50% + SGST 50%)'}
                  </span>
                </p>
                <p>
                  <strong>Export LUT Status: </strong>
                  <span className={lutEligible ? 'text-emerald-700 font-bold' : 'text-slate-700 font-bold'}>
                    {lutEligible ? 'Zero-Rated Export (0% GST on Freight)' : 'Standard Taxable Supply'}
                  </span>
                </p>
              </div>

              {/* Totals */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 min-w-[320px] font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-bold text-slate-900">₹ {totals.taxable.toLocaleString('en-IN')}</span>
                </div>
                {!isInterState && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST Total:</span>
                      <span className="font-bold text-slate-900">₹ {totals.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST Total:</span>
                      <span className="font-bold text-slate-900">₹ {totals.sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                {isInterState && (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST Total:</span>
                    <span className="font-bold text-indigo-900">₹ {totals.igst.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                  <span>Total GST Amount:</span>
                  <span className="font-bold text-slate-900">₹ {totals.totalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base border-t-2 border-slate-900 pt-1.5 text-blue-950 font-black">
                  <span>Grand Total (INR):</span>
                  <span>₹ {totals.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAST INVOICES LEDGER (PURANE BANE HUE BILLS)                       */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Total Invoices</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">{historyStats.totalCount}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">&bull; PostgreSQL Ledger</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Total Billed Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-1">
                ₹ {historyStats.totalBilled.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">Inclusive of GST</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Total GST Collected</span>
              <p className="text-xl sm:text-2xl font-black text-indigo-900 font-mono mt-1">
                ₹ {historyStats.totalTax.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-indigo-600 font-medium">GSTR-1 Ready</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Unpaid Invoices</span>
              <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">
                {historyStats.unpaidCount} <span className="text-xs font-normal text-slate-500">bills</span>
              </p>
              <span className="text-[10px] text-amber-700 font-mono font-bold">
                ₹ {historyStats.unpaidAmount.toLocaleString('en-IN')} Due
              </span>
            </div>
          </div>

          {/* Search, Filter & Action Toolbar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by Inv No, Party, Job No, IRN..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium text-slate-900"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                {['ALL', 'PAID', 'UNPAID', 'LUT'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setHistoryFilter(st)}
                    className={`px-2.5 py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                      historyFilter === st ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadPastInvoices}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition cursor-pointer flex items-center gap-1"
                title="Refresh bills from DB"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create New Bill</span>
              </button>
            </div>
          </div>

          {/* Past Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-mono">
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Billed-To Party</th>
                    <th className="py-3 px-3">Job Reference</th>
                    <th className="py-3 px-3 text-right">Taxable</th>
                    <th className="py-3 px-3 text-right">GST / Tax</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">IRN / E-Inv</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {isLoadingInvoices ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                        Loading past bills from database...
                      </td>
                    </tr>
                  ) : filteredPastInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-sans italic">
                        No invoices match your search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPastInvoices.map(inv => {
                      const isPaid = inv.payment_status === 'PAID';
                      const formattedDate = inv.invoice_date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : '—');
                      const hasIrn = !!inv.irn_number;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                          {/* Invoice Number */}
                          <td className="py-3 px-3 font-bold text-blue-900 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleLoadPastInvoice(inv, 'preview')}
                              className="hover:underline flex items-center gap-1 cursor-pointer text-left"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>{inv.invoice_number}</span>
                            </button>
                            <span className="text-[10px] text-slate-500 font-normal block font-sans">
                              {inv.invoice_type || 'TAX INVOICE'}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          {/* Party */}
                          <td className="py-3 px-3 font-sans">
                            <p className="font-bold text-slate-900 max-w-[200px] truncate" title={inv.party_name}>
                              {inv.party_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              GST: <span className="font-semibold text-slate-700">{inv.party_gstin || '—'}</span> &bull; {inv.party_state || 'Delhi'}
                            </p>
                          </td>

                          {/* Job Reference */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800">{inv.job_number || 'Direct'}</span>
                            {inv.container_count && (
                              <span className="text-[10px] text-slate-500 block">
                                {inv.container_count}x Cont
                              </span>
                            )}
                          </td>

                          {/* Taxable */}
                          <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                            ₹ {(Number(inv.taxable_amount) || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Tax */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {inv.is_lut ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                0% (LUT)
                              </span>
                            ) : (
                              <span className="font-bold text-slate-700">
                                ₹ {(Number(inv.total_tax) || 0).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* Grand Total */}
                          <td className="py-3 px-3 text-right font-black text-slate-950 whitespace-nowrap">
                            ₹ {(Number(inv.grand_total) || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Payment Status Toggle */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentStatus(inv)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                              title="Click to toggle Paid/Unpaid"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                              <span>{isPaid ? 'PAID' : 'UNPAID'}</span>
                            </button>
                          </td>

                          {/* IRN Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {hasIrn ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold" title={inv.irn_number}>
                                  NIC IRN ✓
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator?.clipboard?.writeText) {
                                      navigator.clipboard.writeText(inv.irn_number);
                                      setCopiedIrn(inv.id);
                                      setTimeout(() => setCopiedIrn(''), 2000);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                  title="Copy 64-char IRN"
                                >
                                  {copiedIrn === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Manual Draft</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View / Print */}
                              <button
                                type="button"
                                onClick={() => handleLoadPastInvoice(inv, 'preview')}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition cursor-pointer"
                                title="View Printable PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Load in Form / Edit */}
                              <button
                                type="button"
                                onClick={() => handleLoadPastInvoice(inv, 'edit')}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition cursor-pointer"
                                title="Load Details into Editor"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete invoice ${inv.invoice_number}?`)) {
                                    try {
                                      await api.deleteInvoice(inv.id);
                                      showNotice(`Invoice ${inv.invoice_number} deleted.`);
                                      loadPastInvoices();
                                    } catch (err) {
                                      alert('Error deleting invoice: ' + err.message);
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRINTABLE PDF TAX INVOICE (AUTHENTIC DOCUMENT VIEW)                */}
      {/* ========================================================================= */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs">Printable Document View:</span>
              <span className="font-mono text-xs text-blue-700 font-bold">
                {activeInvoicePreview?.docNumber || 'Draft'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                &larr; Back to Creator
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                View Bills Ledger
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {activeInvoicePreview ? (
            <TaxDocumentPdfView
              docType={invoiceType}
              docNumber={activeInvoicePreview.docNumber}
              docDate={activeInvoicePreview.docDate}
              irnStatus={activeInvoicePreview.irnStatus}
              company={companyProfile}
              customer={activeInvoicePreview.customer}
              shipment={activeInvoicePreview.shipment}
              items={activeInvoicePreview.items}
              taxableTotal={activeInvoicePreview.taxableTotal}
              taxTotal={activeInvoicePreview.taxTotal}
              grandTotal={activeInvoicePreview.grandTotal}
              isLut={activeInvoicePreview.isLut}
              onPrint={() => window.print()}
            />
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              No invoice preview generated. Create an invoice or pick one from the Bills Ledger.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
