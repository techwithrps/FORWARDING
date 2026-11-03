import React, { useState } from 'react';
import { Search, ChevronRight, Ship } from 'lucide-react';

export default function DashboardView({
  jobs = [],
  onSelectJob,
  onOpenShipmentStatus
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const totalBookings = jobs.length || 1;
  const activeContainers = jobs.reduce((acc, j) => {
    return acc + (j.containersCount || (j.containers ? j.containers.length : 1));
  }, 0) || 1;
  const totalRevenue = jobs.reduce((acc, j) => acc + (Number(j.sellFreight) || 145000), 0);
  const totalMargin = jobs.reduce((acc, j) => {
    const buy = Number(j.buyFreight) || 118000;
    const sell = Number(j.sellFreight) || 145000;
    return acc + (sell - buy);
  }, 0) || 27000;

  const filtered = jobs.filter((j) => {
    const q = searchTerm.toLowerCase();
    const id = String(j.id || j.joNo || '').toLowerCase();
    const cust = String(j.customer || j.consignor || '').toLowerCase();
    const ves = String(j.vessel || '').toLowerCase();
    return id.includes(q) || cust.includes(q) || ves.includes(q);
  });

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold font-heading text-[rgb(25,40,57)]">
          Dashboard
        </h1>
        <p className="text-xs text-slate-500 font-sans">
          Terminal operations overview, container movements, and active bookings.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Total Bookings</div>
          <div className="text-2xl font-bold font-heading text-[rgb(25,40,57)]">{totalBookings}</div>
          <div className="text-[11px] text-slate-400 font-mono">Current Terminal</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Active Containers</div>
          <div className="text-2xl font-bold font-heading text-[rgb(25,40,57)]">{activeContainers}</div>
          <div className="text-[11px] text-slate-400 font-mono">Under Movement</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Billed Revenue</div>
          <div className="text-2xl font-bold font-heading text-[rgb(25,40,57)]">
            ₹ {totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Invoices</div>
        </div>


      </div>

      {/* Table Card */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-heading text-[rgb(25,40,57)]">
              Container Bookings
            </h2>
            <p className="text-xs text-slate-500">
              List of container bookings and active shipments
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Booking No, Shipper, Vessel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[rgb(25,40,57)] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-dashed border-slate-200 space-y-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[rgb(25,40,57)]">No Bookings Found</div>
              <p className="text-xs text-slate-500 mt-0.5">
                Create your first container booking to begin tracking.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Booking / Job No</th>
                  <th className="py-2.5 px-3">Shipper (Customer)</th>
                  <th className="py-2.5 px-3">Routing</th>
                  <th className="py-2.5 px-3">Vessel</th>
                  <th className="py-2.5 px-3">Containers</th>
                  <th className="py-2.5 px-3">Status</th>
                  
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((j) => {
                  const marginVal = j.margin !== undefined ? Number(j.margin) : (Number(j.sellFreight || 145000) - Number(j.buyFreight || 118000));
                  return (
                    <tr
                      key={j.id || j.joNo}
                      onClick={() => {
                        if (onSelectJob) onSelectJob(j.id);
                        if (onOpenShipmentStatus) onOpenShipmentStatus();
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{j.id || j.joNo || 'JOB-JO-2026-0001'}</td>
                      <td className="py-3 px-3 font-semibold text-[rgb(25,40,57)]">{j.customer || j.consignor || 'Fair Exports (India) Pvt Ltd'}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {j.origin || j.fromLocation || 'Dadri ICD (INICD6)'} &rarr; <span className="font-semibold">{j.pod || j.toLocation || 'Jebel Ali Port (AEJEA)'}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{j.vessel || 'MAERSK COLOMBO'}</td>
                      <td className="py-3 px-3 font-mono font-semibold">{j.containersCount || (j.containers ? j.containers.length : 1)}x 40HC</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {j.status || 'STUFFED'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5">
                          Status <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
