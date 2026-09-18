import React from 'react';
import { CreditCard, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

export default function StatCards() {
  const stats = [
    {
      label: 'Total Transactions',
      value: '283,726',
      subtext: 'Deduplicated historical records',
      badge: '100% Cleaned',
      icon: CreditCard,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      borderColor: 'border-[#e4d8c5]',
    },
    {
      label: 'Fraudulent Transactions',
      value: '379',
      subtext: '0.13% severe class imbalance',
      badge: 'High Risk Class',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      borderColor: 'border-red-200/70',
    },
    {
      label: 'Legitimate Transactions',
      value: '283,347',
      subtext: '99.87% normal consumer activity',
      badge: 'Verified Clean',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      borderColor: 'border-[#e4d8c5]',
    },
    {
      label: 'Model Recall',
      value: '85.11%',
      subtext: '80 / 94 test frauds caught',
      badge: 'Unseen Holdout',
      icon: Target,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      borderColor: 'border-[#e4d8c5]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`bg-[#f4ede2] border ${item.borderColor} rounded-2xl p-5 shadow-fintech hover:border-orange-300 transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#78716c] uppercase tracking-wider">
                {item.label}
              </span>
              <div className={`w-9 h-9 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#1c1917] tracking-tight">
                {item.value}
              </span>
              <span className="text-[10px] font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-md">
                {item.badge}
              </span>
            </div>

            <p className="text-xs text-[#78716c] mt-2 font-medium">
              {item.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
