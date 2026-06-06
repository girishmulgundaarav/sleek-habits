import { useState, useEffect, useRef } from 'react';
import { X, HelpCircle, BookOpen, Clock, Award, BarChart2 } from 'lucide-react';

export const HelpModal = ({ onClose, playClickSound }) => {
  const [activeTab, setActiveTab] = useState('started'); // 'started', 'trackers', 'xp', 'graphs'
  const modalRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside modal content to close (light-dismiss)
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      if (playClickSound) playClickSound();
      onClose();
    }
  };

  const handleTabClick = (tabId) => {
    if (playClickSound) playClickSound();
    setActiveTab(tabId);
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-3xl h-[85vh] sm:h-[75vh] bg-card-bg/95 dark:bg-slate-900/95 border border-card-border-custom shadow-2xl rounded-card flex flex-col overflow-hidden text-left relative"
      >
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-card-border-custom flex justify-between items-center bg-slate-50-custom/25 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-blue" />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-text-main">SleekHabits User Guide</span>
              <span className="text-[9px] text-brand-grey font-bold uppercase tracking-wider">System Specifications & Instructions</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (playClickSound) playClickSound();
              onClose();
            }}
            className="p-1 rounded-full text-text-muted hover:text-text-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Close Guide"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Navigation row */}
        <div className="flex bg-slate-100/50 dark:bg-slate-800/40 border-b border-card-border-custom p-1.5 gap-1 select-none shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'started', label: 'Get Started', Icon: BookOpen, color: 'text-brand-blue' },
            { id: 'trackers', label: 'Trackers', Icon: Clock, color: 'text-violet-500' },
            { id: 'xp', label: 'XP & Badges', Icon: Award, color: 'text-amber-500' },
            { id: 'graphs', label: 'Charts & AI', Icon: BarChart2, color: 'text-brand-crimson' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-card-bg text-text-main shadow-sm border border-card-border-custom/80'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <tab.Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-xs sm:text-sm text-text-main">
          
          {/* TAB 1: GET STARTED */}
          {activeTab === 'started' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-1.5 text-left">
                <h4 className="text-sm font-extrabold text-brand-blue uppercase tracking-wider">🚀 App Overview</h4>
                <p className="text-text-muted leading-relaxed">
                  Welcome to <strong>SleekHabits</strong>, a premium progress companion app. The system organizes your self-improvement cycle into four main pages accessible via the top navigation bar:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: '📋 Dashboard', desc: 'Manage your active trackers (Focus, Sleep, Mood) and complete your scheduled daily habits. This is your primary log entry view.' },
                  { title: '🎯 Goal Planner', desc: 'Break down long-term accomplishments into actionable milestones and granular subtasks. Completing milestones generates high XP.' },
                  { title: '📈 Analysis', desc: 'Explore historical statistics. Analyze habits completion rates, category distributions, and plot behavior correlations on interactive charts.' },
                  { title: '🧠 AI Coach', desc: 'Interact with SleekCoach, your performance advisor. Get custom habit recommendations and let the coach analyze your weekly logs.' }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50-custom/40 border border-card-border-custom rounded-2xl flex flex-col gap-1 text-left">
                    <h5 className="font-extrabold text-text-main text-xs">{item.title}</h5>
                    <p className="text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 text-left">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">🛠️ Basic Controls</h4>
                <ul className="list-disc pl-5 text-text-muted flex flex-col gap-2 leading-relaxed">
                  <li><strong>Habit Completions</strong>: Click checkboxes to toggle boolean habits. Click the <code>+ / -</code> buttons on numeric habits to adjust progress.</li>
                  <li><strong>Date Navigation</strong>: Use the calendar navigation bar at the top to browse past logs. You can back-fill progress for yesterday or prior days by selecting that date.</li>
                  <li><strong>Interface Customization</strong>: Toggle the <strong>Light/Dark Mode</strong> or adjust the <strong>Audio Feedback</strong> controls in the top-right header actions bar.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: TRACKERS */}
          {activeTab === 'trackers' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-1.5 text-left">
                <h4 className="text-sm font-extrabold text-violet-500 uppercase tracking-wider">⏱️ Premium Tracker Cards</h4>
                <p className="text-text-muted leading-relaxed">
                  SleekHabits comes equipped with specialized daily cards targeting crucial pillars of lifestyle performance.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    title: '🧠 Focus & Deep Work (Pomodoro)',
                    desc: 'A dedicated focus countdown timer with presets for 25m and 50m intervals. Click "+" or "-" to manually adjust focus logs by 15m. Toggle "Deep Focus Mode" (maximize button) to hide the dashboard and engage a minimalist glowing timer. Select ambient background soundscapes (synthesized Rain, Waves, or Space pads) to drop into a flow state.'
                  },
                  {
                    title: '🛌 Sleep Tracker Heatmap',
                    desc: 'Log your nightly rest hours by clicking on any date square inside the 4-week calendar grid. The squares are color-scaled automatically from light pink (under 5 hrs) to deep brand-crimson (8.5+ hrs) to highlight sleep trends.'
                  },
                  {
                    title: '🎭 Mood & Energy Curve',
                    desc: 'Record your daily mental state (Awful, Meh, Good, High, Peak). The tracker generates an SVG Bezier trendline path plotting your mood fluctuations over the past 7 days to help you discover energy cycles.'
                  },
                  {
                    title: '💧 Hydrate Water Habit',
                    desc: 'A specialized card in your daily habits grid. Tap the increment button to add 250ml (one glass) of water towards your daily 3000ml goal. You can complete the card in exactly 12 logs.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50-custom/40 border border-card-border-custom rounded-2xl flex flex-col gap-1.5 text-left">
                    <h5 className="font-extrabold text-text-main text-xs">{item.title}</h5>
                    <p className="text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: XP & BADGES */}
          {activeTab === 'xp' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-1.5 text-left">
                <h4 className="text-sm font-extrabold text-amber-500 uppercase tracking-wider">🏆 Gamified Milestones</h4>
                <p className="text-text-muted leading-relaxed">
                  Every productive action you take on the platform awards experience points (XP) to level up your profile and unlock premium achievements.
                </p>
              </div>

              {/* XP Formula Table */}
              <div className="border border-card-border-custom rounded-2xl overflow-hidden bg-slate-50-custom/20 text-left shrink-0">
                <div className="grid grid-cols-2 bg-slate-50-custom/50 px-4 py-2 border-b border-card-border-custom font-extrabold text-xs">
                  <span>Action</span>
                  <span>XP Awarded</span>
                </div>
                <div className="divide-y divide-card-border-custom/50 text-xs">
                  <div className="grid grid-cols-2 px-4 py-2">
                    <span className="font-semibold">Habit Completion</span>
                    <span className="text-brand-blue font-extrabold">+15 XP</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2">
                    <span className="font-semibold">Focus Session logging</span>
                    <span className="text-brand-blue font-extrabold">+1 XP per minute</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2">
                    <span className="font-semibold">Sleep hours logged</span>
                    <span className="text-brand-blue font-extrabold">+5 XP per hour</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2">
                    <span className="font-semibold">Goal Completed (milestone)</span>
                    <span className="text-brand-blue font-extrabold">+100 XP</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-2">
                    <span className="font-semibold">Goal Subtask Completed</span>
                    <span className="text-brand-blue font-extrabold">+20 XP</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-extrabold text-brand-grey uppercase tracking-widest">Levels Requirement</span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Your level is computed dynamically. Each level requires exactly <strong>300 XP</strong>. E.g., reaching Level 5 requires 1,200 total cumulative XP.
                </p>
              </div>

              {/* Achievements details */}
              <div className="flex flex-col gap-3 text-left">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">🛡️ Badge Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  {[
                    { badge: '🧘 Mindfulness Monk', rule: 'Achieve a 7-day completion streak on any habit under the Mindfulness category.' },
                    { badge: '⚡ Deep Flow Wizard', rule: 'Log 120 minutes or more of total focus work in a single calendar day.' },
                    { badge: '👑 Consistent King', rule: 'Achieve 100% completions of all scheduled habits on at least 3 separate days.' },
                    { badge: '😴 Healthy Sleeper', rule: 'Log between 7 and 9 hours of sleep on at least 5 separate days.' },
                    { badge: '🎯 Goal Crusher', rule: 'Successfully complete any goal along with all of its milestones and subtasks.' }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-slate-50-custom/40 border border-card-border-custom rounded-xl flex flex-col gap-1">
                      <span className="font-bold text-text-main">{item.badge}</span>
                      <p className="text-text-muted leading-normal">{item.rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHARTS & AI */}
          {activeTab === 'graphs' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-1.5 text-left">
                <h4 className="text-sm font-extrabold text-brand-crimson uppercase tracking-wider">📊 Analytics Engine</h4>
                <p className="text-text-muted leading-relaxed">
                  SleekHabits compiles logs across metrics to output visual insights on the <strong>Analysis</strong> tab.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    title: '📈 Completion Rate Line Chart',
                    desc: 'Calculates the percentage of daily scheduled habits completed successfully over the past 7 days to reveal consistency trends.'
                  },
                  {
                    title: '🍕 Category Distribution Pie Chart',
                    desc: 'Aggregates the proportion of active habits scheduled in each performance category (Mindfulness, Health, Fitness, Education, Nutrition).'
                  },
                  {
                    title: '🔀 Interactive Cross-Metric Correlation Explorer',
                    desc: 'The flagship chart. Plot continuous values (Sleep hours, Focus mins, Mood ratings) on the left axis alongside habit checkmarks (Meditation, Hydration, Gym) on the right axis. Habit checkmarks are drawn as a digital stepped step-line (0 = Incomplete, 1 = Done) to visually align habit completions with wellness metrics.'
                  },
                  {
                    title: '🤖 Floating SleekCoach Assistant',
                    desc: 'A contextual chatbot widget located in the bottom-right corner of the dashboard. It observes your log events. The moment you log a focus session, it celebrates your effort, calculates XP progress towards your next level, and prompts you to log a glass of water. Click "Yes, log 250ml" to quickly update your hydration. Click the button to toggle a live chat popover.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50-custom/40 border border-card-border-custom rounded-2xl flex flex-col gap-1 text-left">
                    <h5 className="font-extrabold text-text-main text-xs">{item.title}</h5>
                    <p className="text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HelpModal;
