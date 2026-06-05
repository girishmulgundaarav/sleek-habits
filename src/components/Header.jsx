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
    handleSignOut
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
              className={`flex-1 sm:flex-none px-6 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                currentView === 'dashboard' 
                  ? 'bg-card-bg text-brand-blue shadow-sm dark:shadow-none' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleViewChange('goals')}
              className={`flex-1 sm:flex-none px-6 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                currentView === 'goals' 
                  ? 'bg-card-bg text-brand-blue shadow-sm dark:shadow-none' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Goal Planner
            </button>
            <button 
              onClick={() => handleViewChange('analysis')}
              className={`flex-1 sm:flex-none px-6 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                currentView === 'analysis' 
                  ? 'bg-card-bg text-brand-blue shadow-sm dark:shadow-none' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Analysis
            </button>
          </div>

          {/* User Profile Info */}
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

          {/* Theme, Sound & Authentication Actions */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full shrink-0">
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
