import React, { useState } from 'react';
import { 
  FileText, Play, Download, CheckCircle2, AlertTriangle, ShieldAlert, 
  RefreshCw, DollarSign, BarChart3, UploadCloud, Layers
} from 'lucide-react';
import ThresholdSlider from './ThresholdSlider';

export default function BatchScanner({ token, onBatchEvaluated }) {
  const [threshold, setThreshold] = useState(0.70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchData, setBatchData] = useState(null);

  // Default sample batch of diverse transactions
  const sampleBatch = [
    { Amount: 4.50, Time: 30600, V1: -0.15, V2: 0.08, V3: 0.95, V4: -0.12, V14: 0.22, V12: 0.15, label: 'Starbucks Coffee' },
    { Amount: 89.90, Time: 45000, V1: 0.10, V2: -0.05, V3: 0.50, V4: 0.20, V14: 0.15, V12: 0.20, label: 'Target Department Store' },
    { Amount: 1850.00, Time: 11700, V1: -3.85, V2: 2.91, V3: -4.20, V4: 4.85, V14: -7.80, V12: -6.15, label: 'Midnight Wire Transfer' },
    { Amount: 1.20, Time: 7500, V1: -2.31, V2: 1.85, V3: -3.10, V4: 3.75, V14: -6.50, V12: -4.80, label: 'Micro Carding Test' },
    { Amount: 24.50, Time: 54000, V1: 0.05, V2: 0.12, V3: 0.80, V4: -0.05, V14: 0.30, V12: 0.18, label: 'Uber Ride' },
    { Amount: 420.00, Time: 14400, V1: -2.10, V2: 1.45, V3: -2.80, V4: 3.20, V14: -5.10, V12: -4.20, label: 'Online Electronics Store' },
    { Amount: 15.00, Time: 43200, V1: 0.12, V2: -0.08, V3: 0.65, V4: 0.10, V14: 0.25, V12: 0.12, label: 'Chipotle Lunch' },
    { Amount: 3200.00, Time: 9000, V1: -4.10, V2: 3.20, V3: -4.80, V4: 5.10, V14: -8.20, V12: -6.80, label: 'Cross-Border Remittance' },
  ];

  const handleRunBatch = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        transactions: sampleBatch.map(({ label, ...rest }) => rest),
        threshold: threshold,
      };

      const res = await fetch('/batch-predict', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Batch scan failed. Check backend status.');
      }

      setBatchData(data);
      if (onBatchEvaluated) {
        onBatchEvaluated(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!batchData || !batchData.results) return;

    const headers = ['ID,Amount,Prediction,Fraud_Probability,Risk_Level,Recommended_Action,Top_Risk_Factor\n'];
    const rows = batchData.results.map(r => 
      `${r.id},${r.amount},${r.prediction},${(r.fraud_probability * 100).toFixed(2)}%,${r.risk_level},"${r.recommended_action}",${r.top_factor}`
    );

    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraudshield_batch_audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-6 shadow-fintech">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-[#1c1917]">
                Batch Transaction Scanner & Risk Engine
              </h2>
            </div>
            <p className="text-xs text-[#78716c] mt-1 font-medium">
              Execute high-throughput multi-transaction fraud analysis with configurable alert cutoffs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleRunBatch}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating {sampleBatch.length} Transactions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Batch Scan ({sampleBatch.length} Presets)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Batch Threshold Sensitivity */}
        <ThresholdSlider
          threshold={threshold}
          onChange={setThreshold}
          disabled={loading}
        />

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-100/80 border border-red-300 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Results & Summary KPIs */}
      {batchData && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716c] block">
                Total Evaluated
              </span>
              <span className="text-2xl font-black text-[#1c1917] mt-1 block">
                {batchData.total_scanned}
              </span>
              <span className="text-[10px] text-[#78716c]">Transactions processed</span>
            </div>

            <div className="bg-[#f4ede2] border border-red-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 block">
                High-Risk Frauds
              </span>
              <span className="text-2xl font-black text-red-700 mt-1 block">
                {batchData.fraud_count}
              </span>
              <span className="text-[10px] text-red-600 font-semibold">Immediate blocks triggered</span>
            </div>

            <div className="bg-[#f4ede2] border border-amber-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                Step-up 2FA Reviews
              </span>
              <span className="text-2xl font-black text-amber-800 mt-1 block">
                {batchData.review_count}
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">Flagged for verification</span>
            </div>

            <div className="bg-[#f4ede2] border border-emerald-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                Auto-Approved
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {batchData.legitimate_count}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Clean customer transactions</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-6 shadow-fintech">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-black text-[#1c1917]">
                  Batch Evaluation Breakdown
                </h3>
                <span className="text-xs text-[#78716c]">
                  Applied Decision Cutoff: <strong>{Math.round(batchData.threshold_applied * 100)}%</strong> • Total Volume: <strong>${batchData.total_volume.toLocaleString()}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-3.5 py-1.5 bg-white border border-[#dcd1be] hover:bg-[#ebdcc7] text-[#1c1917] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-orange-600" />
                <span>Export Audit CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e4d8c5] text-[#78716c] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Context / Merchant</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Probability</th>
                    <th className="py-2.5 px-3">Verdict</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Top Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4d8c5]">
                  {batchData.results.map((item, idx) => {
                    const presetLabel = sampleBatch[idx] ? sampleBatch[idx].label : `Tx #${item.id}`;
                    const isFraud = item.prediction === 'FRAUD';
                    const isReview = item.prediction === 'REVIEW';

                    return (
                      <tr key={item.id} className="hover:bg-white/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#78716c]">{item.id}</td>
                        <td className="py-3 px-3 font-semibold text-[#1c1917]">{presetLabel}</td>
                        <td className="py-3 px-3 font-black text-[#1c1917]">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#292524]">
                              {(item.fraud_probability * 100).toFixed(1)}%
                            </span>
                            <div className="w-16 bg-[#ebdcc7] h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isFraud ? 'bg-red-600' : isReview ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(item.fraud_probability * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              isFraud
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : isReview
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.prediction}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#44403c] font-medium">
                          {item.recommended_action}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] font-bold text-orange-700">
                          {item.top_factor}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
