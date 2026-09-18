import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, ShieldAlert, AlertTriangle, CheckCircle2, Zap, Search, 
  ExternalLink, ArrowRight, RefreshCw, Compass, Globe, Info, Filter, X
} from 'lucide-react';
import hotspotData from '../fraud_hotspots.json';

// Equirectangular projection mapping coordinates [-180, 180], [-90, 90] to SVG [0, 960], [0, 500]
const SVG_WIDTH = 960;
const SVG_HEIGHT = 500;

function projectCoords(lat, lon) {
  // Clamp lat to -80, 85 to prevent extreme polar distortion
  const clampedLat = Math.max(-75, Math.min(80, lat));
  const clampedLon = Math.max(-180, Math.min(180, lon));
  const x = ((clampedLon + 180) / 360) * SVG_WIDTH;
  const y = ((85 - clampedLat) / 165) * SVG_HEIGHT;
  return { x, y };
}

// Generates smooth curved quadratic bezier SVG path between two points
function createCurvedArc(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  // Lift the arc perpendicular to distance
  const curveHeight = Math.min(100, Math.max(30, dist * 0.22));
  const ctrlX = midX;
  const ctrlY = midY - curveHeight;
  return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
}

export default function HotspotMap({ focusedTransferId, onClearFocus, onSelectTransferForForm }) {
  const { summary, hotspots, transfers } = hotspotData;
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'FRAUD' | 'IMPOSSIBLE' | 'OFFSHORE' | 'CLEAN'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [viewMode, setViewMode] = useState('CORRIDORS'); // 'CORRIDORS' | 'HOTSPOTS'

  // Handle auto-focus from Chatbot or external trigger
  useEffect(() => {
    if (focusedTransferId) {
      const match = transfers.find((t) => t.transfer_id === focusedTransferId);
      if (match) {
        setSelectedTransfer(match);
        setSelectedHotspot(null);
      }
    }
  }, [focusedTransferId, transfers]);

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Category filter
      if (filter === 'FRAUD' && !t.is_fraud) return false;
      if (filter === 'IMPOSSIBLE' && !t.is_impossible_travel) return false;
      if (filter === 'OFFSHORE' && (!t.origin.region.includes('Offshore') && !t.destination.region.includes('Offshore'))) return false;
      if (filter === 'CLEAN' && t.is_fraud) return false;

      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCity = t.origin.city.toLowerCase().includes(q) || t.destination.city.toLowerCase().includes(q);
        const matchesCountry = t.origin.country.toLowerCase().includes(q) || t.destination.country.toLowerCase().includes(q);
        const matchesId = t.transfer_id.toLowerCase().includes(q);
        const matchesType = t.transfer_type.toLowerCase().includes(q);
        return matchesCity || matchesCountry || matchesId || matchesType;
      }
      return true;
    });
  }, [transfers, filter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary KPIs */}
      <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-6 shadow-fintech">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#1c1917]">
                  Global Credit Card Transfer & Hotspot Radar
                </h2>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                  ML Geospatial Detection
                </span>
              </div>
              <p className="text-xs text-[#78716c] font-medium mt-0.5">
                Real-time tracking of international transaction routing corridors, money-mule hotspots, and impossible transit velocities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'CORRIDORS' ? 'HOTSPOTS' : 'CORRIDORS')}
              className="px-3.5 py-2 bg-white border border-[#dcd1be] hover:bg-[#ebdcc7] text-[#1c1917] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-orange-600" />
              <span>{viewMode === 'CORRIDORS' ? 'Switch to Hotspot Density' : 'Switch to Transfer Corridors'}</span>
            </button>
          </div>
        </div>

        {/* 4 Key Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-[#dcd1be] rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-[#78716c] block">
              Monitored Transfers
            </span>
            <span className="text-xl font-black text-[#1c1917] mt-0.5 block">
              {summary.total_monitored_transfers}
            </span>
            <span className="text-[10px] text-[#78716c]">Global routing corridors</span>
          </div>

          <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-red-700 block">
              Critical Hotspots
            </span>
            <span className="text-xl font-black text-red-700 mt-0.5 block">
              {summary.high_risk_hotspots} Hubs
            </span>
            <span className="text-[10px] text-red-600 font-semibold">Active carding farms</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-amber-800 block">
              Impossible Travel Alerts
            </span>
            <span className="text-xl font-black text-amber-800 mt-0.5 block">
              {summary.impossible_travel_alerts} Alerts
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Velocity &gt; 900 km/h</span>
          </div>

          <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-orange-800 block">
              Capital at Fraud Risk
            </span>
            <span className="text-xl font-black text-orange-800 mt-0.5 block">
              ${summary.capital_at_risk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-orange-700 font-semibold">Flagged cross-border transfers</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Canvas & Side Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Interactive SVG Geospatial Map */}
        <div className="lg:col-span-2 bg-[#1c1917] border border-[#292524] rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* Map Toolbar */}
          <div className="bg-[#292524] px-4 py-3 border-b border-[#44403c] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: `All (${transfers.length})` },
                { id: 'FRAUD', label: 'Fraud Attacks', color: 'text-red-400' },
                { id: 'IMPOSSIBLE', label: 'Impossible Travel', color: 'text-amber-400' },
                { id: 'OFFSHORE', label: 'Offshore Routing', color: 'text-orange-400' },
                { id: 'CLEAN', label: 'Legitimate', color: 'text-emerald-400' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFilter(pill.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    filter === pill.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-[#1c1917] text-stone-300 hover:bg-[#44403c] ' + (pill.color || '')
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, country, TX..."
                className="bg-[#1c1917] border border-[#44403c] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-400 outline-none focus:border-orange-500 w-44 sm:w-52"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-stone-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative flex-1 bg-[#141210] p-2 flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
            >
              {/* Geospatial Coordinate Grids */}
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#292524" strokeWidth="0.5" strokeDasharray="2,3" />
                </pattern>
                {/* Radial gradients for high-risk hotspot radar rings */}
                <radialGradient id="radar-crimson" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#dc2626" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="radar-amber" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#d97706" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Grid */}
              <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#grid)" />

              {/* Stylized Vector World Continents Outlines */}
              {/* North America */}
              <path
                d="M 120 70 Q 210 50 250 90 Q 270 140 220 190 Q 180 230 160 210 Q 140 180 110 130 Z"
                fill="#262320"
                stroke="#38332e"
                strokeWidth="1"
              />
              {/* South America */}
              <path
                d="M 230 250 Q 300 270 290 350 Q 260 440 230 460 Q 200 400 210 320 Z"
                fill="#262320"
                stroke="#38332e"
                strokeWidth="1"
              />
              {/* Europe */}
              <path
                d="M 450 70 Q 530 60 550 110 Q 520 170 480 180 Q 430 160 440 100 Z"
                fill="#2b2723"
                stroke="#443e38"
                strokeWidth="1"
              />
              {/* Africa */}
              <path
                d="M 450 190 Q 540 200 550 280 Q 530 380 480 400 Q 430 350 420 250 Z"
                fill="#262320"
                stroke="#38332e"
                strokeWidth="1"
              />
              {/* Asia */}
              <path
                d="M 550 80 Q 750 60 850 120 Q 820 240 700 260 Q 600 240 560 160 Z"
                fill="#262320"
                stroke="#38332e"
                strokeWidth="1"
              />
              {/* Australia */}
              <path
                d="M 760 340 Q 850 330 860 400 Q 820 440 750 420 Z"
                fill="#262320"
                stroke="#38332e"
                strokeWidth="1"
              />

              {/* Transfer Corridors (Curved Quadratic Arcs) */}
              {viewMode === 'CORRIDORS' && filteredTransfers.map((t) => {
                const p1 = projectCoords(t.origin.lat, t.origin.lon);
                const p2 = projectCoords(t.destination.lat, t.destination.lon);
                const pathD = createCurvedArc(p1.x, p1.y, p2.x, p2.y);
                const isSelected = selectedTransfer?.transfer_id === t.transfer_id;

                let strokeColor = '#10b981'; // Green clean
                if (t.is_fraud) strokeColor = '#ef4444'; // Red fraud
                else if (t.risk_level === 'MEDIUM') strokeColor = '#f59e0b'; // Amber review

                return (
                  <g 
                    key={t.transfer_id} 
                    onClick={() => { setSelectedTransfer(t); setSelectedHotspot(null); }}
                    className="cursor-pointer group"
                  >
                    {/* Wider transparent hit zone */}
                    <path d={pathD} fill="none" stroke="transparent" strokeWidth="12" />
                    
                    {/* Visible corridor arc */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3.5 : 1.6}
                      strokeOpacity={isSelected ? 1.0 : 0.55}
                      strokeDasharray={t.is_impossible_travel ? '4,3' : 'none'}
                      className="transition-all duration-300 group-hover:stroke-opacity-100 group-hover:stroke-width-3"
                    />

                    {/* Animated glowing midpoint dot for active corridors */}
                    {isSelected && (
                      <circle
                        cx={(p1.x + p2.x) / 2}
                        cy={(p1.y + p2.y) / 2 - 30}
                        r="4"
                        fill={strokeColor}
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}

              {/* Hotspot Pulsing Rings */}
              {hotspots.map((h) => {
                const { x, y } = projectCoords(h.lat, h.lon);
                const isCritical = h.severity === 'CRITICAL';
                const isElevated = h.severity === 'ELEVATED';
                const isSelected = selectedHotspot?.node_id === h.node_id;

                return (
                  <g
                    key={h.node_id}
                    onClick={() => { setSelectedHotspot(h); setSelectedTransfer(null); }}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing radar wave for high-risk zones */}
                    {isCritical && (
                      <circle
                        cx={x}
                        cy={y}
                        r="24"
                        fill="url(#radar-crimson)"
                        className="animate-ping"
                        style={{ animationDuration: '2.5s' }}
                      />
                    )}

                    {isElevated && (
                      <circle
                        cx={x}
                        cy={y}
                        r="16"
                        fill="url(#radar-amber)"
                        className="animate-pulse"
                      />
                    )}

                    {/* Core node dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 7 : (isCritical ? 5.5 : 4)}
                      fill={isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Node City Label */}
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fill="#e7e5e4"
                      fontSize="9"
                      fontWeight="bold"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {h.city}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-[#1c1917]/90 border border-[#44403c] rounded-xl px-3 py-2 text-[10px] text-stone-300 backdrop-blur-xs flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Critical Fraud Hub</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Elevated 2FA Zone</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Clean Hub</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 border-l border-stone-700 pl-2 text-stone-400">
                <span>Dashed line = Impossible Velocity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Transfer Dossier / Hotspot Inspector Drawer */}
        <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-5 shadow-fintech flex flex-col">
          {selectedTransfer ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#e4d8c5]">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs ${
                    selectedTransfer.is_fraud ? 'bg-red-600' : selectedTransfer.risk_level === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {selectedTransfer.is_fraud ? <ShieldAlert className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#1c1917]">
                      {selectedTransfer.transfer_id} Dossier
                    </h3>
                    <span className="text-[10px] text-[#78716c] font-semibold">
                      {selectedTransfer.transfer_type}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTransfer(null)}
                  className="text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                selectedTransfer.is_fraud 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : selectedTransfer.risk_level === 'MEDIUM'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Action: {selectedTransfer.recommended_action}
                  </span>
                  <span className="font-mono font-bold">
                    Risk: {(selectedTransfer.fraud_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] leading-snug">
                  {selectedTransfer.reason}
                </p>
              </div>

              {/* Impossible Travel Flag if applicable */}
              {selectedTransfer.is_impossible_travel && (
                <div className="p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-600 flex-shrink-0 animate-bounce" />
                  <div>
                    <span className="font-bold block text-[11px]">IMPOSSIBLE TRAVEL SPEED DETECTED</span>
                    <span className="text-[10px]">
                      {selectedTransfer.velocity_kmh.toLocaleString()} km/h exceeds human passenger capability (&gt;900 km/h).
                    </span>
                  </div>
                </div>
              )}

              {/* Origin -> Destination Corridor */}
              <div className="bg-white border border-[#dcd1be] rounded-xl p-3.5 space-y-3 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#78716c] block">
                    Origin Node (Cardholder / Terminal)
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-black text-[#1c1917]">
                      {selectedTransfer.origin.city}, {selectedTransfer.origin.country}
                    </span>
                    <span className="text-[10px] font-mono text-[#78716c]">
                      [{selectedTransfer.origin.lat.toFixed(2)}, {selectedTransfer.origin.lon.toFixed(2)}]
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center py-1">
                  <div className="w-full border-t border-dashed border-[#dcd1be] relative flex items-center justify-center">
                    <span className="bg-white px-2 text-[10px] font-bold text-orange-600">
                      {selectedTransfer.distance_km} km in {selectedTransfer.time_elapsed_min}m
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[#78716c] block">
                    Destination Clearing Node
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-black text-[#1c1917]">
                      {selectedTransfer.destination.city}, {selectedTransfer.destination.country}
                    </span>
                    <span className="text-[10px] font-mono text-[#78716c]">
                      [{selectedTransfer.destination.lat.toFixed(2)}, {selectedTransfer.destination.lon.toFixed(2)}]
                    </span>
                  </div>
                </div>
              </div>

              {/* Amounts & Machine Learning Vectors */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white border border-[#dcd1be] rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-[#78716c] block">
                    Transfer Amount
                  </span>
                  <span className="text-base font-black text-[#1c1917] mt-0.5 block">
                    ${selectedTransfer.amount.toFixed(2)}
                  </span>
                </div>

                <div className="bg-white border border-[#dcd1be] rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-[#78716c] block">
                    Transit Velocity
                  </span>
                  <span className="text-base font-black text-[#1c1917] mt-0.5 block">
                    {selectedTransfer.velocity_kmh.toLocaleString()} km/h
                  </span>
                </div>
              </div>

              {/* Latent Vector Signals */}
              <div className="bg-white border border-[#dcd1be] rounded-xl p-3 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#78716c] block mb-1">
                  ML Latent Anomaly Signals
                </span>
                <div className="grid grid-cols-3 gap-1 font-mono text-[11px] text-center">
                  <div className="p-1 rounded bg-[#f4ede2]">
                    <span className="text-[9px] text-[#78716c] block">V14</span>
                    <strong className={selectedTransfer.latent_signals.v14 < -3 ? 'text-red-700' : 'text-[#1c1917]'}>
                      {selectedTransfer.latent_signals.v14}
                    </strong>
                  </div>
                  <div className="p-1 rounded bg-[#f4ede2]">
                    <span className="text-[9px] text-[#78716c] block">V4</span>
                    <strong className={selectedTransfer.latent_signals.v4 > 2 ? 'text-red-700' : 'text-[#1c1917]'}>
                      {selectedTransfer.latent_signals.v4}
                    </strong>
                  </div>
                  <div className="p-1 rounded bg-[#f4ede2]">
                    <span className="text-[9px] text-[#78716c] block">V12</span>
                    <strong className={selectedTransfer.latent_signals.v12 < -2 ? 'text-red-700' : 'text-[#1c1917]'}>
                      {selectedTransfer.latent_signals.v12}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {onSelectTransferForForm && (
                <button
                  type="button"
                  onClick={() => onSelectTransferForForm(selectedTransfer)}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Test in Live Control Station</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : selectedHotspot ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Hotspot Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#e4d8c5]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#1c1917]">
                      {selectedHotspot.city} Hotspot Hub
                    </h3>
                    <span className="text-[10px] text-[#78716c] font-semibold">
                      {selectedHotspot.country} • {selectedHotspot.region}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHotspot(null)}
                  className="text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Severity Card */}
              <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
                selectedHotspot.severity === 'CRITICAL'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase text-[10px]">
                    Risk Classification: {selectedHotspot.badge}
                  </span>
                  <span className="font-mono font-bold">
                    Severity {(selectedHotspot.risk_score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] leading-snug">
                  This financial routing hub exhibits an elevated concentration of unauthorized cross-border card injections ({selectedHotspot.fraud_rate_pct}% fraud rate).
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white border border-[#dcd1be] rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-[#78716c] block">
                    Total Transfers Monitored
                  </span>
                  <span className="text-base font-black text-[#1c1917] mt-0.5 block">
                    {selectedHotspot.total_transfers}
                  </span>
                </div>

                <div className="bg-white border border-[#dcd1be] rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-red-700 block">
                    Fraud Interceptions
                  </span>
                  <span className="text-base font-black text-red-700 mt-0.5 block">
                    {selectedHotspot.fraud_transfers} ({selectedHotspot.fraud_rate_pct}%)
                  </span>
                </div>

                <div className="bg-white border border-[#dcd1be] rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-[#78716c] block">
                    Total Volume
                  </span>
                  <span className="text-base font-black text-[#1c1917] mt-0.5 block">
                    ${selectedHotspot.total_volume_usd.toLocaleString()}
                  </span>
                </div>

                <div className="bg-white border border-[#dcd1be] rounded-xl p-2.5">
                  <span className="text-[10px] font-bold uppercase text-red-700 block">
                    Capital Exposed
                  </span>
                  <span className="text-base font-black text-red-700 mt-0.5 block">
                    ${selectedHotspot.fraud_volume_usd.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#dcd1be] rounded-xl text-xs text-[#57534e]">
                <span className="text-[10px] font-bold uppercase text-[#1c1917] block mb-1">
                  Automated Rule Recommendation
                </span>
                Apply automated step-up multi-factor authentication (MFA) and biometric verification on all inbound card transactions clearing through this node.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#78716c]">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#1c1917]">Select a Corridor or Hotspot</h3>
              <p className="text-xs mt-1 max-w-[220px]">
                Click on any transfer arc or pulsating radar hotspot on the map to inspect its real-time transaction dossier and transit velocity.
              </p>
              <div className="mt-4 pt-3 border-t border-[#e4d8c5] w-full text-left">
                <span className="text-[10px] font-bold uppercase text-[#78716c] block mb-1.5">
                  Top Flagged Corridors:
                </span>
                <ul className="space-y-1.5 text-xs">
                  {transfers.slice(0, 3).map((t) => (
                    <li
                      key={t.transfer_id}
                      onClick={() => setSelectedTransfer(t)}
                      className="cursor-pointer flex items-center justify-between p-1.5 rounded-lg hover:bg-white transition-colors"
                    >
                      <span className="font-bold text-[#1c1917]">{t.origin.city} → {t.destination.city}</span>
                      <span className="font-mono text-red-600 font-bold">${t.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
