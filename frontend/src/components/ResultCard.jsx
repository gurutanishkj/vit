import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const isFraud = result.prediction === 'FRAUD';
  const prob = (result.fraud_probability * 100).toFixed(2);

  // Risk styling configuration
  const riskConfig = {
    LOW: {
      label: 'LOW RISK',
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      barColor: 'bg-emerald-500',
      icon: ShieldCheck,
      description: 'Transaction profile consistent with legitimate cardholder habits. Standard settlement recommended.',
    },
    MEDIUM: {
      label: 'MEDIUM RISK',
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
      barColor: 'bg-amber-500',
      icon: AlertTriangle,
      description: 'Moderate anomaly variance detected. Recommend automated 2FA step-up authentication challenge.',
    },
    HIGH: {
      label: 'HIGH RISK',
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      barColor: 'bg-red-500',
      icon: ShieldAlert,
      description: 'Severe statistical anomaly across PCA behavioral projections. Recommend immediate hold or transaction block.',
    },
  };

  const currentRisk = riskConfig[result.risk_level] || riskConfig.LOW;
  const RiskIcon = currentRisk.icon;

  return (
    <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-6 shadow-fintech transition-all">
      {/* Header Status Banner */}
      <div className={`p-4 rounded-xl border ${currentRisk.border} ${currentRisk.bg} flex items-start gap-4 mb-6`}>
        <div className={`p-2.5 rounded-lg bg-white/80 ${currentRisk.text} shadow-sm flex-shrink-0`}>
          <RiskIcon className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#44403c]">
              Transaction Classification Result
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${currentRisk.bg} ${currentRisk.text} border ${currentRisk.border}`}>
              {currentRisk.label}
            </span>
          </div>
          <h2 className={`text-2xl font-black tracking-tight mt-0.5 ${isFraud ? 'text-red-700' : 'text-emerald-700'}`}>
            {result.prediction}
          </h2>
          <p className="text-xs text-[#57534e] mt-1 font-medium">
            {currentRisk.description}
          </p>
        </div>
      </div>

      {/* Probability Gauge & Progress Bar */}
      <div className="bg-white border border-[#dcd1be] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#44403c] uppercase tracking-wider">
            Model Fraud Probability
          </span>
          <span className="text-lg font-black text-[#1c1917]">
            {prob}%
          </span>
        </div>

        {/* Multi-segment Threshold Bar */}
        <div className="w-full bg-[#f4ede2] h-3.5 rounded-full overflow-hidden relative border border-[#e4d8c5]">
          <div
            className={`h-full ${currentRisk.barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(Math.max(result.fraud_probability * 100, 2), 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-semibold text-[#78716c] mt-2 px-1">
          <span>0% (Legitimate)</span>
          <span className="text-amber-700">30% Threshold (Review)</span>
          <span className="text-red-700">70% Threshold (Fraud)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Top Driving Factors (Feature Attribution) */}
      {result.top_factors && result.top_factors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-[#44403c] uppercase tracking-wider mb-2.5">
            Key Behavioral Risk Drivers (Explainable AI)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {result.top_factors.map((factor, idx) => {
              const isElevated = factor.direction === 'Elevated Risk';
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#dcd1be] rounded-xl p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#1c1917]">
                      {factor.feature}
                    </span>
                    {isElevated ? (
                      <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#78716c]">
                    Impact: <strong className={isElevated ? 'text-red-600' : 'text-emerald-700'}>{factor.impact > 0 ? `+${factor.impact}` : factor.impact}</strong>
                  </span>
                  <span className={`text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded ${isElevated ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {factor.direction}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evaluated Transaction Metadata */}
      {result.transaction_details && (
        <div className="bg-[#fcfaf6] border border-[#e4d8c5] rounded-xl p-3.5 flex flex-wrap items-center justify-around gap-3 text-xs text-[#57534e]">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-orange-600" />
            <span>Amount: <strong>${result.transaction_details.amount?.toFixed(2)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>Hour of Day: <strong>{result.transaction_details.hour_of_day?.toFixed(1)}h</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            <span>Model: <strong>{result.model_used || 'Logistic Regression'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
