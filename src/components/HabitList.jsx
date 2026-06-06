import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { UndrawIllustration } from './UndrawIllustration';
import { Check, Flame, Heart, BookOpen, Smile, Sparkles, Plus, Trash2, Clock } from 'lucide-react';

// Helper to determine step values dynamically based on habit properties
const getHabitStep = (habit) => {
  if (!habit.isProgressType) return 1;
  const unit = (habit.unit || '').toLowerCase();
  const name = (habit.name || '').toLowerCase();
  if (unit === 'ml' || name.includes('water') || name.includes('hydrate')) {
    return 250;
  }
  if (unit === 'cal' || unit === 'kcal' || name.includes('calories') || name.includes('food')) {
    return 100;
  }
  if (unit === 'steps') {
    return 1000;
  }
  if (unit === 'min' || unit === 'minutes') {
    if (habit.targetValue >= 60) return 15;
    if (habit.targetValue >= 30) return 5;
    return 5;
  }
  // Default step mapping based on target value magnitude:
  if (habit.targetValue >= 1000) return 100;
  if (habit.targetValue >= 100) return 10;
  if (habit.targetValue >= 10) return 5;
  return 1;
};

export const HabitList = () => {
  const { 
    selectedDate, 
    habits, 
    toggleHabit, 
    changeHabitProgress, 
    addNewHabit, 
    deleteHabit, 
    restoreHabit,
    deleteHabitPermanently,
    isHabitCompleted, 
    isScheduledForDate, 
    calculateStreak,
    requestNotificationPermission,
    playClickSound,
    theme
  } = useContext(AppContext);

  // Quick Add states
  const [showHiddenSpace, setShowHiddenSpace] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Health');
  const [isProgressType, setIsProgressType] = useState(false);
  const [targetValue, setTargetValue] = useState(10);
  const [unit, setUnit] = useState('pages');
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [weekdays, setWeekdays] = useState(['Mon', 'Wed', 'Fri']);
  const [reminderTime, setReminderTime] = useState('');

  // Categories list
  const categories = ['Health', 'Fitness', 'Mindfulness', 'Education', 'Nutrition'];

  // Map category names to icons
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Fitness':
        return <Flame className="w-4 h-4 text-brand-crimson" />;
      case 'Health':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'Mindfulness':
        return <Smile className="w-4 h-4 text-emerald-400" />;
      case 'Education':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-brand-blue" />;
    }
  };

  // Map habit names/categories to dynamic unDraw SVGs and accent details
  const getHabitDetails = (habitName, category) => {
    const name = habitName.toLowerCase();
    
    if (name.includes('meditation') || name.includes('mindful') || name.includes('calm')) {
      return { 
        svgName: 'meditation', 
        color: '#10B981',
        detailText: <>Daily limit: <strong className="text-emerald-500">15m</strong></>
      };
    }
    if (name.includes('hydrate') || name.includes('water') || name.includes('drink')) {
      return { 
        svgName: 'healthyHabit', 
        color: '#0066FF',
        detailText: <>Daily target: <strong className="text-brand-blue">3000ml</strong></>
      };
    }
    if (name.includes('run') || name.includes('cardio') || name.includes('jog') || name.includes('exercise')) {
      return { 
        svgName: 'jogging', 
        color: '#FF4B55',
        detailText: <>Daily target: <strong className="text-brand-crimson">30m</strong></>
      };
    }
    if (name.includes('read') || name.includes('book') || name.includes('study') || name.includes('page')) {
      return { 
        svgName: 'reading', 
        color: '#F59E0B',
        detailText: <>Daily target: <strong className="text-amber-500">20p</strong></>
      };
    }
    if (name.includes('diet') || name.includes('sugar') || name.includes('eat') || name.includes('nutrition')) {
      return { 
        svgName: 'diet', 
        color: '#8B5CF6',
        detailText: <>Daily target: <strong className="text-purple-500">0g sugar</strong></>
      };
    }
    
    // Category fallbacks
    switch (category) {
      case 'Fitness': 
        return { 
          svgName: 'jogging', 
          color: '#FF4B55', 
          detailText: <>Goal: <strong className="text-brand-crimson">Active</strong></> 
        };
      case 'Mindfulness': 
        return { 
          svgName: 'meditation', 
          color: '#10B981', 
          detailText: <>Goal: <strong className="text-emerald-500">Mindful</strong></> 
        };
      case 'Education': 
        return { 
          svgName: 'reading', 
          color: '#F59E0B', 
          detailText: <>Goal: <strong className="text-amber-500">Learn</strong></> 
        };
      case 'Nutrition': 
        return { 
          svgName: 'diet', 
          color: '#8B5CF6', 
          detailText: <>Goal: <strong className="text-purple-500">Healthy</strong></> 
        };
      default: 
        return { 
          svgName: 'healthyHabit', 
          color: '#0066FF', 
          detailText: <>Goal: <strong className="text-brand-blue">Complete</strong></> 
        };
    }
  };

  const handleAddHabitSubmit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    if (habits.length >= 10) return;

    playClickSound();

    if (reminderTime) {
      // Proactively request browser notifications permissions
      await requestNotificationPermission();
    }

    addNewHabit(
      newHabitName.trim(), 
      newHabitCategory, 
      isProgressType, 
      isProgressType ? targetValue : 1, 
      isProgressType ? unit : '', 
      recurrenceType, 
      weekdays, 
      reminderTime || null
    );

    // Reset form states
    setNewHabitName('');
    setIsProgressType(false);
    setTargetValue(10);
    setUnit('pages');
    setRecurrenceType('daily');
    setWeekdays(['Mon', 'Wed', 'Fri']);
    setReminderTime('');
  };

  // Filter active and hidden habits
  const activeHabits = habits.filter(h => !h.isHidden);
  const hiddenHabits = habits.filter(h => h.isHidden);

  // Calculate habit stats for selected date using active habits only
  const completedHabits = activeHabits.filter(h => isHabitCompleted(h, selectedDate)).length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
            Daily Habits Checklist
          </span>
          <span className="text-xl font-extrabold text-text-main tracking-tight">
            Habits Grid ({completedHabits}/{activeHabits.length} Completed)
          </span>
        </div>

        {/* Hidden Habits Space Toggle */}
        {hiddenHabits.length > 0 && (
          <button
            onClick={() => {
              playClickSound();
              setShowHiddenSpace(true);
            }}
            className="px-3.5 py-1.5 bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-card-border-custom rounded-xl text-[10px] font-bold text-text-muted hover:text-text-main transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Hidden Space ({hiddenHabits.length})</span>
          </button>
        )}
      </div>

      {/* Grid of Habit Cards (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {activeHabits.map((habit) => {
          const isCompleted = isHabitCompleted(habit, selectedDate);
          const isScheduled = isScheduledForDate(habit, selectedDate);
          const streak = calculateStreak(habit);
          const progressValue = habit.history[selectedDate] || 0;
          const details = getHabitDetails(habit.name, habit.category);

          return (
            <div
              key={habit.id}
              onClick={() => {
                playClickSound();
                toggleHabit(habit.id, selectedDate);
              }}
              className={`group bg-card-bg rounded-card shadow-card border p-4 sm:p-5 flex flex-row items-stretch justify-between gap-4 transition-all hover:shadow-lg cursor-pointer select-none ${
                isCompleted
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : isScheduled
                    ? 'border-card-border-custom hover:border-slate-200 dark:hover:border-slate-700'
                    : 'opacity-85 hover:opacity-100'
              }`}
              style={
                !isCompleted && !isScheduled
                  ? {
                      backgroundColor: theme === 'dark' 
                        ? `${details.color}12` // Soft custom tint dark (~7% opacity)
                        : `${details.color}06`, // Soft custom tint light (~2.3% opacity)
                      borderColor: theme === 'dark'
                        ? `${details.color}25` // Color-tinted border dark
                        : `${details.color}15` // Color-tinted border light
                    }
                  : undefined
              }
            >
              {/* Left Side (Text Details & Actions) */}
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div className="flex flex-col">
                  {/* Category Row */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-slate-50-custom flex items-center justify-center shrink-0">
                        {getCategoryIcon(habit.category)}
                      </div>
                      <span className="text-[9px] sm:text-[11px] text-brand-grey font-bold uppercase tracking-wider">
                        {habit.category}
                      </span>
                    </div>

                    {/* Streak & Status Badges */}
                    <div className="flex items-center gap-1">
                      {streak > 0 && (
                        <span 
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-lg text-[9px] font-extrabold"
                          title={`${streak}-day streak!`}
                        >
                          <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> {streak}d
                        </span>
                      )}
                      {!isScheduled && (
                        <span className="px-1.5 py-0.5 bg-slate-50-custom text-text-muted text-[8px] font-bold rounded-full uppercase tracking-wider">
                          Rest
                        </span>
                      )}
                      {/* Delete button (soft deletes habit) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          if (window.confirm(`Are you sure you want to hide "${habit.name}"? You can restore it or permanently delete it later in the Hidden Space.`)) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-brand-crimson opacity-0 group-hover:opacity-100 rounded-lg hover:bg-slate-50-custom transition-all shrink-0 cursor-pointer"
                        title="Hide Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Habit Name */}
                  <h3 className={`text-sm sm:text-base font-extrabold text-text-main tracking-tight mt-1 sm:mt-1.5 transition-all line-clamp-2`}>
                    {habit.name}
                  </h3>

                  {/* Reminder Badge */}
                  {habit.reminderTime && (
                    <span className="flex items-center gap-1 text-[8px] sm:text-[9px] text-text-muted font-bold uppercase mt-1">
                      <Clock className="w-3 h-3" /> {habit.reminderTime}
                    </span>
                  )}

                  {/* Progress Bar (if progress-based) */}
                  {habit.isProgressType && (
                    <div className="w-full flex flex-col gap-1 mt-1.5 pr-2">
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, (progressValue / habit.targetValue) * 100)}%` }}
                          className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-brand-blue'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Completion Action Buttons */}
                <div className="mt-2">
                  {habit.isProgressType ? (
                    /* Progress Incrementor buttons */
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          playClickSound();
                          changeHabitProgress(habit.id, selectedDate, -getHabitStep(habit));
                        }}
                        className="w-7 h-7 rounded-full bg-slate-50-custom hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-text-muted border border-card-border-custom flex items-center justify-center font-extrabold text-xs active:scale-90 transition-all shrink-0 select-none cursor-pointer"
                      >
                        -
                      </button>
                      <div className="flex flex-col items-center min-w-[50px]">
                        <span className="text-[11px] font-extrabold text-text-main leading-none">
                          {progressValue} / {habit.targetValue}
                        </span>
                        <span className="text-[8px] font-semibold text-text-muted uppercase tracking-wide mt-0.5">
                          {habit.unit}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          playClickSound();
                          changeHabitProgress(habit.id, selectedDate, getHabitStep(habit));
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs active:scale-90 transition-all shrink-0 select-none cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-brand-blue text-white hover:bg-opacity-90 shadow-md shadow-brand-blue/10'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    /* Standard checkbox mark complete button */
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound();
                        toggleHabit(habit.id, selectedDate);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-brand-blue text-white hover:bg-opacity-95 shadow-md shadow-brand-blue/15 hover:shadow-lg active:scale-95'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" /> Completed
                        </>
                      ) : (
                        <>Mark Completed</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side (Color-Swapped unDraw SVG Illustration - matched to Activities) */}
              <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-slate-50-custom rounded-2xl flex items-center justify-center p-1 sm:p-2 overflow-hidden shrink-0 self-center">
                <UndrawIllustration 
                  name={details.svgName}
                  primaryColor={details.color} 
                  className="w-full h-full scale-[1.05]" 
                />
              </div>

            </div>
          );
        })}

        {/* QUICK ADD HABIT CARD (Expandable Layout to accommodate rich configurations) */}
        <div className="bg-slate-50-custom/20 rounded-card border border-dashed border-card-border-custom p-4 flex flex-col justify-between gap-3 min-h-[220px]">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] sm:text-[11px] text-brand-grey font-bold uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-brand-blue" /> Quick Add Habit
            </span>
            
            {/* Name Input */}
            <input
              type="text"
              placeholder="Name (e.g. Read book)..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="w-full px-3 py-1.5 bg-card-bg border border-card-border-custom rounded-xl text-xs font-semibold text-text-main outline-none placeholder-slate-400"
              required
            />

            {/* Category & Time Row */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="w-full px-2 py-1.5 bg-card-bg border border-card-border-custom rounded-xl text-[10px] font-bold text-text-muted outline-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-2 py-1 bg-card-bg border border-card-border-custom rounded-xl text-[10px] font-bold text-text-muted outline-none cursor-pointer"
                title="Reminder Time"
              />
            </div>

            {/* Progress-Based Settings */}
            <div className="flex flex-col gap-1.5 border-t border-card-border-custom pt-2">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isProgressType}
                  onChange={(e) => setIsProgressType(e.target.checked)}
                  className="rounded text-brand-blue focus:ring-brand-blue w-3.5 h-3.5 border-card-border-custom bg-card-bg"
                />
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wide">Progress-Based Habit</span>
              </label>

              {isProgressType && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Target Value"
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value) || '')}
                    className="w-full px-2.5 py-1 bg-card-bg border border-card-border-custom rounded-xl text-[10px] font-bold text-text-main outline-none"
                    min="1"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. p)"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-1 bg-card-bg border border-card-border-custom rounded-xl text-[10px] font-bold text-text-main outline-none"
                  />
                </div>
              )}
            </div>

            {/* Recurrence Settings */}
            <div className="flex flex-col gap-1.5 border-t border-card-border-custom pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wide">Schedule</label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value)}
                  className="px-2 py-0.5 bg-card-bg border border-card-border-custom rounded-lg text-[9px] font-bold text-text-muted outline-none cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Specific Days</option>
                </select>
              </div>

              {recurrenceType === 'weekdays' && (
                <div className="flex justify-between gap-1 mt-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const isSelected = weekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setWeekdays(prev => 
                            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                          );
                        }}
                        className={`w-6 h-6 rounded-lg text-[9px] font-extrabold flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                            : 'bg-card-bg text-text-muted border-card-border-custom hover:bg-slate-50-custom'
                        }`}
                      >
                        {day.slice(0, 1)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {habits.length >= 10 ? (
            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[9px] text-brand-crimson font-bold text-center uppercase tracking-wider">
                Max limit reached (10/10). Delete a habit to add new ones.
              </span>
              <button
                disabled
                className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-text-muted rounded-xl text-xs font-extrabold cursor-not-allowed flex items-center justify-center gap-1"
              >
                Add Habit Card
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddHabitSubmit}
              className="w-full py-2 bg-brand-blue hover:bg-opacity-95 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-brand-blue/15 mt-2 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Habit Card
            </button>
          )}
        </div>

      </div>

      {/* Hidden Habits Space Modal Overlay */}
      {showHiddenSpace && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all">
          <div className="w-full max-w-md bg-card-bg border border-card-border-custom shadow-2xl rounded-card p-6 flex flex-col gap-4 relative transition-all animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">Archived Items</span>
                <h3 className="text-base font-extrabold text-text-main">Hidden Habits Space</h3>
              </div>
              <button 
                onClick={() => { playClickSound(); setShowHiddenSpace(false); }}
                className="text-xs text-text-muted hover:text-text-main font-bold p-1 hover:bg-slate-50-custom rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {hiddenHabits.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-muted font-medium uppercase tracking-wider">
                  No hidden habits found
                </div>
              ) : (
                hiddenHabits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-slate-50-custom dark:bg-slate-800/30 rounded-xl border border-card-border-custom/50">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-brand-grey font-bold uppercase tracking-wide">{habit.category}</span>
                      <span className="text-xs font-bold text-text-main truncate pr-2">{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          playClickSound();
                          restoreHabit(habit.id);
                        }}
                        className="px-2.5 py-1 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          if (window.confirm(`Permanently delete "${habit.name}"? This wipes all daily checkmarks and logs forever.`)) {
                            deleteHabitPermanently(habit.id);
                          }
                        }}
                        className="px-2.5 py-1 bg-brand-crimson/10 hover:bg-brand-crimson/20 text-brand-crimson text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <p className="text-[9px] text-text-muted font-medium text-center uppercase tracking-wide border-t border-card-border-custom pt-3">
              Total habits: {habits.length} / 10 slots used
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default HabitList;
