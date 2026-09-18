import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, X, Bot, User, Sparkles, Paperclip, 
  FileText, UploadCloud, CheckCircle2, AlertTriangle, ShieldAlert, BarChart2,
  Volume2, VolumeX, MapPin, Compass
} from 'lucide-react';
import localKB from '../chatbot_knowledge.json';
import datasetStats from '../dataset_stats.json';
import hotspotData from '../fraud_hotspots.json';
import { predictClientSide } from '../clientPrediction';

function findLocalAnswer(query, logs = []) {
  const qLower = query.toLowerCase().trim();

  // Dynamic Session / Uploaded Transactions Analysis
  if (
    qLower.includes('upload') || 
    qLower.includes('session') || 
    qLower.includes('ledger') || 
    qLower.includes('my transaction') ||
    qLower.includes('current batch')
  ) {
    if (!logs || logs.length === 0) {
      return "📁 No transactions are currently recorded in your session ledger.\n\nYou can click the Paperclip 📎 button below to upload a transaction dataset (.csv or .json), or run a batch scan in the Batch Scanner tab to analyze transactions!";
    }

    const total = logs.length;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalVol = 0.0;
    let fraudVol = 0.0;
    const factorCounts = {};

    logs.forEach((item) => {
      const amt = parseFloat(item.amount) || 0;
      totalVol += amt;
      if (item.risk_level === 'HIGH' || item.prediction === 'FRAUD') {
        highCount++;
        fraudVol += amt;
      } else if (item.risk_level === 'MEDIUM' || item.prediction === 'REVIEW') {
        mediumCount++;
      } else {
        lowCount++;
      }

      const factor = item.top_factor || 'V14';
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });

    const topFactor = Object.entries(factorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'V14';
    const fraudPct = ((highCount / total) * 100).toFixed(1);
    const avgAmt = (totalVol / total).toFixed(2);

    return `📈 Active Session Dataset Analysis (${total} Transactions Evaluated):\n\n` +
      `• Total Evaluated: ${total} records\n` +
      `• Fraud Risk Rate: ${fraudPct}% (${highCount} high-risk flags)\n` +
      `• Step-up 2FA Reviews: ${mediumCount} (${((mediumCount / total) * 100).toFixed(1)}%)\n` +
      `• Auto-Approved Legitimate: ${lowCount} (${((lowCount / total) * 100).toFixed(1)}%)\n` +
      `• Total Monitored Volume: $${totalVol.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
      `• Capital at Fraud Risk: $${fraudVol.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
      `• Average Transaction Size: $${avgAmt}\n` +
      `• Dominant Risk Factor: ${topFactor}\n\n` +
      `💡 Verdict: ${highCount > 0 ? `Detected ${highCount} severe anomaly events requiring immediate intervention.` : 'All session activity aligns with safe consumer spending patterns.'}`;
  }

  // Geospatial Hotspot & Credit Card Transfer Location Query
  if (
    qLower.includes('locate') || 
    qLower.includes('location') || 
    qLower.includes('where') || 
    qLower.includes('hotspot') || 
    qLower.includes('transfer') || 
    qLower.includes('impossible travel') ||
    qLower.includes('corridor') ||
    qLower.includes('radar') ||
    qLower.includes('gps') ||
    qLower.includes('coordinates')
  ) {
    // Check if user is asking about impossible travel speed
    if (qLower.includes('impossible') || qLower.includes('speed') || qLower.includes('velocity')) {
      const impTransfers = hotspotData.transfers.filter(t => t.is_impossible_travel);
      const topImp = impTransfers[0] || hotspotData.transfers[0];
      return {
        text: `🌍 Impossible Travel Velocity Alerts (${impTransfers.length} detected):\n\n` +
          `• Primary Anomaly: Transfer ${topImp.transfer_id} (${topImp.transfer_type})\n` +
          `• Routing Corridor: ${topImp.origin.city}, ${topImp.origin.country} ➔ ${topImp.destination.city}, ${topImp.destination.country}\n` +
          `• Distance & Time: ${topImp.distance_km} km in ${topImp.time_elapsed_min} minutes\n` +
          `• Transit Velocity: ${topImp.velocity_kmh.toLocaleString()} km/h (Physically impossible commercial transit >900 km/h!)\n` +
          `• Amount: $${topImp.amount.toFixed(2)} | Fraud Probability: ${(topImp.fraud_probability * 100).toFixed(1)}%\n` +
          `• Machine Learning Action: ${topImp.recommended_action}\n\n` +
          `Click below to pinpoint and highlight this transfer on the interactive Hotspot Map!`,
        transfer_id: topImp.transfer_id
      };
    }

    // Check if user is asking about a specific city or destination
    const cities = ["london", "paris", "frankfurt", "zurich", "amsterdam", "new york", "san francisco", "miami", "singapore", "hong kong", "tokyo", "dubai", "george town", "belize", "limassol", "lagos", "moscow"];
    const matchedCity = cities.find(c => qLower.includes(c));

    let matchedTransfer = null;
    if (matchedCity) {
      matchedTransfer = hotspotData.transfers.find(t => 
        t.origin.city.toLowerCase().includes(matchedCity) || 
        t.destination.city.toLowerCase().includes(matchedCity)
      );
    }

    if (matchedTransfer) {
      return {
        text: `📍 Located Credit Card Transfer for ${matchedTransfer.origin.city} ➔ ${matchedTransfer.destination.city}:\n\n` +
          `• Transfer ID: ${matchedTransfer.transfer_id} (${matchedTransfer.transfer_type})\n` +
          `• Origin: ${matchedTransfer.origin.city}, ${matchedTransfer.origin.country} [Lat: ${matchedTransfer.origin.lat.toFixed(2)}, Lon: ${matchedTransfer.origin.lon.toFixed(2)}]\n` +
          `• Destination: ${matchedTransfer.destination.city}, ${matchedTransfer.destination.country} [Lat: ${matchedTransfer.destination.lat.toFixed(2)}, Lon: ${matchedTransfer.destination.lon.toFixed(2)}]\n` +
          `• Distance & Time: ${matchedTransfer.distance_km} km (${matchedTransfer.time_elapsed_min} minutes window)\n` +
          `• Velocity: ${matchedTransfer.velocity_kmh.toLocaleString()} km/h ${matchedTransfer.is_impossible_travel ? '⚠️ (Impossible Travel)' : '✅ (Normal Transit)'}\n` +
          `• Amount: $${matchedTransfer.amount.toFixed(2)}\n` +
          `• Risk Level: ${matchedTransfer.risk_level} (${(matchedTransfer.fraud_probability * 100).toFixed(1)}%)\n` +
          `• Action: ${matchedTransfer.recommended_action}\n` +
          `• Latent Vector Anomaly: V14=${matchedTransfer.latent_signals.v14}, V4=${matchedTransfer.latent_signals.v4}\n\n` +
          `Click below to view this transfer in the Hotspot Map!`,
        transfer_id: matchedTransfer.transfer_id
      };
    }

    // Default overview of hotspots and flagged transfers
    const criticalHotspots = hotspotData.hotspots.filter(h => h.severity === 'CRITICAL');
    const topHighRisk = hotspotData.transfers.find(t => t.is_fraud) || hotspotData.transfers[0];

    return {
      text: `🗺️ Credit Card Transfer Geospatial Intelligence:\n\n` +
        `• Monitored Global Corridors: ${hotspotData.summary.total_monitored_transfers} active transfer routes\n` +
        `• Critical Risk Hotspots: ${hotspotData.summary.high_risk_hotspots} hubs (${criticalHotspots.map(h => h.city + ' [' + h.fraud_rate_pct + '% fraud]').join(', ')})\n` +
        `• Impossible Travel Alerts: ${hotspotData.summary.impossible_travel_alerts} velocity spikes (>900 km/h)\n` +
        `• Total Monitored Volume: $${hotspotData.summary.total_monitored_volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
        `• Capital at Risk: $${hotspotData.summary.capital_at_risk.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +
        `📍 Top Flagged Transfer: ${topHighRisk.transfer_id} ($${topHighRisk.amount.toFixed(2)}) from ${topHighRisk.origin.city} to ${topHighRisk.destination.city} at ${topHighRisk.velocity_kmh.toLocaleString()} km/h (${topHighRisk.risk_level} Risk).\n\n` +
        `Click below to inspect the complete Hotspot Map!`,
      transfer_id: topHighRisk.transfer_id
    };
  }

  // Token / keyword matching across knowledge base
  const qWords = qLower.replace(/[?!.]/g, '').split(/\s+/);
  const stopWords = new Set(["what", "is", "the", "a", "an", "of", "to", "in", "on", "for", "how", "does", "do", "can", "you", "my"]);
  const meaningfulWords = qWords.filter(w => !stopWords.has(w));

  for (const entry of localKB) {
    for (const kw of (entry.keywords || [])) {
      if (qLower.includes(kw.toLowerCase())) {
        return entry.answer;
      }
    }
  }

  let bestAnswer = null;
  let maxScore = 0;
  for (const entry of localKB) {
    const entryWords = entry.question.toLowerCase().replace(/[?!.]/g, '').split(/\s+/);
    const overlap = meaningfulWords.filter(w => entryWords.includes(w)).length;
    if (overlap > maxScore && overlap >= 1) {
      maxScore = overlap;
      bestAnswer = entry.answer;
    }
  }

  return bestAnswer || "I'm FraudShield Assistant. I can analyze uploaded datasets, explain fraud metrics (Recall, ROC-AUC), inspect transaction features, and provide statistical insights on the financial dataset.";
}

export default function Chatbot({ isOpen, setIsOpen, logs = [], onDatasetUploaded, onFocusTransfer }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hello! I'm FraudShield Assistant. I can locate credit card transfers on the global hotspot map, analyze dataset distributions, evaluate uploaded CSV files, and explain fraud detection metrics.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem('fraudshield_voice_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const quickQuestions = [
    '🗺️ Locate Hotspots',
    '📍 Impossible Travel Speed',
    '📊 Analyze Core Dataset',
    '📁 Analyze Uploaded Data',
    '💰 Fraud vs Normal Amounts',
    '🎯 Top 5 Predictive Signals',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Clean markdown and non-phonetic characters for speech synthesis
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/[*_#`~]/g, '')
      .replace(/[•■▪]/g, '')
      .replace(/[━─═-]{3,}/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // Remove emojis
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speakText = (text, idx = null) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingIndex === idx && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Zira')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setSpeakingIndex(idx);
    };
    utterance.onend = () => {
      setSpeakingIndex(null);
    };
    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    const next = !isVoiceEnabled;
    setIsVoiceEnabled(next);
    try {
      localStorage.setItem('fraudshield_voice_enabled', String(next));
    } catch {
      // ignore
    }
    if (!next && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }
  };

  const handleCloseModal = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
    setIsOpen(false);
  };

  const handleSend = async (messageText = null) => {
    const query = messageText || input.trim();
    if (!query) return;

    const userMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    let replyText = null;
    let replyTransferId = null;

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply;
        replyTransferId = data.transfer_id || null;
      } else {
        const localAns = findLocalAnswer(query, logs);
        if (typeof localAns === 'object' && localAns !== null) {
          replyText = localAns.text;
          replyTransferId = localAns.transfer_id || null;
        } else {
          replyText = localAns;
        }
      }
    } catch {
      const localAns = findLocalAnswer(query, logs);
      if (typeof localAns === 'object' && localAns !== null) {
        replyText = localAns.text;
        replyTransferId = localAns.transfer_id || null;
      } else {
        replyText = localAns;
      }
    } finally {
      if (!replyText) {
        const localAns = findLocalAnswer(query, logs);
        if (typeof localAns === 'object' && localAns !== null) {
          replyText = localAns.text;
          replyTransferId = localAns.transfer_id || null;
        } else {
          replyText = localAns;
        }
      }

      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', text: replyText, transfer_id: replyTransferId }
      ]);
      setLoading(false);
      if (isVoiceEnabled) {
        speakText(replyText, messages.length + 1);
      }
    }
  };

  // Direct CSV / JSON Dataset Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isCSV = fileName.endsWith('.csv');
    const isJSON = fileName.endsWith('.json');

    if (!isCSV && !isJSON) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "⚠️ Unsupported file format. Please upload a .csv or .json file containing transaction records." }
      ]);
      return;
    }

    // User upload notice
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: `📎 Uploaded dataset: ${fileName} (${(file.size / 1024).toFixed(1)} KB)` },
      { role: 'assistant', text: `🔄 Parsing and running ML fraud analysis on ${fileName}...` }
    ]);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let transactions = [];

        if (isJSON) {
          const parsed = JSON.parse(content);
          transactions = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // Parse CSV
          const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length < 2) throw new Error("CSV file contains no data rows.");

          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row = {};
            headers.forEach((h, colIdx) => {
              row[h] = parseFloat(values[colIdx]) || 0.0;
            });
            transactions.push(row);
          }
        }

        if (transactions.length === 0) {
          throw new Error("No transaction rows found in the uploaded file.");
        }

        // Limit maximum instant batch to first 2,000 rows to prevent browser freeze
        const processRows = transactions.slice(0, 2000);

        let highCount = 0;
        let mediumCount = 0;
        let lowCount = 0;
        let totalVol = 0.0;
        let fraudVol = 0.0;
        const evaluatedRows = [];
        const factorFrequency = {};

        processRows.forEach((tx, idx) => {
          const res = predictClientSide(tx);
          const amt = parseFloat(tx.Amount) || 0;
          totalVol += amt;

          if (res.risk_level === 'HIGH') {
            highCount++;
            fraudVol += amt;
          } else if (res.risk_level === 'MEDIUM') {
            mediumCount++;
          } else {
            lowCount++;
          }

          const topFeat = res.top_factors && res.top_factors[0] ? res.top_factors[0].feature : 'V14';
          factorFrequency[topFeat] = (factorFrequency[topFeat] || 0) + 1;

          evaluatedRows.push({
            id: Date.now() + idx,
            timestamp: new Date().toLocaleTimeString(),
            amount: amt,
            prediction: res.prediction,
            fraud_probability: res.fraud_probability,
            risk_level: res.risk_level,
            recommended_action: res.recommended_action,
            threshold_used: res.threshold_used,
            top_factor: topFeat
          });
        });

        const dominantFactor = Object.entries(factorFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'V14';
        const fraudPercentage = ((highCount / processRows.length) * 100).toFixed(2);
        const avgAmt = (totalVol / processRows.length).toFixed(2);

        const report = `📊 Dataset Analysis Report for: ${fileName}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• Total Transactions Processed: ${processRows.length.toLocaleString()}${transactions.length > 2000 ? ` (first 2,000 of ${transactions.length.toLocaleString()})` : ''}\n` +
          `• High-Risk Fraud Alerts: ${highCount} (${fraudPercentage}%)\n` +
          `• Step-up 2FA Reviews: ${mediumCount} (${((mediumCount / processRows.length) * 100).toFixed(2)}%)\n` +
          `• Auto-Approved Legitimate: ${lowCount} (${((lowCount / processRows.length) * 100).toFixed(2)}%)\n` +
          `• Total Monetary Volume: $${totalVol.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
          `• Capital at Risk (Fraud Exposure): $${fraudVol.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
          `• Average Transaction Amount: $${avgAmt}\n` +
          `• Primary Behavioral Anomaly Signal: ${dominantFactor}\n\n` +
          `💡 Machine Learning Assessment: ` +
          `${parseFloat(fraudPercentage) > 2.0 
            ? `⚠️ Elevated anomaly cluster detected (${fraudPercentage}% fraud rate). This significantly exceeds standard baseline (0.13%). Recommend applying automated holds.` 
            : `✅ Normal risk distribution detected (${fraudPercentage}% fraud rate). Overall dataset behaves consistently with typical payment rails.`}\n\n` +
          `✅ All ${processRows.length} transactions have been automatically registered in your live Audit Ledger!`;

        setMessages((prev) => [...prev, { role: 'assistant', text: report }]);

        // Send to parent to populate Audit Ledger
        if (onDatasetUploaded) {
          onDatasetUploaded(evaluatedRows);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `❌ Failed to parse dataset: ${err.message}. Please verify the file has valid columns (e.g. Amount, Time, V1...V28).` }
        ]);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-orange-600 hover:bg-orange-700 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
        title="Chat with FraudShield Assistant"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pr-1">
          FraudShield Assistant
        </span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[440px] h-[550px] bg-[#fcfaf6] border border-[#e4d8c5] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-orange-600 text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">FraudShield AI Data Assistant</h3>
                <span className="text-[10px] text-orange-100 font-medium block">
                  ML Dataset Analytics • Voice Enabled
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice Output Toggle */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition-all ${
                  isVoiceEnabled 
                    ? 'text-white bg-white/20 hover:bg-white/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={isVoiceEnabled ? "Voice Output Active (Click to Mute)" : "Voice Output Muted (Click to Enable)"}
              >
                {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Question Chips */}
          <div className="bg-[#f4ede2] border-b border-[#e4d8c5] px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <Sparkles className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 ml-1" />
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[11px] whitespace-nowrap font-semibold bg-white hover:bg-orange-50 text-[#44403c] hover:text-orange-700 border border-[#dcd1be] hover:border-orange-300 rounded-full px-2.5 py-1 transition-all flex-shrink-0 shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-white/40">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 shadow-xs ${
                      isUser
                        ? 'bg-orange-600 text-white'
                        : 'bg-[#f4ede2] text-orange-700 border border-[#e4d8c5]'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-orange-600 text-white rounded-tr-none'
                        : 'bg-[#f4ede2] border border-[#e4d8c5] text-[#292524] rounded-tl-none font-sans'
                    }`}
                  >
                    {m.text}

                    {/* Action Buttons: View on Hotspot Map + Listen Audio */}
                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-[#e4d8c5]/70 flex items-center justify-between gap-2">
                        {m.transfer_id && onFocusTransfer ? (
                          <button
                            type="button"
                            onClick={() => {
                              onFocusTransfer(m.transfer_id);
                            }}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-orange-700 hover:text-white bg-white hover:bg-orange-600 border border-orange-300 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>View on Hotspot Map</span>
                          </button>
                        ) : <div />}

                        {/* Listen to Voice Reply Button for Assistant */}
                        <button
                          type="button"
                          onClick={() => speakText(m.text, idx)}
                          title={speakingIndex === idx ? "Stop Audio" : "Listen to Voice Reply"}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                            speakingIndex === idx
                              ? 'text-orange-700 bg-orange-200 animate-pulse'
                              : 'text-[#78716c] hover:text-orange-700 hover:bg-white/80'
                          }`}
                        >
                          {speakingIndex === idx ? (
                            <>
                              <VolumeX className="w-3 h-3 text-orange-700" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-orange-600" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#78716c] italic pl-9">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Analyzing dataset with ML intelligence...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Send Form with Dataset File Upload */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#f4ede2] border-t border-[#e4d8c5] flex items-center gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv, .json"
              className="hidden"
            />

            {/* Paperclip Upload Dataset Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Upload Transaction Dataset (.csv or .json) for AI Analysis"
              className="p-2 bg-white hover:bg-orange-50 text-[#78716c] hover:text-orange-600 border border-[#dcd1be] rounded-xl transition-all shadow-xs flex items-center justify-center group"
            >
              <Paperclip className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to analyze datasets or upload a CSV..."
              className="flex-1 bg-white border border-[#dcd1be] rounded-xl px-3.5 py-2 text-xs text-[#1c1917] outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600/30 transition-all"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
