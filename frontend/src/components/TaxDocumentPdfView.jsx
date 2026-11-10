import React from 'react';
import { Printer, QrCode } from 'lucide-react';

export default function TaxDocumentPdfView({
  docType = 'TAX INVOICE', // 'TAX INVOICE', 'CREDIT NOTE', 'DEBIT NOTE'
  docNumber,
  docDate,
  origInvoiceNo,
  origInvoiceDate,
  irnStatus,
  customer = {},
  shipment = {},
  items = [],
  containers = [],
  taxableTotal = 0,
  taxTotal = 0,
  grandTotal = 0,
  isLut = true,
  reason = '',
  onPrint = () => window.print()
}) {
  // Convert number to Indian currency words
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
      let str = '';
      if (n > 9999999) {
        str += inWords(Math.floor(n / 10000000)) + 'Crore ';
        n %= 10000000;
      }
      if (n > 99999) {
        str += inWords(Math.floor(n / 100000)) + 'Lakh ';
        n %= 100000;
      }
      if (n > 999) {
        str += inWords(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
      }
      if (n > 99) {
        str += inWords(Math.floor(n / 100)) + 'Hundred ';
        n %= 100;
      }
      if (n > 0) {
        if (str !== '') str += 'and ';
        if (n < 20) str += a[n];
        else {
          str += b[Math.floor(n / 10)];
          if (n % 10 > 0) str += ' ' + a[n % 10];
        }
      }
      return str;
    };

    const rounded = Math.round(num);
    if (rounded === 0) return 'Zero Rupees Only';
    return 'Indian Rupees ' + inWords(rounded).trim() + ' Only';
  };

  const isCreditDebit = docType === 'CREDIT NOTE' || docType === 'DEBIT NOTE';

  // Sample or live container movements
  const contList = containers.length > 0 ? containers : [
    {
      sr: 1,
      partyInvNo: shipment.partyInvoiceNo || 'PI-2026-9810',
      poDate: docDate,
      contNo: shipment.containerNo || 'MSKU-8291024',
      icdOut: '28/10/2026',
      icdIn: '29/10/2026',
      handover: '30/10/2026',
      freeDays: 14,
      totalDays: 3,
      detDays: 0,
      detAmt: '0.00'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto my-3 font-sans text-black">
      {/* Action Bar (Hidden in Print) */}
      <div className="no-print flex items-center justify-between pb-2 mb-2 border-b border-slate-300">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-wide">
            SPJ-2 Standard &bull; {docType}
          </span>
          <span className="text-xs font-mono font-bold text-slate-700">{docNumber}</span>
        </div>

        <button
          type="button"
          onClick={onPrint}
          className="px-4 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow flex items-center gap-1.5 transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* ================= AUTHENTIC SPJ-2 PRINTABLE SHEET ================= */}
      <div className="bg-white border-2 border-slate-400 p-6 sm:p-8 space-y-3 print:border-0 print:p-0 print:m-0 text-slate-900 leading-normal text-[11px] font-sans">
        
        {/* SPJ-2 TOP HEADER */}
        <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Logo / Company Identity */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-950 font-serif">
              {docType}
            </h1>
            <h2 className="text-lg font-black tracking-tight text-blue-950 font-sans mt-0.5">
              SPJ CARGO PVT. LTD.
            </h2>
            <p className="text-[11px] font-medium text-slate-600">
              Complete Logistics Solution Provider &bull; Multimodal Transport Operator
            </p>
            <p className="text-[11px] text-slate-700">
              D-9/3, Okhla Industrial Area Phase-1, New Delhi-110020
            </p>
            <div className="flex flex-wrap gap-x-4 text-[11px] font-mono font-bold text-slate-800 mt-1">
              <span>GSTIN: 07AAFPB3130K1Z5</span>
              <span>PAN: AAFPB3130K</span>
              <span>Tel: +91 - 11-41062143-2147</span>
              <span>Email: accounts@spjcargo.com</span>
            </div>
          </div>

          {/* Right Recipient Checkbox & QR/Barcode Block */}
          <div className="flex flex-col items-end shrink-0 text-right space-y-1.5">
            <div className="border border-slate-400 p-2 rounded bg-slate-50 text-[10px] font-bold text-slate-800 space-y-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-blue-600" />
                <span>Original For Recipient</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 text-blue-600" />
                <span>Duplicate For Supplier</span>
              </label>
            </div>

            {/* NIC QR Code Box */}
            <div className="w-14 h-14 border border-slate-400 bg-white p-1 rounded flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
          </div>
        </div>

        {/* TWO-COLUMN FRAME BOX (EXACT SPJ-2 FIELD LAYOUT) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          {/* Left Frame: Customer / Shipper Details */}
          <div className="border border-slate-400 p-3 bg-white space-y-1">
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">To:</span>
              <span className="col-span-2 font-black text-xs text-slate-950">
                {customer.name || 'Fair Exports (India) Pvt Ltd'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Add:</span>
              <span className="col-span-2 text-slate-800 leading-tight">
                {customer.address || 'Plot 4, Ecotech-II, Udyog Vihar, Greater Noida, UP - 201306'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">State Code:</span>
              <span className="col-span-2 font-mono text-slate-900">
                {customer.state || '09 - Uttar Pradesh'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">GSTIN:</span>
              <span className="col-span-2 font-mono font-bold text-slate-900">
                {customer.gstin || '09AAACF9128M1Z8'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Customer Type:</span>
              <span className="col-span-2 text-slate-800 font-semibold">Exporter / Shipper</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Line:</span>
              <span className="col-span-2 text-slate-900 font-semibold">
                {shipment.line || 'Maersk Line India Pvt Ltd'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">BL No:</span>
              <span className="col-span-2 font-mono font-bold text-blue-900">
                {shipment.blNo || 'BL-2026-DXB-981'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">SB No. &amp; Date:</span>
              <span className="col-span-2 font-mono text-slate-900">
                {shipment.sbNo || 'SB-7891240'} Dt. {shipment.sbDate || docDate}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">ETD / SOB Date:</span>
              <span className="col-span-2 font-mono text-slate-900">
                {shipment.sobDate || docDate}
              </span>
            </div>
          </div>

          {/* Right Frame: Invoice & Shipment Specs */}
          <div className="border border-slate-400 p-3 bg-white space-y-1">
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Invoice No:</span>
              <span className="col-span-2 font-mono font-black text-xs text-blue-950">
                {docNumber}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Dated:</span>
              <span className="col-span-2 font-mono font-bold text-slate-900">{docDate}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Job No:</span>
              <span className="col-span-2 font-mono font-bold text-slate-900">
                {shipment.jobNo || 'JO-94280'}
              </span>
            </div>
            {isCreditDebit && origInvoiceNo && (
              <div className="grid grid-cols-3 gap-1 bg-rose-50 p-1 border border-rose-200 rounded">
                <span className="font-bold text-rose-800">Orig Inv Ref:</span>
                <span className="col-span-2 font-mono font-bold text-rose-900">
                  {origInvoiceNo} ({origInvoiceDate || docDate})
                </span>
              </div>
            )}
            {isCreditDebit && reason && (
              <div className="grid grid-cols-3 gap-1">
                <span className="font-bold text-slate-600">Reason:</span>
                <span className="col-span-2 text-slate-900 font-semibold">{reason}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Mode:</span>
              <span className="col-span-2 text-slate-900">Ocean Freight (FCL)</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Place of Supply:</span>
              <span className="col-span-2 font-mono text-slate-900">
                {customer.pos || '09-Uttar Pradesh'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Size &amp; Type:</span>
              <span className="col-span-2 font-mono text-slate-900">
                {shipment.containersCount || 1}x {shipment.size || "40'"} {shipment.type || "HC Reefer"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Consignee:</span>
              <span className="col-span-2 text-slate-900 font-semibold truncate">
                {shipment.consignee || 'Al Maya Trading LLC (Dubai, UAE)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">POL &amp; POD:</span>
              <span className="col-span-2 font-mono text-slate-900">
                {shipment.origin || 'Nhava Sheva (INNSA1)'} &rarr; {shipment.pod || 'Jebel Ali (AEJEA)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="font-bold text-slate-600">Vessel &amp; Voyage:</span>
              <span className="col-span-2 font-mono text-slate-900">
                {shipment.vessel || 'MAERSK COLOMBO'} ({shipment.voyage || '2604W'})
              </span>
            </div>
          </div>
        </div>

        {/* SPJ-2 SECTION 1: MOVEMENT DETAILS (CONTAINER WISE) */}
        <div>
          <div className="text-center font-bold text-xs uppercase tracking-wide border-t border-b border-slate-900 py-1 bg-slate-100">
            MOVEMENT DETAILS
          </div>
          <table className="w-full text-left border-collapse border border-slate-400 text-[10px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-400 text-slate-800 font-mono font-bold uppercase text-center">
                <th className="border border-slate-400 py-1 px-1 w-8">Sr.</th>
                <th className="border border-slate-400 py-1 px-2">Party Inv No.</th>
                <th className="border border-slate-400 py-1 px-2">Date</th>
                <th className="border border-slate-400 py-1 px-2">Container No</th>
                <th className="border border-slate-400 py-1 px-2">ICD Out</th>
                <th className="border border-slate-400 py-1 px-2">ICD In</th>
                <th className="border border-slate-400 py-1 px-2">Handover</th>
                <th className="border border-slate-400 py-1 px-1">Free Days</th>
                <th className="border border-slate-400 py-1 px-1">Total Days</th>
                <th className="border border-slate-400 py-1 px-1">Det. Days</th>
                <th className="border border-slate-400 py-1 px-2 text-right">Det Amt.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono text-center">
              {contList.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border border-slate-400 py-1 px-1">{idx + 1}</td>
                  <td className="border border-slate-400 py-1 px-2 font-sans font-bold">{c.partyInvNo}</td>
                  <td className="border border-slate-400 py-1 px-2">{c.poDate}</td>
                  <td className="border border-slate-400 py-1 px-2 font-bold text-blue-900">{c.contNo}</td>
                  <td className="border border-slate-400 py-1 px-2">{c.icdOut}</td>
                  <td className="border border-slate-400 py-1 px-2">{c.icdIn}</td>
                  <td className="border border-slate-400 py-1 px-2">{c.handover}</td>
                  <td className="border border-slate-400 py-1 px-1">{c.freeDays}</td>
                  <td className="border border-slate-400 py-1 px-1">{c.totalDays}</td>
                  <td className="border border-slate-400 py-1 px-1">{c.detDays}</td>
                  <td className="border border-slate-400 py-1 px-2 text-right font-bold">₹ {c.detAmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SPJ-2 SECTION 2: CHARGE DETAILS (TAX INVOICE GRID) */}
        <div>
          <div className="text-center font-bold text-xs uppercase tracking-wide border-t border-b border-slate-900 py-1 bg-slate-100">
            CHARGE DETAILS &bull; GST SPECIFICATIONS
          </div>
          <table className="w-full text-left border-collapse border border-slate-400 text-[10px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-400 text-slate-800 font-mono font-bold uppercase text-center">
                <th className="border border-slate-400 py-1.5 px-1 w-7">Sr.</th>
                <th className="border border-slate-400 py-1.5 px-2 text-left">Description of Services</th>
                <th className="border border-slate-400 py-1.5 px-1">SAC</th>
                <th className="border border-slate-400 py-1.5 px-1">Qty</th>
                <th className="border border-slate-400 py-1.5 px-1">Curr</th>
                <th className="border border-slate-400 py-1.5 px-2 text-right">Rate</th>
                <th className="border border-slate-400 py-1.5 px-2 text-right">Taxable</th>
                <th className="border border-slate-400 py-1.5 px-1">CGST%</th>
                <th className="border border-slate-400 py-1.5 px-1.5 text-right">CGST Amt</th>
                <th className="border border-slate-400 py-1.5 px-1">SGST%</th>
                <th className="border border-slate-400 py-1.5 px-1.5 text-right">SGST Amt</th>
                <th className="border border-slate-400 py-1.5 px-1">IGST%</th>
                <th className="border border-slate-400 py-1.5 px-1.5 text-right">IGST Amt</th>
                <th className="border border-slate-400 py-1.5 px-2 text-right">Total Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono text-[10px]">
              {items.map((item, idx) => {
                const taxRate = isLut && item.sac === '996511' ? 0 : (item.taxRate || 0);
                const taxable = (item.qty || 1) * (item.rate || 0);
                const cgstRate = taxRate > 0 ? (taxRate / 2) : 0;
                const sgstRate = taxRate > 0 ? (taxRate / 2) : 0;
                const cgstAmt = (taxable * cgstRate) / 100;
                const sgstAmt = (taxable * sgstRate) / 100;
                const lineTotal = taxable + cgstAmt + sgstAmt;

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="border border-slate-400 py-1.5 px-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 py-1.5 px-2 font-sans font-bold text-slate-900">
                      {item.head || item.description}
                      {item.sac === '996511' && isLut && (
                        <span className="block text-[8px] text-emerald-800 font-mono">
                          Zero Rated Export Freight (LUT Rule 96A)
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-400 py-1.5 px-1 text-center">{item.sac || '996511'}</td>
                    <td className="border border-slate-400 py-1.5 px-1 text-center font-bold">{item.qty || 1}</td>
                    <td className="border border-slate-400 py-1.5 px-1 text-center">INR</td>
                    <td className="border border-slate-400 py-1.5 px-2 text-right">{(item.rate || 0).toLocaleString('en-IN')}</td>
                    <td className="border border-slate-400 py-1.5 px-2 text-right font-bold">{(taxable).toLocaleString('en-IN')}</td>
                    <td className="border border-slate-400 py-1.5 px-1 text-center">{cgstRate}%</td>
                    <td className="border border-slate-400 py-1.5 px-1.5 text-right">{cgstAmt.toLocaleString('en-IN')}</td>
                    <td className="border border-slate-400 py-1.5 px-1 text-center">{sgstRate}%</td>
                    <td className="border border-slate-400 py-1.5 px-1.5 text-right">{sgstAmt.toLocaleString('en-IN')}</td>
                    <td className="border border-slate-400 py-1.5 px-1 text-center">0%</td>
                    <td className="border border-slate-400 py-1.5 px-1.5 text-right">0.00</td>
                    <td className="border border-slate-400 py-1.5 px-2 text-right font-bold text-slate-950">
                      {(lineTotal).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-mono font-bold text-slate-950 border-t-2 border-slate-400">
                <td colSpan={6} className="border border-slate-400 py-1.5 px-2 text-right font-bold uppercase">
                  Totals (INR):
                </td>
                <td className="border border-slate-400 py-1.5 px-2 text-right">
                  ₹ {taxableTotal.toLocaleString('en-IN')}
                </td>
                <td colSpan={2} className="border border-slate-400 py-1.5 px-1 text-right">
                  ₹ {(taxTotal / 2).toLocaleString('en-IN')}
                </td>
                <td colSpan={2} className="border border-slate-400 py-1.5 px-1 text-right">
                  ₹ {(taxTotal / 2).toLocaleString('en-IN')}
                </td>
                <td colSpan={2} className="border border-slate-400 py-1.5 px-1 text-right">
                  ₹ 0.00
                </td>
                <td className="border border-slate-400 py-1.5 px-2 text-right font-black text-blue-950">
                  ₹ {grandTotal.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* AMOUNT IN WORDS & INVOICE NOTE */}
        <div className="border border-slate-400 p-2.5 bg-slate-50 space-y-1 text-xs">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div>
              <span className="font-bold text-slate-700">Amount in Words :- </span>
              <span className="font-bold text-slate-900 font-serif italic">
                {numberToWords(grandTotal)}
              </span>
            </div>
            <div className="font-mono text-slate-600 text-[11px]">
              <strong>Amount in USD :- </strong> ${(grandTotal / 86.5).toFixed(2)}
            </div>
          </div>

          <div className="pt-1 border-t border-slate-300 text-[11px] font-mono">
            <strong>Invoice Note : </strong>
            <span className="text-slate-800">
              Supply meant for export under Letter of Undertaking without payment of integrated tax (LUT ARN: AD070324001928K).
            </span>
          </div>

          {/* IRN Bar */}
          <div className="pt-1 border-t border-slate-300 text-[11px] font-mono">
            <strong className="text-slate-900">IRN :- </strong>
            <span className="text-blue-900 font-bold select-all">
              {irnStatus?.irn || '8492019481029481029481029481029481029481029481029'}
            </span>
          </div>
        </div>

        {/* SPJ-2 FOOTER: TERMS & CONDITIONS + BANK DETAILS + AUTHORIZED SIGNATORY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Terms & Conditions (Exact 4 Points from SPJ-2) */}
          <div className="border border-slate-400 p-2.5 bg-white text-[10px] space-y-1">
            <h4 className="font-bold text-xs uppercase text-slate-900 border-b border-slate-300 pb-1">
              Terms &amp; Conditions
            </h4>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-700 font-medium leading-relaxed">
              <li>Payment due 5 days from Invoice date.</li>
              <li>Delayed payments: 24% p.a. Interest.</li>
              <li>Dispute Raise within 5 days.</li>
              <li>All Disputes Subject to the Delhi Jurisdiction.</li>
            </ol>
          </div>

          {/* Bank Details & Signature Block (Exact from SPJ-2) */}
          <div className="border border-slate-400 p-2.5 bg-white flex flex-col justify-between">
            <div className="text-[10px] font-mono space-y-0.5 border-b border-slate-300 pb-2">
              <h4 className="font-bold text-xs uppercase text-slate-900 font-sans">
                Bank Details &bull; SPJ CARGO PVT. LTD.
              </h4>
              <p><strong>A/C No. :</strong> 50200084920194</p>
              <p><strong>IFSC Code:</strong> HDFC0000128 &bull; <strong>SWIFT Code:</strong> HDFCINBB</p>
              <p><strong>Bank Name:</strong> HDFC Bank Ltd &bull; <strong>Branch:</strong> Okhla Phase-1, New Delhi</p>
            </div>

            <div className="text-right pt-2 font-mono">
              <div className="h-9 flex items-center justify-end text-slate-400 text-[10px] italic">
                [ Digitally Signed &amp; Approved ]
              </div>
              <p className="font-bold text-slate-950 text-xs">For SPJ CARGO PVT. LTD.</p>
              <p className="text-[10px] text-slate-600 font-sans font-bold">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
