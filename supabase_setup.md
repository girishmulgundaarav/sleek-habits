# Supabase & Google Authentication Integration Guide

This document provides complete instructions for integrating your React Habit Tracker with Supabase and Google OAuth, including the exact SQL schemas, security rules, and code patterns.

---

## Part 1: Google OAuth & Supabase Project Setup

### 1. Google Cloud Console Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for and navigate to **APIs & Services** > **OAuth consent screen**.
4. Set the **User Type** to **External** and fill out the required app registration details.
5. In the next steps (Scopes and Test Users), proceed with defaults or add your email as a test user.
6. Navigate to **Credentials** in the left menu.
7. Click **+ Create Credentials** > **OAuth client ID**.
8. Select **Web application** as the Application type.
9. Under **Authorized JavaScript origins**, add your local dev URL:
   - `http://localhost:5173`
10. Under **Authorized redirect URIs**, add the callback URL provided by your Supabase project (see step below):
    - `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
11. Click **Create** and copy the generated **Client ID** and **Client Secret**.

### 2. Supabase Dashboard Configuration
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard/) and select your project.
2. Go to **Authentication** > **Providers** > **Google**.
3. Toggle the **Enable Google Provider** setting.
4. Input your **Google Client ID** and **Google Client Secret** from the previous step.
5. Copy the **Redirect URI** shown in the Supabase Google Provider panel and paste it into the Google Cloud Console's **Authorized redirect URIs** section (if not already done).
6. Under **Authentication** > **URL Configuration**, set the **Site URL** to `http://localhost:5173` (or your production deployment domain).

---

## Part 2: Database Schema & SQL Scripts

Navigate to the **SQL Editor** in your Supabase Dashboard, create a new query, and execute the following SQL script. This will create all required tables, configure automatic timestamps, and enable Row Level Security (RLS) policies.

```sql
-- =========================================================================
-- 1. TABLES CREATION
-- =========================================================================

-- Habits Table
CREATE TABLE public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_progress_type BOOLEAN NOT NULL DEFAULT false,
    target_value INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT '',
    recurrence_type TEXT NOT NULL DEFAULT 'daily',
    weekdays TEXT[] NOT NULL DEFAULT '{}',
    reminder_time TEXT, -- Stores format "HH:MM"
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit History (Daily Progress logs) Table
CREATE TABLE public.habit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    progress NUMERIC NOT NULL DEFAULT 0, -- Stores steps count, duration, or 1 for boolean tasks
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_habit_date UNIQUE (habit_id, date)
);

-- Focus & Deep Work Log Table
CREATE TABLE public.focus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_focus_date UNIQUE (user_id, date)
);

-- Sleep Log Table
CREATE TABLE public.sleep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_sleep_date UNIQUE (user_id, date)
);

-- Mood & Energy Log Table
CREATE TABLE public.mood_energy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    score INTEGER NOT NULL DEFAULT 3, -- 1-5 rating, default to 3 (Good)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_mood_energy_date UNIQUE (user_id, date)
);

-- Goals Table
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    target_date DATE NOT NULL,
    linked_habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goal Subtasks Table
CREATE TABLE public.goal_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Duplicated here for efficient RLS check
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_energy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_subtasks ENABLE ROW LEVEL SECURITY;

-- Habits Policies
CREATE POLICY "Users can manage their own habits" ON public.habits
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Habit History Policies
CREATE POLICY "Users can manage their own habit histories" ON public.habit_history
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Focus Policies
CREATE POLICY "Users can manage their own focus logs" ON public.focus
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sleep Policies
CREATE POLICY "Users can manage their own sleep logs" ON public.sleep
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mood & Energy Policies
CREATE POLICY "Users can manage their own mood & energy logs" ON public.mood_energy
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can manage their own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goal Subtasks Policies
CREATE POLICY "Users can manage their own goal subtasks" ON public.goal_subtasks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## Part 3: Frontend Integration Code Patterns

### 1. Install Supabase Client JS SDK
Install the official Javascript SDK in your workspace terminal:
```bash
npm install @supabase/supabase-js
```

### 2. Configure Client (`src/supabaseClient.js`)
Create a file at `src/supabaseClient.js` to establish connection. Use Vite env variables (`.env` file) to keep your project API keys safe.

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### `.env` File
Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Authentication Hooks (`src/context/AppContext.jsx`)
Here are the methods you will add to your context provider to manage the login state and authorize requests:

```javascript
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth changes on startup
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
  
  // Expose these states via your Provider value
}
```

### 4. Fetching & Writing Data
When the user is authenticated, query Supabase instead of local storage. Here is how your fetch hooks will load habits, focus, sleep, and mood & energy logs, mapping them correctly to your current state objects:

```javascript
// Example: Load data from Supabase
const fetchUserData = async () => {
  if (!user) return;
  
  // 1. Fetch habits
  const { data: habitsData, error: habitsErr } = await supabase
    .from('habits')
    .select('*');
    
  // 2. Fetch history logs
  const { data: historyData, error: historyErr } = await supabase
    .from('habit_history')
    .select('*');
    
  // 3. Fetch focus logs
  const { data: focusData, error: focusErr } = await supabase
    .from('focus')
    .select('date, minutes');
    
  // 4. Fetch sleep logs
  const { data: sleepData, error: sleepErr } = await supabase
    .from('sleep')
    .select('date, hours');

  // 5. Fetch mood & energy logs
  const { data: moodData, error: moodErr } = await supabase
    .from('mood_energy')
    .select('date, score');

  if (!habitsErr && !historyErr) {
    // Map history to context shape
    const habitsList = habitsData.map(habit => {
      const historyObj = {};
      historyData
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
          weekdays: habit.weekdays
        },
        reminderTime: habit.reminder_time,
        history: historyObj
      };
    });
    setHabits(habitsList);
  }

  // Map other metric states
  if (!focusErr && focusData) {
    const focusMap = {};
    focusData.forEach(row => { focusMap[row.date] = row.minutes; });
    setFocus(focusMap);
  }

  if (!sleepErr && sleepData) {
    const sleepMap = {};
    sleepData.forEach(row => { sleepMap[row.date] = Number(row.hours); });
    setSleep(sleepMap);
  }

  if (!moodErr && moodData) {
    const moodMap = {};
    moodData.forEach(row => { moodMap[row.date] = row.score; });
    setMoodEnergy(moodMap);
  }
};
```

```javascript
// Example: Write a checkmark toggle to Supabase
const toggleHabit = async (habitId, date) => {
  if (!user) return;
  
  const targetHabit = habits.find(h => h.id === habitId);
  const isCurrentlyCompleted = isHabitCompleted(targetHabit, date);
  const nextVal = targetHabit.isProgressType
    ? (isCurrentlyCompleted ? 0 : targetHabit.targetValue)
    : (isCurrentlyCompleted ? 0 : 1); // 0 = uncompleted, 1/targetValue = completed
    
  // Upsert history log
  const { error } = await supabase
    .from('habit_history')
    .upsert({
      habit_id: habitId,
      user_id: user.id,
      date: date,
      progress: nextVal
    }, { onConflict: 'habit_id, date' });

  if (!error) {
    // Update local state to avoid delay
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          history: { ...h.history, [date]: targetHabit.isProgressType ? nextVal : (nextVal > 0) }
        };
      }
      return h;
    }));
  }
};
```
