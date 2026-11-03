import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import TaxDocumentPdfView from '../components/TaxDocumentPdfView.jsx';
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
  Edit3
} from 'lucide-react';

export default function InvoicingView({ jobs = [], job = null, triggerGenerateInvoice = 0 }) {
  const [activeJobState, setActiveJobState] = useState(job || jobs[0] || null);
  const [lutEligible, setLutEligible] = useState(true);
  const [irnStatus, setIrnStatus] = useState(null);
  const [isGeneratingIrn, setIsGeneratingIrn] = useState(false);
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' or 'editor'

  useEffect(() => {
    if (job) {
      setActiveJobState(job);
    } else if (jobs.length > 0 && !activeJobState) {
      setActiveJobState(jobs[0]);
    }
  }, [jobs, job]);

  const currentJob = activeJobState || job || jobs[0] || {
    id: 'DEMO-INV-DRAFT',
    customer: 'Fair Exports (India) Pvt Ltd',
    consignor: 'Fair Exports (India) Pvt Ltd',
    consignee: 'Al Maya Trading LLC (Dubai, UAE)',
    origin: 'Dadri ICD (INICD6)',
    pod: 'Jebel Ali (AEJEA)',
    line: 'Maersk Line India Pvt Ltd',
    vessel: 'MAERSK COLOMBO',
    voyage: '2604W',
    containersCount: 1,
    size: "40' HC",
    sellFreight: 185000
  };

  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: 1,
      head: 'Basic Ocean Freight (BOF)',
      sac: '996511',
      qty: currentJob.containersCount || (currentJob.containers ? currentJob.containers.length : 1),
      rate: currentJob.sellFreight || 135000,
      taxRate: 0
    },
    {
      id: 2,
      head: 'Terminal Handling Charges (THC)',
      sac: '996719',
      qty: currentJob.containersCount || (currentJob.containers ? currentJob.containers.length : 1),
      rate: 12500,
      taxRate: 18
    },
    {
      id: 3,
      head: 'Inland Haulage Charges (IHC - Rail)',
      sac: '996511',
      qty: currentJob.containersCount || (currentJob.containers ? currentJob.containers.length : 1),
      rate: 34000,
      taxRate: 18
    }
  ]);

  useEffect(() => {
    if (currentJob) {
      const cnt = currentJob.containersCount || (currentJob.containers ? currentJob.containers.length : 1);
      const rate = currentJob.sellFreight || 135000;
      setInvoiceItems([
        {
          id: 1,
          head: 'Basic Ocean Freight (BOF)',
          sac: '996511',
          qty: cnt,
          rate: rate,
          taxRate: lutEligible ? 0 : 5
        },
        {
          id: 2,
          head: 'Terminal Handling Charges (THC)',
          sac: '996719',
          qty: cnt,
          rate: 12500,
          taxRate: 18
        },
        {
          id: 3,
          head: 'Inland Haulage Charges (IHC - Rail)',
          sac: '996511',
          qty: cnt,
          rate: 34000,
          taxRate: 18
        }
      ]);
    }
  }, [currentJob, lutEligible]);

  const handleRateChange = (idx, newRate) => {
    const updated = [...invoiceItems];
    updated[idx].rate = Number(newRate) || 0;
    setInvoiceItems(updated);
  };

  const taxableTotal = invoiceItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const taxTotal = invoiceItems.reduce(
    (acc, item) => acc + ((item.qty * item.rate) * (lutEligible && item.sac === '996511' ? 0 : item.taxRate)) / 100,
    0
  );
  const grandTotal = taxableTotal + taxTotal;

  // AI Copilot End-to-End Invoice Generation Trigger
  useEffect(() => {
    if (triggerGenerateInvoice > 0) {
      handleGenerateIrn();
    }
  }, [triggerGenerateInvoice]);

  const handleGenerateIrn = async () => {
    setIsGeneratingIrn(true);
    try {
      const irnNum = '8492' + Math.floor(100000000000 + Math.random() * 900000000000);
      await api.createInvoice({
        jobNumber: currentJob.joNo || currentJob.id,
        partyName: currentJob.consignor || currentJob.customer || 'Fair Exports (India) Pvt Ltd',
        taxableAmount: taxableTotal,
        cgstAmount: lutEligible ? 0 : taxTotal / 2,
        sgstAmount: lutEligible ? 0 : taxTotal / 2,
        igstAmount: 0,
        isLut: lutEligible,
        irnNumber: irnNum,
        items: invoiceItems
      });

      setIrnStatus({
        irn: irnNum,
        ackNo: '122610' + Math.floor(10000 + Math.random() * 90000),
        ackDate: new Date().toLocaleDateString('en-GB')
      });
    } catch (err) {
      console.warn('Invoice IRN creation error:', err);
      setIrnStatus({
        irn: '8492011928492019481920491029481029481029481029',
        ackNo: '12261084920',
        ackDate: new Date().toLocaleDateString('en-GB')
      });
    } finally {
      setIsGeneratingIrn(false);
    }
  };

  const invoiceNumber = `INV-2026-${String(currentJob.id || '0001').replace(/[^0-9]/g, '').slice(-4) || '0042'}`;
  const todayStr = new Date().toLocaleDateString('en-GB');

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Controls */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Tax Invoice Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Commercial Billing &bull; GST Itemized Invoices &bull; Panvaya E-Invoice NIC IRN Portal
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'pdf' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Printable PDF Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'editor' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Rate Editor</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerateIrn}
            disabled={isGeneratingIrn}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isGeneratingIrn ? 'Generating IRN...' : 'Generate NIC IRN'}</span>
          </button>
        </div>
      </div>

      {/* Job Selector Strip */}
      {jobs.length > 0 && (
        <div className="no-print p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto text-xs">
          <span className="font-semibold text-slate-500 whitespace-nowrap">Select Job:</span>
          {jobs.map((j) => (
            <button
              key={j.id}
              onClick={() => setActiveJobState(j)}
              className={
                'px-3 py-1 rounded-lg font-mono font-medium transition whitespace-nowrap cursor-pointer ' +
                (activeJobState && activeJobState.id === j.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700')
              }
            >
              {j.id || j.joNo} ({j.customer || j.consignor})
            </button>
          ))}
        </div>
      )}

      {/* ================= VIEW 1: PRINTABLE PDF TAX INVOICE ================= */}
      {activeTab === 'pdf' && (
        <TaxDocumentPdfView
          docType="TAX INVOICE"
          docNumber={invoiceNumber}
          docDate={todayStr}
          irnStatus={irnStatus}
          customer={{
            name: currentJob.customer || currentJob.consignor || 'Fair Exports (India) Pvt Ltd',
            address: 'Plot 4, Ecotech-II, Udyog Vihar, Greater Noida, UP - 201306',
            gstin: '09AAACF9128M1Z8',
            state: 'Uttar Pradesh (09)',
            pos: currentJob.origin || 'Dadri ICD (INICD6)'
          }}
          shipment={{
            jobNo: currentJob.id || currentJob.joNo || 'JOB-JO-2026-0001',
            origin: currentJob.origin || currentJob.fromLocation || 'Dadri ICD',
            pod: currentJob.pod || currentJob.toLocation || 'Jebel Ali (AEJEA)',
            line: currentJob.line || currentJob.shippingLine || 'Maersk Line India Pvt Ltd',
            vessel: currentJob.vessel || 'MAERSK COLOMBO',
            voyage: currentJob.voyage || '2604W',
            containersCount: currentJob.containersCount || 1,
            size: currentJob.size || "40' HC"
          }}
          items={invoiceItems}
          taxableTotal={taxableTotal}
          taxTotal={taxTotal}
          grandTotal={grandTotal}
          isLut={lutEligible}
          onPrint={() => window.print()}
        />
      )}

      {/* ================= VIEW 2: RATE & SAC EDITOR ================= */}
      {activeTab === 'editor' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">GST Itemized Rates &amp; Charge Heads</h2>
              <p className="text-slate-500 text-[11px]">Adjust billing tariff rates before generating final tax invoice</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lutEligible}
                onChange={(e) => setLutEligible(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-700">Export LUT Zero-Rated (Rule 96A)</span>
            </label>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-mono">
                <th className="py-2.5 px-3">Charge Description</th>
                <th className="py-2.5 px-3 text-center">SAC Code</th>
                <th className="py-2.5 px-3 text-center">Quantity</th>
                <th className="py-2.5 px-3 text-right">Rate Per Unit (₹)</th>
                <th className="py-2.5 px-3 text-center">GST %</th>
                <th className="py-2.5 px-3 text-right">Taxable Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {invoiceItems.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-sans font-medium text-slate-900">{item.head}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{item.sac}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{item.qty}</td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleRateChange(idx, e.target.value)}
                      className="w-32 px-2.5 py-1 text-right rounded border border-slate-200 focus:border-blue-500 font-mono font-bold text-slate-900"
                    />
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700 font-bold">
                    {lutEligible && item.sac === '996511' ? '0% (LUT)' : `${item.taxRate}%`}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-950">
                    ₹ {(item.qty * item.rate).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-6 font-mono text-xs">
            <div>
              <span className="text-slate-500">Taxable Value: </span>
              <span className="font-bold text-slate-900">₹ {taxableTotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Tax: </span>
              <span className="font-bold text-slate-900">₹ {taxTotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-500">Grand Total: </span>
              <span className="font-black text-blue-700 text-sm">₹ {grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
