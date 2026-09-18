import React from 'react';
import StatCards from '../components/StatCards';
import TransactionForm from '../components/TransactionForm';
import BatchScanner from '../components/BatchScanner';
import ModelInfo from '../components/ModelInfo';
import AuditLog from '../components/AuditLog';
import { Shield, Sparkles, Layers, Sliders, ArrowUpRight, Cpu } from 'lucide-react';

export default function Dashboard({ 
  activeTab, 
  setActiveTab, 
  token, 
  user, 
  logs = [], 
  onTransactionEvaluated, 
  onBatchEvaluated,
  onClearLogs,
  onSeedSampleLogs
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Subtitle Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1c1917] tracking-tight">
            Financial Fraud Detection & Risk Control Center
          </h1>
          <p className="text-sm text-[#78716c] mt-1 font-medium">
            Fine-tune decision boundaries, run real-time transaction simulations, and audit holdout benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#f4ede2] border border-[#e4d8c5] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#44403c]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Pure ML Model • 85.11% Recall</span>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === 'dashboard' ? 'batch' : 'dashboard')}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {activeTab === 'dashboard' ? (
              <>
                <Layers className="w-3.5 h-3.5" />
                <span>Switch to Batch Scanner</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Control Center</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Dashboard (Control Center & Live Scanner) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Real Statistics from Genuine Model */}
          <StatCards />

          {/* Interactive Control Station */}
          <div>
            <TransactionForm 
              token={token} 
              onTransactionEvaluated={onTransactionEvaluated} 
            />
          </div>
        </div>
      )}

      {/* Tab 2: Batch Scanner */}
      {activeTab === 'batch' && (
        <BatchScanner 
          token={token} 
          onBatchEvaluated={onBatchEvaluated} 
        />
      )}

      {/* Tab 3: Model Intelligence */}
      {activeTab === 'model' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#1c1917]">
              Model Intelligence & Performance Metrics
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              Genuine validation metrics computed on 56,744 out-of-sample holdout test transactions.
            </p>
          </div>
          <ModelInfo />
        </div>
      )}

      {/* Tab 4: Audit Ledger */}
      {activeTab === 'audit' && (
        <AuditLog 
          logs={logs} 
          onClearLogs={onClearLogs} 
          onSeedSampleLogs={onSeedSampleLogs} 
        />
      )}

      {/* Tab 5: Assistant */}
      {activeTab === 'assistant' && (
        <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-fintech">
          <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white mx-auto flex items-center justify-center mb-4 shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1c1917]">FraudShield AI Assistant</h2>
          <p className="text-xs text-[#78716c] mt-2 leading-relaxed">
            The assistant is powered by a local knowledge base with zero external API dependencies. Click the floating widget in the bottom-right corner at any time to consult the assistant on fraud metrics, model architecture, or risk thresholds.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-xs font-semibold bg-white border border-[#dcd1be] text-[#44403c] px-3 py-1.5 rounded-xl">
              Q: What is FraudShield?
            </span>
            <span className="text-xs font-semibold bg-white border border-[#dcd1be] text-[#44403c] px-3 py-1.5 rounded-xl">
              Q: How does the threshold slider work?
            </span>
            <span className="text-xs font-semibold bg-white border border-[#dcd1be] text-[#44403c] px-3 py-1.5 rounded-xl">
              Q: What is recall?
            </span>
            <span className="text-xs font-semibold bg-white border border-[#dcd1be] text-[#44403c] px-3 py-1.5 rounded-xl">
              Q: What does my risk score mean?
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
