import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, TrendingDown, 
  Clock, DollarSign, Check, Copy, Sliders, Cpu, Activity
} from 'lucide-react';

export default function ResultCard({ result }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const isFraud = result.prediction === 'FRAUD';
  const isReview = result.prediction === 'REVIEW' || result.risk_level === 'MEDIUM';
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
      actionBadge: 'bg-emerald-600 text-white',
      defaultAction: 'Approve Automatically',
      description: 'Transaction profile matches normal legitimate customer spending behavior. Automated settlement permitted.',
    },
    MEDIUM: {
      label: 'MEDIUM RISK',
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
      barColor: 'bg-amber-500',
      icon: AlertTriangle,
      actionBadge: 'bg-amber-600 text-white',
      defaultAction: 'Step-up 2FA Challenge',
      description: 'Variance detected on latent anomaly vectors. Recommend secondary SMS/Push multi-factor verification.',
    },
    HIGH: {
      label: 'HIGH RISK',
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      barColor: 'bg-red-500',
      icon: ShieldAlert,
      actionBadge: 'bg-red-600 text-white',
      defaultAction: 'Decline & Flag Transaction',
      description: 'Severe divergence from legitimate spending signatures. Immediate transaction hold and account alert recommended.',
    },
  };

  const currentRisk = riskConfig[result.risk_level] || riskConfig.LOW;
  const RiskIcon = currentRisk.icon;
  const actionText = result.recommended_action || currentRisk.defaultAction;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              Evaluation Verdict
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${currentRisk.bg} ${currentRisk.text} border ${currentRisk.border}`}>
                {currentRisk.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${currentRisk.actionBadge}`}>
                {actionText}
              </span>
            </div>
          </div>
          <h2 className={`text-2xl font-black tracking-tight mt-1 ${isFraud ? 'text-red-700' : isReview ? 'text-amber-700' : 'text-emerald-700'}`}>
            {result.prediction === 'FRAUD' ? 'FRAUDULENT' : result.prediction === 'REVIEW' ? 'REQUIRES REVIEW' : 'LEGITIMATE'}
          </h2>
          <p className="text-xs text-[#57534e] mt-1 font-medium leading-relaxed">
            {currentRisk.description}
          </p>
        </div>
      </div>

      {/* Probability Gauge & Progress Bar */}
      <div className="bg-white border border-[#dcd1be] rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-[#44403c] uppercase tracking-wider">
              Calibrated Fraud Probability
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#1c1917]">
              {prob}%
            </span>
            <span className="text-[11px] text-[#78716c]">risk score</span>
          </div>
        </div>

        {/* Multi-segment Threshold Bar */}
        <div className="w-full bg-[#f4ede2] h-4 rounded-full overflow-hidden relative border border-[#e4d8c5]">
          <div
            className={`h-full ${currentRisk.barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(Math.max(result.fraud_probability * 100, 3), 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-semibold text-[#78716c] mt-2 px-1">
          <span>0% (Legitimate)</span>
          <span className="text-amber-700 font-bold">Review Cutoff</span>
          <span className="text-red-700 font-bold">Cutoff: {Math.round((result.threshold_used || 0.70) * 100)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Top Driving Factors (Feature Attribution) */}
      {result.top_factors && result.top_factors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-[#44403c] uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Explainable AI Risk Attribution (Waterfall Drivers)</span>
            <span className="text-[10px] text-[#78716c] font-medium lowercase">weight × value</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {result.top_factors.map((factor, idx) => {
              const isPositive = factor.impact > 0;
              const DirectionIcon = isPositive ? TrendingUp : TrendingDown;
              const absScore = Math.abs(factor.impact);
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#dcd1be] rounded-xl p-3 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isPositive
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <DirectionIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1c1917] block">
                        {factor.feature}
                      </span>
                      <span className="text-[10px] text-[#78716c] font-medium">
                        {factor.direction}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded ${
                      isPositive
                        ? 'text-red-700 bg-red-50'
                        : 'text-emerald-700 bg-emerald-50'
                    }`}
                  >
                    {isPositive ? `+${factor.impact}` : factor.impact}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer System Attribution & Copy Audit Details */}
      <div className="pt-4 border-t border-[#e4d8c5] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#78716c]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-[#44403c]">
            <Cpu className="w-3.5 h-3.5 text-orange-600" />
            {result.model_used || 'Balanced Logistic Regression'}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>Threshold Applied: <strong>{Math.round((result.threshold_used || 0.70) * 100)}%</strong></span>
          <span className="hidden sm:inline">•</span>
          <span>Analyst: <strong>{result.analyst || 'Authorized Analyst'}</strong></span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#dcd1be] hover:bg-[#fcfaf6] text-[#44403c] rounded-lg font-semibold transition-all shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#78716c]" />
              <span>Copy Audit JSON</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
