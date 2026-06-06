import { createContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getLocalDateString();

// Helper to get past date string relative to current local date
const getPastDateString = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateString(date);
};

// Helper to check if a habit is completed on a date
const isHabitCompleted = (habit, date) => {
  const record = habit.history[date];
  if (habit.isProgressType) {
    return (record || 0) >= (habit.targetValue || 1);
  }
  return record === true;
};

// Helper to check if a habit is scheduled for a specific date
const isScheduledForDate = (habit, dateStr) => {
  if (!habit.recurrence || habit.recurrence.type === 'daily') return true;
  if (habit.recurrence.type === 'weekdays') {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[d.getDay()];
    return habit.recurrence.weekdays.includes(dayName);
  }
  return true;
};

// Helper to calculate consecutive day streak
const calculateStreak = (habit) => {
  let streak = 0;
  let daysAgo;
  
  const checkCompletion = (days) => {
    const dateStr = getPastDateString(days);
    return isHabitCompleted(habit, dateStr);
  };

  // Check if completed today. If not, check yesterday.
  if (checkCompletion(0)) {
    streak = 1;
    daysAgo = 1;
    while (checkCompletion(daysAgo)) {
      streak++;
      daysAgo++;
    }
  } else if (checkCompletion(1)) {
    // If not completed today, but completed yesterday, streak is still active
    streak = 1;
    daysAgo = 2;
    while (checkCompletion(daysAgo)) {
      streak++;
      daysAgo++;
    }
  }
  return streak;
};

