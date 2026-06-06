import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { LogIn, CheckCircle, Brain, Moon, Award } from 'lucide-react';

export const LoginScreen = () => {
  const { signInWithGoogle, startGuestSession } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-canvas-bg flex flex-col items-center justify-center p-4 py-8 sm:py-12 relative overflow-y-auto transition-all duration-300">
      {/* Background ambient glow effects to feel premium */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-blue/10 dark:bg-brand-blue/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-crimson/10 dark:bg-brand-crimson/5 blur-[120px] pointer-events-none" />

      {/* Main glassmorphism card container */}
      <div className="w-full max-w-md bg-card-bg border border-card-border-custom shadow-card rounded-card p-6 sm:p-10 flex flex-col items-center text-center relative z-10 transition-all duration-300 my-auto">
        
        {/* Brand Typographic Logo */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 select-none">
          <div className="flex items-center text-3xl sm:text-4xl font-black tracking-tight">
            <span className="text-slate-800 dark:text-slate-100">Sleek</span>
            <span className="text-brand-blue">Habits</span>
            <span className="text-brand-crimson font-black">.</span>
          </div>
          <span className="text-[9px] text-brand-grey font-extrabold tracking-widest uppercase mt-1">
            Personal Progress System
          </span>
        </div>

        {/* Welcome Text */}
        <p className="text-xs text-text-muted font-bold mb-6 sm:mb-8 max-w-[280px] leading-relaxed uppercase tracking-wider">
          Log in with Google to synchronize your habits, deep work focus sessions, and targets.
        </p>

        {/* System Features Highlights Showcase */}
        <div className="w-full flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 text-left bg-slate-50-custom dark:bg-slate-800/30 p-4 sm:p-5 rounded-2xl border border-card-border-custom/40">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-text-main">Habits & Completion Streaks</h4>
              <p className="text-[10px] text-text-muted mt-0.5 font-medium">Define custom progress targets and follow automated weekly recurrence schedules.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Brain className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-text-main">Pomodoro Focus Timer</h4>
              <p className="text-[10px] text-text-muted mt-0.5 font-medium">Log deep work sessions with visual circular progress timer count widgets.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Moon className="w-4 h-4 text-brand-crimson mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-text-main">Sleep & Mood Trend charts</h4>
              <p className="text-[10px] text-text-muted mt-0.5 font-medium">Analyze sleep schedules and daily productivity levels through trendlines.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-text-main">Interactive Goal Planner</h4>
              <p className="text-[10px] text-text-muted mt-0.5 font-medium">Break down major milestones into structured subtasks linked to active habits.</p>
            </div>
          </div>
        </div>

        {/* Premium Google OAuth Login Button */}
        <button
          onClick={signInWithGoogle}
          className="w-full py-3.5 bg-brand-blue hover:bg-opacity-95 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-3 transition-all active:scale-98 shadow-md shadow-brand-blue/15 hover:shadow-brand-blue/20"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google</span>
        </button>

        {/* Guest Session Button */}
        <button
          onClick={startGuestSession}
          className="w-full mt-3 py-3.5 bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30 text-text-muted hover:text-text-main border border-card-border-custom font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer flex items-center justify-center gap-3 transition-all active:scale-98"
        >
          <span>Continue as Guest</span>
        </button>

        {/* Footer */}
        <span className="text-[8px] text-brand-grey font-black uppercase tracking-widest mt-6 sm:mt-8 select-none">
          Secured with Supabase auth
        </span>
      </div>
    </div>
  );
};

export default LoginScreen;
