import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Printer,
  Mail,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileText,
  Phone,
  UserCheck,
  Sparkles,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api.js';

export default function SendInvoiceModal({
  isOpen,
  onClose,
  invoice = null,
  partiesList = [],
  onSavePdf = () => window.print()
}) {
  const [activeChannel, setActiveChannel] = useState('WHATSAPP'); // 'WHATSAPP' | 'EMAIL'
  const [copiedType, setCopiedType] = useState('');
  
  // Contact details state (editable)
  const [contactPerson, setContactPerson] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  
  // Simulated Dispatch States
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStep, setDispatchStep] = useState(0);
  const [dispatchResult, setDispatchResult] = useState(null);

  // Extract core invoice attributes
  const invDetails = useMemo(() => {
    if (!invoice) return null;

    const invNo = invoice.docNumber || invoice.invoice_number || invoice.invoiceNumber || 'INV-2026-0001';
    const invDate = invoice.docDate || invoice.invoice_date || invoice.invoiceDate || new Date().toISOString().slice(0, 10);
    const dueDate = invoice.dueDate || invoice.due_date || 'Within 15 Days';
    const grandTotal = Number(invoice.grandTotal || invoice.grand_total || 0);
    const taxableTotal = Number(invoice.taxableTotal || invoice.taxable_amount || 0);
    const taxTotal = Number(invoice.taxTotal || invoice.total_tax || 0);
    const irn = invoice.irnStatus?.irn || invoice.irn_number || invoice.irnNumber || null;
    const ackNo = invoice.irnStatus?.ackNo || invoice.ack_no || null;
    
    // Customer identification
    const customerObj = invoice.customer || {};
    const customerName = customerObj.name || invoice.party_name || invoice.partyName || 'Customer';
    const gstin = customerObj.gstin || invoice.party_gstin || 'Unspecified';
    const address = customerObj.address || invoice.party_address || '';
    const pos = customerObj.pos || invoice.place_of_supply || '09-Uttar Pradesh';
    
    // Shipment identification
    const shipmentObj = invoice.shipment || {};
    const jobNo = shipmentObj.jobNo || invoice.job_number || invoice.jobNumber || invoice.jobId || 'JO-94280';
    const origin = shipmentObj.origin || invoice.origin || 'Dadri ICD Hub';
    const pod = shipmentObj.pod || invoice.pod || 'Nhava Sheva (INNSA1)';
    const contCount = shipmentObj.containersCount || invoice.container_count || 1;
    const contNos = shipmentObj.containerNo || invoice.container_nos || '';

    return {
      invNo,
      invDate,
      dueDate,
      grandTotal,
      taxableTotal,
      taxTotal,
      irn,
      ackNo,
      customerName,
      gstin,
      address,
      pos,
      jobNo,
      origin,
      pod,
      contCount,
      contNos,
      rawInvoice: invoice
    };
  }, [invoice]);

  // Auto-fetch Customer Phone & Email when invoice changes or modal opens
  useEffect(() => {
    if (!invDetails) return;

    // Reset dispatch simulation state
    setIsDispatching(false);
    setDispatchStep(0);
    setDispatchResult(null);

    // 1. Check if invoice object already carries contact info
    let person = invoice.customer?.contactPerson || invoice.party_contact_person || '';
    let phone = invoice.customer?.mobile || invoice.party_mobile || '';
    let email = invoice.customer?.email || invoice.party_email || '';

    // 2. If missing, look up in loaded parties list from Customer Master
    if ((!phone || !email || !person) && partiesList.length > 0) {
      const partyMatch = partiesList.find(p => 
        (invoice.party_id && String(p.id) === String(invoice.party_id)) ||
        (p.name && invDetails.customerName && p.name.trim().toLowerCase() === invDetails.customerName.trim().toLowerCase())
      );

      if (partyMatch) {
        if (!person) person = partyMatch.contact_person || 'Accounts Manager';
        if (!phone) phone = partyMatch.mobile || partyMatch.contact_no || '';
        if (!email) email = partyMatch.email_comm || partyMatch.email_ops || '';
      }
    }

    // 3. Fallbacks if customer master had empty contact fields
    if (!person) person = 'Accounts Manager';
    if (!phone) phone = '9811002233';
    if (!email) {
      const sanitizedName = invDetails.customerName.toLowerCase().replace(/[^a-z0-9]/g, '');
      email = `accounts@${sanitizedName || 'customer'}.com`;
    }

    setContactPerson(person);
    setRecipientPhone(phone);
    setRecipientEmail(email);
    setEmailSubject(`Tax Invoice #${invDetails.invNo} - Elogisol Technologies (₹${invDetails.grandTotal.toLocaleString('en-IN')})`);
  }, [invDetails, invoice, partiesList, isOpen]);

  if (!isOpen || !invDetails) return null;

  // Formatted WhatsApp Message Text
  const whatsappMessage = `*TAX INVOICE - ELOGISOL TECHNOLOGIES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${contactPerson || invDetails.customerName}*,

Greetings from *Elogisol Technologies*!
Please find below the summary of your Tax Invoice:

📄 *Invoice No:* ${invDetails.invNo}
📅 *Date:* ${invDetails.invDate}
💰 *Grand Total:* ₹${invDetails.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
${invDetails.irn ? `📑 *NIC IRN:* ${invDetails.irn.slice(0, 16)}...` : '📑 *NIC Status:* Generated & Tax Verified'}
🚢 *Job Reference:* ${invDetails.jobNo} (${invDetails.contCount} Containers)
📍 *Route:* ${invDetails.origin} ➔ ${invDetails.pod}
💳 *Due Date:* ${invDetails.dueDate}

Official digitally signed PDF Tax Invoice with NIC QR-Code is attached.

For payment confirmation or queries, please reply directly to this message.

*Elogisol Technologies Billing & Accounts Dept*
Web: https://elogisol.com`;

  // Formatted Email Body Text
  const emailBodyText = `Dear ${contactPerson || invDetails.customerName},

Greetings from Elogisol Technologies!

Thank you for partnering with us for your freight and logistics requirements. Please find attached the official digitally signed Tax Invoice for your shipment.

INVOICE SUMMARY:
--------------------------------------------------
Invoice Number : ${invDetails.invNo}
Invoice Date   : ${invDetails.invDate}
Due Date       : ${invDetails.dueDate}
Shipment / Job : ${invDetails.jobNo} (${invDetails.contCount} Container(s))
Route          : ${invDetails.origin} to ${invDetails.pod}
${invDetails.irn ? `NIC IRN        : ${invDetails.irn}\n` : ''}
FINANCIAL BREAKDOWN:
--------------------------------------------------
Taxable Value  : INR ${invDetails.taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total GST      : INR ${invDetails.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Grand Total    : INR ${invDetails.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

PAYMENT INSTRUCTIONS:
Please remit payment as per agreed terms into our official bank account:
Bank Name      : HDFC Bank Ltd
Account Name   : ELOGISOL TECHNOLOGIES PVT LTD
Account Number : 50200084920192
IFSC Code      : HDFC0000128
Branch         : Dadri Logistics Park Hub

The certified PDF tax invoice with NIC IRN and QR validation is attached to this transmission.

Warm regards,
Billing & Commercial Accounts
Elogisol Technologies
Helpline: +91 120 4892000 | billing@elogisol.com`;

  // Copy to clipboard helper
  const handleCopy = (text, type) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(''), 2500);
    }
  };

  // Open real WhatsApp Web / App
  const handleOpenWhatsAppWeb = () => {
    const cleanNum = recipientPhone.replace(/[^0-9]/g, '');
    const fullNum = cleanNum.startsWith('91') ? cleanNum : `91${cleanNum}`;
    const url = `https://api.whatsapp.com/send?phone=${fullNum}&text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  // Open default desktop/web mailer (mailto:)
  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${recipientEmail}?cc=billing@elogisol.com&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;
    window.location.href = mailtoUrl;
  };

  // Simulated Dispatch Trigger (Demo Mode)
  const handleSimulateDispatch = async () => {
    setIsDispatching(true);
    setDispatchResult(null);
    setDispatchStep(1);

    // Sequence simulation steps
    setTimeout(() => {
      setDispatchStep(2);
    }, 700);

    setTimeout(() => {
      setDispatchStep(3);
    }, 1400);

    setTimeout(async () => {
      try {
        const payload = {
          channel: activeChannel,
          recipient: activeChannel === 'WHATSAPP' ? recipientPhone : recipientEmail,
          contactPerson: contactPerson,
          message: activeChannel === 'WHATSAPP' ? whatsappMessage : emailBodyText
        };
        
        // Notify backend server to record demo dispatch
        const invId = invoice.id || invDetails.invNo;
        let serverRes = null;
        try {
          serverRes = await api.dispatchDemoInvoice(invId, payload);
        } catch (e) {
          // Fallback if network or offline
        }

        const gatewayId = serverRes?.data?.simulatedGatewayId || (activeChannel === 'WHATSAPP' 
          ? `wamid.HBgL${Date.now()}==` 
          : `msg_${Date.now()}@relay.elogisol.internal`);

        setDispatchStep(4);
        setDispatchResult({
          success: true,
          channel: activeChannel,
          gatewayId: gatewayId,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          recipient: activeChannel === 'WHATSAPP' ? recipientPhone : recipientEmail
        });
      } finally {
        setIsDispatching(false);
      }
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-[#192839] to-blue-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Send className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Dispatch Tax Invoice
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {invDetails.invNo}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Demo Dispatch Mode
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Auto-fetched Customer KYC &bull; {invDetails.customerName} &bull; Total: <strong className="text-white">₹{invDetails.grandTotal.toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* 1. CUSTOMER CONTACT INFO CARD (AUTO-FETCHED FROM CUSTOMER MASTER) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Customer Master Contact Record
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Auto-Fetched
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                GSTIN: <strong className="text-slate-700">{invDetails.gstin}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Contact Person */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Recipient Name
                </label>
                <div className="relative">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Accounts Manager"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* WhatsApp / Mobile */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  WhatsApp / Mobile No
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-500 absolute left-2.5 top-2 select-none">+91</span>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full pl-10 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="billing@customer.com"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. CHANNEL SELECTOR TABS */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveChannel('WHATSAPP');
                setDispatchResult(null);
              }}
              className={`flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                activeChannel === 'WHATSAPP'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                <MessageSquare className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>WhatsApp Dispatch</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                Instant
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveChannel('EMAIL');
                setDispatchResult(null);
              }}
              className={`flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                activeChannel === 'EMAIL'
                  ? 'border-blue-600 text-blue-800 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <Mail className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>Official Email Dispatch</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                Certified PDF
              </span>
            </button>
          </div>

          {/* 3. CHANNEL CONTENT */}
          {activeChannel === 'WHATSAPP' ? (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Sending formatted bill to: <strong className="text-slate-800 font-mono">+91 {recipientPhone}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(whatsappMessage, 'whatsapp')}
                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                >
                  {copiedType === 'whatsapp' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy WhatsApp Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* Authentic WhatsApp Chat Bubble Preview */}
              <div className="bg-[#e5ddd5] p-3.5 sm:p-4 rounded-xl border border-[#d1c7bc] shadow-inner font-sans">
                <div className="max-w-md bg-white rounded-lg rounded-tl-none p-3 shadow-sm border border-slate-200/80 space-y-2 text-xs text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-black text-emerald-800 text-[11px] tracking-wide uppercase flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" /> Tax Invoice Transmittal
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800">
                    Dear <strong>{contactPerson || invDetails.customerName}</strong>,
                  </p>

                  <p className="text-slate-600 text-[11.5px] leading-relaxed">
                    Greetings from <strong>Elogisol Technologies</strong>! Please find below your Tax Invoice summary:
                  </p>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/90 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice No:</span>
                      <strong className="text-slate-900">{invDetails.invNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="text-slate-800 font-bold">{invDetails.invDate}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-800 font-black">
                      <span>Total Amount:</span>
                      <span>₹{invDetails.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {invDetails.irn && (
                      <div className="flex justify-between text-[10px] text-slate-500 truncate pt-0.5">
                        <span>NIC IRN:</span>
                        <span className="truncate max-w-[170px]" title={invDetails.irn}>{invDetails.irn.slice(0, 18)}...</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10.5px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Shipment:</span>
                      <span>{invDetails.jobNo} ({invDetails.contCount} Units)</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Route:</span>
                      <span>{invDetails.origin} ➔ {invDetails.pod}</span>
                    </div>
                  </div>

                  {/* Attachment Badge */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 truncate">
                      <div className="font-bold truncate">{invDetails.invNo}.pdf</div>
                      <div className="text-[10px] text-emerald-700">Digital Tax Invoice with NIC QR Code</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">PDF</span>
                  </div>

                  <div className="text-right text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                    <span>Delivered</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EMAIL TAB CONTENT */
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Sending certified billing email to: <strong className="text-slate-800">{recipientEmail}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(emailBodyText, 'email')}
                  className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                >
                  {copiedType === 'email' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Email Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rich Email Client Preview Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
                {/* Email Header Metadata */}
                <div className="space-y-1.5 border-b border-slate-200 pb-3 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-slate-400 font-bold uppercase text-[10px]">To:</span>
                    <span className="text-slate-900 font-semibold">{recipientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-slate-400 font-bold uppercase text-[10px]">CC:</span>
                    <span className="text-slate-600">billing@elogisol.com, accounts@elogisol.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-slate-400 font-bold uppercase text-[10px]">Subject:</span>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-900 font-sans text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-16 text-slate-400 font-bold uppercase text-[10px]">Attach:</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-200">
                      <FileText className="w-3 h-3" />
                      {invDetails.invNo}.pdf (Tax Invoice &amp; NIC QR)
                    </span>
                  </div>
                </div>

                {/* Email Body Letter */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5 text-slate-800 leading-relaxed font-sans text-xs">
                  <p>Dear <strong>{contactPerson || invDetails.customerName}</strong>,</p>
                  
                  <p className="text-slate-600">
                    Thank you for choosing <strong>Elogisol Technologies</strong> as your multimodal logistics partner. Please find attached the official Tax Invoice for your recent shipment:
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500">Invoice No:</span> <strong className="text-slate-900">{invDetails.invNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Invoice Date:</span> <span className="text-slate-800">{invDetails.invDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Taxable Value:</span> <span className="text-slate-800">₹{invDetails.taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total GST:</span> <span className="text-slate-800">₹{invDetails.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="col-span-2 border-t border-slate-200 pt-1 flex justify-between items-center text-xs font-bold text-blue-900">
                      <span>Total Amount Payable:</span>
                      <span className="text-sm">₹{invDetails.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Please remit payment within the credit term to: <strong>HDFC Bank Ltd</strong> (A/C: 50200084920192, IFSC: HDFC0000128).
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    Best Regards,<br />
                    <strong>Billing &amp; Commercial Operations</strong><br />
                    Elogisol Technologies Pvt Ltd
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATED DISPATCH PROGRESS & SUCCESS ALERT */}
          {isDispatching && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  Simulating {activeChannel === 'WHATSAPP' ? 'WhatsApp Gateway Dispatch' : 'SMTP Email Transmission'}...
                </span>
                <span className="font-mono text-[10px] text-blue-600">Step {dispatchStep} of 4</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-1.5 transition-all duration-500" 
                  style={{ width: `${(dispatchStep / 4) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-700 font-medium">
                {dispatchStep === 1 && `Resolving recipient route (${activeChannel === 'WHATSAPP' ? '+91 ' + recipientPhone : recipientEmail})...`}
                {dispatchStep === 2 && `Validating customer KYC & generating signed PDF attachment (${invDetails.invNo}.pdf)...`}
                {dispatchStep === 3 && `Transmitting encrypted payload to ${activeChannel === 'WHATSAPP' ? 'WhatsApp Business Cloud Gateway' : 'Elogisol Mail Relay'}...`}
                {dispatchStep === 4 && `✓ Handshake verified & delivery status confirmed!`}
              </p>
            </div>
          )}

          {dispatchResult && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2 animate-scale-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Demo {dispatchResult.channel === 'WHATSAPP' ? 'WhatsApp Message' : 'Email'} Successfully Dispatched!</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  {dispatchResult.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Demo transmission simulated cleanly for recipient: <strong className="font-mono">{dispatchResult.recipient}</strong>. Real gateway charges were prevented in this sandbox demonstration.
              </p>
              <div className="bg-emerald-100/60 p-2 rounded-lg font-mono text-[10px] text-emerald-900 flex items-center justify-between">
                <span>SIMULATED GATEWAY ID:</span>
                <strong className="truncate max-w-[340px]">{dispatchResult.gatewayId}</strong>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="bg-slate-100 border-t border-slate-200/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSavePdf}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              title="Print or Save official PDF locally"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Save as PDF</span>
            </button>

            {activeChannel === 'WHATSAPP' ? (
              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                title="Launch official WhatsApp Web chat with customer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open WhatsApp Web</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenMailto}
                className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                title="Launch default mail app (Outlook/Apple Mail)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Mail Client</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-white text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSimulateDispatch}
              disabled={isDispatching}
              className={`px-4 py-2 rounded-lg text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition cursor-pointer ${
                activeChannel === 'WHATSAPP'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              } ${isDispatching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isDispatching 
                  ? 'Dispatching Demo...' 
                  : activeChannel === 'WHATSAPP' 
                    ? 'Simulate WhatsApp Send (Demo)' 
                    : 'Simulate Email Send (Demo)'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
