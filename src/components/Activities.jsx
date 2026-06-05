import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { UndrawIllustration } from './UndrawIllustration';
import { Compass, Award } from 'lucide-react';

export const Activities = () => {
  const { selectedDate, updateMoodEnergy, playClickSound } = useContext(AppContext);
  const [activeLog, setActiveLog] = useState(null); // 'hiking' or 'biking' for micro-animation

  const logActivity = (type) => {
    playClickSound();
    updateMoodEnergy(selectedDate, 5); // Boost mood & energy to Peak (5)
    setActiveLog(type);
    setTimeout(() => {
      setActiveLog(null);
    }, 2500); // Animation timeout
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* HIKING ACTIVITY CARD */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 sm:p-6 flex flex-row items-center justify-between gap-4 sm:gap-6 transition-all hover:shadow-lg">
        {/* Text Details & Action */}
        <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[11px] text-brand-grey font-bold uppercase tracking-wider">
              Outdoor Activity
            </span>
            <span className="text-base sm:text-xl font-extrabold text-text-main tracking-tight mt-0.5 truncate">
              Mountain Hiking
            </span>
            <span className="text-[10px] sm:text-xs text-text-muted font-medium mt-0.5 sm:mt-1">
              Est. Boost: <strong className="text-brand-blue font-bold">Peak Energy & Focus</strong>
            </span>
          </div>

          <div>
            <button
              onClick={() => logActivity('hiking')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
                activeLog === 'hiking'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-brand-blue text-white hover:bg-opacity-95 shadow-md shadow-brand-blue/15 hover:shadow-lg active:scale-95'
              }`}
            >
              {activeLog === 'hiking' ? (
                <>
                  <Award className="w-3.5 h-3.5 animate-bounce" /> Vibe Boosted! (+5 Energy)
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Log Hiking
                </>
              )}
            </button>
          </div>
        </div>

        {/* Vector Asset with Color Swap */}
        <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-slate-50-custom rounded-2xl flex items-center justify-center p-1.5 sm:p-3 overflow-hidden shrink-0">
          <UndrawIllustration 
            name="hiking" 
            primaryColor="#0066FF" // Matches brand-blue
            className="w-full h-full scale-[1.1]" 
          />
        </div>
      </div>

      {/* BIKING ACTIVITY CARD */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 sm:p-6 flex flex-row items-center justify-between gap-4 sm:gap-6 transition-all hover:shadow-lg">
        {/* Text Details & Action */}
        <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[11px] text-brand-grey font-bold uppercase tracking-wider">
              Outdoor Activity
            </span>
            <span className="text-base sm:text-xl font-extrabold text-text-main tracking-tight mt-0.5 truncate">
              Road Cycling
            </span>
            <span className="text-[10px] sm:text-xs text-text-muted font-medium mt-0.5 sm:mt-1">
              Est. Boost: <strong className="text-brand-crimson font-bold">Endorphin Rush</strong>
            </span>
          </div>

          <div>
            <button
              onClick={() => logActivity('biking')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
                activeLog === 'biking'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-brand-crimson text-white hover:bg-opacity-95 shadow-md shadow-brand-crimson/15 hover:shadow-lg active:scale-95'
              }`}
            >
              {activeLog === 'biking' ? (
                <>
                  <Award className="w-3.5 h-3.5 animate-bounce" /> Vibe Boosted! (+5 Energy)
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Log Biking
                </>
              )}
            </button>
          </div>
        </div>

        {/* Vector Asset with Color Swap */}
        <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-slate-50-custom rounded-2xl flex items-center justify-center p-1.5 sm:p-3 overflow-hidden shrink-0">
          <UndrawIllustration 
            name="biking" 
            primaryColor="#FF4B55" // Cyclist uses brand-crimson accents
            className="w-full h-full scale-[1.05]" 
          />
        </div>
      </div>

    </div>
  );
};

export default Activities;
