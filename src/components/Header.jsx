import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Sun, Moon, Volume2, VolumeX, LogIn, LogOut } from 'lucide-react';

export const Header = ({ currentView, setCurrentView }) => {
  const { 
    selectedDate, 
    setSelectedDate, 
    todayStr,
    habits, 
    isHabitCompleted,
    getPastDateString,
    theme,
    setTheme,
    isSoundEnabled,
    setIsSoundEnabled,
    playClickSound,
    user,
    loading,
    signInWithGoogle,
    handleSignOut,
    xpDetails,
    badges
  } = useContext(AppContext);

  // Generate list of the past 7 days for the calendar strip
  const daysList = [];
  for (let i = 6; i >= 0; i--) {
    daysList.push(getPastDateString(i));
  }

  // Parse date string (YYYY-MM-DD) as local time to avoid timezone offset shifts
  const getLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format date for displays (e.g. "Thu, Jun 4")
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = getLocalDate(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get day name and date number for calendar cells
  const getDayDetails = (dateStr) => {
    const d = getLocalDate(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      name: days[d.getDay()],
      num: d.getDate(),
      isToday: dateStr === todayStr
    };
  };

  // Calculate habit stats for selected date
  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => isHabitCompleted(h, selectedDate)).length;
  const percentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // SVG Progress Ring calculations
  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Navigate dates left/right in local time
  const shiftDate = (offset) => {
    playClickSound();
    const d = getLocalDate(selectedDate);
    d.setDate(d.getDate() + offset);
    const nextYear = d.getFullYear();
    const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
    const nextDay = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  // Helper to get relative date text for the navigation button (Today / Yesterday / Tomorrow / date)
  const getRelativeDateLabel = (dateStr) => {
    if (dateStr === todayStr) return 'Today';
    
    const dateObj = getLocalDate(dateStr);
    const todayObj = getLocalDate(todayStr);
    
    const diffTime = dateObj.getTime() - todayObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 1) return 'Tomorrow';
    
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleViewChange = (view) => {
    playClickSound();
    setCurrentView(view);
  };

  const handleThemeToggle = () => {
    playClickSound();
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSoundToggle = () => {
    const newVal = !isSoundEnabled;
    setIsSoundEnabled(newVal);
    if (newVal) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      } catch (e) {
        void e;
      }
    }
  };

  const getBadgeGlow = (type) => {
    switch (type) {
      case 'monk': return '0 0 12px rgba(16, 185, 129, 0.25)';
      case 'wizard': return '0 0 12px rgba(139, 92, 246, 0.25)';
      case 'king': return '0 0 12px rgba(245, 158, 11, 0.25)';
      case 'sleep': return '0 0 12px rgba(59, 130, 246, 0.25)';
      case 'target': return '0 0 12px rgba(244, 63, 94, 0.25)';
      default: return 'none';
    }
  };

  const getBadgeIcon = (type, isUnlocked) => {
    switch (type) {
      case 'monk':
        return (
          <svg className={`w-6 h-6 ${isUnlocked ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3c-1.2 2.5-3.6 4-6 4 2.4 0 4.8 1.5 6 4 1.2-2.5 3.6-4 6-4-2.4 0-4.8-1.5-6-4z" />
            <path d="M12 11c-1.8 2-5.4 3-8 3 2.6 0 6.2-1 8-3 1.8 2 5.4 3 8 3-2.6 0-6.2-1-8-3z" />
            <path d="M12 11v10" />
            <path d="M8 21h8" />
          </svg>
        );
      case 'wizard':
        return (
          <svg className={`w-6 h-6 ${isUnlocked ? 'text-violet-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 0-1.275 1.275L3 12l5.813 1.912a2 2 0 0 0 1.275 1.275L12 21l1.912-5.813a2 2 0 0 0 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 0-1.275-1.275L12 3Z" />
            <path d="m5 3 2 2" />
            <path d="m19 3-2 2" />
            <path d="m5 21 2-2" />
            <path d="m19 21-2-2" />
          </svg>
        );
      case 'king':
        return (
          <svg className={`w-6 h-6 ${isUnlocked ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
            <path d="M3 20h18" />
            <circle cx="12" cy="4" r="1" fill="currentColor" />
            <circle cx="5" cy="4" r="1" fill="currentColor" />
            <circle cx="19" cy="4" r="1" fill="currentColor" />
          </svg>
        );
      case 'sleep':
        return (
          <svg className={`w-6 h-6 ${isUnlocked ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            <path d="M19 3v4" />
            <path d="M17 5h4" />
          </svg>
        );
      case 'target':
        return (
          <svg className={`w-6 h-6 ${isUnlocked ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
            <path d="m19 5-7 7" />
            <path d="M14 5h5v5" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Brand & Main View Tab Selectors */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between py-2 border-b border-card-border-custom">
        <div className="flex items-center gap-3">
          {/* Real typographic logo for SleekHabits brand */}
          <div className="flex flex-col">
            <div className="flex items-center text-2xl font-black tracking-tight select-none">
              <span className="text-slate-800 dark:text-slate-100">Sleek</span>
              <span className="text-brand-blue">Habits</span>
              <span className="text-brand-crimson font-black">.</span>
            </div>
            <span className="text-[9px] text-brand-grey font-extrabold tracking-wider uppercase -mt-0.5">Personal Progress System</span>
          </div>
        </div>

        {/* View Selection & Toggles */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full w-full sm:w-auto justify-center">
            <button 
              onClick={() => handleViewChange('dashboard')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-6 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'dashboard' 
                  ? 'bg-card-bg text-brand-blue shadow-sm dark:shadow-none' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleViewChange('goals')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-6 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'goals' 
                  ? 'bg-card-bg text-brand-blue shadow-sm dark:shadow-none' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Goal Planner
            </button>
            <button 
              onClick={() => handleViewChange('analysis')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-6 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'analysis' 
                  ? 'bg-card-bg text-brand-blue shadow-sm dark:shadow-none' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Analysis
            </button>
            <button 
              onClick={() => handleViewChange('coach')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-6 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'coach' 
                  ? 'bg-card-bg text-brand-blue shadow-sm dark:shadow-none' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              AI Coach
            </button>
          </div>

          {/* User Profile & Actions wrapper for mobile row alignment */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            {user && (
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-1 pl-1.5 pr-3 rounded-full shrink-0 select-none">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt={user.user_metadata.full_name || 'Profile'} 
                    className="w-5 h-5 rounded-full object-cover border border-brand-blue/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-brand-blue/15 text-brand-blue text-[9px] font-black flex items-center justify-center border border-brand-blue/20">
                    {user.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-[10px] font-extrabold text-text-main truncate max-w-[100px]">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full shrink-0 ml-auto sm:ml-0">
              <button
                onClick={handleThemeToggle}
                className="p-1.5 text-text-muted hover:text-text-main hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full transition-all active:scale-90 cursor-pointer"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </button>
              <button
                onClick={handleSoundToggle}
                className="p-1.5 text-text-muted hover:text-text-main hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full transition-all active:scale-90 cursor-pointer"
                title={isSoundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4 text-brand-blue" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Google Authentication Toggles */}
              {!loading && (
                user ? (
                  <button
                    onClick={() => {
                      playClickSound();
                      handleSignOut();
                    }}
                    className="p-1.5 text-brand-crimson hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full transition-all active:scale-90 cursor-pointer flex items-center gap-1"
                    title={`Sign Out (${user.email})`}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      signInWithGoogle();
                    }}
                    className="p-1.5 text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-full transition-all active:scale-90 cursor-pointer flex items-center gap-1"
                    title="Sign In with Google"
                  >
                    <LogIn className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gamified Achievements & Leveling Section */}
      {user && xpDetails && (
        <div className="bg-card-bg/60 dark:bg-card-bg/40 backdrop-blur-md rounded-card shadow-card border border-card-border-custom p-4 flex flex-col md:flex-row items-center gap-6 justify-between select-none">
          
          {/* Level Progress Indicator */}
          <div className="flex items-center gap-4 w-full md:w-auto shrink-0 border-b md:border-b-0 md:border-r border-card-border-custom pb-4 md:pb-0 md:pr-6 justify-start">
            <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-brand-blue to-violet-500 rounded-full shadow-[0_0_15px_rgba(0,102,255,0.4)] border-2 border-white/20 shrink-0">
              <div className="flex flex-col items-center leading-none text-white">
                <span className="text-[8px] font-black uppercase tracking-wider">Lvl</span>
                <span className="text-lg sm:text-xl font-extrabold">{xpDetails.level}</span>
              </div>
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-brand-blue/30 animate-ping [animation-duration:3s]" />
            </div>

            <div className="flex flex-col gap-1.5 flex-1 md:max-w-[200px] text-left ml-2">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[9px] sm:text-[10px] text-brand-grey font-bold uppercase tracking-wider">XP Progress</span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-brand-blue whitespace-nowrap">{xpDetails.xpInLevel} / {xpDetails.xpNeeded} XP</span>
              </div>
              {/* Custom Level Progress Bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden border border-card-border-custom">
                <div 
                  className="h-full bg-gradient-to-r from-brand-blue to-violet-500 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${xpDetails.progressPercentage}%` }}
                />
              </div>
              <span className="text-[8px] sm:text-[9px] text-text-muted font-semibold leading-none">
                Total Earned: {xpDetails.totalXP} XP
              </span>
            </div>
          </div>

          {/* Badges Carousel Row */}
          <div className="relative flex-1 w-full overflow-hidden flex items-center justify-end">
            <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-2 w-full justify-start md:justify-end">
              {badges.map((badge) => {
                const Icon = getBadgeIcon(badge.iconType, badge.isUnlocked);
                return (
                  <div 
                    key={badge.id} 
                    className="group relative flex flex-col items-center shrink-0 cursor-help"
                  >
                    {/* Glowing circular container */}
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        badge.isUnlocked
                          ? 'bg-gradient-to-b from-card-bg to-slate-50-custom shadow-md border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95'
                          : 'bg-slate-100/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-800 opacity-60 filter grayscale'
                      }`}
                      style={badge.isUnlocked ? {
                        boxShadow: getBadgeGlow(badge.iconType)
                      } : {}}
                    >
                      {Icon}
                    </div>

                    {/* Miniature lock badge if locked */}
                    {!badge.isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}

                    {/* Unlocked check badge if unlocked */}
                    {badge.isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border border-white dark:border-slate-900 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Floating Glassmorphic Tooltip */}
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-48 p-3 rounded-2xl bg-card-bg/95 dark:bg-slate-900/95 border border-card-border-custom shadow-xl backdrop-blur-md opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 text-center flex flex-col gap-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${badge.isUnlocked ? 'text-brand-blue' : 'text-text-muted'}`}>
                        {badge.isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
                      </span>
                      <h5 className="text-xs font-extrabold text-text-main leading-tight">{badge.name}</h5>
                      <p className="text-[9px] text-text-muted leading-relaxed mt-0.5">{badge.description}</p>
                      <div className="mt-1.5 pt-1.5 border-t border-card-border-custom flex justify-between items-center text-[9px] font-bold text-text-main">
                        <span>Progress:</span>
                        <span className={badge.isUnlocked ? 'text-emerald-500' : 'text-brand-blue'}>{badge.progressText}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Date Navigator Grid & Completion Summary Card */}
      {currentView === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          
          {/* Date Selector Navigation Strip */}
          <div className="md:col-span-2 bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 sm:p-5 flex flex-col gap-4 justify-between">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-blue" />
                <span className="font-semibold text-text-main text-sm">
                  {formatDateLabel(selectedDate)}
                </span>
                {selectedDate === todayStr && (
                  <span className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded-full">
                    Today
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => shiftDate(-1)}
                  className="p-1.5 hover:bg-slate-50-custom rounded-full transition-all text-text-muted hover:text-text-main active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    playClickSound();
                    setSelectedDate(todayStr);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold hover:bg-slate-50-custom rounded-full transition-all text-text-muted hover:text-text-main cursor-pointer"
                >
                  {getRelativeDateLabel(selectedDate)}
                </button>
                <button 
                  onClick={() => shiftDate(1)}
                  className="p-1.5 hover:bg-slate-50-custom rounded-full transition-all text-text-muted hover:text-text-main active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Past 7 Days Strip */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysList.map((dateStr) => {
                const details = getDayDetails(dateStr);
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      playClickSound();
                      setSelectedDate(dateStr);
                    }}
                    className={`flex flex-col items-center py-2 rounded-xl sm:rounded-2xl transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20 scale-[1.03]'
                        : 'bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-text-muted'
                    }`}
                  >
                    <span className={`text-[8px] sm:text-[10px] font-medium uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-text-muted'}`}>
                      {details.name}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold mt-0.5 sm:mt-1 ${isSelected ? 'text-white' : 'text-text-main'}`}>
                      {details.num}
                    </span>
                    {details.isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 bg-brand-blue rounded-full mt-0.5 sm:mt-1"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Completion Progress Ring Card */}
          <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
                Daily Progress
              </span>
              <span className="text-xl font-extrabold text-text-main tracking-tight">
                Habits Completion
              </span>
              <span className="text-xs text-text-muted font-medium">
                {completedHabits} of {totalHabits} completed today
              </span>
            </div>

            {/* SVG Progress Ring */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Foreground Ring */}
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  className="stroke-brand-blue transition-all duration-500 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-xs sm:text-sm font-extrabold text-brand-blue">
                {percentage}%
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Header;
