import React, { useState } from 'react';
import { 
  ClipboardList, Download, Trash2, Search, Filter, ShieldCheck, 
  ShieldAlert, AlertTriangle, ArrowUpRight, CheckCircle2
} from 'lucide-react';

export default function AuditLog({ logs = [], onClearLogs, onSeedSampleLogs }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'LOW' && log.risk_level !== 'LOW') return false;
    if (filter === 'MEDIUM' && log.risk_level !== 'MEDIUM') return false;
    if (filter === 'HIGH' && log.risk_level !== 'HIGH') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAmt = String(log.amount).includes(q);
      const matchPred = log.prediction.toLowerCase().includes(q);
      const matchFactor = (log.top_factor || '').toLowerCase().includes(q);
      return matchAmt || matchPred || matchFactor;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ['ID,Timestamp,Amount,Prediction,Fraud_Probability,Risk_Level,Recommended_Action,Top_Risk_Factor\n'];
    const rows = logs.map(r => 
      `${r.id},${r.timestamp},${r.amount},${r.prediction},${(r.fraud_probability * 100).toFixed(2)}%,${r.risk_level},"${r.recommended_action || 'N/A'}",${r.top_factor || 'N/A'}`
    );

    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraudshield_audit_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-6 shadow-fintech">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                <ClipboardList className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-[#1c1917]">
                Transaction Audit Trail & Security Ledger
              </h2>
            </div>
            <p className="text-xs text-[#78716c] mt-1 font-medium">
              Permanent immutable log of transactions evaluated during this session with explainability flags.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-white border border-[#dcd1be] hover:bg-[#ebdcc7] text-[#1c1917] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-orange-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="px-3.5 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Ledger</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: `All (${logs.length})` },
              { id: 'LOW', label: 'Approved (Low Risk)', color: 'text-emerald-700' },
              { id: 'MEDIUM', label: '2FA Review (Medium)', color: 'text-amber-700' },
              { id: 'HIGH', label: 'Blocked (High Fraud)', color: 'text-red-700' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filter === f.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-[#57534e] border border-[#dcd1be] hover:bg-[#fcfaf6]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#78716c] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search amount or factor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#dcd1be] rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-[#1c1917] outline-none focus:border-orange-600"
            />
          </div>
        </div>
      </div>

      {/* Log Table or Empty State */}
      <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-6 shadow-fintech">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1c1917]">No Transactions in Ledger</h3>
            <p className="text-xs text-[#78716c] max-w-sm mx-auto mt-1 mb-4">
              Transactions scanned via the Control Center or Batch Scanner will appear here automatically.
            </p>
            {onSeedSampleLogs && (
              <button
                type="button"
                onClick={onSeedSampleLogs}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Load Sample Audit Transactions
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e4d8c5] text-[#78716c] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Fraud Probability</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Recommended Action</th>
                  <th className="py-2.5 px-3">Top Driving Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4d8c5]">
                {filteredLogs.map((log) => {
                  const isFraud = log.prediction === 'FRAUD';
                  const isReview = log.prediction === 'REVIEW' || log.risk_level === 'MEDIUM';

                  return (
                    <tr key={log.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-[#78716c]">{log.timestamp}</td>
                      <td className="py-3 px-3 font-black text-[#1c1917]">
                        ${Number(log.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#292524]">
                            {(log.fraud_probability * 100).toFixed(1)}%
                          </span>
                          <div className="w-14 bg-[#ebdcc7] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isFraud ? 'bg-red-600' : isReview ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(log.fraud_probability * 100, 100)}%` }}
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
                          {log.prediction}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#44403c] font-medium">
                        {log.recommended_action || (isFraud ? 'Decline' : 'Approve')}
                      </td>
                      <td className="py-3 px-3 font-mono text-orange-700 font-bold">
                        {log.top_factor || 'V14'}
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