export const AppProvider = ({ children }) => {
  // Global Selected Date (Starts at today's local date)
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRealUser = user && user.id !== 'guest';

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sleekhabits_theme') || 'light';
  });

  // Sound state
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return localStorage.getItem('sleekhabits_sound') !== 'false';
  });

  // Apply theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sleekhabits_theme', theme);
  }, [theme]);

  // Persist sound state
  useEffect(() => {
    localStorage.setItem('sleekhabits_sound', isSoundEnabled ? 'true' : 'false');
  }, [isSoundEnabled]);

  // Play synthesized Web Audio click sound
  const playClickSound = () => {
    if (!isSoundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  // Load state from LocalStorage or initialize with premium mock data
  const [habits, setHabits] = useState(() => {
    const migrated = localStorage.getItem('sleekhabits_migrated_v2');
    if (migrated) {
      const local = localStorage.getItem('sleekhabits_habits_v2');
      if (local) return JSON.parse(local);
    }
    
    // Initial habits list
    return [
      {
        id: 'h1',
        name: 'Morning Meditation',
        category: 'Mindfulness',
        isProgressType: true,
        targetValue: 15,
        unit: 'min',
        recurrence: { type: 'daily', weekdays: [] },
        reminderTime: null,
        history: {
          [getPastDateString(0)]: 15,
          [getPastDateString(1)]: 15,
          [getPastDateString(2)]: 15,
          [getPastDateString(3)]: 15,
          [getPastDateString(4)]: 0,
          [getPastDateString(5)]: 15,
          [getPastDateString(6)]: 15,
        }
      },
      {
        id: 'h2',
        name: 'Hydrate Water',
        category: 'Health',
        isProgressType: true,
        targetValue: 3000,
        unit: 'ml',
        recurrence: { type: 'daily', weekdays: [] },
        reminderTime: '08:00',
        history: {
          [getPastDateString(0)]: 1500,
          [getPastDateString(1)]: 3000,
          [getPastDateString(2)]: 3000,
          [getPastDateString(3)]: 3000,
          [getPastDateString(4)]: 1000,
          [getPastDateString(5)]: 3000,
          [getPastDateString(6)]: 3000,
        }
      },
      {
        id: 'h3',
        name: 'Outdoor Run / Cardio',
        category: 'Fitness',
        isProgressType: true,
        targetValue: 30,
        unit: 'min',
        recurrence: { type: 'weekdays', weekdays: ['Mon', 'Wed', 'Fri'] },
        reminderTime: '07:30',
        history: {
          [getPastDateString(0)]: 0,
          [getPastDateString(1)]: 30, // Wednesday
          [getPastDateString(2)]: 0, // Tuesday
          [getPastDateString(3)]: 30, // Monday
          [getPastDateString(4)]: 0,
          [getPastDateString(5)]: 0,
          [getPastDateString(6)]: 30, // Friday
        }
      },
      {
        id: 'h4',
        name: 'Read 20 Pages',
        category: 'Education',
        isProgressType: true,
        targetValue: 20,
        unit: 'p',
        recurrence: { type: 'daily', weekdays: [] },
        reminderTime: '22:00',
        history: {
          [getPastDateString(0)]: 20,
          [getPastDateString(1)]: 20,
          [getPastDateString(2)]: 20,
          [getPastDateString(3)]: 20,
          [getPastDateString(4)]: 0,
          [getPastDateString(5)]: 10,
          [getPastDateString(6)]: 20,
        }
      },
      {
        id: 'h5',
        name: 'No Sugar Diet',
        category: 'Nutrition',
        isProgressType: true,
        targetValue: 3,
        unit: 'meals',
        recurrence: { type: 'daily', weekdays: [] },
        reminderTime: '21:00',
        history: {
          [getPastDateString(0)]: 3,
          [getPastDateString(1)]: 0,
          [getPastDateString(2)]: 3,
          [getPastDateString(3)]: 3,
          [getPastDateString(4)]: 3,
          [getPastDateString(5)]: 3,
          [getPastDateString(6)]: 3,
        }
      }
    ];
  });

  const [focus, setFocus] = useState(() => {
    const local = localStorage.getItem('sleekhabits_focus');
    if (local) return JSON.parse(local);
    
    // Initial focus logs (in minutes, target is 120 minutes) for 28 days
    const mockFocus = {};
    const focusValues = [75, 120, 100, 50, 150, 75, 120, 90, 110, 130, 45, 120, 80, 140, 115, 60, 100, 125, 90, 75, 120, 110, 95, 120, 60, 130, 110, 85];
    for (let i = 0; i < 28; i++) {
      mockFocus[getPastDateString(i)] = focusValues[i % focusValues.length];
    }
    return mockFocus;
  });

  const [sleep, setSleep] = useState(() => {
    const local = localStorage.getItem('sleekhabits_sleep') || localStorage.getItem('asklepios_sleep');
    if (local) return JSON.parse(local);

    // Initial sleep log (for heatmap: 28 days - 4 weeks of data)
    const mockSleep = {};
    const sleepValues = [7.5, 6, 8, 4.5, 9, 8.2, 5.5, 7.8, 6.2, 8.5, 7, 4, 8, 9.2, 8, 7.6, 6.4, 5, 8.2, 7.8, 4.5, 7, 8.5, 9, 6.2, 8, 7.4, 8.1];
    for (let i = 0; i < 28; i++) {
      mockSleep[getPastDateString(i)] = sleepValues[i % sleepValues.length];
    }
    return mockSleep;
  });

  const [moodEnergy, setMoodEnergy] = useState(() => {
    const local = localStorage.getItem('sleekhabits_moodenergy');
    if (local) return JSON.parse(local);

    // Initial mood/energy ratings (1-5 scale) for past 28 days
    const mockRatings = {};
    const values = [4, 5, 3, 2, 4, 5, 4, 3, 4, 5, 4, 2, 3, 4, 5, 4, 3, 2, 4, 5, 3, 4, 5, 4, 3, 4, 4, 5];
    for (let i = 0; i < 28; i++) {
      mockRatings[getPastDateString(i)] = values[i % values.length];
    }
    return mockRatings;
  });

  const [goals, setGoals] = useState(() => {
    const local = localStorage.getItem('sleekhabits_goals_v2') || localStorage.getItem('asklepios_goals');
    if (local) return JSON.parse(local);

    // Initial goals and their subtasks
    return [
      {
        id: 'g1',
        title: 'Run a Half Marathon',
        category: 'Fitness',
        targetDate: '2026-09-15',
        linkedHabitId: 'h3', // Linked to Outdoor Run / Cardio
        subtasks: [
          { id: 'g1-s1', text: 'Buy professional running shoes', completed: true },
          { id: 'g1-s2', text: 'Complete a 5K training run', completed: true },
          { id: 'g1-s3', text: 'Run 10K under 60 minutes', completed: false },
          { id: 'g1-s4', text: 'Run 15K endurance pacing', completed: false }
        ]
      },
      {
        id: 'g2',
        title: 'Build a Personal Brand Website',
        category: 'Career',
        targetDate: '2026-07-30',
        linkedHabitId: null,
        subtasks: [
          { id: 'g2-s1', text: 'Draft portfolio design wireframes', completed: true },
          { id: 'g2-s2', text: 'Code React frontend structure', completed: false },
          { id: 'g2-s3', text: 'Deploy to Vercel/Netlify', completed: false }
        ]
      }
    ];
  });

  // Fetch remote user data from Supabase
  const fetchUserData = async (currentUser) => {
    if (!currentUser) return;
    if (currentUser.id === 'guest') {
      loadGuestData();
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch habits
      let { data: habitsData, error: habitsErr } = await supabase
        .from('habits')
        .select('*');
        
      if (habitsErr) throw habitsErr;

      // Seed default habits for a brand new user
      if (!habitsData || habitsData.length === 0) {
        const defaultHabitsToSeed = [
          {
            user_id: currentUser.id,
            name: 'Morning Meditation',
            category: 'Mindfulness',
            is_progress_type: true,
            target_value: 15,
            unit: 'min',
            recurrence_type: 'daily',
            weekdays: []
          },
          {
            user_id: currentUser.id,
            name: 'Hydrate Water',
            category: 'Health',
            is_progress_type: true,
            target_value: 3000,
            unit: 'ml',
            recurrence_type: 'daily',
            weekdays: [],
            reminder_time: '08:00'
          },
          {
            user_id: currentUser.id,
            name: 'Outdoor Run / Cardio',
            category: 'Fitness',
            is_progress_type: true,
            target_value: 30,
            unit: 'min',
            recurrence_type: 'weekdays',
            weekdays: ['Mon', 'Wed', 'Fri'],
            reminder_time: '07:30'
          },
          {
            user_id: currentUser.id,
            name: 'Read 20 Pages',
            category: 'Education',
            is_progress_type: true,
            target_value: 20,
            unit: 'p',
            recurrence_type: 'daily',
            weekdays: [],
            reminder_time: '22:00'
          },
          {
            user_id: currentUser.id,
            name: 'No Sugar Diet',
            category: 'Nutrition',
            is_progress_type: true,
            target_value: 3,
            unit: 'meals',
            recurrence_type: 'daily',
            weekdays: [],
            reminder_time: '21:00'
          }
        ];

        const { data: seededHabits, error: seedErr } = await supabase
          .from('habits')
          .insert(defaultHabitsToSeed)
          .select();

        if (seedErr) throw seedErr;
        habitsData = seededHabits || [];
      }

      // 2. Fetch history logs
      const { data: historyData, error: historyErr } = await supabase
        .from('habit_history')
        .select('*');
        
      if (historyErr) throw historyErr;

      // 3. Fetch focus logs
      const { data: focusData, error: focusErr } = await supabase
        .from('focus')
        .select('date, minutes');
        
      if (focusErr) throw focusErr;

      // 4. Fetch sleep logs
      const { data: sleepData, error: sleepErr } = await supabase
        .from('sleep')
        .select('date, hours');
        
      if (sleepErr) throw sleepErr;

      // 5. Fetch mood & energy logs
      const { data: moodData, error: moodErr } = await supabase
        .from('mood_energy')
        .select('date, score');
        
      if (moodErr) throw moodErr;

      // 6. Fetch goals
      const { data: goalsData, error: goalsErr } = await supabase
        .from('goals')
        .select('*');

      if (goalsErr) throw goalsErr;

      // 7. Fetch goal subtasks
      const { data: subtasksData, error: subtasksErr } = await supabase
        .from('goal_subtasks')
        .select('*');

      if (subtasksErr) throw subtasksErr;

      // Map history to context shape
      const habitsList = (habitsData || []).map(habit => {
        const historyObj = {};
        (historyData || [])
          .filter(log => log.habit_id === habit.id)
          .forEach(log => {
            historyObj[log.date] = habit.is_progress_type ? Number(log.progress) : (log.progress > 0);
          });
          
        return {
          id: habit.id,
          name: habit.name,
          category: habit.category,
          isProgressType: habit.is_progress_type,
          targetValue: habit.target_value,
          unit: habit.unit,
          recurrence: {
            type: habit.recurrence_type,
            weekdays: habit.weekdays || []
          },
          reminderTime: habit.reminder_time,
          isHidden: habit.is_hidden || false,
          history: historyObj
        };
      });
      setHabits(habitsList);

      // Map focus
      const focusMap = {};
      (focusData || []).forEach(row => { focusMap[row.date] = row.minutes; });
      setFocus(focusMap);

      // Map sleep
      const sleepMap = {};
      (sleepData || []).forEach(row => { sleepMap[row.date] = Number(row.hours); });
      setSleep(sleepMap);

      // Map mood & energy
      const moodMap = {};
      (moodData || []).forEach(row => { moodMap[row.date] = row.score; });
      setMoodEnergy(moodMap);

      // Map goals and subtasks
      const mappedGoals = (goalsData || []).map(goal => {
        const subtasks = (subtasksData || [])
          .filter(s => s.goal_id === goal.id)
          .map(s => ({
            id: s.id,
            text: s.text,
            completed: s.completed
          }));

        return {
          id: goal.id,
          title: goal.title,
          category: goal.category,
          targetDate: goal.target_date,
          linkedHabitId: goal.linked_habit_id,
          subtasks
        };
      });
      setGoals(mappedGoals);
    } catch (err) {
      console.error('Error fetching user data from Supabase:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load guest data from LocalStorage
  const loadGuestData = () => {
    // Habits
    const localHabits = localStorage.getItem('sleekhabits_habits_v2');
    if (localHabits) {
      setHabits(JSON.parse(localHabits));
    } else {
      setHabits([
        {
          id: 'h1',
          name: 'Morning Meditation',
          category: 'Mindfulness',
          isProgressType: true,
          targetValue: 15,
          unit: 'min',
          recurrence: { type: 'daily', weekdays: [] },
          reminderTime: null,
          history: {
            [getPastDateString(0)]: 15,
            [getPastDateString(1)]: 15,
            [getPastDateString(2)]: 15,
            [getPastDateString(3)]: 15,
            [getPastDateString(4)]: 0,
            [getPastDateString(5)]: 15,
            [getPastDateString(6)]: 15,
          }
        },
        {
          id: 'h2',
          name: 'Hydrate Water',
          category: 'Health',
          isProgressType: true,
          targetValue: 3000,
          unit: 'ml',
          recurrence: { type: 'daily', weekdays: [] },
          reminderTime: '08:00',
          history: {
            [getPastDateString(0)]: 1500,
            [getPastDateString(1)]: 3000,
            [getPastDateString(2)]: 3000,
            [getPastDateString(3)]: 3000,
            [getPastDateString(4)]: 1000,
            [getPastDateString(5)]: 3000,
            [getPastDateString(6)]: 3000,
          }
        },
        {
          id: 'h3',
          name: 'Outdoor Run / Cardio',
          category: 'Fitness',
          isProgressType: true,
          targetValue: 30,
          unit: 'min',
          recurrence: { type: 'weekdays', weekdays: ['Mon', 'Wed', 'Fri'] },
          reminderTime: '07:30',
          history: {
            [getPastDateString(0)]: 0,
            [getPastDateString(1)]: 30,
            [getPastDateString(2)]: 0,
            [getPastDateString(3)]: 30,
            [getPastDateString(4)]: 0,
            [getPastDateString(5)]: 0,
            [getPastDateString(6)]: 30,
          }
        },
        {
          id: 'h4',
          name: 'Read 20 Pages',
          category: 'Education',
          isProgressType: true,
          targetValue: 20,
          unit: 'p',
          recurrence: { type: 'daily', weekdays: [] },
          reminderTime: '22:00',
          history: {
            [getPastDateString(0)]: 20,
            [getPastDateString(1)]: 20,
            [getPastDateString(2)]: 20,
            [getPastDateString(3)]: 20,
            [getPastDateString(4)]: 0,
            [getPastDateString(5)]: 10,
            [getPastDateString(6)]: 20,
          }
        },
        {
          id: 'h5',
          name: 'No Sugar Diet',
          category: 'Nutrition',
          isProgressType: true,
          targetValue: 3,
          unit: 'meals',
          recurrence: { type: 'daily', weekdays: [] },
          reminderTime: '21:00',
          history: {
            [getPastDateString(0)]: 3,
            [getPastDateString(1)]: 0,
            [getPastDateString(2)]: 3,
            [getPastDateString(3)]: 3,
            [getPastDateString(4)]: 3,
            [getPastDateString(5)]: 3,
            [getPastDateString(6)]: 3,
          }
        }
      ]);
    }

    // Focus
    const localFocus = localStorage.getItem('sleekhabits_focus');
    if (localFocus) {
      setFocus(JSON.parse(localFocus));
    } else {
      const mockFocus = {};
      const focusValues = [75, 120, 100, 50, 150, 75, 120, 90, 110, 130, 45, 120, 80, 140, 115, 60, 100, 125, 90, 75, 120, 110, 95, 120, 60, 130, 110, 85];
      for (let i = 0; i < 28; i++) {
        mockFocus[getPastDateString(i)] = focusValues[i % focusValues.length];
      }
      setFocus(mockFocus);
    }

    // Sleep
    const localSleep = localStorage.getItem('sleekhabits_sleep');
    if (localSleep) {
      setSleep(JSON.parse(localSleep));
    } else {
      const mockSleep = {};
      const sleepValues = [7.5, 6, 8, 4.5, 9, 8.2, 5.5, 7.8, 6.2, 8.5, 7, 4, 8, 9.2, 8, 7.6, 6.4, 5, 8.2, 7.8, 4.5, 7, 8.5, 9, 6.2, 8, 7.4, 8.1];
      for (let i = 0; i < 28; i++) {
        mockSleep[getPastDateString(i)] = sleepValues[i % sleepValues.length];
      }
      setSleep(mockSleep);
    }

    // Mood Energy
    const localMood = localStorage.getItem('sleekhabits_moodenergy');
    if (localMood) {
      setMoodEnergy(JSON.parse(localMood));
    } else {
      const mockRatings = {};
      const values = [4, 5, 3, 2, 4, 5, 4, 3, 4, 5, 4, 2, 3, 4, 5, 4, 3, 2, 4, 5, 3, 4, 5, 4, 3, 4, 4, 5];
      for (let i = 0; i < 28; i++) {
        mockRatings[getPastDateString(i)] = values[i % values.length];
      }
      setMoodEnergy(mockRatings);
    }

    // Goals
    const localGoals = localStorage.getItem('sleekhabits_goals_v2');
    if (localGoals) {
      setGoals(JSON.parse(localGoals));
    } else {
      setGoals([
        {
          id: 'g1',
          title: 'Run a Half Marathon',
          category: 'Fitness',
          targetDate: '2026-09-15',
          linkedHabitId: 'h3',
          subtasks: [
            { id: 'g1-s1', text: 'Buy professional running shoes', completed: true },
            { id: 'g1-s2', text: 'Complete a 5K training run', completed: true },
            { id: 'g1-s3', text: 'Run 10K under 60 minutes', completed: false },
            { id: 'g1-s4', text: 'Run 15K endurance pacing', completed: false }
          ]
        },
        {
          id: 'g2',
          title: 'Build a Personal Brand Website',
          category: 'Career',
          targetDate: '2026-07-30',
          linkedHabitId: null,
          subtasks: [
            { id: 'g2-s1', text: 'Draft portfolio design wireframes', completed: true },
            { id: 'g2-s2', text: 'Code React frontend structure', completed: false },
            { id: 'g2-s3', text: 'Deploy to Vercel/Netlify', completed: false }
          ]
        }
      ]);
    }
  };

  // Monitor Auth Changes
  useEffect(() => {
    // Initial fetch of active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser);
      } else {
        loadGuestData();
        setLoading(false);
      }
    });

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser);
      } else {
        loadGuestData();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Google OAuth Login
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error logging in:', error.message);
  };

  // Logout
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
  };

  const startGuestSession = () => {
    setUser({
      id: 'guest',
      email: 'guest@sleekhabits.app',
      user_metadata: {
        full_name: 'Guest Explorer',
        avatar_url: null
      }
    });
    loadGuestData();
  };

  // Sync to local storage
  useEffect(() => {
    if (!user || user.id === 'guest') {
      localStorage.setItem('sleekhabits_habits_v2', JSON.stringify(habits));
      localStorage.setItem('sleekhabits_migrated_v2', 'true');
    }
  }, [habits, user]);

  useEffect(() => {
    if (!user || user.id === 'guest') {
      localStorage.setItem('sleekhabits_focus', JSON.stringify(focus));
    }
  }, [focus, user]);

  useEffect(() => {
    if (!user || user.id === 'guest') {
      localStorage.setItem('sleekhabits_sleep', JSON.stringify(sleep));
    }
  }, [sleep, user]);

  useEffect(() => {
    if (!user || user.id === 'guest') {
      localStorage.setItem('sleekhabits_moodenergy', JSON.stringify(moodEnergy));
    }
  }, [moodEnergy, user]);

  useEffect(() => {
    if (!user || user.id === 'guest') {
      localStorage.setItem('sleekhabits_goals_v2', JSON.stringify(goals));
    }
  }, [goals, user]);

  // Request notifications permission helper
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Background timer for habit reminders
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5); // "HH:MM"
      const todayStr = now.toISOString().split('T')[0];

      habits.forEach(h => {
        if (h.reminderTime === currentHHMM) {
          const isCompleted = isHabitCompleted(h, todayStr);
          const notificationKey = `sleekhabits_notified_${h.id}_${todayStr}`;
          
          if (!isCompleted && !localStorage.getItem(notificationKey)) {
            new Notification("SleekHabits Reminder", {
              body: `Time for your habit: ${h.name}!`,
              icon: '/favicon.svg'
            });
            localStorage.setItem(notificationKey, 'true');
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [habits]);

  // Habit completion actions
  const toggleHabit = async (habitId, date) => {
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const currentVal = targetHabit.history[date] || 0;
    let nextVal;
    if (targetHabit.isProgressType) {
      const target = targetHabit.targetValue || 1;
      nextVal = currentVal >= target ? 0 : target;
    } else {
      nextVal = !currentVal ? 1 : 0;
    }

    setHabits(prev => {
      const nextHabits = prev.map(habit => {
        if (habit.id === habitId) {
          const history = { ...habit.history };
          if (habit.isProgressType) {
            history[date] = nextVal;
          } else {
            history[date] = nextVal > 0;
          }
          return { ...habit, history };
        }
        return habit;
      });

      // Confetti logic: check if this completes the schedule for the day
      const scheduled = nextHabits.filter(h => isScheduledForDate(h, date));
      if (scheduled.length > 0) {
        const allCompleted = scheduled.every(h => isHabitCompleted(h, date));
        const previouslyCompleted = prev.filter(h => isScheduledForDate(h, date)).every(h => isHabitCompleted(h, date));
        if (allCompleted && !previouslyCompleted) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#0066FF', '#FF4B55', '#10B981']
          });
        }
      }

      return nextHabits;
    });

    if (isRealUser) {
      const { error } = await supabase
        .from('habit_history')
        .upsert({
          habit_id: habitId,
          user_id: user.id,
          date: date,
          progress: nextVal
        }, { onConflict: 'habit_id, date' });
      if (error) console.error('Error toggling habit:', error.message);
    }
  };

  const changeHabitProgress = async (habitId, date, delta) => {
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const currentVal = targetHabit.history[date] || 0;
    const nextVal = Math.max(0, currentVal + delta);

    setHabits(prev => {
      const nextHabits = prev.map(habit => {
        if (habit.id === habitId) {
          const history = { ...habit.history };
          history[date] = nextVal;
          return { ...habit, history };
        }
        return habit;
      });

      // Confetti logic: check if this completes the schedule for the day
      const scheduled = nextHabits.filter(h => isScheduledForDate(h, date));
      if (scheduled.length > 0) {
        const allCompleted = scheduled.every(h => isHabitCompleted(h, date));
        const previouslyCompleted = prev.filter(h => isScheduledForDate(h, date)).every(h => isHabitCompleted(h, date));
        if (allCompleted && !previouslyCompleted) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#0066FF', '#FF4B55', '#10B981']
          });
        }
      }

      return nextHabits;
    });

    if (isRealUser) {
      const { error } = await supabase
        .from('habit_history')
        .upsert({
          habit_id: habitId,
          user_id: user.id,
          date: date,
          progress: nextVal
        }, { onConflict: 'habit_id, date' });
      if (error) console.error('Error changing habit progress:', error.message);
    }
  };

  const addNewHabit = async (name, category, isProgressType = false, targetValue = 1, unit = '', recurrenceType = 'daily', weekdays = [], reminderTime = null) => {
    if (habits.length >= 10) return;

    if (isRealUser) {
      const newHabitData = {
        user_id: user.id,
        name,
        category,
        is_progress_type: isProgressType,
        target_value: isProgressType ? parseInt(targetValue) || 1 : 1,
        unit: isProgressType ? unit : '',
        recurrence_type: recurrenceType,
        weekdays: recurrenceType === 'weekdays' ? weekdays : [],
        reminder_time: reminderTime || null,
        is_hidden: false
      };

      const { data, error } = await supabase
        .from('habits')
        .insert(newHabitData)
        .select()
        .single();

      if (error) {
        console.error('Error adding new habit:', error.message);
        return;
      }

      if (data) {
        const newHabit = {
          id: data.id,
          name: data.name,
          category: data.category,
          isProgressType: data.is_progress_type,
          targetValue: data.target_value,
          unit: data.unit,
          recurrence: {
            type: data.recurrence_type,
            weekdays: data.weekdays || []
          },
          reminderTime: data.reminder_time,
          isHidden: false,
          history: {}
        };
        setHabits(prev => [...prev, newHabit]);
      }
    } else {
      const newHabit = {
        id: `h-${Date.now()}`,
        name,
        category,
        isProgressType,
        targetValue: isProgressType ? parseInt(targetValue) || 1 : 1,
        unit: isProgressType ? unit : '',
        recurrence: {
          type: recurrenceType,
          weekdays: recurrenceType === 'weekdays' ? weekdays : []
        },
        reminderTime: reminderTime || null,
        isHidden: false,
        history: {
          [selectedDate]: isProgressType ? 0 : false
        }
      };
      setHabits(prev => [...prev, newHabit]);
    }
  };

  const deleteHabit = async (habitId) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, isHidden: true } : h));

    if (isRealUser) {
      const { error } = await supabase
        .from('habits')
        .update({ is_hidden: true })
        .eq('id', habitId);
      if (error) console.error('Error soft deleting habit:', error.message);
    }
  };

  const restoreHabit = async (habitId) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, isHidden: false } : h));

    if (isRealUser) {
      const { error } = await supabase
        .from('habits')
        .update({ is_hidden: false })
        .eq('id', habitId);
      if (error) console.error('Error restoring habit:', error.message);
    }
  };

  const deleteHabitPermanently = async (habitId) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));

    if (isRealUser) {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
      if (error) console.error('Error permanently deleting habit:', error.message);
    }
  };

  // Focus Actions
  const changeFocus = async (date, amount) => {
    const current = focus[date] || 0;
    const next = Math.max(0, current + amount);
    setFocus(prev => ({ ...prev, [date]: next }));

    if (isRealUser) {
      const { error } = await supabase
        .from('focus')
        .upsert({
          user_id: user.id,
          date: date,
          minutes: next
        }, { onConflict: 'user_id, date' });
      if (error) console.error('Error syncing focus:', error.message);
    }
  };

  // Sleep Actions
  const updateSleepLog = async (date, hours) => {
    const parsedHours = parseFloat(hours) || 0;
    setSleep(prev => ({ ...prev, [date]: parsedHours }));

    if (isRealUser) {
      const { error } = await supabase
        .from('sleep')
        .upsert({
          user_id: user.id,
          date: date,
          hours: parsedHours
        }, { onConflict: 'user_id, date' });
      if (error) console.error('Error syncing sleep:', error.message);
    }
  };

  // Mood & Energy Actions
  const updateMoodEnergy = async (date, score) => {
    const parsedScore = parseInt(score) || 3;
    setMoodEnergy(prev => ({ ...prev, [date]: parsedScore }));

    if (isRealUser) {
      const { error } = await supabase
        .from('mood_energy')
        .upsert({
          user_id: user.id,
          date: date,
          score: parsedScore
        }, { onConflict: 'user_id, date' });
      if (error) console.error('Error syncing mood energy:', error.message);
    }
  };

  // Goals Actions
  const addGoal = async (title, category, targetDate, subtaskTexts, linkedHabitId = null) => {
    if (isRealUser) {
      const { data: goalData, error: goalErr } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          category,
          target_date: targetDate,
          linked_habit_id: linkedHabitId || null
        })
        .select()
        .single();

      if (goalErr) {
        console.error('Error adding goal:', goalErr.message);
        return;
      }

      let subtasksList = [];
      if (subtaskTexts && subtaskTexts.length > 0) {
        const subtasksData = subtaskTexts.map(text => ({
          goal_id: goalData.id,
          user_id: user.id,
          text,
          completed: false
        }));

        const { data: subtasksResult, error: subtasksErr } = await supabase
          .from('goal_subtasks')
          .insert(subtasksData)
          .select();

        if (subtasksErr) {
          console.error('Error adding goal subtasks:', subtasksErr.message);
        } else if (subtasksResult) {
          subtasksList = subtasksResult.map(s => ({
            id: s.id,
            text: s.text,
            completed: s.completed
          }));
        }
      }

      const newGoal = {
        id: goalData.id,
        title: goalData.title,
        category: goalData.category,
        targetDate: goalData.target_date,
        linkedHabitId: goalData.linked_habit_id,
        subtasks: subtasksList
      };
      setGoals(prev => [...prev, newGoal]);
    } else {
      const newGoal = {
        id: `g-${Date.now()}`,
        title,
        category,
        targetDate,
        linkedHabitId: linkedHabitId || null,
        subtasks: subtaskTexts.map((text, index) => ({
          id: `g-${Date.now()}-s-${index}`,
          text,
          completed: false
        }))
      };
      setGoals(prev => [...prev, newGoal]);
    }
  };

  const toggleSubtask = async (goalId, subtaskId) => {
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;
    const targetSubtask = targetGoal.subtasks.find(s => s.id === subtaskId);
    if (!targetSubtask) return;
    const nextCompleted = !targetSubtask.completed;

    setGoals(prev => {
      const nextGoals = prev.map(goal => {
        if (goal.id === goalId) {
          const subtasks = goal.subtasks.map(task => {
            if (task.id === subtaskId) {
              return { ...task, completed: nextCompleted };
            }
            return task;
          });
          return { ...goal, subtasks };
        }
        return goal;
      });

      // Confetti logic: check if this completes the goal
      const originalGoal = prev.find(g => g.id === goalId);
      const updatedGoal = nextGoals.find(g => g.id === goalId);
      if (originalGoal && updatedGoal && updatedGoal.subtasks.length > 0) {
        const wasCompleted = originalGoal.subtasks.every(s => s.completed);
        const isNowCompleted = updatedGoal.subtasks.every(s => s.completed);
        if (isNowCompleted && !wasCompleted) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#0066FF', '#FF4B55', '#10B981']
          });
        }
      }

      return nextGoals;
    });

    if (isRealUser) {
      const { error } = await supabase
        .from('goal_subtasks')
        .update({ completed: nextCompleted })
        .eq('id', subtaskId);
      if (error) console.error('Error toggling subtask:', error.message);
    }
  };

  const deleteGoal = async (goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));

    if (isRealUser) {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      if (error) console.error('Error deleting goal:', error.message);
    }
  };

  // Dynamic XP and Badges calculation
  const getXPAndBadges = () => {
    // 1. Habits XP (15 XP per completion)
    let habitCompletions = 0;
    habits.forEach(h => {
      Object.keys(h.history || {}).forEach(date => {
        if (isHabitCompleted(h, date)) {
          habitCompletions++;
        }
      });
    });
    const habitXP = habitCompletions * 15;

    // 2. Focus XP (1 XP per minute logged)
    let totalFocusMins = 0;
    Object.values(focus || {}).forEach(m => {
      totalFocusMins += Number(m) || 0;
    });
    const focusXP = totalFocusMins * 1;

    // 3. Sleep XP (5 XP per sleep hour logged)
    let totalSleepHours = 0;
    Object.values(sleep || {}).forEach(h => {
      totalSleepHours += Number(h) || 0;
    });
    const sleepXP = Math.round(totalSleepHours * 5);

    // 4. Goals and Subtasks XP (100 XP per completed goal, 20 XP per completed subtask)
    let completedSubtasks = 0;
    let completedGoals = 0;
    goals.forEach(g => {
      const totalSub = g.subtasks.length;
      const completedSub = g.subtasks.filter(s => s.completed).length;
      completedSubtasks += completedSub;
      if (totalSub > 0 && completedSub === totalSub) {
        completedGoals++;
      }
    });
    const goalXP = (completedSubtasks * 20) + (completedGoals * 100);

    const totalXP = habitXP + focusXP + sleepXP + goalXP;
    
    // Level calculations (300 XP per level)
    const level = Math.floor(totalXP / 300) + 1;
    const xpInLevel = totalXP % 300;
    const xpNeeded = 300;
    const progressPercentage = Math.round((xpInLevel / xpNeeded) * 100);

    const xpDetails = {
      totalXP,
      level,
      xpInLevel,
      xpNeeded,
      progressPercentage
    };

    // 5. Badges details & unlock checks
    
    // Badge 1: Mindfulness Monk (7-day completion streak on a mindfulness habit)
    const mindfulnessHabits = habits.filter(h => h.category === 'Mindfulness');
    const maxMindfulnessStreak = mindfulnessHabits.reduce((max, h) => {
      const streak = calculateStreak(h);
      return streak > max ? streak : max;
    }, 0);
    const mindfulnessUnlocked = maxMindfulnessStreak >= 7;

    // Badge 2: Deep Flow Wizard (120+ focus minutes in a single day)
    const maxFocusDay = Math.max(...Object.values(focus || {}).map(Number), 0);
    const flowWizardUnlocked = maxFocusDay >= 120;

    // Badge 3: Consistent King (Completed all scheduled habits on at least 3 separate days)
    const allLoggedDates = new Set();
    habits.forEach(h => {
      Object.keys(h.history || {}).forEach(date => allLoggedDates.add(date));
    });
    let allScheduledCompletedDays = 0;
    allLoggedDates.forEach(date => {
      const scheduled = habits.filter(h => isScheduledForDate(h, date) && !h.isHidden);
      if (scheduled.length > 0) {
        const allCompleted = scheduled.every(h => isHabitCompleted(h, date));
        if (allCompleted) {
          allScheduledCompletedDays++;
        }
      }
    });
    const consistentKingUnlocked = allScheduledCompletedDays >= 3;

    // Badge 4: Healthy Sleeper (Logged 8+ sleep hours on 5+ days)
    const sleep8PlusDays = Object.values(sleep || {}).filter(hrs => Number(hrs) >= 8).length;
    const healthySleeperUnlocked = sleep8PlusDays >= 5;

    // Badge 5: Goal Crusher (Completed at least 1 goal)
    const goalCrusherUnlocked = completedGoals >= 1;

    const badges = [
      {
        id: 'mindfulness_monk',
        name: 'Mindfulness Monk',
        description: 'Achieve a 7-day completion streak on any Mindfulness habit.',
        isUnlocked: mindfulnessUnlocked,
        progressText: `${maxMindfulnessStreak}/7 days`,
        iconType: 'monk'
      },
      {
        id: 'flow_wizard',
        name: 'Deep Flow Wizard',
        description: 'Complete 120+ minutes of deep focus in a single day.',
        isUnlocked: flowWizardUnlocked,
        progressText: `${maxFocusDay}/120 mins`,
        iconType: 'wizard'
      },
      {
        id: 'consistent_king',
        name: 'Consistent King',
        description: 'Check off all scheduled habits on 3 separate days.',
        isUnlocked: consistentKingUnlocked,
        progressText: `${allScheduledCompletedDays}/3 days`,
        iconType: 'king'
      },
      {
        id: 'healthy_sleeper',
        name: 'Healthy Sleeper',
        description: 'Log 8+ hours of deep, restful sleep on 5 different days.',
        isUnlocked: healthySleeperUnlocked,
        progressText: `${sleep8PlusDays}/5 days`,
        iconType: 'sleep'
      },
      {
        id: 'goal_crusher',
        name: 'Goal Crusher',
        description: 'Successfully complete a planner goal and all its subtasks.',
        isUnlocked: goalCrusherUnlocked,
        progressText: `${completedGoals}/1 goal`,
        iconType: 'target'
      }
    ];

    return { xpDetails, badges };
  };

  const { xpDetails, badges } = getXPAndBadges();

  return (
    <AppContext.Provider value={{
      selectedDate,
      setSelectedDate,
      todayStr,
      habits,
      xpDetails,
      badges,
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
      focus,
      changeFocus,
      sleep,
      updateSleepLog,
      moodEnergy,
      updateMoodEnergy,
      goals,
      addGoal,
      toggleSubtask,
      deleteGoal,
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
      startGuestSession
    }}>
      {children}
    </AppContext.Provider>
  );
};
