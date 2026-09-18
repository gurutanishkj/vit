import React from 'react';
import { Sliders, ShieldAlert, ShieldCheck, Scale, Info } from 'lucide-react';

export default function ThresholdSlider({ threshold, onChange, disabled = false }) {
  const percentage = Math.round(threshold * 100);

  const presets = [
    { label: 'High Sensitivity', value: 0.40, desc: 'Maximum fraud capture (High Recall)' },
    { label: 'Balanced (Default)', value: 0.70, desc: 'Optimal fraud vs friction balance' },
    { label: 'Low Friction', value: 0.85, desc: 'Fewer false alarms (High Precision)' },
  ];

  return (
    <div className="bg-white border border-[#dcd1be] rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                Fraud Decision Threshold Control
              </span>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-orange-200">
                Active: {percentage}%
              </span>
            </div>
            <p className="text-[11px] text-[#78716c]">
              Control the probability cutoff for classifying a transaction as fraudulent.
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {presets.map((p) => {
            const isSelected = Math.abs(threshold - p.value) < 0.03;
            return (
              <button
                key={p.label}
                type="button"
                disabled={disabled}
                onClick={() => onChange(p.value)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-[#f4ede2] hover:bg-[#ebdcc7] text-[#44403c] border border-[#e4d8c5]'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slider Bar */}
      <div className="space-y-1.5">
        <input
          type="range"
          min="0.10"
          max="0.95"
          step="0.05"
          value={threshold}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#f4ede2] rounded-lg appearance-none cursor-pointer accent-orange-600 border border-[#e4d8c5]"
        />

        <div className="flex justify-between text-[10px] font-semibold text-[#78716c] px-0.5">
          <span className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="w-3 h-3" />
            10% Strict Cutoff
          </span>
          <span className="text-orange-700 font-bold">
            Cutoff: {percentage}%
          </span>
          <span className="flex items-center gap-1 text-red-700">
            95% Permissive Cutoff
            <ShieldAlert className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Dynamic threshold behavior explanation */}
      <div className="mt-3 pt-2.5 border-t border-[#f4ede2] flex items-start gap-2 text-[11px] text-[#57534e]">
        <Info className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          {percentage < 50 ? (
            <span>
              <strong className="text-red-700 font-bold">High Alert Mode ({percentage}%):</strong> Transactions with over {percentage}% model probability trigger a Fraud block. Catches near 99% of fraud, but may increase step-up 2FA on edge cases.
            </span>
          ) : percentage <= 75 ? (
            <span>
              <strong className="text-orange-700 font-bold">Balanced Mode ({percentage}%):</strong> Recommended production baseline. Achieves 85.11% recall on holdout test set with low false alarm friction.
            </span>
          ) : (
            <span>
              <strong className="text-blue-700 font-bold">Conservative Mode ({percentage}%):</strong> Only transactions with extreme confidence (&gt;{percentage}%) trigger fraud blocks. Minimizes friction for VIP accounts.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
