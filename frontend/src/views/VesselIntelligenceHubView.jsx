import React, { useState } from 'react';
import { Ship, Radio, CalendarCheck2 } from 'lucide-react';
import OceanIntelligenceView from './OceanIntelligenceView';
import VesselBookingPlanningView from './VesselBookingPlanningView';

export default function VesselIntelligenceHubView({ initialTab = 'RADAR' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'RADAR' or 'PLANNING'

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans">
      {/* Sleek Minimal Tab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold shrink-0">
            <Ship className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Ocean Vessel &amp; Planning Intelligence
            </h1>
            <p className="text-[11px] text-slate-500 font-sans">
              Global AIS Sailing Schedules &bull; Carrier Cut-offs &bull; Booking Vessel Revisions
            </p>
          </div>
        </div>

        {/* The 2 Tabs: Ocean & Vessel Radar / Booking & Vessel Planning */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('RADAR')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
              activeTab === 'RADAR'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-600" />
            <span>Ocean &amp; Vessel Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PLANNING')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
              activeTab === 'PLANNING'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Booking &amp; Vessel Planning</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Ocean & Vessel Radar (Schedules, Cut-offs, 31 Preloaded Sailings, AIS Map) */}
      {activeTab === 'RADAR' && <OceanIntelligenceView />}

      {/* Tab 2: Booking & Vessel Planning (Container Grouping, Delay Revisions, Vessel Planning) */}
      {activeTab === 'PLANNING' && <VesselBookingPlanningView />}
    </div>
  );
}
