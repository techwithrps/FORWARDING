import React from 'react';
import { Printer, X } from 'lucide-react';
import spjLogo from '../assets/spj-logo.png';

export default function GRPrintDocument({ grData = {}, onClose }) {
  const d = grData;

  const copies = [
    { label: 'Original Copy', subtitle: 'For Consignor / Shipper' },
    { label: 'Duplicate Copy', subtitle: 'For Transporter / Driver' },
    { label: 'Triplicate Copy', subtitle: 'For Office / Record' }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* On-screen Action Toolbar (Hidden during print) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold">eLOGiFreight &bull; Classic Official GR Print</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-800 text-cyan-200">
              GR No: {d.grNo || '61546'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet - Formatted to exact eLOGiFreight / LogiPark ASPX Print Standard */}
        <div className="p-4 sm:p-8 bg-white font-sans text-slate-900 space-y-6 print:p-2 text-xs">
          {copies.map((copy, copyIdx) => (
            <div
              key={copy.label}
              className={`print-copy bg-white space-y-2 ${
                copyIdx > 0 ? 'print:break-before-page pt-6 print:pt-2 border-t-2 border-dashed border-slate-300 print:border-none' : ''
              }`}
            >
              {/* Top Copy Badge */}
              <div className="flex items-center justify-end">
                <span className="text-sm sm:text-base font-bold text-rose-600 tracking-wide">
                  {copy.label}
                </span>
              </div>

              {/* Company Header */}
              <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-300">
                <div className="w-24 sm:w-28 shrink-0 flex items-center justify-center">
                  <img
                    src={spjLogo}
                    alt="SPJ Cargo"
                    className="h-16 sm:h-20 w-auto object-contain"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>
                <div className="text-center flex-1 space-y-0.5">
                  <h1 className="text-lg sm:text-xl font-extrabold text-blue-700 tracking-wide uppercase">
                    SPJ CARGO PVT LTD
                  </h1>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-700">
                    Complete Logistics Solution Provider
                  </p>
                  <p className="text-[10px] text-slate-600">
                    (Transport Contractors &amp; Fleet Owner)
                  </p>
                  <p className="text-[10px] text-slate-600">
                    D-9/3, Okhla Industrial Area Phase-1 New Delhi-110020
                  </p>
                  <p className="text-[10px] text-slate-700 font-medium">
                    <span className="font-bold">PAN NO.:</span> AAOCS1758E &nbsp;|&nbsp;{' '}
                    <span className="font-bold">GSTN NO.:</span> 07AAOCS1758E1Z5
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    Contact No.: 8285148316, 8750183111, 8750189777, 8750183777
                  </p>
                </div>
              </div>

              {/* Table 1: Primary Dispatch Particulars */}
              <table className="w-full border-collapse border border-black text-[11px] leading-tight">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="w-28 p-1.5 font-bold bg-slate-50 border-r border-black">Consignor</td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-black">
                      {d.consignor || 'SPJ CARGO PVT LTD.'}
                    </td>
                    <td className="w-24 p-1.5 font-bold bg-slate-50 border-r border-black">GR No</td>
                    <td className="w-36 p-1.5 font-bold font-mono text-slate-900 text-sm">
                      {d.grNo || '61546'}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Consignee</td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-black">
                      {d.consignee || 'INTERNATIONAL AGRO FOODS'}
                    </td>
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Date</td>
                    <td className="p-1.5 font-mono text-slate-900">
                      {d.grDate || new Date().toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black align-top">Address</td>
                    <td className="p-1.5 text-slate-800 border-r border-black">
                      {d.consigneeAddress || '2764, Bhoor Garhi,Dasna Dist:- Ghaziabad, Uttar Pradesh-201010'}
                    </td>
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Party GSTIN</td>
                    <td className="p-1.5 font-mono font-bold text-slate-900">
                      {d.partyGstin || '09AACFI2693D1ZF'}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Trailor/Truck No</td>
                    <td className="p-1.5 font-mono font-bold text-slate-900 border-r border-black">
                      {d.vehicleNo || 'HR58F7371'}
                    </td>
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Origin</td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {d.fromLocation || 'TRANSWORLD-DADRI'}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Driver Name</td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-black">
                      {d.driver || d.driverName || 'ISTKAR'}
                    </td>
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">To</td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {d.toLocation || 'DASNA'}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Mobile No</td>
                    <td className="p-1.5 font-mono text-slate-900 border-r border-black">
                      {d.driverContactNo || d.driverMobile || '9870733033'}
                    </td>
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Handover</td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {d.handoverLocation || 'TRANSWORLD-DADRI'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Movement</td>
                    <td className="p-1.5 text-slate-900 font-semibold border-r border-black">
                      {d.movement || d.joFor || 'Empty Container Out For Stuffing'}
                    </td>
                    <td className="p-1.5 font-bold bg-slate-50 border-r border-black">Commodity</td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {d.commodity || 'BONELESS BUFFALO MEAT'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Table 2: Container Particulars + Party Section (Split 55% / 45%) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 border border-black text-[11px] divide-y sm:divide-y-0 sm:divide-x divide-black">
                {/* Left Side: Container Specifications */}
                <div className="sm:col-span-7 p-2 space-y-1">
                  <table className="w-full text-[11px]">
                    <tbody>
                      <tr>
                        <td className="w-28 font-bold py-0.5">Jo No</td>
                        <td className="w-3">:</td>
                        <td className="font-mono font-bold text-slate-900">{d.joNo || '94303'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Container No</td>
                        <td>:</td>
                        <td className="font-mono font-black text-blue-900 text-xs">
                          {d.contNo || 'SEGU9951308'}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Size</td>
                        <td>:</td>
                        <td className="font-mono">{d.size || '40'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Type</td>
                        <td>:</td>
                        <td className="font-mono font-semibold">{d.type || 'RF'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Line</td>
                        <td>:</td>
                        <td className="font-bold text-slate-900">{d.shippingLine || d.line || 'WAN HAI GROUP'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Seal No</td>
                        <td>:</td>
                        <td className="font-mono">{d.sealNo || '-'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Pay Load</td>
                        <td>:</td>
                        <td className="font-mono font-bold">{d.weight || d.payload || '30460'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Oil Slip No</td>
                        <td>:</td>
                        <td className="font-mono">{d.slipNo || '-'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5">Port</td>
                        <td>:</td>
                        <td className="font-bold text-slate-900">{d.port || d.podPort || 'PORT KLANG NORTH-MALAYSIA'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Side: To Be Filled By Party */}
                <div className="sm:col-span-5 p-2 flex flex-col justify-between">
                  <div>
                    <div className="text-center font-bold text-slate-900 uppercase border-b border-black pb-1 mb-1.5 text-[10px]">
                      (TO BE FILLED BY PARTY)
                    </div>
                    <table className="w-full text-[11px]">
                      <tbody>
                        <tr>
                          <td className="w-36 font-semibold py-1">Party Ref No.</td>
                          <td className="w-3">:</td>
                          <td className="border-b border-dotted border-slate-400">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="font-semibold py-1">Party Advance</td>
                          <td>:</td>
                          <td className="border-b border-dotted border-slate-400">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="font-semibold py-1">Seal No</td>
                          <td>:</td>
                          <td className="border-b border-dotted border-slate-400">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="font-semibold py-1">Factory Site Reporting</td>
                          <td>:</td>
                          <td className="border-b border-dotted border-slate-400">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="font-semibold py-1">Factory Site Release</td>
                          <td>:</td>
                          <td className="border-b border-dotted border-slate-400">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="font-semibold py-1">VIA</td>
                          <td>:</td>
                          <td className="border-b border-dotted border-slate-400">&nbsp;</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Table 3: Factory Stamp, Signatures & Legal Declaration */}
              <div className="border border-black text-[11px]">
                {/* Signatures Row */}
                <div className="flex items-start justify-between p-3 min-h-[70px]">
                  <div className="font-bold text-slate-900">
                    FOR FACTORY STAMP &amp; SIGNATURE
                  </div>
                  <div className="font-bold text-slate-900 text-right">
                    Authorised Signatory
                  </div>
                </div>

                {/* Declaration Header */}
                <div className="border-t border-black bg-slate-50 py-1 text-center font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                  DECLARATION
                </div>

                {/* Declaration Body */}
                <div className="border-t border-black p-2.5 text-[10px] text-slate-700 leading-snug space-y-0.5">
                  <p className="font-bold text-slate-900">Note:</p>
                  <p>&bull; Goods are Transported at Owners risk.</p>
                  <p>&bull; Company will not be responsible for the damage of goods, leakage and breakage.</p>
                  <p>&bull; Consignee is responsible for the correctness of GSTIN &amp; other details.</p>
                  <p>&bull; All Matter of disputes will be settled in DELHI Jurisdication only.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
