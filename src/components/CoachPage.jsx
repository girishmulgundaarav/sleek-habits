import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Brain, Send, RefreshCw, Key, ShieldAlert, Sparkles, Check, Award } from 'lucide-react';

export const CoachPage = () => {
  const { 
    habits, 
    focus, 
    sleep, 
    moodEnergy, 
    selectedDate, 
    todayStr,
    playClickSound 
  } = useContext(AppContext);

  // States
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('sleekhabits_coach_history');
    return saved ? JSON.parse(saved) : [
      {
        sender: 'ai',
        text: "Hello! I'm **SleekCoach**, your AI-powered performance and habit coach. I've analyzed your daily logs. Ask me to *'Analyze my week'*, *'Suggest tips for better sleep'*, or ask any question to optimize your productivity!"
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(() => {
    return localStorage.getItem('sleekhabits_gemini_key') || '';
  });
  const [keyInput, setKeyInput] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(!import.meta.env.VITE_GEMINI_API_KEY && !localStorage.getItem('sleekhabits_gemini_key'));

  const chatEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    localStorage.setItem('sleekhabits_coach_history', JSON.stringify(messages));
  }, [messages]);

  // Resolve API Key
  const getApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || localApiKey;
  };

  // Safe Regex HTML Markdown parser
  const renderMessageContent = (text) => {
    if (!text) return null;
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-text-main dark:text-white">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Code blocks/inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc my-1">$1</li>');

    // Paragraph splits
    html = html.replace(/\n/g, '<br />');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Build the payload context
  const buildContextPrompt = () => {
    const habitsSummary = habits.map(h => {
      const completions = Object.values(h.history || {}).filter(Boolean).length;
      return `- ${h.name} (${h.category}): scheduled as ${h.recurrence.type}. Target: ${h.targetValue} ${h.unit}. Completed ${completions} times.`;
    }).join('\n');

    const sleepSummary = Object.entries(sleep).slice(-7).map(([d, val]) => `${d}: ${val} hrs`).join(', ');
    const focusSummary = Object.entries(focus).slice(-7).map(([d, val]) => `${d}: ${val} mins`).join(', ');
    const moodSummary = Object.entries(moodEnergy).slice(-7).map(([d, val]) => `${d}: rating ${val}/5`).join(', ');

    return `You are "SleekCoach", a premium AI habit & performance coach integrated into the SleekHabits system.
You analyze user habits, sleep, focus logs, and mood ratings to discover correlations and recommend action plans.
Format your responses in clean, structured markdown. Be encouraging, highly professional, direct, and concise.

User Data Summary:
- Habits:
${habitsSummary || 'None created yet'}
- Sleep logs (past 7 logs): ${sleepSummary || 'None logged yet'}
- Focus logs (past 7 logs): ${focusSummary || 'None logged yet'}
- Mood rating (past 7 logs): ${moodSummary || 'None logged yet'}

Current date: ${todayStr} (selected date in view: ${selectedDate})`;
  };

  // Call Gemini API via fetch
  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim()) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setShowKeySetup(true);
      return;
    }

    playClickSound();
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const systemContext = buildContextPrompt();
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemContext}\n\nUser Question: ${queryText}` }
            ]
          }
        ]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP error! status: ${response.status}`;
        setMessages(prev => [...prev, { sender: 'ai', text: `⚠️ **API Error:** ${errorMsg}` }]);
        return;
      }

      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to retrieve a response. Please check your candidates config and try again.";
      
      setMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
    } catch (err) {
      console.error("Gemini API Error:", err);
      setMessages(prev => [...prev, { sender: 'ai', text: "Error connecting to the coaching server. Please check your internet connection or verification keys." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    playClickSound();
    localStorage.setItem('sleekhabits_gemini_key', keyInput.trim());
    setLocalApiKey(keyInput.trim());
    setShowKeySetup(false);
    setKeyInput('');
  };

  const handleClearKey = () => {
    playClickSound();
    localStorage.removeItem('sleekhabits_gemini_key');
    setLocalApiKey('');
    setShowKeySetup(true);
  };

  const clearChat = () => {
    playClickSound();
    setMessages([
      {
        sender: 'ai',
        text: "Chat cleared! Ask me anything about your productivity log correlations."
      }
    ]);
  };

  const hasKey = !!getApiKey();

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-col text-left">
          <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
            Gemini Performance Engine
          </span>
          <span className="text-xl font-extrabold text-text-main tracking-tight">
            SleekCoach AI Assistant
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasKey && (
            <button
              onClick={handleClearKey}
              className="px-3 py-1.5 border border-card-border-custom rounded-xl text-[10px] font-bold text-text-muted hover:text-brand-crimson hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Reset API Key settings"
            >
              <Key className="w-3.5 h-3.5" /> Remove Key
            </button>
          )}
          
          <button
            onClick={clearChat}
            className="px-3 py-1.5 border border-card-border-custom rounded-xl text-[10px] font-bold text-text-muted hover:text-text-main hover:bg-slate-50-custom transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Column - AI Insights & Setup Panel */}
        <div className="md:col-span-1 flex flex-col gap-5 bg-card-bg border border-card-border-custom rounded-card shadow-card p-5 text-left justify-between min-h-[300px]">
          <div className="flex flex-col gap-4">
            
            {/* API Key warning or status */}
            {!hasKey ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-2.5">
                <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">API Key Required</h4>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 leading-normal mt-0.5">
                    A Gemini API Key is needed. You can paste one below or configure VITE_GEMINI_API_KEY in .env.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-start gap-2.5">
                <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">SleekCoach Connected</h4>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-normal mt-0.5">
                    Your Gemini API key is loaded. The coach is ready to analyze your habits.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Prompts list */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">Quick Suggestions</span>
              <button
                disabled={!hasKey}
                onClick={() => handleSendMessage("Analyze my week and list correlation insights.")}
                className="w-full text-left px-3.5 py-2.5 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-card-border-custom rounded-xl text-xs font-semibold text-text-main transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>📊 Analyze my week</span>
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              </button>
              <button
                disabled={!hasKey}
                onClick={() => handleSendMessage("I am having trouble sleeping. What does my logged data show, and how can I fix it?")}
                className="w-full text-left px-3.5 py-2.5 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-card-border-custom rounded-xl text-xs font-semibold text-text-main transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>😴 Suggest sleep tips</span>
                <Sparkles className="w-3.5 h-3.5 text-brand-crimson" />
              </button>
              <button
                disabled={!hasKey}
                onClick={() => handleSendMessage("Create a custom productivity routine linked to my active habits list.")}
                className="w-full text-left px-3.5 py-2.5 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-card-border-custom rounded-xl text-xs font-semibold text-text-main transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>⚡ Build habit routine</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>
          </div>

          {/* Minimal coach summary info */}
          <div className="flex items-center gap-2.5 border-t border-card-border-custom pt-4 text-[10px] text-text-muted font-semibold uppercase tracking-wider">
            <Award className="w-4 h-4 text-violet-500 shrink-0" />
            <span>Habits, sleep, & focus analysis</span>
          </div>
        </div>

        {/* Right Column - Main Chat Area */}
        <div className="md:col-span-2 bg-card-bg border border-card-border-custom rounded-card shadow-card flex flex-col justify-between overflow-hidden relative min-h-[500px]">
          
          {/* Setup screen overlay if key is missing */}
          {showKeySetup && (
            <div className="absolute inset-0 bg-card-bg/95 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-center text-center gap-4">
              <Key className="w-10 h-10 text-brand-blue" />
              <h4 className="text-sm font-extrabold text-text-main">Enter Gemini API Key</h4>
              <p className="text-xs text-text-muted max-w-[280px] leading-relaxed">
                Provide an API key to enable AI features. Your key is stored locally in your browser storage and never sent anywhere else.
              </p>
              <form onSubmit={handleSaveKey} className="flex flex-col gap-2 w-full max-w-xs">
                <input
                  type="password"
                  placeholder="Paste AI API Key (AIzaSy...)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="px-4 py-2 border border-card-border-custom bg-slate-50-custom rounded-xl text-xs font-semibold outline-none"
                  required
                />
                <button
                  type="submit"
                  className="py-2.5 bg-brand-blue text-white rounded-xl text-xs font-extrabold cursor-pointer hover:bg-opacity-95 active:scale-98"
                >
                  Save API Key
                </button>
              </form>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-brand-blue font-bold uppercase tracking-wider hover:underline"
              >
                Get a free key from Google AI Studio
              </a>
            </div>
          )}

          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-card-border-custom flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500 animate-pulse" />
              <span className="text-sm font-extrabold text-text-main">SleekCoach Chat</span>
            </div>
            <span className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[9px] font-bold rounded-full">
              Gemini Powered
            </span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 bg-slate-50-custom/20 max-h-[360px] md:max-h-[420px]">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div 
                  className={`px-4 py-3 rounded-2xl text-xs md:text-sm font-medium leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-blue text-white rounded-tr-none shadow-md shadow-brand-blue/15'
                      : 'bg-card-bg border border-card-border-custom text-text-main rounded-tl-none shadow-sm'
                  }`}
                >
                  {renderMessageContent(msg.text)}
                </div>
                <span className="text-[8px] text-text-muted mt-1 font-semibold uppercase tracking-wider">
                  {msg.sender === 'user' ? 'You' : 'SleekCoach'}
                </span>
              </div>
            ))}
            
            {/* Loading / Typing indicator */}
            {isTyping && (
              <div className="self-start flex flex-col max-w-[85%] items-start">
                <div className="px-4 py-3 rounded-2xl bg-card-bg border border-card-border-custom rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[8px] text-text-muted mt-1 font-semibold uppercase tracking-wider">
                  SleekCoach is writing...
                </span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="p-3 border-t border-card-border-custom flex gap-2 bg-card-bg items-center"
          >
            <input
              type="text"
              placeholder={hasKey ? "Ask SleekCoach something..." : "Configure API key to start chat..."}
              disabled={!hasKey || isTyping}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 border border-card-border-custom bg-slate-50-custom rounded-xl text-xs font-semibold outline-none disabled:opacity-50 placeholder-slate-400 text-text-main"
            />
            <button
              type="submit"
              disabled={!hasKey || isTyping || !inputText.trim()}
              className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center hover:bg-opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md shadow-brand-blue/15"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          
        </div>
      </div>
      
    </div>
  );
};

export default CoachPage;
