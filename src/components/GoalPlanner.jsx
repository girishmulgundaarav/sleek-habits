import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { UndrawIllustration } from './UndrawIllustration';
import { Trash2, Plus, Check, ListTodo, CalendarDays, Target, Layers, LayoutGrid } from 'lucide-react';

export const GoalPlanner = () => {
  const { 
    goals, 
    addGoal, 
    toggleSubtask, 
    deleteGoal, 
    playClickSound, 
    habits, 
    isHabitCompleted, 
    todayStr 
  } = useContext(AppContext);
  
  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [linkedHabitId, setLinkedHabitId] = useState('');
  const [subtaskInputs, setSubtaskInputs] = useState(['']); // Start with one empty subtask input
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'

  const handleAddSubtaskField = () => {
    playClickSound();
    setSubtaskInputs(prev => [...prev, '']);
  };

  const handleSubtaskInputChange = (index, value) => {
    setSubtaskInputs(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleRemoveSubtaskField = (index) => {
    playClickSound();
    if (subtaskInputs.length === 1) {
      setSubtaskInputs(['']);
    } else {
      setSubtaskInputs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmitGoal = (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    playClickSound();

    // Filter out empty subtasks
    const filteredSubtasks = subtaskInputs.filter(txt => txt.trim() !== '');
    
    addGoal(goalTitle.trim(), goalCategory, targetDate, filteredSubtasks, linkedHabitId || null);
    
    // Reset form
    setGoalTitle('');
    setGoalCategory('Personal');
    setTargetDate('2026-12-31');
    setSubtaskInputs(['']);
    setLinkedHabitId('');
  };

  // Calculate dynamic goal progress combining subtasks and linked habits
  const getGoalProgress = (goal) => {
    const totalSubtasks = goal.subtasks.length;
    const completedSubtasks = goal.subtasks.filter(s => s.completed).length;
    
    const linkedHabit = habits.find(h => h.id === goal.linkedHabitId);
    const hasLinkedHabit = !!linkedHabit;
    const isHabitCompletedToday = hasLinkedHabit && isHabitCompleted(linkedHabit, todayStr);
    
    const totalItems = totalSubtasks + (hasLinkedHabit ? 1 : 0);
    const completedItems = completedSubtasks + (isHabitCompletedToday ? 1 : 0);
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    return {
      totalItems,
      completedItems,
      percentage,
      isCompleted: totalItems > 0 && completedItems === totalItems,
      linkedHabitName: linkedHabit ? linkedHabit.name : null,
      isHabitCompletedToday
    };
  };

  // Get dynamic deadline label and styling
  const getDeadlineMarker = (targetDateStr) => {
    const today = new Date(todayStr + 'T00:00:00');
    const target = new Date(targetDateStr + 'T00:00:00');
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        text: 'Overdue', 
        color: 'text-brand-crimson bg-red-50 dark:bg-rose-950/20 border border-brand-crimson/10 dark:border-brand-crimson/20' 
      };
    } else if (diffDays === 0) {
      return { 
        text: 'Due Today', 
        color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/30' 
      };
    } else if (diffDays === 1) {
      return { 
        text: '1 day left', 
        color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/40 font-bold' 
      };
    } else if (diffDays <= 7) {
      return { 
        text: `${diffDays} days left`, 
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30' 
      };
    } else {
      return { 
        text: `${diffDays} days left`, 
        color: 'text-text-muted bg-slate-50-custom dark:bg-slate-800/50 border border-card-border-custom' 
      };
    }
  };

  // Sort goals by target deadline ascending (closest first)
  const sortedGoals = [...goals].sort((a, b) => {
    const dateA = new Date(a.targetDate);
    const dateB = new Date(b.targetDate);
    return dateA - dateB;
  });

  // Get active vs completed goals count
  const completedGoalsCount = goals.filter(g => getGoalProgress(g).isCompleted).length;

  const [showCreatorKanban, setShowCreatorKanban] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState({});

  const toggleExpandGoal = (goalId) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  // Reusable sub-component for the Creator Form to avoid code duplication
  const renderCreatorForm = () => {
    return (
      <form onSubmit={handleSubmitGoal} className="flex flex-col gap-4">
        {/* Goal Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Goal Name</label>
          <input
            type="text"
            placeholder="E.g., Complete marathon training..."
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50-custom border border-card-border-custom focus:border-brand-blue/20 focus:bg-card-bg rounded-xl text-xs font-semibold text-text-main outline-none transition-all placeholder-slate-400"
            required
          />
        </div>

        {/* Category & Target Date Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Category</label>
            <select
              value={goalCategory}
              onChange={(e) => setGoalCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50-custom border border-card-border-custom rounded-xl text-xs font-semibold text-text-main outline-none focus:bg-card-bg cursor-pointer"
            >
              <option value="Personal">Personal</option>
              <option value="Career">Career</option>
              <option value="Fitness">Fitness</option>
              <option value="Finance">Finance</option>
              <option value="Health">Health</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50-custom border border-card-border-custom rounded-xl text-xs font-semibold text-text-main outline-none focus:bg-card-bg cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Link to Habit */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Link to Habit (Optional)</label>
          <select
            value={linkedHabitId}
            onChange={(e) => setLinkedHabitId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50-custom border border-card-border-custom rounded-xl text-xs font-semibold text-text-main outline-none focus:bg-card-bg cursor-pointer"
          >
            <option value="">None (Subtasks Only)</option>
            {habits.map(h => (
              <option key={h.id} value={h.id}>{h.name} ({h.category})</option>
            ))}
          </select>
        </div>

        {/* Subtasks checklist configuration */}
        <div className="flex flex-col gap-2 border-t border-card-border-custom pt-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Subtasks Checklist</label>
            <button
              type="button"
              onClick={handleAddSubtaskField}
              className="text-[10px] font-bold text-brand-blue hover:text-opacity-80 flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Step
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
            {subtaskInputs.map((val, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-text-muted w-4">{idx + 1}.</span>
                <input
                  type="text"
                  placeholder="E.g., Read documentation..."
                  value={val}
                  onChange={(e) => handleSubtaskInputChange(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50-custom border border-card-border-custom rounded-lg text-xs font-semibold text-text-main outline-none focus:bg-card-bg placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSubtaskField(idx)}
                  className="p-1.5 text-slate-350 hover:text-brand-crimson hover:bg-slate-50-custom rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-opacity-95 shadow-md shadow-brand-blue/15 hover:shadow-lg active:scale-95 transition-all mt-2 cursor-pointer"
        >
          Create Goal Planner
        </button>
      </form>
    );
  };

  // Reusable component to render a single goal card (used in both List and Kanban layouts)
  const renderGoalCard = (goal, isCompact = false) => {
    const progress = getGoalProgress(goal);
    const deadline = getDeadlineMarker(goal.targetDate);
    const isExpanded = !isCompact || !!expandedGoals[goal.id];

    return (
      <div 
        key={goal.id} 
        className={`bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 sm:p-6 flex flex-col gap-4 transition-all hover:shadow-md ${
          progress.isCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : ''
        }`}
      >
        {/* Goal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded-full uppercase tracking-wider">
                {goal.category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${deadline.color}`}>
                {deadline.text}
              </span>
              {progress.isCompleted && (
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Complete
                </span>
              )}
            </div>
            <h3 
              onClick={() => isCompact && toggleExpandGoal(goal.id)}
              className={`text-sm sm:text-base font-bold tracking-tight mt-1 truncate ${isCompact ? 'cursor-pointer hover:text-brand-blue' : ''} ${progress.isCompleted ? 'text-text-muted line-through opacity-60' : 'text-text-main'}`}
            >
              {goal.title}
            </h3>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playClickSound();
              if (window.confirm(`Are you sure you want to delete the goal "${goal.title}"?`)) {
                deleteGoal(goal.id);
              }
            }}
            className="p-1.5 text-slate-350 hover:text-brand-crimson hover:bg-slate-50-custom rounded-xl transition-all cursor-pointer shrink-0"
            title="Delete Goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Linked Habit Connection details */}
        {goal.linkedHabitId && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-brand-blue font-bold uppercase border-b border-dashed border-card-border-custom pb-2.5 -mt-1.5">
            <span className="text-text-muted">Connection:</span>
            <span className="truncate max-w-[150px]">{progress.linkedHabitName}</span>
            {progress.isHabitCompletedToday ? (
              <span className="text-[8px] font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded-md border border-emerald-500/10">Today Completed</span>
            ) : (
              <span className="text-[8px] font-extrabold text-brand-grey bg-slate-50-custom dark:bg-slate-800 px-1 py-0.5 rounded-md border border-card-border-custom">Today Pending</span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ListTodo className="w-3.5 h-3.5 text-text-muted" /> 
              Progress: {progress.completedItems} / {progress.totalItems} steps
            </span>
            <span className={progress.isCompleted ? 'text-emerald-500 font-extrabold' : 'text-brand-blue font-extrabold'}>
              {progress.percentage}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              style={{ width: `${progress.percentage}%` }}
              className={`h-full transition-all duration-500 ${progress.isCompleted ? 'bg-emerald-500' : 'bg-brand-blue'}`}
            />
          </div>
        </div>

        {/* Subtasks Checklist */}
        {goal.subtasks.length > 0 && isExpanded && (
          <div className="border-t border-card-border-custom pt-3 flex flex-col gap-2 mt-0.5">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Milestone Checklist</span>
            <div className={`grid grid-cols-1 ${isCompact ? 'grid-cols-1' : 'md:grid-cols-2'} gap-2`}>
              {goal.subtasks.map((task) => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    toggleSubtask(goal.id, task.id);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    task.completed
                      ? 'border-emerald-500/10 bg-emerald-500/10 hover:bg-emerald-500/20'
                      : 'border-card-border-custom hover:bg-slate-50-custom/60'
                  }`}
                >
                  <span className={`text-xs font-semibold truncate flex-1 min-w-0 pr-2 ${
                    task.completed ? 'text-text-muted line-through opacity-60' : 'text-text-main'
                  }`}>
                    {task.text}
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    task.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border border-card-border-custom text-transparent hover:border-slate-350'
                  }`}>
                    {task.completed && <Check className="w-3 h-3 stroke-[3.5]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse Toggle for Compact view */}
        {isCompact && goal.subtasks.length > 0 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              playClickSound();
              toggleExpandGoal(goal.id);
            }}
            className="text-[10px] text-brand-blue font-bold text-center hover:text-opacity-80 transition-all cursor-pointer -mt-1 uppercase tracking-wider"
          >
            {isExpanded ? 'Hide Steps' : `Show Steps (${goal.subtasks.length})`}
          </button>
        )}

        {/* Target Date Footer */}
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted border-t border-card-border-custom pt-3 mt-auto uppercase tracking-wider">
          <CalendarDays className="w-3.5 h-3.5" />
          TARGET: {new Date(goal.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. GOAL PLANNER HEADER CARD WITH UNDRAW SVG */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 flex-1 text-center md:text-left">
          <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
            Milestones Planner
          </span>
          <span className="text-2xl font-extrabold text-text-main tracking-tight">
            Design Your Long-Term Goals
          </span>
          <p className="text-xs text-text-muted max-w-md font-medium leading-relaxed">
            Break down your vision into manageable micro-tasks. Track your completion rate and target dates to stay aligned with your aspirations.
          </p>
          <div className="flex items-center gap-4 mt-2 justify-center md:justify-start">
            <span className="px-3 py-1 bg-slate-50-custom rounded-full text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-brand-blue" /> {goals.length} Goals
            </span>
            <span className="px-3 py-1 bg-slate-50-custom rounded-full text-xs font-semibold text-text-main flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> {completedGoalsCount} Completed
            </span>
          </div>
        </div>

        {/* Goals Illustration (unDraw goals) */}
        <div className="w-32 h-28 sm:w-48 sm:h-40 bg-slate-50-custom rounded-2xl flex items-center justify-center p-2 sm:p-4 overflow-hidden shrink-0">
          <UndrawIllustration 
            name="goals" 
            primaryColor="#0066FF" 
            className="w-full h-full scale-[1.1]" 
          />
        </div>
      </div>

      {/* 2. VIEW SELECTION BAR */}
      <div className="flex items-center justify-between border-b border-card-border-custom pb-3 mb-2 flex-wrap gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">Milestones Overview</span>
          <span className="text-base font-extrabold text-text-main tracking-tight">Active Milestones</span>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full shrink-0">
          <button 
            onClick={() => {
              playClickSound();
              setViewMode('list');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-card-bg text-brand-blue shadow-sm' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> List View
          </button>
          <button 
            onClick={() => {
              playClickSound();
              setViewMode('kanban');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'kanban' 
                ? 'bg-card-bg text-brand-blue shadow-sm' 
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
          </button>
        </div>
      </div>

      {/* 3. DUAL LAYOUT: LIST VIEW OR KANBAN BOARD */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* CREATE GOAL FORM (Left Column) */}
          <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col gap-5 lg:col-span-1">
            <div className="flex flex-col">
              <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
                Setup Milestone
              </span>
              <span className="text-lg font-extrabold text-text-main tracking-tight">
                Create New Goal
              </span>
            </div>
            {renderCreatorForm()}
          </div>

          {/* ACTIVE GOALS LIST (Right Column) */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {sortedGoals.length === 0 ? (
              <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-10 text-center text-text-muted text-sm font-semibold uppercase tracking-wider">
                No active goals. Define your milestones using the creator form!
              </div>
            ) : (
              sortedGoals.map(goal => renderGoalCard(goal, false))
            )}
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW (Full Width) */
        <div className="flex flex-col gap-5 w-full">
          <div className="flex justify-end">
            <button
              onClick={() => {
                playClickSound();
                setShowCreatorKanban(!showCreatorKanban);
              }}
              className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-opacity-95 shadow-md shadow-brand-blue/15 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {showCreatorKanban ? 'Hide Creator' : 'Create New Goal'}
            </button>
          </div>

          {showCreatorKanban && (
            <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 max-w-xl mx-auto w-full transition-all">
              <div className="flex flex-col mb-3">
                <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
                  Setup Milestone
                </span>
                <span className="text-lg font-extrabold text-text-main tracking-tight">
                  Create New Goal
                </span>
              </div>
              {renderCreatorForm()}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-2">
            {/* To Do Column (0% progress) */}
            <div className="flex flex-col gap-4 bg-slate-50-custom/40 dark:bg-slate-900/30 p-4 rounded-3xl border border-card-border-custom min-h-[500px]">
              <div className="flex items-center justify-between border-b border-card-border-custom pb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="text-xs font-extrabold text-text-main uppercase tracking-wider">To Do</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold rounded-md text-text-muted">
                  {sortedGoals.filter(g => getGoalProgress(g).percentage === 0).length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {sortedGoals.filter(g => getGoalProgress(g).percentage === 0).length === 0 ? (
                  <div className="text-center text-[10px] text-text-muted font-bold uppercase tracking-wider py-8">No items</div>
                ) : (
                  sortedGoals.filter(g => getGoalProgress(g).percentage === 0).map(g => renderGoalCard(g, true))
                )}
              </div>
            </div>

            {/* In Progress Column (1-99% progress) */}
            <div className="flex flex-col gap-4 bg-slate-50-custom/40 dark:bg-slate-900/30 p-4 rounded-3xl border border-card-border-custom min-h-[500px]">
              <div className="flex items-center justify-between border-b border-card-border-custom pb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                  <span className="text-xs font-extrabold text-text-main uppercase tracking-wider">In Progress</span>
                </div>
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-[10px] font-extrabold rounded-md">
                  {sortedGoals.filter(g => { const p = getGoalProgress(g).percentage; return p > 0 && p < 100; }).length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {sortedGoals.filter(g => { const p = getGoalProgress(g).percentage; return p > 0 && p < 100; }).length === 0 ? (
                  <div className="text-center text-[10px] text-text-muted font-bold uppercase tracking-wider py-8">No items</div>
                ) : (
                  sortedGoals.filter(g => { const p = getGoalProgress(g).percentage; return p > 0 && p < 100; }).map(g => renderGoalCard(g, true))
                )}
              </div>
            </div>

            {/* Achieved Column (100% progress) */}
            <div className="flex flex-col gap-4 bg-slate-50-custom/40 dark:bg-slate-900/30 p-4 rounded-3xl border border-card-border-custom min-h-[500px]">
              <div className="flex items-center justify-between border-b border-card-border-custom pb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-extrabold text-text-main uppercase tracking-wider">Achieved</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-md">
                  {sortedGoals.filter(g => getGoalProgress(g).percentage === 100).length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {sortedGoals.filter(g => getGoalProgress(g).percentage === 100).length === 0 ? (
                  <div className="text-center text-[10px] text-text-muted font-bold uppercase tracking-wider py-8">No items</div>
                ) : (
                  sortedGoals.filter(g => getGoalProgress(g).percentage === 100).map(g => renderGoalCard(g, true))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalPlanner;
