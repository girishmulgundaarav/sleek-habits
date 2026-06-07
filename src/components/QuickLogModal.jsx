import { useEffect, useRef, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Moon, Brain, Smile, Droplets, Check, Sparkles, Zap, Frown, Meh } from 'lucide-react';

export const QuickLogModal = ({ onClose }) => {
  const {
    selectedDate,
    habits,
    sleep,
    focus,
    moodEnergy,
    isScheduledForDate,
    saveDailyQuickLog,
    playClickSound
  } = useContext(AppContext);

  const dialogRef = useRef(null);

  // 1. Identify active scheduled habits for selectedDate
  const scheduledHabits = habits.filter(h => isScheduledForDate(h, selectedDate) && !h.isHidden);
  
  // Find special "water/hydration" habit to render in Section 1
  const waterHabit = scheduledHabits.find(
    h => h.name.toLowerCase().includes('hydrate') || h.name.toLowerCase().includes('water')
  );
  
  // Keep other habits for Section 2
  const otherHabits = scheduledHabits.filter(h => h.id !== waterHabit?.id);

  // 2. Local states initialized with current context values
  const [sleepVal, setSleepVal] = useState(sleep[selectedDate] || 0);
  const [focusVal, setFocusVal] = useState(focus[selectedDate] || 0);
  const [moodVal, setMoodVal] = useState(moodEnergy[selectedDate] || 3);
  const [waterVal, setWaterVal] = useState(waterHabit ? (waterHabit.history[selectedDate] || 0) : 0);
  
  const [habitStates, setHabitStates] = useState(() => {
    const states = {};
    otherHabits.forEach(h => {
      states[h.id] = h.history[selectedDate] !== undefined ? h.history[selectedDate] : (h.isProgressType ? 0 : false);
    });
    return states;
  });

  // 3. Show dialog modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.showModal();
    }
    const handleClose = () => {
      onClose();
    };
    dialog?.addEventListener('close', handleClose);
    return () => {
      dialog?.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // 4. Backdrop click light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (e) => {
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isDialogContent) {
        if (playClickSound) playClickSound();
        dialog.close();
      }
    };
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('click', handleClick);
    };
  }, [playClickSound]);

  // Submit all metrics
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (playClickSound) playClickSound();

    const habitUpdates = [];
    if (waterHabit) {
      habitUpdates.push({ id: waterHabit.id, value: Number(waterVal) });
    }
    otherHabits.forEach(h => {
      habitUpdates.push({ id: h.id, value: habitStates[h.id] });
    });

    await saveDailyQuickLog({
      date: selectedDate,
      sleepHours: sleepVal,
      focusMins: focusVal,
      moodScore: moodVal,
      habitUpdates
    });

    dialogRef.current?.close();
  };

  // Helper for step sizes
  const getHabitStep = (habit) => {
    if (!habit.isProgressType) return 1;
    const unit = (habit.unit || '').toLowerCase();
    const name = (habit.name || '').toLowerCase();
    if (unit === 'ml' || name.includes('water') || name.includes('hydrate')) return 250;
    if (unit === 'cal' || unit === 'kcal' || name.includes('calories') || name.includes('food')) return 100;
    if (unit === 'steps') return 1000;
    if (unit === 'min' || unit === 'minutes') {
      if (habit.targetValue >= 60) return 15;
      if (habit.targetValue >= 30) return 5;
      return 5;
    }
    if (habit.targetValue >= 1000) return 100;
    if (habit.targetValue >= 100) return 10;
    if (habit.targetValue >= 10) return 5;
    return 1;
  };

  // Format date for selected header display (e.g. "Sunday, Jun 7")
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Toggle boolean habits inside states map
  const handleToggleHabitState = (habitId) => {
    if (playClickSound) playClickSound();
    setHabitStates(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  // Adjust numeric habits inside states map
  const handleChangeHabitProgressState = (habitId, delta) => {
    if (playClickSound) playClickSound();
    setHabitStates(prev => {
      const nextVal = Math.max(0, (prev[habitId] || 0) + delta);
      return {
        ...prev,
        [habitId]: nextVal
      };
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] md:max-h-[85vh] bg-card-bg/95 dark:bg-slate-900/90 border border-card-border-custom shadow-2xl rounded-card overflow-hidden text-left outline-none p-0"
    >
      <form onSubmit={handleSubmit} className="w-full flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-card-border-custom flex justify-between items-center bg-slate-50-custom/25 select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-text-main">Daily Quick Log Center</span>
              <span className="text-[9px] text-brand-grey font-bold uppercase tracking-wider">
                Log metrics for {formatDateLabel(selectedDate)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (playClickSound) playClickSound();
              dialogRef.current?.close();
            }}
            className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Close Modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Container Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 select-none">
        
        {/* Section 1: Daily Wellness Stats */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-black text-brand-grey uppercase tracking-widest">
            Section 1: Daily Wellness Stats
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sleep Logger */}
            <div className="p-4 bg-slate-50-custom/40 border border-card-border-custom rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4.5 h-4.5 text-brand-crimson" />
                  <span className="text-xs font-extrabold text-text-main">Sleep Hours</span>
                </div>
                <span className="text-xs font-black text-brand-crimson">{sleepVal.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={sleepVal}
                onChange={(e) => {
                  setSleepVal(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-crimson"
              />
              <div className="flex justify-between text-[9px] text-text-muted font-bold">
                <span>0h</span>
                <span>8h</span>
                <span>16h</span>
              </div>
            </div>

            {/* Focus Logger */}
            <div className="p-4 bg-slate-50-custom/40 border border-card-border-custom rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4.5 h-4.5 text-violet-500" />
                  <span className="text-xs font-extrabold text-text-main">Focus Minutes</span>
                </div>
                <span className="text-xs font-black text-violet-500">{focusVal} mins</span>
              </div>
              
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={focusVal}
                  onChange={(e) => setFocusVal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 px-2 py-1 bg-card-bg border border-card-border-custom rounded-xl text-xs font-extrabold text-text-main outline-none"
                />
                <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1">
                  {[-30, 15, 30, 60].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        if (playClickSound) playClickSound();
                        setFocusVal(prev => Math.max(0, prev + amt));
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all border cursor-pointer ${
                        amt > 0
                          ? 'bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20'
                          : 'bg-slate-200/50 dark:bg-slate-800/50 text-text-muted border-card-border-custom hover:bg-slate-350'
                      }`}
                    >
                      {amt > 0 ? `+${amt}m` : `${amt}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mood & Energy */}
            <div className="p-4 bg-slate-50-custom/40 border border-card-border-custom rounded-2xl flex flex-col gap-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="w-4.5 h-4.5 text-orange-400" />
                  <span className="text-xs font-extrabold text-text-main">Mood & Energy</span>
                </div>
                <span className="text-xs font-black text-orange-400">
                  {moodVal === 5 && 'Peak'}
                  {moodVal === 4 && 'High'}
                  {moodVal === 3 && 'Good'}
                  {moodVal === 2 && 'Meh'}
                  {moodVal === 1 && 'Awful'}
                </span>
              </div>

              <div className="flex justify-between gap-1.5 mt-1">
                {[
                  { score: 1, Icon: Frown, label: 'Awful', activeClass: 'bg-red-500/15 text-red-500 border-red-500/30' },
                  { score: 2, Icon: Meh, label: 'Meh', activeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
                  { score: 3, Icon: Smile, label: 'Good', activeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
                  { score: 4, Icon: Zap, label: 'High', activeClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
                  { score: 5, Icon: Sparkles, label: 'Peak', activeClass: 'bg-violet-500/15 text-violet-500 border-violet-500/30' }
                ].map((item) => (
                  <button
                    key={item.score}
                    type="button"
                    onClick={() => {
                      if (playClickSound) playClickSound();
                      setMoodVal(item.score);
                    }}
                    className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer border text-center ${
                      moodVal === item.score
                        ? `${item.activeClass} scale-[1.03] shadow-sm font-bold`
                        : 'bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border-transparent text-text-muted hover:text-text-main'
                    }`}
                  >
                    <item.Icon className="w-5 h-5" />
                    <span className="text-[9px] font-bold tracking-wider">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hydration / Water Intake (Conditional) */}
            {waterHabit && (
              <div className="p-4 bg-slate-50-custom/40 border border-card-border-custom rounded-2xl flex flex-col gap-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4.5 h-4.5 text-brand-blue" />
                    <span className="text-xs font-extrabold text-text-main">{waterHabit.name}</span>
                  </div>
                  <span className="text-xs font-black text-brand-blue">
                    {waterVal} / {waterHabit.targetValue} {waterHabit.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="250"
                    value={waterVal}
                    onChange={(e) => setWaterVal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-2 py-1 bg-card-bg border border-card-border-custom rounded-xl text-xs font-extrabold text-text-main outline-none"
                  />
                  <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1">
                    {[-250, 250, 500].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          if (playClickSound) playClickSound();
                          setWaterVal(prev => Math.max(0, prev + amt));
                        }}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all border cursor-pointer ${
                          amt > 0
                            ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20 hover:bg-brand-blue/20'
                            : 'bg-slate-200/50 dark:bg-slate-800/50 text-text-muted border-card-border-custom hover:bg-slate-350'
                        }`}
                      >
                        {amt > 0 ? `+${amt}ml` : `${amt}ml`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Section 2: Dynamic Habits Checklist */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-black text-brand-grey uppercase tracking-widest">
            Section 2: Dynamic Habits Checklist
          </h4>

          {otherHabits.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-card-border-custom rounded-2xl text-xs text-text-muted font-semibold uppercase tracking-wider bg-slate-50-custom/10">
              No other habits scheduled for today
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[240px] overflow-y-auto pr-1">
              {otherHabits.map((habit) => {
                const step = getHabitStep(habit);
                const val = habitStates[habit.id];
                const isCompleted = habit.isProgressType ? (val >= habit.targetValue) : (val === true);

                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between p-3.5 bg-slate-50-custom/30 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-card-border-custom'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[9px] text-brand-grey font-bold uppercase tracking-wider">
                        {habit.category}
                      </span>
                      <span className="text-xs font-extrabold text-text-main truncate">
                        {habit.name}
                      </span>
                    </div>

                    {habit.isProgressType ? (
                      /* Progress habit control */
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleChangeHabitProgressState(habit.id, -step)}
                          className="w-7 h-7 rounded-xl bg-card-bg hover:bg-slate-100 dark:hover:bg-slate-800 border border-card-border-custom text-text-muted flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <span className="text-xs font-extrabold text-text-main min-w-[55px] text-center">
                          {val} / {habit.targetValue} <span className="text-[9px] text-text-muted font-bold block">{habit.unit}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleChangeHabitProgressState(habit.id, step)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'bg-brand-blue text-white shadow-sm'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      /* Boolean habit check */
                      <button
                        type="button"
                        onClick={() => handleToggleHabitState(habit.id)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          val
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-card-bg border-card-border-custom text-transparent hover:border-slate-350'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Unified Actions */}
      <div className="px-6 py-4 border-t border-card-border-custom flex gap-3 bg-slate-50-custom/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (playClickSound) playClickSound();
              dialogRef.current?.close();
            }}
            className="flex-1 py-3 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-card-border-custom text-text-muted hover:text-text-main rounded-2xl text-xs font-extrabold transition-all cursor-pointer active:scale-[0.98] text-center"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="flex-1 py-3 bg-gradient-to-r from-brand-blue to-violet-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-brand-blue/15 hover:shadow-lg hover:shadow-brand-blue/20 cursor-pointer active:scale-[0.98] text-center"
          >
            Save Daily Logs
          </button>
        </div>

      </form>
    </dialog>
  );
};

export default QuickLogModal;
