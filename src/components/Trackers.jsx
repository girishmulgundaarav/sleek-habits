import { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { Brain, Moon, Smile, Frown, Meh, Zap, Sparkles, Plus, Minus, Play, Pause, RotateCcw } from 'lucide-react';

export const Trackers = () => {
  const { 
    selectedDate, 
    focus, 
    changeFocus, 
    sleep, 
    updateSleepLog, 
    moodEnergy, 
    updateMoodEnergy,
    getPastDateString,
    playClickSound,
    isSoundEnabled
  } = useContext(AppContext);

  // States for edit overlays
  const [editingSleepDate, setEditingSleepDate] = useState(null);
  const [sleepInput, setSleepInput] = useState('');

  // Today's values
  const todayFocus = focus[selectedDate] || 0;

  // 1. FOCUS / POMODORO TIMER STATE
  // Load timer states from localStorage on initialization
  const [timerDuration, setTimerDuration] = useState(() => {
    const saved = localStorage.getItem('sleekhabits_timer_duration');
    return saved ? parseInt(saved, 10) : 25 * 60;
  });

  const [endTime, setEndTime] = useState(() => {
    const saved = localStorage.getItem('sleekhabits_timer_endtime');
    return saved ? parseInt(saved, 10) : null;
  });

  const [isRunning, setIsRunning] = useState(() => {
    if (typeof window === 'undefined') return false;
    const running = localStorage.getItem('sleekhabits_timer_running') === 'true';
    const savedEnd = localStorage.getItem('sleekhabits_timer_endtime');
    if (running && savedEnd) {
      const endTs = parseInt(savedEnd, 10);
      if (endTs > Date.now()) {
        return true;
      }
    }
    return false;
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window === 'undefined') return 25 * 60;
    const running = localStorage.getItem('sleekhabits_timer_running') === 'true';
    const savedEnd = localStorage.getItem('sleekhabits_timer_endtime');
    const savedDuration = localStorage.getItem('sleekhabits_timer_duration');
    const duration = savedDuration ? parseInt(savedDuration, 10) : 25 * 60;

    if (running && savedEnd) {
      const endTs = parseInt(savedEnd, 10);
      const remaining = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
      if (remaining > 0) return remaining;
    }
    return duration;
  });

  // Play synthesized double beep chime when timer is complete
  const playAlarmSound = useCallback(() => {
    if (!isSoundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);
      
      // Tone 2 (offset)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      }, 150);
    } catch (err) {
      console.error("Alarm playback error:", err);
    }
  }, [isSoundEnabled]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sleekhabits_timer_duration', timerDuration.toString());
  }, [timerDuration]);

  useEffect(() => {
    localStorage.setItem('sleekhabits_timer_running', isRunning ? 'true' : 'false');
    if (endTime) {
      localStorage.setItem('sleekhabits_timer_endtime', endTime.toString());
    } else {
      localStorage.removeItem('sleekhabits_timer_endtime');
    }
  }, [isRunning, endTime]);

  // Timer Tick Effect (Timestamp-based to work when device is locked/sleeping)
  useEffect(() => {
    let interval = null;
    if (isRunning && endTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        if (remaining === 0) {
          setIsRunning(false);
          setEndTime(null);
          setTimeLeft(timerDuration);
          playAlarmSound();
          const minutesCompleted = Math.round(timerDuration / 60);
          changeFocus(selectedDate, minutesCompleted);
        } else {
          setTimeLeft(remaining);
        }
      }, 500); // Check every 500ms
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, endTime, timerDuration, selectedDate, changeFocus, playAlarmSound]);

  // Check if timer finished while the page was closed/refreshed
  useEffect(() => {
    const running = localStorage.getItem('sleekhabits_timer_running') === 'true';
    const savedEnd = localStorage.getItem('sleekhabits_timer_endtime');
    const savedDuration = localStorage.getItem('sleekhabits_timer_duration');
    
    if (running && savedEnd && savedDuration) {
      const endTs = parseInt(savedEnd, 10);
      const duration = parseInt(savedDuration, 10);
      if (endTs <= Date.now()) {
        const minutesCompleted = Math.round(duration / 60);
        changeFocus(selectedDate, minutesCompleted);
        
        localStorage.setItem('sleekhabits_timer_running', 'false');
        localStorage.removeItem('sleekhabits_timer_endtime');
        playAlarmSound();
      }
    }
  }, [selectedDate, changeFocus, playAlarmSound]);

  const handleSetPreset = (minutes) => {
    if (isRunning) return;
    playClickSound();
    const secs = minutes * 60;
    setTimerDuration(secs);
    setTimeLeft(secs);
    setEndTime(null);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const todaySleep = sleep[selectedDate] || 0;
  
  const todayMood = moodEnergy[selectedDate];

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. SLEEP HEATMAP DATA PREPARATION
  // 7 columns aligned to actual calendar days (Monday to Sunday)
  const heatmapWeeks = [];
  const startMonday = new Date();
  const jsDay = startMonday.getDay();
  const currentWeekDayIndex = jsDay === 0 ? 6 : jsDay - 1;
  // Start at Monday of 3 weeks ago
  startMonday.setDate(startMonday.getDate() - currentWeekDayIndex - 21);

  for (let w = 0; w < 4; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + (w * 7) + d);
      weekDays.push(getLocalDateString(date));
    }
    heatmapWeeks.push(weekDays);
  }

  // Get color scale for sleep hours
  const getSleepColorClass = (hours) => {
    if (!hours || hours === 0) return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700';
    if (hours < 5) return 'bg-[#FFE4E6] dark:bg-rose-950/20 hover:bg-rose-200 dark:hover:bg-rose-900/30'; // light pink
    if (hours < 7) return 'bg-[#FDA4AF] dark:bg-rose-900/40 hover:bg-rose-300 dark:hover:bg-rose-800/50'; // medium pink
    if (hours < 8.5) return 'bg-[#F43F5E] dark:bg-rose-600 hover:bg-rose-500'; // brand-crimson
    return 'bg-[#FF4B55] dark:bg-rose-550 hover:bg-rose-600'; // intense brand-crimson
  };

  // Calculate total sleep this week (past 7 days)
  let totalSleepThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    totalSleepThisWeek += sleep[getPastDateString(i)] || 0;
  }

  // 2. MOOD & ENERGY TRENDLINE CHART DATA PREPARATION
  // Fetch values for the past 7 days
  const chartDays = [];
  for (let i = 6; i >= 0; i--) {
    chartDays.push(getPastDateString(i));
  }

  const chartPoints = chartDays.map((dateStr, index) => {
    const val = moodEnergy[dateStr] || 3; // Fallback to 3 (Good)
    // Scale value between 1 (y = 65) and 5 (y = 15) inside SVG height 80
    const x = 15 + index * 28; // Spacing horizontally (7 points fits in viewBox 200)
    const minVal = 1;
    const maxVal = 5;
    const y = 65 - Math.min(50, Math.max(0, ((val - minVal) / (maxVal - minVal)) * 50));
    return { x, y, value: val, date: dateStr };
  });

  // Calculate smooth SVG bezier path
  const getBezierPath = (points) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const trendlinePath = getBezierPath(chartPoints);
  const areaPath = chartPoints.length > 0 
    ? `${trendlinePath} L ${chartPoints[chartPoints.length - 1].x} 75 L ${chartPoints[0].x} 75 Z`
    : '';

  // Trigger sleep save
  const handleSaveSleep = (e) => {
    e.preventDefault();
    playClickSound();
    if (editingSleepDate) {
      updateSleepLog(editingSleepDate, sleepInput);
      setEditingSleepDate(null);
      setSleepInput('');
    }
  };



  // Date short formatter (e.g. "Jun 4")
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFocusStatusLabel = (mins) => {
    if (mins === 0) return { label: 'Resting', color: 'text-text-muted' };
    if (mins < 45) return { label: 'Focused', color: 'text-emerald-500 dark:text-emerald-400' };
    if (mins < 90) return { label: 'Productive', color: 'text-blue-500 dark:text-blue-400' };
    return { label: 'Deep Flow', color: 'text-violet-500 dark:text-violet-400 font-extrabold' };
  };
  const focusStatus = getFocusStatusLabel(todayFocus);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. FOCUS & DEEP WORK CARD */}
      {/* 1. FOCUS & DEEP WORK CARD */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
        
        {/* Right Side - Vertical Manual Adjustments Bar */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-30 pl-3 border-l border-card-border-custom/40">
          <button
            onClick={() => {
              playClickSound();
              changeFocus(selectedDate, 15);
            }}
            title="Manually add 15 focus minutes"
            className="w-8 h-8 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-text-main rounded-xl flex items-center justify-center border border-card-border-custom active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-violet-500" />
          </button>
          <span className="text-[9px] text-text-muted font-bold select-none py-0.5">15m</span>
          <button
            onClick={() => {
              playClickSound();
              changeFocus(selectedDate, -15);
            }}
            title="Manually remove 15 focus minutes"
            className="w-8 h-8 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-text-muted hover:text-text-main rounded-xl flex items-center justify-center border border-card-border-custom active:scale-95 transition-all cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Top Header Section (Left Aligned like Sleep/Mood cards) */}
        <div className="w-full flex justify-between items-start z-10 pr-12">
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain className="w-4 h-4 text-violet-500" />
              <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
                Focus & Deep Work
              </span>
            </div>
            
            <span className={`text-2xl font-extrabold tracking-tight mt-0.5 ${focusStatus.color}`}>
              {focusStatus.label}
            </span>
            
            <span className="text-xs text-text-muted font-medium mt-1">
              {parseFloat((todayFocus / 60).toFixed(2))} hrs focused today
            </span>
          </div>
        </div>

        {/* Centered Timer & Controls Wrapper */}
        <div className="w-full flex flex-col items-center z-10 mt-3 pr-12">
          {/* Large Center Pomodoro Timer Circle */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
              {/* Outer circle track */}
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="5"
                fill="transparent"
              />
              {/* Active animated duration countdown circle */}
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-violet-500 transition-all duration-1000 ease-linear"
                strokeWidth="5.5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 62}
                strokeDashoffset={(2 * Math.PI * 62) - (timeLeft / timerDuration) * (2 * Math.PI * 62)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center select-none">
              <span className="text-2xl font-black text-text-main tracking-tight font-mono">
                {formatTimer(timeLeft)}
              </span>
              <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                {isRunning ? 'Focusing' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Action Buttons & Presets Selector */}
          <div className="flex flex-col gap-2 items-center w-full mt-4">
            {/* Control Actions (Play/Pause, Stop) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClickSound();
                  if (isRunning) {
                    setIsRunning(false);
                    setEndTime(null);
                  } else {
                    const targetEndTime = Date.now() + timeLeft * 1000;
                    setEndTime(targetEndTime);
                    setIsRunning(true);
                  }
                }}
                title={isRunning ? 'Pause Focus' : 'Start Focus'}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-card-border-custom ${
                  isRunning 
                    ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                    : 'bg-violet-500 text-white hover:bg-violet-650 shadow-md shadow-violet-500/15'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              
              <button
                onClick={() => {
                  playClickSound();
                  setIsRunning(false);
                  setEndTime(null);
                  setTimeLeft(timerDuration);
                }}
                title="Reset Timer"
                className="w-8 h-8 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-text-muted hover:text-text-main rounded-full flex items-center justify-center cursor-pointer transition-all border border-card-border-custom active:scale-90"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Switcher (Disabled during runs) */}
            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg border border-card-border-custom/50">
              <button
                disabled={isRunning}
                onClick={() => handleSetPreset(25)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                  isRunning ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  timerDuration === 25 * 60 
                    ? 'bg-card-bg text-violet-500 shadow-sm border border-card-border-custom' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                25m
              </button>
              <button
                disabled={isRunning}
                onClick={() => handleSetPreset(50)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                  isRunning ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  timerDuration === 50 * 60 
                    ? 'bg-card-bg text-violet-500 shadow-sm border border-card-border-custom' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                50m
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 2. SLEEP TRACKER CARD */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col justify-between min-h-[250px] relative">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
                Sleep Tracker
              </span>
              <span className="text-2xl font-extrabold text-text-main tracking-tight mt-0.5">
                {todaySleep} <span className="text-sm font-medium text-text-muted">hrs</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
              <Moon className="w-4 h-4 text-brand-crimson" />
            </div>
          </div>

          {/* Week Statistics */}
          <span className="text-xs text-text-muted font-medium block -mt-1 mb-3">
            Week total: {totalSleepThisWeek.toFixed(1)} hrs
          </span>

          {/* 7-Day Heatmap Grid */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="grid grid-cols-7 gap-1 text-[9px] text-text-muted font-bold uppercase tracking-wider text-center mb-0.5">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
            {heatmapWeeks.map((week, wIndex) => (
              <div key={wIndex} className="grid grid-cols-7 gap-1.5">
                {week.map((dateStr) => {
                  const hours = sleep[dateStr] || 0;
                  const isSelected = dateStr === selectedDate;
                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        playClickSound();
                        setEditingSleepDate(dateStr);
                        setSleepInput(hours || '');
                      }}
                      title={`${formatDateShort(dateStr)}: ${hours} hrs`}
                      className={`aspect-square rounded-md cursor-pointer transition-all ${getSleepColorClass(hours)} ${
                        isSelected ? 'ring-2 ring-brand-blue ring-offset-1 scale-[1.08]' : ''
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="text-[9px] font-bold text-text-muted flex items-center gap-2 mt-4 uppercase tracking-wider">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800"></span>
          <span className="w-2.5 h-2.5 rounded bg-[#FFE4E6] dark:bg-rose-950/20"></span>
          <span className="w-2.5 h-2.5 rounded bg-[#FDA4AF] dark:bg-rose-900/40"></span>
          <span className="w-2.5 h-2.5 rounded bg-[#F43F5E] dark:bg-rose-600"></span>
          <span className="w-2.5 h-2.5 rounded bg-[#FF4B55] dark:bg-rose-550"></span>
          <span>More</span>
        </div>

        {/* Modal Overlay for Editing Sleep Hours (Dynamic Inline Modal) */}
        {editingSleepDate && (
          <div className="absolute inset-0 bg-card-bg/95 backdrop-blur-md rounded-card p-6 flex flex-col justify-center gap-4 z-20 transition-all border border-card-border-custom">
            <h4 className="font-bold text-text-main text-sm">
              Log Sleep: {formatDateShort(editingSleepDate)}
            </h4>
            <form onSubmit={handleSaveSleep} className="flex gap-2">
              <input
                type="number"
                step="0.5"
                placeholder="Hours (e.g. 8)"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-card-border-custom bg-slate-50-custom rounded-xl text-xs font-semibold text-text-main outline-none placeholder-slate-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-opacity-95 active:scale-95 cursor-pointer"
              >
                Save
              </button>
            </form>
            <button
              onClick={() => {
                playClickSound();
                setEditingSleepDate(null);
              }}
              className="text-xs text-text-muted font-semibold hover:text-text-main text-center cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* 3. MOOD & ENERGY CARD */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
                Mood & Energy
              </span>
              <span className="text-2xl font-extrabold text-text-main tracking-tight mt-0.5 flex items-center gap-1.5 h-8">
                {todayMood === 5 && <><Sparkles className="w-5 h-5 text-violet-500 animate-pulse" /> Peak</>}
                {todayMood === 4 && <><Zap className="w-5 h-5 text-blue-500" /> High</>}
                {todayMood === 3 && <><Smile className="w-5 h-5 text-emerald-500" /> Good</>}
                {todayMood === 2 && <><Meh className="w-5 h-5 text-amber-500" /> Meh</>}
                {todayMood === 1 && <><Frown className="w-5 h-5 text-red-500" /> Awful</>}
                {!todayMood && <span className="text-text-muted font-normal text-lg">Not logged</span>}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
              <Smile className="w-4 h-4 text-orange-400" />
            </div>
          </div>

          {/* Icon selector row */}
          <div className="flex items-center justify-between gap-1 mt-3 relative z-10">
            {[
              { score: 1, Icon: Frown, label: 'Awful', activeClass: 'bg-red-500/15 text-red-500 border-red-500/30' },
              { score: 2, Icon: Meh, label: 'Meh', activeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
              { score: 3, Icon: Smile, label: 'Good', activeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
              { score: 4, Icon: Zap, label: 'High', activeClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
              { score: 5, Icon: Sparkles, label: 'Peak', activeClass: 'bg-violet-500/15 text-violet-500 border-violet-500/30' }
            ].map((item) => (
              <button
                key={item.score}
                onClick={() => {
                  playClickSound();
                  updateMoodEnergy(selectedDate, item.score);
                }}
                title={item.label}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                  todayMood === item.score
                    ? `${item.activeClass} scale-110 shadow-sm font-bold`
                    : 'bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                <item.Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* SVG Bezier Path Trendline */}
        <div className="h-20 w-full mt-4 -mx-6 relative">
          <svg className="w-[calc(100%+3rem)] h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
            <defs>
              {/* Soft Gradient for Area Under the Curve */}
              <linearGradient id="moodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
              {/* Line Stroke Gradient */}
              <linearGradient id="moodLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Area path */}
            {areaPath && (
              <path d={areaPath} fill="url(#moodAreaGrad)" />
            )}

            {/* Line path */}
            {trendlinePath && (
              <path 
                d={trendlinePath} 
                fill="none" 
                stroke="url(#moodLineGrad)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            )}

            {/* Bullet points on curve */}
            {chartPoints.map((pt, i) => {
              const isSelected = pt.date === selectedDate;
              return (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 4 : 2.5}
                  fill={isSelected ? '#F59E0B' : '#EF4444'}
                  stroke={isSelected ? '#FFFFFF' : 'none'}
                  strokeWidth={isSelected ? 1.5 : 0}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        </div>

        {/* Past 7 Days Labels */}
        <div className="flex justify-between mt-2 text-[9px] text-text-muted font-bold uppercase tracking-wider">
          <span>{formatDateShort(chartDays[0])}</span>
          <span>{formatDateShort(chartDays[3])}</span>
          <span>{formatDateShort(chartDays[6])}</span>
        </div>

      </div>

    </div>
  );
};

export default Trackers;
