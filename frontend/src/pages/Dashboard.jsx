import React from 'react';
import StatCards from '../components/StatCards';
import TransactionForm from '../components/TransactionForm';
import ModelInfo from '../components/ModelInfo';
import { Shield, Sparkles, CheckCircle2, AlertOctagon, ArrowUpRight } from 'lucide-react';

export default function Dashboard({ activeTab, setActiveTab, token, user }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Subtitle Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1c1917] tracking-tight">
            Financial Fraud Detection
          </h1>
          <p className="text-sm text-[#78716c] mt-1 font-medium">
            Monitor and analyze transaction risk using machine learning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#f4ede2] border border-[#e4d8c5] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#44403c]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>ML Engine Online • 85.11% Recall</span>
          </div>
          <button
            onClick={() => setActiveTab('analyze')}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Analyze Transaction</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab: Dashboard (Overview) */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Authentic Real Stat Cards */}
          <StatCards />

          {/* Quick Analysis Form Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-[#1c1917]">
                  Instant Transaction Risk Evaluation
                </h2>
                <p className="text-xs text-[#78716c]">
                  Evaluate transactions in real-time or pick a 1-click test scenario below.
                </p>
              </div>
            </div>

            <TransactionForm token={token} />
          </div>
        </div>
      )}

      {/* Tab: Analyze Transaction */}
      {activeTab === 'analyze' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#1c1917]">
              Full Transaction Risk Analyzer
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              Submit transaction parameters for algorithmic risk score calibration.
            </p>
          </div>
          <TransactionForm token={token} />
        </div>
      )}

      {/* Tab: Model Info */}
      {activeTab === 'model' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#1c1917]">
              Model Intelligence & Validation Results
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              Exact validation metrics computed on 56,744 out-of-sample holdout test transactions.
            </p>
          </div>
          <ModelInfo />
        </div>
      )}

      {/* Tab: Assistant */}
      {activeTab === 'assistant' && (
        <div className="bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-fintech">
          <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white mx-auto flex items-center justify-center mb-4 shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1c1917]">FraudShield Assistant</h2>
          <p className="text-xs text-[#78716c] mt-2 leading-relaxed">
            The assistant is powered by a local knowledge base (zero external LLM APIs). Click the floating button in the bottom right corner of the screen at any time to open the interactive assistant.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-xs font-semibold bg-white border border-[#dcd1be] text-[#44403c] px-3 py-1.5 rounded-xl">
              Q: What is FraudShield?
            </span>
            <span className="text-xs font-semibold bg-white border border-[#dcd1be] text-[#44403c] px-3 py-1.5 rounded-xl">
              Q: How does fraud detection work?
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
