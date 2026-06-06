import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Brain, Send, Key, Sparkles, X } from 'lucide-react';

export const FloatingCoach = () => {
  const {
    focus,
    habits,
    changeHabitProgress,
    selectedDate,
    xpDetails,
    playClickSound,
    todayStr,
    loading,
    isScheduledForDate,
    isHabitCompleted
  } = useContext(AppContext);

  // Widget States
  const [isOpen, setIsOpen] = useState(false);
  const [bubble, setBubble] = useState(null); // { text, amount, visible }
  const [isPulsing, setIsPulsing] = useState(false);

  // Chat States (shared with dedicated CoachPage)
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('sleekhabits_coach_history');
    return saved ? JSON.parse(saved) : [
      {
        sender: 'ai',
        text: "Hello! I'm **SleekCoach**, your AI performance assistant. I observe your progress in real-time. Ask me for tips to optimize your flow, sleep, or mood!"
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(() => {
    return localStorage.getItem('sleekhabits_gemini_key') || '';
  });
  const [keyInput, setKeyInput] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(
    !import.meta.env.VITE_GEMINI_API_KEY && !localStorage.getItem('sleekhabits_gemini_key')
  );

  const chatEndRef = useRef(null);
  const prevFocusRef = useRef(focus[selectedDate] || 0);
  const prevDateRef = useRef(selectedDate);
  const isInitialLoadRef = useRef(true);
  const prevAllCompletedRef = useRef(false);
  const prevDateRef2 = useRef(selectedDate);

  // Sync state changes from localStorage (if the user chatted on the dedicated CoachPage)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sleekhabits_coach_history');
      if (saved) {
        setMessages(JSON.parse(saved));
      }
      const savedKey = localStorage.getItem('sleekhabits_gemini_key');
      if (savedKey) {
        setLocalApiKey(savedKey);
        setShowKeySetup(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update messages in localStorage and scroll to bottom
  useEffect(() => {
    localStorage.setItem('sleekhabits_coach_history', JSON.stringify(messages));
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Real-time focus logging observer
  useEffect(() => {
    if (loading) {
      isInitialLoadRef.current = true;
      return;
    }

    const currentFocus = focus[selectedDate] || 0;

    // Prevent triggering a bubble on initial load
    if (isInitialLoadRef.current) {
      prevFocusRef.current = currentFocus;
      prevDateRef.current = selectedDate;
      isInitialLoadRef.current = false;
      return;
    }

    // Prevent triggering a bubble just because the user switched selected dates
    if (prevDateRef.current !== selectedDate) {
      prevDateRef.current = selectedDate;
      prevFocusRef.current = currentFocus;
      return;
    }

    const diff = currentFocus - prevFocusRef.current;

    if (diff > 0) {
      // Focus session logged! Calculate next level and trigger AI Coach alert
      const nextLevel = xpDetails.level + 1;
      
      setIsPulsing(true);
      setBubble({
        visible: true,
        amount: diff,
        text: `Exceptional work! That ${diff}m focus session brings you ${diff} XP closer to Level ${nextLevel}. Would you like a glass of water now?`
      });

      // Reset pulse animation after 8 seconds
      setTimeout(() => {
        setIsPulsing(false);
      }, 8000);
    }

    prevFocusRef.current = currentFocus;
  }, [focus, selectedDate, xpDetails.level, loading]);

  // Real-time habit completion observer
  useEffect(() => {
    if (loading) return;

    const scheduled = habits.filter(h => isScheduledForDate(h, selectedDate) && !h.isHidden);
    const allCompleted = scheduled.length > 0 && scheduled.every(h => isHabitCompleted(h, selectedDate));

    // Handle date switching
    if (prevDateRef2.current !== selectedDate) {
      prevDateRef2.current = selectedDate;
      prevAllCompletedRef.current = allCompleted;
      return;
    }

    // Trigger celebration when user transitions from not completed to all completed
    if (allCompleted && !prevAllCompletedRef.current) {
      setIsPulsing(true);
      setBubble({
        visible: true,
        text: "Outstanding dedication! You've completed all scheduled habits for today. You are operating at peak efficiency!",
        success: true
      });

      setTimeout(() => {
        setIsPulsing(false);
      }, 8000);
    }

    prevAllCompletedRef.current = allCompleted;
  }, [habits, selectedDate, loading, isScheduledForDate, isHabitCompleted]);

  // Handle logging water from the speech bubble
  const handleLogWater = () => {
    playClickSound();
    
    // Find Hydrate Water habit (case insensitive match)
    const hydrateHabit = habits.find(
      h => h.name.toLowerCase().includes('hydrate') || h.name.toLowerCase().includes('water')
    );

    if (hydrateHabit) {
      // Add 250ml water progress
      changeHabitProgress(hydrateHabit.id, selectedDate, 250);
      
      // Update bubble state to thank user
      setBubble(prev => ({
        ...prev,
        text: "💧 Awesome! 250ml of water has been logged. Stay hydrated to maintain your flow state!",
        success: true
      }));

      // Close the bubble automatically after 3.5 seconds
      setTimeout(() => {
        setBubble(null);
      }, 3500);
    } else {
      // Fallback if no Hydrate Water habit is found
      setBubble(prev => ({
        ...prev,
        text: "Logged! Keep up the amazing work!",
        success: true
      }));
      setTimeout(() => {
        setBubble(null);
      }, 2500);
    }
  };

  const getApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || localApiKey;
  };

  // Send message to Gemini API
  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim()) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setShowKeySetup(true);
      return;
    }

    playClickSound();
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      // Gather context
      const habitsSummary = habits.map(h => {
        const completions = Object.values(h.history || {}).filter(Boolean).length;
        return `- ${h.name} (${h.category}): Target: ${h.targetValue} ${h.unit}. Completed ${completions} times.`;
      }).join('\n');

      const sleepSummary = Object.entries(focus).slice(-3).map(([d, val]) => `${d}: ${val} mins focus`).join(', ');
      
      const systemContext = `You are "SleekCoach", a premium AI performance coach integrated into the SleekHabits system.
Analyze the user's data and provide short, actionable, and encouraging feedback. Keep your answers concise (1-3 sentences) as they are viewed in a small widget.

User habits summary:
${habitsSummary || 'None'}
Recent focus summary:
${sleepSummary || 'None'}
Current date: ${todayStr}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemContext}\n\nUser Question: ${queryText}` }]
          }
        ]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP error! status: ${response.status}`;
        setMessages(prev => [...prev, { sender: 'ai', text: `⚠️ **API Error:** ${errorMsg}` }]);
        return;
      }

      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to retrieve a response. Please try again.";
      setMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
    } catch (err) {
      console.error("Gemini Widget Error:", err);
      setMessages(prev => [...prev, { sender: 'ai', text: "Error connecting to the coaching server. Check your connection." }]);
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

  const renderMessageContent = (text) => {
    if (!text) return null;
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-text-main dark:text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>');
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc my-0.5">$1</li>');
    html = html.replace(/\n/g, '<br />');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 select-none">
      
      {/* Dynamic Keyframes Animation Injection */}
      <style>{`
        @keyframes brainGlow {
          0% {
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.4), 0 0 5px rgba(139, 92, 246, 0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.8), 0 0 15px rgba(99, 102, 241, 0.6);
            transform: scale(1.1);
          }
          100% {
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.4), 0 0 5px rgba(139, 92, 246, 0.2);
            transform: scale(1);
          }
        }
        .animate-brain-pulse {
          animation: brainGlow 2s infinite ease-in-out;
        }
      `}</style>

      {/* 1. Speech Bubble Overlay */}
      {bubble?.visible && (
        <div className="w-72 sm:w-80 bg-card-bg/95 backdrop-blur-md border border-card-border-custom shadow-2xl rounded-2xl p-4 flex flex-col gap-3 relative text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Close button */}
          <button
            onClick={() => {
              playClickSound();
              setBubble(null);
            }}
            className="absolute top-3 right-3 text-text-muted hover:text-text-main transition-all p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Heading */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
            <span className="text-[10px] text-brand-grey font-extrabold uppercase tracking-widest">
              SleekCoach Insight
            </span>
          </div>

          {/* Body Text */}
          <p className="text-xs font-semibold text-text-main leading-relaxed pr-6">
            {bubble.text}
          </p>

          {/* Hydration Action Trigger */}
          {!bubble.success && (
            <button
              onClick={handleLogWater}
              className="mt-1 flex items-center justify-center gap-2 py-2 px-3 bg-brand-blue/10 hover:bg-brand-blue text-brand-blue hover:text-white border border-brand-blue/20 hover:border-transparent rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95"
            >
              <span>💧 Yes, log 250ml water</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Floating Mini-Chat Window */}
      {isOpen && (
        <div className="w-80 h-[400px] sm:w-96 sm:h-[450px] bg-card-bg/95 backdrop-blur-lg border border-card-border-custom shadow-2xl rounded-2xl flex flex-col justify-between overflow-hidden text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Popup Header */}
          <div className="px-4 py-3 border-b border-card-border-custom flex items-center justify-between bg-slate-50-custom/20">
            <div className="flex items-center gap-2">
              <Brain className="w-4.5 h-4.5 text-violet-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-text-main">SleekCoach Assistant</span>
                <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider">Gemini Live Sync</span>
              </div>
            </div>
            <button
              onClick={() => {
                playClickSound();
                setIsOpen(false);
              }}
              className="p-1 rounded-full text-text-muted hover:text-text-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* API Key Missing Overlay */}
          {showKeySetup && (
            <div className="flex-1 p-5 flex flex-col items-center justify-center text-center gap-3">
              <Key className="w-8 h-8 text-brand-blue" />
              <h4 className="text-xs font-extrabold text-text-main">Enter Gemini API Key</h4>
              <p className="text-[10px] text-text-muted max-w-[220px] leading-relaxed">
                Provide an API key to chat with the Coach from the dashboard. Setup details sync automatically.
              </p>
              <form onSubmit={handleSaveKey} className="flex flex-col gap-2 w-full max-w-[200px]">
                <input
                  type="password"
                  placeholder="Paste Key (AIzaSy...)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="px-3 py-1.5 border border-card-border-custom bg-slate-50-custom rounded-xl text-[10px] font-semibold outline-none"
                  required
                />
                <button
                  type="submit"
                  className="py-2 bg-brand-blue text-white rounded-xl text-[10px] font-extrabold cursor-pointer hover:bg-opacity-95"
                >
                  Save API Key
                </button>
              </form>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[9px] text-brand-blue font-bold uppercase tracking-wider hover:underline"
              >
                Get free key from AI Studio
              </a>
            </div>
          )}

          {/* Message List */}
          {!showKeySetup && (
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-slate-50-custom/10">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div 
                    className={`px-3 py-2 rounded-2xl text-[11px] sm:text-xs font-medium leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-blue text-white rounded-tr-none shadow-md'
                        : 'bg-card-bg border border-card-border-custom text-text-main rounded-tl-none shadow-sm'
                    }`}
                  >
                    {renderMessageContent(msg.text)}
                  </div>
                  <span className="text-[7px] text-text-muted mt-0.5 font-bold uppercase tracking-widest">
                    {msg.sender === 'user' ? 'You' : 'SleekCoach'}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="self-start flex flex-col max-w-[85%] items-start">
                  <div className="px-3 py-2 rounded-2xl bg-card-bg border border-card-border-custom rounded-tl-none shadow-sm flex items-center gap-1">
                    <div className="w-1 h-1 bg-brand-blue rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-brand-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-brand-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[7px] text-text-muted mt-0.5 font-bold uppercase tracking-widest">
                    Typing...
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Chat Quick Action Suggestions */}
          {!showKeySetup && (
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto border-t border-card-border-custom/50 bg-slate-50-custom/5">
              <button
                disabled={isTyping}
                onClick={() => handleSendMessage("Analyze my focus logs.")}
                className="whitespace-nowrap px-2 py-1 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-card-border-custom rounded-lg text-[9px] font-bold text-text-main transition-all cursor-pointer shrink-0"
              >
                📊 Analyze Focus
              </button>
              <button
                disabled={isTyping}
                onClick={() => handleSendMessage("Tips for deep flow?")}
                className="whitespace-nowrap px-2 py-1 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-card-border-custom rounded-lg text-[9px] font-bold text-text-main transition-all cursor-pointer shrink-0"
              >
                ⚡ Deep Flow Tips
              </button>
              <button
                disabled={isTyping}
                onClick={() => handleSendMessage("Habit routine review.")}
                className="whitespace-nowrap px-2 py-1 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-card-border-custom rounded-lg text-[9px] font-bold text-text-main transition-all cursor-pointer shrink-0"
              >
                🎯 Habit Routine
              </button>
            </div>
          )}

          {/* Input Bar */}
          {!showKeySetup && (
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
              className="p-2 border-t border-card-border-custom flex gap-1.5 bg-card-bg items-center"
            >
              <input
                type="text"
                placeholder="Ask coach something..."
                disabled={isTyping}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-3 py-2 border border-card-border-custom bg-slate-50-custom rounded-xl text-[11px] font-semibold outline-none placeholder-slate-400 text-text-main"
              />
              <button
                type="submit"
                disabled={isTyping || !inputText.trim()}
                className="w-8 h-8 rounded-xl bg-brand-blue text-white flex items-center justify-center hover:bg-opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>
      )}

      {/* 3. Main Floating Avatar Button */}
      <button
        onClick={() => {
          playClickSound();
          setIsOpen(!isOpen);
          // If we had a bubble open, dismiss it when they open the main chat
          setBubble(null);
        }}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-violet-500/20 bg-violet-650 hover:bg-violet-750 shadow-xl ${
          isPulsing ? 'animate-brain-pulse' : 'hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]'
        }`}
        title="Chat with SleekCoach"
      >
        <Brain className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${isPulsing ? 'animate-pulse' : ''}`} />
      </button>

    </div>
  );
};

export default FloatingCoach;
