import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Brain, Moon, Smile, Frown, Meh, Zap, Sparkles, Plus, Minus, Play, Pause, RotateCcw, Maximize2, Minimize2, Volume2 } from 'lucide-react';

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
    isSoundEnabled,
    theme
  } = useContext(AppContext);

  // States for edit overlays
  const [editingSleepDate, setEditingSleepDate] = useState(null);
  const [sleepInput, setSleepInput] = useState('');

  // 1.1 IMMERSIVE DEEP FOCUS & AMBIENT SYNTH STATES
  const [isDeepFocusActive, setIsDeepFocusActive] = useState(false);
  const [activeSound, setActiveSound] = useState('none'); // 'none', 'rain', 'waves', 'ambient'
  
  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef(null);

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

  // Canvas wave animation effect
  useEffect(() => {
    if (!isDeepFocusActive) return;
    const canvas = document.getElementById('wave-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const percent = timeLeft / timerDuration;
      const fillHeight = canvas.height * (1 - percent); // Height from top
      
      // Draw wave 1 (indigo background wave)
      ctx.fillStyle = theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x++) {
        const y = fillHeight + Math.sin(x * 0.015 + offset) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Draw wave 2 (violet foreground wave)
      ctx.fillStyle = theme === 'dark' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.18)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x++) {
        const y = fillHeight + Math.cos(x * 0.02 + offset * 1.3) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      offset += 0.03;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isDeepFocusActive, timeLeft, timerDuration, theme]);

  // Ambient Sound Controller Effect using Web Audio API synthesis
  useEffect(() => {
    const startAudio = async () => {
      stopAudio();

      if (!isRunning || activeSound === 'none' || typeof window === 'undefined') return;

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass();
        }
        
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Setup master gain node
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
        masterGain.connect(ctx.destination);

        const nodes = {
          sources: [],
          gains: [],
          lfos: []
        };

        if (activeSound === 'rain') {
          // Brownian Noise (Rain)
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          }
          
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;
          
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(800, ctx.currentTime);
          
          noise.connect(lp);
          lp.connect(masterGain);
          noise.start();
          
          nodes.sources.push(noise);
        } 
        else if (activeSound === 'waves') {
          // Ocean Waves (Modulated Brown Noise)
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          }
          
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;
          
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(500, ctx.currentTime);
          
          const waveGain = ctx.createGain();
          waveGain.gain.setValueAtTime(0.1, ctx.currentTime);
          
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
          
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(0.3, ctx.currentTime);
          
          lfo.connect(lfoGain);
          lfoGain.connect(waveGain.gain);
          
          noise.connect(lp);
          lp.connect(waveGain);
          waveGain.connect(masterGain);
          
          noise.start();
          lfo.start();
          
          nodes.sources.push(noise);
          nodes.lfos.push(lfo);
        } 
        else if (activeSound === 'ambient') {
          // Deep Space Drone / Ambient Chords
          const freqs = [110, 164.81, 220, 246.94, 261.63]; // A2, E3, A3, B3, C4
          
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(280, ctx.currentTime);
          lp.Q.setValueAtTime(2.0, ctx.currentTime);
          
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(0.06, ctx.currentTime);
          
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(140, ctx.currentTime);
          
          lfo.connect(lfoGain);
          lfoGain.connect(lp.frequency);
          
          freqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq + (Math.random() - 0.5), ctx.currentTime);
            
            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
            
            osc.connect(oscGain);
            oscGain.connect(lp);
            osc.start();
            nodes.sources.push(osc);
          });
          
          lfo.start();
          nodes.lfos.push(lfo);
          
          lp.connect(masterGain);
        }

        synthNodesRef.current = nodes;
      } catch (err) {
        console.error("Error starting ambient synthesizer:", err);
      }
    };

    const stopAudio = () => {
      if (synthNodesRef.current) {
        const { sources, lfos } = synthNodesRef.current;
        sources.forEach(src => {
          try { src.stop(); } catch (e) { void e; }
          try { src.disconnect(); } catch (e) { void e; }
        });
        lfos.forEach(lfo => {
          try { lfo.stop(); } catch (e) { void e; }
          try { lfo.disconnect(); } catch (e) { void e; }
        });
        synthNodesRef.current = null;
      }
    };

    startAudio();

    return () => stopAudio();
  }, [isRunning, activeSound]);

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

              <button
                onClick={() => {
                  playClickSound();
                  setIsDeepFocusActive(true);
                }}
                title="Enter Deep Focus"
                className="w-8 h-8 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-text-muted hover:text-violet-500 dark:hover:text-violet-400 rounded-full flex items-center justify-center cursor-pointer transition-all border border-card-border-custom active:scale-90"
              >
                <Maximize2 className="w-4 h-4" />
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

      {/* Deep Focus Immersive Overlay */}
      {isDeepFocusActive && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-between p-6 sm:p-12 text-white select-none transition-all duration-500 ease-out select-none">
          {/* Background Ambient Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-650/10 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-650/10 blur-[130px] pointer-events-none" />

          {/* Top Header Row (Close Button / Exit) */}
          <div className="w-full flex justify-between items-center z-10">
            <div className="flex flex-col">
              <span className="text-[10px] text-brand-grey font-black uppercase tracking-widest">Immersive Mode</span>
              <span className="text-sm font-extrabold text-slate-200">Deep Focus Flow</span>
            </div>
            <button 
              onClick={() => {
                playClickSound();
                setIsDeepFocusActive(false);
              }}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-90"
              title="Exit Immersive Mode"
            >
              <Minimize2 className="w-5 h-5 text-slate-300 hover:text-white" />
            </button>
          </div>

          {/* Main Visual: Circular Wave Timer */}
          <div className="flex flex-col items-center justify-center gap-6 z-10 my-auto">
            {/* The circular water container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-slate-900/40 backdrop-blur-lg">
              {/* Wave Canvas */}
              <canvas 
                id="wave-canvas" 
                width="288" 
                height="288" 
                className="absolute inset-0 w-full h-full"
              />
              
              {/* Central Time Label */}
              <div className="absolute flex flex-col items-center z-20">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {formatTimer(timeLeft)}
                </span>
                <span className="text-[10px] sm:text-xs text-white/60 font-black uppercase tracking-widest mt-1.5 drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]">
                  {isRunning ? 'Flow State Active' : 'Session Paused'}
                </span>
              </div>
            </div>

            {/* Immersive Play/Pause & Reset controls */}
            <div className="flex items-center gap-4">
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
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 border ${
                  isRunning 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/35' 
                    : 'bg-violet-600 text-white border-violet-500 hover:bg-violet-700 shadow-lg shadow-violet-500/20'
                }`}
                title={isRunning ? 'Pause Timer' : 'Start Timer'}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              
              <button
                onClick={() => {
                  playClickSound();
                  setIsRunning(false);
                  setEndTime(null);
                  setTimeLeft(timerDuration);
                }}
                className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Bar: Ambient Audio Soundscapes Panel */}
          <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 z-10 mb-2 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">
                Ambient Soundscapes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: '🔇 Silent' },
                { id: 'rain', label: '🌧️ Rain' },
                { id: 'waves', label: '🌊 Waves' },
                { id: 'ambient', label: '🌌 Space' }
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    playClickSound();
                    setActiveSound(sound.id);
                  }}
                  className={`py-2 px-3 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all cursor-pointer border ${
                    activeSound === sound.id
                      ? 'bg-violet-650/30 text-violet-300 border-violet-500/50 shadow-md shadow-violet-500/10'
                      : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Trackers;
