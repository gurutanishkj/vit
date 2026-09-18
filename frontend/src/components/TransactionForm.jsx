import React, { useState } from 'react';
import { 
  Play, Sparkles, SlidersHorizontal, RotateCcw, AlertCircle, 
  Coffee, ShoppingBag, Send, CreditCard, Clock, Sun, Moon,
  Dices, ArrowRight, ShieldAlert, CheckCircle2
} from 'lucide-react';
import ResultCard from './ResultCard';
import ThresholdSlider from './ThresholdSlider';
import { predictClientSide } from '../clientPrediction';

export default function TransactionForm({ token, onTransactionEvaluated }) {
  // Base fields
  const [amount, setAmount] = useState('25.00');
  const [time, setTime] = useState(36000); // 10:00 AM in seconds
  const [threshold, setThreshold] = useState(0.70);

  // PCA Features V1 to V28
  const defaultV = {};
  for (let i = 1; i <= 28; i++) {
    defaultV[`V${i}`] = 0.0;
  }
  const [vFeatures, setVFeatures] = useState(defaultV);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Preset definitions for 1-click live demo
  const presets = [
    {
      id: 'coffee',
      label: 'Morning Coffee',
      type: 'Legitimate',
      typeColor: 'text-emerald-700 bg-emerald-100',
      icon: Coffee,
      amount: '4.50',
      time: 30600, // 8:30 AM
      pca: { V1: -0.15, V2: 0.08, V3: 0.95, V4: -0.12, V5: 0.05, V10: -0.05, V12: 0.15, V14: 0.22, V17: -0.05 },
    },
    {
      id: 'grocery',
      label: 'Supermarket Grocery',
      type: 'Legitimate',
      typeColor: 'text-emerald-700 bg-emerald-100',
      icon: ShoppingBag,
      amount: '78.25',
      time: 62100, // 5:15 PM
      pca: { V1: 0.25, V2: -0.10, V3: 0.45, V4: 0.05, V5: -0.20, V10: 0.10, V12: 0.35, V14: 0.18, V17: 0.12 },
    },
    {
      id: 'midnight',
      label: 'Suspicious 3 AM Wire',
      type: 'Fraudulent',
      typeColor: 'text-red-700 bg-red-100',
      icon: Send,
      amount: '1850.00',
      time: 11700, // 3:15 AM
      pca: { V1: -3.85, V2: 2.91, V3: -4.20, V4: 4.85, V5: -2.60, V10: -4.10, V12: -6.15, V14: -7.80, V17: -8.90 },
    },
    {
      id: 'carding',
      label: 'Micro Carding Attack',
      type: 'Fraudulent',
      typeColor: 'text-red-700 bg-red-100',
      icon: CreditCard,
      amount: '1.20',
      time: 7500, // 2:05 AM
      pca: { V1: -2.31, V2: 1.85, V3: -3.10, V4: 3.75, V5: -1.90, V10: -3.20, V12: -4.80, V14: -6.50, V17: -5.90 },
    },
  ];

  const applyPreset = (preset) => {
    setAmount(preset.amount);
    setTime(preset.time);
    const newV = { ...defaultV };
    Object.entries(preset.pca).forEach(([k, v]) => {
      newV[k] = v;
    });
    setVFeatures(newV);
    setError('');
  };

  const handleVChange = (col, val) => {
    setVFeatures(prev => ({ ...prev, [col]: parseFloat(val) || 0.0 }));
  };

  const generateRandomScenario = (type = 'random') => {
    setError('');
    const randomBetween = (min, max) => (Math.random() * (max - min) + min);

    if (type === 'fraud') {
      setAmount((randomBetween(450, 4800)).toFixed(2));
      setTime(Math.floor(randomBetween(1000, 15000))); // night time
      const newV = { ...defaultV };
      newV.V14 = parseFloat(randomBetween(-9.0, -5.5).toFixed(2));
      newV.V4 = parseFloat(randomBetween(3.5, 6.5).toFixed(2));
      newV.V12 = parseFloat(randomBetween(-7.0, -4.0).toFixed(2));
      newV.V10 = parseFloat(randomBetween(-5.0, -3.0).toFixed(2));
      newV.V17 = parseFloat(randomBetween(-8.0, -4.5).toFixed(2));
      setVFeatures(newV);
    } else if (type === 'legit') {
      setAmount((randomBetween(5, 120)).toFixed(2));
      setTime(Math.floor(randomBetween(28800, 68400))); // 8 AM to 7 PM
      const newV = { ...defaultV };
      newV.V14 = parseFloat(randomBetween(-0.5, 1.2).toFixed(2));
      newV.V4 = parseFloat(randomBetween(-0.8, 0.8).toFixed(2));
      newV.V12 = parseFloat(randomBetween(-0.4, 1.0).toFixed(2));
      newV.V10 = parseFloat(randomBetween(-0.6, 0.8).toFixed(2));
      newV.V17 = parseFloat(randomBetween(-0.5, 0.9).toFixed(2));
      setVFeatures(newV);
    } else {
      setAmount((randomBetween(1, 999)).toFixed(2));
      setTime(Math.floor(randomBetween(0, 86399)));
      const newV = { ...defaultV };
      for (let i = 1; i <= 28; i++) {
        newV[`V${i}`] = parseFloat(randomBetween(-3.0, 3.0).toFixed(2));
      }
      setVFeatures(newV);
    }
  };

  const handleReset = () => {
    setAmount('25.00');
    setTime(36000);
    setThreshold(0.70);
    setVFeatures(defaultV);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        Amount: parseFloat(amount) || 0.0,
        Time: parseFloat(time) || 0.0,
        threshold: parseFloat(threshold) || 0.70,
      };

      for (let i = 1; i <= 28; i++) {
        payload[`V${i}`] = parseFloat(vFeatures[`V${i}`]) || 0.0;
      }

      let data;
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/predict', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          data = await res.json();
        } else {
          // Static host without backend (e.g. GitHub Pages)
          data = predictClientSide(payload, payload.threshold);
        }
      } catch {
        // Network error / offline / GitHub Pages
        data = predictClientSide(payload, payload.threshold);
      }

      setResult(data);
      if (onTransactionEvaluated) {
        onTransactionEvaluated({
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          amount: parseFloat(amount),
          prediction: data.prediction,
          fraud_probability: data.fraud_probability,
          risk_level: data.risk_level,
          recommended_action: data.recommended_action,
          threshold_used: data.threshold_used,
          top_factor: data.top_factors && data.top_factors[0] ? data.top_factors[0].feature : 'V14'
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Time format helper
  const hour = Math.floor(time / 3600);
  const minute = Math.floor((time % 3600) / 60);
  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const isNight = hour >= 23 || hour < 5;

  return (
    <div className="space-y-6">
      {/* 1-Click Quick Presets */}
      <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-5 shadow-fintech">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-bold text-[#1c1917] uppercase tracking-wider">
              1-Click Demo Scenarios & Generators
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => generateRandomScenario('legit')}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-[#ebdcc7] text-emerald-800 font-semibold rounded-lg border border-[#dcd1be] transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              + Legit
            </button>
            <button
              type="button"
              onClick={() => generateRandomScenario('fraud')}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-[#ebdcc7] text-red-800 font-semibold rounded-lg border border-[#dcd1be] transition-colors flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3 text-red-600" />
              + Fraud
            </button>
            <button
              type="button"
              onClick={() => generateRandomScenario('random')}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-[#ebdcc7] text-[#44403c] font-semibold rounded-lg border border-[#dcd1be] transition-colors flex items-center gap-1"
            >
              <Dices className="w-3 h-3 text-orange-600" />
              Random
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#dcd1be] hover:border-orange-500 hover:shadow-sm text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#1c1917]">
                      {p.label}
                    </span>
                    <span className="block text-[11px] text-[#78716c]">
                      ${p.amount}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.typeColor}`}>
                  {p.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Control Suite */}
      <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-6 shadow-fintech">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-[#1c1917]">
              Interactive Transaction Control Station
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              Adjust parameters, simulate attacks, calibrate sensitivity threshold, and inspect real-time risk scores.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#78716c] hover:text-[#1c1917] bg-white border border-[#dcd1be] rounded-xl hover:bg-[#fcfaf6] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-100/70 border border-red-300 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Transaction Fields: Amount & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amount Controller */}
            <div className="bg-white border border-[#dcd1be] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#44403c] uppercase tracking-wider">
                  Transaction Amount ($ USD)
                </label>
                <span className="text-sm font-black text-orange-600">
                  ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                max="25000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50.00"
                className="w-full bg-[#fcfaf6] border border-[#dcd1be] rounded-lg px-3 py-2 text-sm font-semibold text-[#1c1917] outline-none focus:border-orange-600 transition-all mb-2.5"
              />

              <input
                type="range"
                min="0"
                max="5000"
                step="5"
                value={Math.min(parseFloat(amount) || 0, 5000)}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-2 bg-[#f4ede2] rounded-lg appearance-none cursor-pointer accent-orange-600 border border-[#e4d8c5]"
              />

              <div className="flex items-center justify-between gap-1.5 mt-2.5">
                {['4.50', '45.00', '185.00', '1500.00', '4800.00'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold border transition-colors ${
                      amount === amt
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-[#f4ede2] text-[#57534e] border-[#e4d8c5] hover:bg-[#ebdcc7]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Controller */}
            <div className="bg-white border border-[#dcd1be] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#44403c] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  Time of Transaction (24-Hour Cycle)
                </label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  isNight ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isNight ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                  {formattedTime} ({isNight ? 'High Night Risk' : 'Daytime Hours'})
                </span>
              </div>

              <div className="text-xs font-semibold text-[#1c1917] bg-[#fcfaf6] border border-[#dcd1be] rounded-lg px-3 py-2 mb-2.5 flex justify-between">
                <span>Seconds from Midnight: <strong>{time}s</strong></span>
                <span className="text-[#78716c]">Cycle: ~{formattedTime}</span>
              </div>

              <input
                type="range"
                min="0"
                max="86399"
                step="600"
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-[#f4ede2] rounded-lg appearance-none cursor-pointer accent-orange-600 border border-[#e4d8c5]"
              />

              <div className="flex justify-between text-[10px] font-semibold text-[#78716c] mt-2 px-0.5">
                <span>00:00 (Midnight)</span>
                <span>06:00 AM</span>
                <span>12:00 PM</span>
                <span>18:00 PM</span>
                <span>23:59</span>
              </div>
            </div>
          </div>

          {/* High-Impact Behavioral Factor Sliders (V14, V4, V12, V10, V17) */}
          <div className="bg-white border border-[#dcd1be] rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                  High-Impact ML Feature Vectors (Primary Fraud Signatures)
                </h4>
                <p className="text-[11px] text-[#78716c]">
                  Features identified by the trained model with highest absolute coefficients.
                </p>
              </div>
              <span className="text-[10px] text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded font-bold self-start sm:self-auto">
                Real-Time Anomaly Sensitivity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { name: 'V14', label: 'V14 (Primary Risk Signal)', min: -10, max: 5, defaultVal: vFeatures.V14 },
                { name: 'V4', label: 'V4 (Velocity Divergence)', min: -4, max: 8, defaultVal: vFeatures.V4 },
                { name: 'V12', label: 'V12 (Account Pattern)', min: -10, max: 4, defaultVal: vFeatures.V12 },
                { name: 'V10', label: 'V10 (Terminal Deviation)', min: -8, max: 4, defaultVal: vFeatures.V10 },
                { name: 'V17', label: 'V17 (Geographic Drift)', min: -10, max: 4, defaultVal: vFeatures.V17 },
              ].map((feat) => {
                const val = parseFloat(vFeatures[feat.name]) || 0;
                const isAnomaly = val < -3.0 || (feat.name === 'V4' && val > 3.0);
                return (
                  <div key={feat.name} className="p-2.5 rounded-lg bg-[#fcfaf6] border border-[#e4d8c5]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#292524]">{feat.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isAnomaly ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {val.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={feat.min}
                      max={feat.max}
                      step="0.1"
                      value={val}
                      onChange={(e) => handleVChange(feat.name, e.target.value)}
                      className="w-full h-1.5 bg-[#ebdcc7] rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex justify-between text-[9px] text-[#78716c] mt-1">
                      <span>{feat.min}</span>
                      <span className="text-[9px] font-medium text-orange-700">
                        {isAnomaly ? 'Anomaly Zone' : 'Normal'}
                      </span>
                      <span>+{feat.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collapsible Accordion for All 28 PCA Features */}
          <div className="border border-[#dcd1be] rounded-xl bg-white/70 p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-[#1c1917] uppercase tracking-wider">
                  Full 28 Latent Vector Inspector (V1 — V28)
                </span>
              </div>
              <span className="text-xs font-semibold text-orange-600">
                {showAdvanced ? 'Hide Vectors ▲' : 'Show All 28 Vectors ▼'}
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-[#e4d8c5]">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((idx) => {
                    const col = `V${idx}`;
                    return (
                      <div key={col} className="p-1.5 rounded-lg bg-[#fcfaf6] border border-[#e4d8c5]">
                        <div className="flex items-center justify-between mb-0.5">
                          <label htmlFor={`input-${col}`} className="text-[10px] font-bold text-[#57534e]">
                            {col}
                          </label>
                        </div>
                        <input
                          id={`input-${col}`}
                          type="number"
                          step="0.01"
                          value={vFeatures[col]}
                          onChange={(e) => handleVChange(col, e.target.value)}
                          className="w-full bg-white border border-[#dcd1be] rounded px-1.5 py-1 text-xs font-semibold text-[#1c1917] outline-none focus:border-orange-600 text-center"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sensitivity Threshold Controller */}
          <ThresholdSlider
            threshold={threshold}
            onChange={setThreshold}
            disabled={loading}
          />

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Calibrating Risk Vectors...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Real-Time Fraud Assessment</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Evaluation Results Card */}
      {result && <ResultCard result={result} />}
    </div>
  );
}
