// Import SVG contents as raw strings using Vite's ?raw suffix loader
import hikingSvg from '../assets/svg/hiking.svg?raw';
import bikingSvg from '../assets/svg/biking.svg?raw';
import goalsSvg from '../assets/svg/goals.svg?raw';
import personalGoalsSvg from '../assets/svg/personalGoals.svg?raw';
import meditationSvg from '../assets/svg/meditation.svg?raw';
import healthyHabitSvg from '../assets/svg/healthyHabit.svg?raw';
import joggingSvg from '../assets/svg/jogging.svg?raw';
import readingSvg from '../assets/svg/reading.svg?raw';
import dietSvg from '../assets/svg/diet.svg?raw';

const illustrations = {
  hiking: hikingSvg,
  biking: bikingSvg,
  goals: goalsSvg,
  personalGoals: personalGoalsSvg,
  meditation: meditationSvg,
  healthyHabit: healthyHabitSvg,
  jogging: joggingSvg,
  reading: readingSvg,
  diet: dietSvg
};

export const UndrawIllustration = ({ 
  name, 
  primaryColor = '#0066FF', 
  className = 'w-full h-auto',
  style = {}
}) => {
  const rawSvg = illustrations[name];
  
  if (!rawSvg) {
    console.warn(`Illustration "${name}" not found.`);
    return null;
  }

  // Swap out the unDraw primary colors (both the var(--primary-svg-color) used in the repo and the default #6c5ce7)
  const processedSvg = rawSvg
    .replaceAll('var(--primary-svg-color)', primaryColor)
    .replaceAll('#6c5ce7', primaryColor);

  return (
    <div 
      className={className} 
      style={style}
      dangerouslySetInnerHTML={{ __html: processedSvg }} 
    />
  );
};

export default UndrawIllustration;
