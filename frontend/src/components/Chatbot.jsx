import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import localKB from '../chatbot_knowledge.json';

function findLocalAnswer(query) {
  const qLower = query.toLowerCase().trim();
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

  return bestAnswer || "I'm FraudShield Assistant. I can help you understand FraudShield, fraud detection, the machine learning model, transaction analysis, the API, and the dashboard.";
}

export default function Chatbot({ isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm FraudShield Assistant. I can help you understand FraudShield, fraud detection, the machine learning model, transaction analysis, the API, and the dashboard.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    'What is FraudShield?',
    'How does fraud detection work?',
    'What is recall?',
    'What does my risk score mean?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const query = messageText || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    let replyText;
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply;
      } else {
        replyText = findLocalAnswer(query);
      }
    } catch (err) {
      replyText = findLocalAnswer(query);
    } finally {
      setMessages((prev) => [...prev, { role: 'assistant', text: replyText || findLocalAnswer(query) }]);
      setLoading(false);
    }
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
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[520px] bg-[#fcfaf6] border border-[#e4d8c5] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Orange Header */}
          <div className="bg-orange-600 text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">FraudShield Assistant</h3>
                <span className="text-[10px] text-orange-100 font-medium block">
                  Local Knowledge Base • Zero External APIs
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Question Chips */}
          <div className="bg-[#f4ede2] border-b border-[#e4d8c5] px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <Sparkles className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 ml-1" />
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[11px] whitespace-nowrap font-semibold bg-white hover:bg-orange-50 text-[#44403c] hover:text-orange-700 border border-[#dcd1be] hover:border-orange-300 rounded-full px-2.5 py-1 transition-all flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fcfaf6]">
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
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-orange-600 text-white rounded-tr-none'
                        : 'bg-[#f4ede2] border border-[#e4d8c5] text-[#292524] rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#78716c] italic pl-9">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Searching local knowledge base...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#f4ede2] border-t border-[#e4d8c5] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about fraud detection, recall, model..."
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
