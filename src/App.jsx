import { useState, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Header from './components/Header';
import HabitList from './components/HabitList';
import Trackers from './components/Trackers';
import Activities from './components/Activities';
import GoalPlanner from './components/GoalPlanner';
import AnalysisPage from './components/AnalysisPage';
import LoginScreen from './components/LoginScreen';

function MainApp() {
  const { user, loading } = useContext(AppContext);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'goals', or 'analysis'

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-bg flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand-blue/15 border-t-brand-blue animate-spin" />
          <span className="text-[10px] font-extrabold text-brand-grey uppercase tracking-widest animate-pulse">
            Loading SleekHabits...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-canvas-bg text-text-main antialiased font-sans">
      {/* Container wrapper */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 flex flex-col gap-8">
        
        {/* Top Header section (Date toggle, Progress Ring, Views Selector) */}
        <Header currentView={currentView} setCurrentView={setCurrentView} />

        {/* Views Rendering */}
        <main className="w-full">
          {currentView === 'dashboard' ? (
            /* Dashboard Grid: Stacked sections of card rows */
            <div className="flex flex-col gap-8">
              {/* 3-Card Tracker Row (Hydration, Sleep Heatmap, Calories) */}
              <Trackers />
              
              {/* Daily Habits Grid (Multi-card checklist) */}
              <HabitList />
              
              {/* 2-Card Activity Row (Hiking & Biking unDraw Illustrations) */}
              <Activities />
            </div>
          ) : currentView === 'goals' ? (
            /* Goal Planner view */
            <GoalPlanner />
          ) : (
            /* Analysis view with Recharts */
            <AnalysisPage />
          )}
        </main>

        {/* Footer info */}
        <footer className="text-center py-6 border-t border-card-border-custom mt-8 text-[11px] font-bold text-text-muted uppercase tracking-wider">
          © 2026 SleekHabits • Personal Progress System
        </footer>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
