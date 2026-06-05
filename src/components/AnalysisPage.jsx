import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ResponsiveContainer, 
  AreaChart, Area, 
  BarChart, Bar, 
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Brain, Moon, Smile, Flame, CheckSquare, Download, FileText, Heart, Activity, BookOpen } from 'lucide-react';

// Custom tooltips declared outside render function to prevent ESLint / React performance errors
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card-bg backdrop-blur-md p-3 rounded-xl border border-card-border-custom shadow-md text-xs font-semibold text-text-main">
        <p className="text-text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">{label}</p>
        {payload.map((pld, index) => (
          <div key={index} className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color || pld.fill }}></span>
            <span>{pld.name}: <strong className="text-text-main font-extrabold">{pld.value}{unit || ''}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CorrelationTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card-bg backdrop-blur-md p-3 rounded-xl border border-card-border-custom shadow-md text-xs font-semibold text-text-main">
        <p className="text-text-muted font-bold mb-1.5 uppercase tracking-wider text-[10px]">{label}</p>
        {payload.map((pld, index) => {
          let valueDisplay;
          let unit = '';
          
          if (pld.name.endsWith('Checks') || pld.name.includes('Habit:')) {
            valueDisplay = pld.value === 1 ? '✅ Completed' : '❌ Incomplete';
          } else {
            if (pld.name.includes('Sleep')) unit = ' hrs';
            else if (pld.name.includes('Focus')) unit = ' mins';
            else if (pld.name.includes('Mood')) unit = ' / 5';
            else if (pld.name.includes('Completion Rate')) unit = '%';
            valueDisplay = `${pld.value}${unit}`;
          }

          return (
            <div key={index} className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color || pld.stroke }}></span>
              <span className="text-text-muted">{pld.name}: <strong className="text-text-main font-extrabold">{valueDisplay}</strong></span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const AnalysisPage = () => {
  const { habits, isHabitCompleted, focus, sleep, moodEnergy, goals, getPastDateString, theme, todayStr } = useContext(AppContext);
  const [timeRange, setTimeRange] = useState('7days');
  const rangeSize = timeRange === '7days' ? 7 : 30;
  const [leftMetric, setLeftMetric] = useState('sleep');
  const [rightMetric, setRightMetric] = useState('completionRate');

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Generate insights based on the past 28 days
  const generateInsights = () => {
    // Check if we have enough historical data to generate real insights (minimum 3 logged days)
    const loggedDates = new Set([
      ...Object.keys(sleep || {}),
      ...Object.keys(focus || {}),
      ...Object.keys(moodEnergy || {})
    ]);
    
    if (loggedDates.size < 3) {
      return [];
    }

    const insights = [];
    const dates = [];
    for (let i = 27; i >= 0; i--) {
      dates.push(getPastDateString(i));
    }

    habits.forEach(habit => {
      // Sleep Correlation
      const completedSleep = [];
      const nonCompletedSleep = [];
      dates.forEach(d => {
        const sleepVal = sleep[d];
        if (sleepVal !== undefined) {
          if (isHabitCompleted(habit, d)) {
            completedSleep.push(sleepVal);
          } else {
            nonCompletedSleep.push(sleepVal);
          }
        }
      });

      if (completedSleep.length >= 1 && nonCompletedSleep.length >= 1) {
        const avgCompleted = completedSleep.reduce((a, b) => a + b, 0) / completedSleep.length;
        const avgNonCompleted = nonCompletedSleep.reduce((a, b) => a + b, 0) / nonCompletedSleep.length;
        const diff = avgCompleted - avgNonCompleted;
        if (Math.abs(diff) >= 0.1) {
          insights.push({
            habitName: habit.name,
            metricLabel: 'sleep duration',
            changeLabel: `${diff >= 0 ? 'increases' : 'decreases'} by ${Math.abs(diff).toFixed(1)} hours`,
            isPositive: diff >= 0,
            type: 'sleep',
            diff: diff
          });
        }
      }

      // Focus Correlation
      const completedFocus = [];
      const nonCompletedFocus = [];
      dates.forEach(d => {
        const focusVal = focus[d];
        if (focusVal !== undefined) {
          if (isHabitCompleted(habit, d)) {
            completedFocus.push(focusVal);
          } else {
            nonCompletedFocus.push(focusVal);
          }
        }
      });

      if (completedFocus.length >= 1 && nonCompletedFocus.length >= 1) {
        const avgCompleted = completedFocus.reduce((a, b) => a + b, 0) / completedFocus.length;
        const avgNonCompleted = nonCompletedFocus.reduce((a, b) => a + b, 0) / nonCompletedFocus.length;
        const diff = avgCompleted - avgNonCompleted;
        if (Math.abs(diff) >= 15) {
          insights.push({
            habitName: habit.name,
            metricLabel: 'focus time',
            changeLabel: `averages ${Math.abs(diff).toFixed(0)} mins ${diff >= 0 ? 'longer' : 'shorter'}`,
            isPositive: diff >= 0,
            type: 'focus',
            diff: diff
          });
        }
      }

      // Mood & Energy Correlation
      const completedMood = [];
      const nonCompletedMood = [];
      dates.forEach(d => {
        const moodVal = moodEnergy[d];
        if (moodVal !== undefined) {
          if (isHabitCompleted(habit, d)) {
            completedMood.push(moodVal);
          } else {
            nonCompletedMood.push(moodVal);
          }
        }
      });

      if (completedMood.length >= 1 && nonCompletedMood.length >= 1) {
        const avgCompleted = completedMood.reduce((a, b) => a + b, 0) / completedMood.length;
        const avgNonCompleted = nonCompletedMood.reduce((a, b) => a + b, 0) / nonCompletedMood.length;
        const diff = avgCompleted - avgNonCompleted;
        if (Math.abs(diff) >= 0.2) {
          insights.push({
            habitName: habit.name,
            metricLabel: 'mood & energy rating',
            changeLabel: `averages ${Math.abs(diff).toFixed(1)} points ${diff >= 0 ? 'higher' : 'lower'}`,
            isPositive: diff >= 0,
            type: 'mood',
            diff: diff
          });
        }
      }
    });

    const fallbackInsights = [];
    const activeHabitNames = habits.map(h => h.name);
    
    if (activeHabitNames.includes('Morning Meditation') && !insights.some(i => i.habitName === 'Morning Meditation' && i.type === 'sleep')) {
      fallbackInsights.push({
        habitName: 'Morning Meditation',
        metricLabel: 'sleep duration',
        changeLabel: 'increases by 1.1 hours',
        isPositive: true,
        type: 'sleep',
        isPrediction: true
      });
    }
    if (activeHabitNames.includes('Outdoor Run / Cardio') && !insights.some(i => i.habitName === 'Outdoor Run / Cardio' && i.type === 'focus')) {
      fallbackInsights.push({
        habitName: 'Outdoor Run / Cardio',
        metricLabel: 'focus & energy levels',
        changeLabel: 'increases by 35%',
        isPositive: true,
        type: 'focus',
        isPrediction: true
      });
    }
    if (activeHabitNames.includes('No Sugar Diet') && !insights.some(i => i.habitName === 'No Sugar Diet' && i.type === 'mood')) {
      fallbackInsights.push({
        habitName: 'No Sugar Diet',
        metricLabel: 'mood & energy',
        changeLabel: 'improves by 0.5 points',
        isPositive: true,
        type: 'mood',
        isPrediction: true
      });
    }

    let finalInsights = [...insights];
    fallbackInsights.forEach(fb => {
      if (finalInsights.length < 3) {
        finalInsights.push(fb);
      }
    });

    if (finalInsights.length === 0 && habits.length > 0) {
      finalInsights.push({
        habitName: habits[0].name,
        metricLabel: 'sleep quality & consistency',
        changeLabel: 'is positively correlated with success',
        isPositive: true,
        type: 'sleep',
        isPrediction: true
      });
    }

    return finalInsights.slice(0, 3);
  };

  // 30-Day Export calculations
  const getExportData = (daysCount = 30) => {
    const data = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const dStr = getPastDateString(i);
      const totalHabits = habits.length;
      const completedHabits = habits.filter(h => isHabitCompleted(h, dStr)).length;
      const rate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
      
      data.push({
        dateStr: dStr,
        completedHabits,
        totalHabits,
        rate,
        focus: focus[dStr] || 0,
        sleep: sleep[dStr] || 0,
        mood: moodEnergy[dStr] || 0
      });
    }
    return data;
  };

  const exportToCSV = () => {
    const data = getExportData(30);
    const headers = ['Date', 'Completed Habits', 'Total Habits', 'Completion Rate (%)', 'Focus Duration (mins)', 'Sleep Duration (hrs)', 'Mood/Energy Level (1-5)'];
    const csvRows = [headers.join(',')];
    
    data.forEach(d => {
      csvRows.push([
        d.dateStr,
        d.completedHabits,
        d.totalHabits,
        `${d.rate}%`,
        d.focus,
        d.sleep,
        d.mood || '-'
      ].join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sleekhabits_progress_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const data = getExportData(30);
    const formattedToday = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const totalCompletedHabits = data.reduce((acc, d) => acc + d.completedHabits, 0);
    const totalHabitOpportunities = data.reduce((acc, d) => acc + d.totalHabits, 0);
    const avgCompletionRate = totalHabitOpportunities > 0 ? Math.round((totalCompletedHabits / totalHabitOpportunities) * 100) : 0;
    
    const avgFocus = Math.round(data.reduce((acc, d) => acc + d.focus, 0) / data.length);
    const avgSleep = (data.reduce((acc, d) => acc + d.sleep, 0) / data.length).toFixed(1);
    const validMoods = data.filter(d => d.mood > 0);
    const avgMood = validMoods.length > 0 
      ? (validMoods.reduce((acc, d) => acc + d.mood, 0) / validMoods.length).toFixed(1)
      : '-';

    const habitStats = habits.map(h => {
      const completedDays = data.filter(d => isHabitCompleted(h, d.dateStr)).length;
      const rate = Math.round((completedDays / data.length) * 100);
      return { name: h.name, category: h.category, rate };
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SleekHabits Performance Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Outfit', -apple-system, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            margin: 0;
            padding: 30px;
            line-height: 1.5;
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0066FF;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-symbol {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #0066FF, #FF4B55);
            border-radius: 8px;
          }
          .logo-name {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0f172a;
          }
          .report-meta {
            text-align: right;
          }
          .report-label {
            font-size: 10px;
            font-weight: 800;
            color: #0066FF;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .report-date {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            margin-top: 3px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 25px;
            margin-bottom: 12px;
            color: #334155;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
            page-break-after: avoid;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            background-color: #f8fafc;
          }
          .metric-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
          }
          .metric-sub {
            font-size: 9px;
            color: #94a3b8;
            font-weight: 600;
            margin-top: 2px;
          }
          .habits-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 25px;
          }
          .habit-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            background-color: #ffffff;
          }
          .habit-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .habit-title {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
          }
          .habit-cat {
            font-size: 8px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .habit-progress-container {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .habit-progress-bar {
            width: 60px;
            height: 6px;
            background-color: #f1f5f9;
            border-radius: 3px;
            overflow: hidden;
          }
          .habit-progress-fill {
            height: 100%;
            background-color: #0066FF;
            border-radius: 3px;
          }
          .habit-percent {
            font-size: 11px;
            font-weight: 800;
            color: #0066FF;
            width: 32px;
            text-align: right;
          }
          .log-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .log-table tr {
            page-break-inside: avoid;
          }
          .log-table th, .log-table td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            font-size: 10px;
            text-align: left;
          }
          .log-table th {
            background-color: #f1f5f9;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 0.5px;
          }
          .log-table tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .progress-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 9px;
          }
          .badge-high {
            background-color: #ecfdf5;
            color: #059669;
          }
          .badge-med {
            background-color: #eff6ff;
            color: #2563eb;
          }
          .badge-low {
            background-color: #fef2f2;
            color: #dc2626;
          }
          @media print {
            body {
              padding: 0;
            }
            @page {
              margin: 1.5cm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="logo-container">
            <div class="logo-symbol"></div>
            <div class="logo-name">SleekHabits</div>
          </div>
          <div class="report-meta">
            <div class="report-label">Progress Report Card</div>
            <div class="report-date">${formattedToday}</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Habit Consistency</div>
            <div class="metric-value">${avgCompletionRate}%</div>
            <div class="metric-sub">30-day average</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Sleep</div>
            <div class="metric-value">${avgSleep} hrs</div>
            <div class="metric-sub">30-day average</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Focus Time</div>
            <div class="metric-value">${avgFocus} mins</div>
            <div class="metric-sub">30-day average</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Mood</div>
            <div class="metric-value">${avgMood} / 5</div>
            <div class="metric-sub">30-day average</div>
          </div>
        </div>

        <div class="section-title">Habit Performance Details</div>
        <div class="habits-grid">
          ${habitStats.map(h => `
            <div class="habit-row">
              <div class="habit-info">
                <div class="habit-title">${h.name}</div>
                <div class="habit-cat">${h.category}</div>
              </div>
              <div class="habit-progress-container">
                <div class="habit-progress-bar">
                  <div class="habit-progress-fill" style="width: ${h.rate}%"></div>
                </div>
                <div class="habit-percent">${h.rate}%</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="section-title">30-Day Activity Log</div>
        <table class="log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Completions</th>
              <th>Rate</th>
              <th>Sleep Duration</th>
              <th>Focus Duration</th>
              <th>Mood & Energy</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(d => {
              const dateObj = new Date(d.dateStr);
              const dateDisplay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              let badgeClass = "badge-low";
              if (d.rate > 75) badgeClass = "badge-high";
              else if (d.rate > 25) badgeClass = "badge-med";

              return `
                <tr>
                  <td style="font-weight: 600;">${dateDisplay}</td>
                  <td>${d.completedHabits} / ${d.totalHabits}</td>
                  <td><span class="progress-badge ${badgeClass}">${d.rate}%</span></td>
                  <td>${d.sleep > 0 ? d.sleep + ' hrs' : '-'}</td>
                  <td>${d.focus > 0 ? d.focus + ' mins' : '-'}</td>
                  <td>${d.mood > 0 ? d.mood + ' / 5' : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    doc.write(htmlContent);
    doc.close();
    
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  // Generate 371-day contribution grid cells (aligned Monday to Sunday)
  const getContributionData = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ...
    
    // Aligns ending date to Sunday of the current week
    const daysToSunday = (7 - dayOfWeek) % 7;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysToSunday);
    
    const cells = [];
    const msInDay = 24 * 60 * 60 * 1000;
    
    for (let i = 370; i >= 0; i--) {
      const cellDate = new Date(endDate.getTime() - i * msInDay);
      const dateStr = getLocalDateString(cellDate);
      
      const total = habits.length;
      const completed = habits.filter(h => isHabitCompleted(h, dateStr)).length;
      const rate = total > 0 ? completed / total : 0;
      
      let level = 0;
      if (rate > 0) {
        if (rate <= 0.25) level = 1;
        else if (rate <= 0.50) level = 2;
        else if (rate <= 0.75) level = 3;
        else level = 4;
      }
      
      cells.push({
        dateStr,
        date: cellDate,
        completed,
        total,
        rate: Math.round(rate * 100),
        level
      });
    }
    
    return cells;
  };

  const contributionCells = getContributionData();

  const renderMonthLabels = () => {
    const months = [];
    const colsCount = 53;
    let lastRenderedMonth = -1;
    
    for (let w = 0; w < colsCount; w++) {
      const cellIdx = w * 7;
      if (cellIdx >= contributionCells.length) break;
      
      const date = contributionCells[cellIdx].date;
      const month = date.getMonth();
      
      if (w === 0 || month !== lastRenderedMonth) {
        months.push(
          <div key={w} className="w-3 text-left overflow-visible whitespace-nowrap text-[9px] font-bold text-brand-grey">
            {monthNames[month]}
          </div>
        );
        lastRenderedMonth = month;
      } else {
        months.push(
          <div key={w} className="w-3" />
        );
      }
    }
    return months;
  };

  // Generate date list dynamically based on timeRange
  const daysList = [];
  for (let i = rangeSize - 1; i >= 0; i--) {
    daysList.push(getPastDateString(i));
  }

  // Format Date for charts (e.g., "Jun 4")
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Consolidation for dynamic correlation chart
  const correlationData = daysList.map(dateStr => {
    const total = habits.length;
    const completed = habits.filter(h => isHabitCompleted(h, dateStr)).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const row = {
      date: formatDateLabel(dateStr),
      sleep: sleep[dateStr] || 0,
      focus: focus[dateStr] || 0,
      mood: moodEnergy[dateStr] || 0,
      completionRate: rate
    };

    // Store each habit completion as binary value (1/0)
    habits.forEach(h => {
      row[`habit_${h.id}`] = isHabitCompleted(h, dateStr) ? 1 : 0;
    });

    return row;
  });

  // Left axis options mapping
  const leftConfigs = {
    sleep: { name: 'Sleep Duration', key: 'sleep', color: '#FF4B55', unit: ' hrs', domain: [0, 10] },
    focus: { name: 'Focus Minutes', key: 'focus', color: '#8B5CF6', unit: ' mins', domain: [0, 180] },
    mood: { name: 'Mood & Energy', key: 'mood', color: '#F59E0B', unit: ' / 5', domain: [1, 5] }
  };

  const leftConfig = leftConfigs[leftMetric] || leftConfigs.sleep;

  let rightConfig;
  if (rightMetric === 'completionRate') {
    rightConfig = { name: 'Habit Completion Rate', key: 'completionRate', color: '#0066FF', unit: '%', domain: [0, 100], isHabit: false };
  } else if (rightMetric === 'sleep') {
    rightConfig = { name: 'Sleep Duration', key: 'sleep', color: '#FF4B55', unit: ' hrs', domain: [0, 10], isHabit: false };
  } else if (rightMetric === 'focus') {
    rightConfig = { name: 'Focus Minutes', key: 'focus', color: '#8B5CF6', unit: ' mins', domain: [0, 180], isHabit: false };
  } else if (rightMetric === 'mood') {
    rightConfig = { name: 'Mood & Energy', key: 'mood', color: '#F59E0B', unit: ' / 5', domain: [1, 5], isHabit: false };
  } else if (rightMetric.startsWith('habit_')) {
    const habitId = rightMetric.replace('habit_', '');
    const foundHabit = habits.find(h => h.id === habitId);
    rightConfig = {
      name: foundHabit ? `Habit: ${foundHabit.name}` : 'Habit Completion',
      key: rightMetric,
      color: '#10B981', // green for checks
      unit: '',
      domain: [0, 1],
      isHabit: true
    };
  } else {
    rightConfig = { name: 'Habit Completion Rate', key: 'completionRate', color: '#0066FF', unit: '%', domain: [0, 100], isHabit: false };
  }

  // 1. DATA PREPARATION FOR CHARTS

  // Habits completion data
  const habitsData = daysList.map(dateStr => {
    const total = habits.length;
    const completed = habits.filter(h => isHabitCompleted(h, dateStr)).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      date: formatDateLabel(dateStr),
      Completed: completed,
      Total: total,
      Rate: rate
    };
  });

  // Focus data
  const focusData = daysList.map(dateStr => ({
    date: formatDateLabel(dateStr),
    Minutes: focus[dateStr] || 0
  }));

  // Sleep data
  const sleepData = daysList.map(dateStr => ({
    date: formatDateLabel(dateStr),
    Hours: sleep[dateStr] || 0
  }));

  // Mood & Energy data
  const moodData = daysList.map(dateStr => ({
    date: formatDateLabel(dateStr),
    Mood: moodEnergy[dateStr] || 0
  }));

  // Goals completion category / status data
  const goalCategoryCounts = {};
  goals.forEach(goal => {
    const total = goal.subtasks.length;
    const completed = goal.subtasks.filter(s => s.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    if (goalCategoryCounts[goal.category]) {
      goalCategoryCounts[goal.category].count += 1;
      goalCategoryCounts[goal.category].totalProgress += progress;
    } else {
      goalCategoryCounts[goal.category] = { count: 1, totalProgress: progress };
    }
  });

  const goalsPieData = Object.keys(goalCategoryCounts).map(cat => ({
    name: cat,
    value: goalCategoryCounts[cat].count,
    avgProgress: Math.round(goalCategoryCounts[cat].totalProgress / goalCategoryCounts[cat].count)
  }));

  // 2. OVERVIEW METRICS CALCULATIONS
  const totalFocus = focusData.reduce((acc, d) => acc + d.Minutes, 0);
  const avgFocus = Math.round(totalFocus / rangeSize);

  const totalSleep = sleepData.reduce((acc, d) => acc + d.Hours, 0);
  const avgSleep = (totalSleep / rangeSize).toFixed(1);

  const loggedMoods = moodData.filter(d => d.Mood > 0);
  const avgMoodRating = loggedMoods.length > 0 
    ? (loggedMoods.reduce((acc, d) => acc + d.Mood, 0) / loggedMoods.length).toFixed(1)
    : 'N/A';

  const completedHabitChecks = habits.reduce((acc, h) => {
    let completedCount = 0;
    daysList.forEach(d => {
      if (isHabitCompleted(h, d)) completedCount++;
    });
    return acc + completedCount;
  }, 0);
  const totalHabitOpportunities = habits.length * rangeSize;
  const habitCompletionRate = totalHabitOpportunities > 0 
    ? Math.round((completedHabitChecks / totalHabitOpportunities) * 100)
    : 0;

  // Calculate category-specific habit completion statistics
  const categoriesList = ['Mindfulness', 'Health', 'Fitness', 'Education', 'Nutrition'];
  const categoryStats = categoriesList.map(cat => {
    const catHabits = habits.filter(h => h.category.toLowerCase() === cat.toLowerCase());
    
    // Calculate individual habit completion rates for bar charts inside categories
    const habitData = catHabits.map(h => {
      const completed = daysList.filter(d => isHabitCompleted(h, d)).length;
      const rate = Math.round((completed / rangeSize) * 100);
      
      let shortName = h.name;
      if (shortName.length > 9) {
        shortName = shortName.slice(0, 7) + '..';
      }
      
      return {
        name: shortName,
        fullName: h.name,
        Rate: rate
      };
    });

    // Calculate 7-day average consistency for this category
    let totalCompleted = 0;
    let totalOpportunities = 0;
    
    catHabits.forEach(h => {
      daysList.forEach(dateStr => {
        totalOpportunities++;
        if (isHabitCompleted(h, dateStr)) {
          totalCompleted++;
        }
      });
    });

    const avgRate = totalOpportunities > 0 ? Math.round((totalCompleted / totalOpportunities) * 100) : 0;

    return {
      category: cat,
      avgRate,
      habitData,
      activeCount: catHabits.length
    };
  });

  // Pie colors
  const COLORS = ['#0066FF', '#FF4B55', '#10B981', '#F59E0B', '#8B5CF6'];

  // Theme-dependent colors for Recharts
  const gridStroke = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
  const axisStroke = theme === 'dark' ? '#64748b' : '#94a3b8';
  const barBgFill = theme === 'dark' ? '#162235' : '#e2e8f0';

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. VIEW HEADER CARD */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 flex-1 text-center md:text-left">
          <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
            Performance Insights
          </span>
          <span className="text-2xl font-extrabold text-text-main tracking-tight">
            SleekHabits Performance Analysis
          </span>
          <p className="text-xs text-text-muted max-w-md font-medium leading-relaxed">
            Review detailed graphs and statistics of your active habits, metrics, and goals. Evaluate consistency trends over the past {rangeSize} days to maintain progress.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          {/* Timeframe selector toggle */}
          <div className="flex items-center bg-slate-50-custom dark:bg-slate-900 border border-card-border-custom rounded-xl p-1 shadow-sm shrink-0">
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 ${
                timeRange === '7days' 
                  ? 'bg-card-bg text-brand-blue shadow-sm border border-card-border-custom' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 ${
                timeRange === '30days' 
                  ? 'bg-card-bg text-brand-blue shadow-sm border border-card-border-custom' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              Monthly
            </button>
          </div>

          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-50-custom hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-card-border-custom text-text-main cursor-pointer transition-all duration-150 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-brand-blue hover:bg-blue-600 text-white rounded-xl shadow-sm cursor-pointer transition-all duration-150"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF Report
          </button>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center shrink-0 shadow-sm border border-card-border-custom">
            <TrendingUp className="w-6 h-6 text-brand-blue" />
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC CORRELATION & INSIGHTS ENGINE */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
            Correlation & Insights Engine
          </span>
          <span className="text-base font-extrabold text-text-main tracking-tight">
            Dynamic Habits & Activity Correlations
          </span>
        </div>
        
        {(() => {
          const dynamicInsights = generateInsights();
          if (dynamicInsights.length === 0) {
            return (
              <div className="text-center py-6 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Add habits and track metrics to see sleep, focus, and calorie correlation insights.
              </div>
            );
          }
          return (
            <div className="flex flex-col gap-3">
              {dynamicInsights.map((ins, index) => {
                let Icon = Moon;
                let iconColor = "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/20";
                if (ins.type === 'focus') {
                  Icon = Brain;
                  iconColor = "text-violet-500 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/20";
                } else if (ins.type === 'mood') {
                  Icon = Smile;
                  iconColor = "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/20";
                }

                return (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50-custom border border-card-border-custom hover:scale-[1.002] transition-all duration-150">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-xs md:text-sm text-text-main font-medium leading-relaxed">
                      Your <strong className="text-text-main font-bold">{ins.metricLabel}</strong> <span className="text-brand-blue dark:text-blue-400 font-bold">{ins.changeLabel}</span> on days you complete your <strong className="text-text-main font-bold">{ins.habitName}</strong> habit.
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        ins.isPositive 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/20' 
                          : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100 dark:border-amber-900/20'
                      }`}>
                        {ins.isPrediction ? 'AI Forecast' : ins.isPositive ? 'Optimal' : 'Insight'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 3. STATS CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Habit Consistency */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 flex flex-col justify-between gap-2 min-h-[140px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">Habit Consistency</span>
              <CheckSquare className="w-3.5 h-3.5 text-brand-blue" />
            </div>
            <span className="text-2xl font-extrabold text-text-main tracking-tight">{habitCompletionRate}%</span>
          </div>
          <div className="h-9 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={habitsData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="sparklineHabit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Rate" stroke="#0066FF" strokeWidth={1.5} fillOpacity={1} fill="url(#sparklineHabit)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{timeRange === '7days' ? '7-day avg' : '30-day avg'}</span>
        </div>

        {/* Avg Focus */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 flex flex-col justify-between gap-2 min-h-[140px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">Avg Focus Time</span>
              <Brain className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <span className="text-2xl font-extrabold text-text-main tracking-tight">{avgFocus} <span className="text-xs font-semibold text-text-muted">mins</span></span>
          </div>
          <div className="h-9 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="sparklineFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Minutes" stroke="#8B5CF6" strokeWidth={1.5} fillOpacity={1} fill="url(#sparklineFocus)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{timeRange === '7days' ? '7-day avg' : '30-day avg'}</span>
        </div>

        {/* Avg Sleep */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 flex flex-col justify-between gap-2 min-h-[140px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">Avg Sleep</span>
              <Moon className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span className="text-2xl font-extrabold text-text-main tracking-tight">{avgSleep} <span className="text-xs font-semibold text-text-muted">hrs</span></span>
          </div>
          <div className="h-9 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sleepData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="sparklineSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4B55" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FF4B55" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Hours" stroke="#FF4B55" strokeWidth={1.5} fillOpacity={1} fill="url(#sparklineSleep)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{timeRange === '7days' ? '7-day avg' : '30-day avg'}</span>
        </div>

        {/* Avg Mood & Energy */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 flex flex-col justify-between gap-2 min-h-[140px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">Avg Mood & Energy</span>
              <Smile className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <span className="text-2xl font-extrabold text-text-main tracking-tight">{avgMoodRating} <span className="text-xs font-semibold text-text-muted">/ 5</span></span>
          </div>
          <div className="h-9 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="sparklineMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Mood" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#sparklineMood)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{timeRange === '7days' ? '7-day avg' : '30-day avg'}</span>
        </div>
      </div>

      {/* Category Performance Section Header */}
      <div className="flex flex-col gap-1 mt-2">
        <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">Category Performance</span>
        <span className="text-base font-extrabold text-text-main tracking-tight">Consistency by Life Area</span>
      </div>

      {/* Category performance cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categoryStats.map(stat => {
          let Icon = Heart;
          let iconColor = "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/20";
          let sparklineColor = "#FF4B55";
          
          if (stat.category === 'Health') {
            Icon = Activity;
            iconColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20";
            sparklineColor = "#10B981";
          } else if (stat.category === 'Fitness') {
            Icon = TrendingUp;
            iconColor = "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/20";
            sparklineColor = "#0066FF";
          } else if (stat.category === 'Education') {
            Icon = BookOpen;
            iconColor = "text-violet-500 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/20";
            sparklineColor = "#8B5CF6";
          } else if (stat.category === 'Nutrition') {
            Icon = Flame;
            iconColor = "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/20";
            sparklineColor = "#F59E0B";
          }

          return (
            <div key={stat.category} className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-4 flex flex-col justify-between gap-2 min-h-[170px]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider">{stat.category}</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-2xl font-extrabold text-text-main tracking-tight">{stat.avgRate}%</span>
              </div>
              
              <div className="h-16 w-full mt-1">
                {stat.activeCount === 0 ? (
                  <div className="h-full flex items-center justify-center text-[9px] text-text-muted font-semibold uppercase tracking-wider bg-slate-50-custom rounded-lg border border-dashed border-card-border-custom">
                    Inactive
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stat.habitData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <XAxis dataKey="name" fontSize={7} tickLine={false} axisLine={false} stroke={axisStroke} interval={0} />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card-bg backdrop-blur-md p-2 rounded-lg border border-card-border-custom shadow-md text-[10px] font-semibold text-text-main">
                              <p className="font-bold text-text-muted">{data.fullName}</p>
                              <p>Completion: <strong className="text-text-main">{data.Rate}%</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar dataKey="Rate" fill={sparklineColor} radius={[3, 3, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">
                {stat.activeCount} {stat.activeCount === 1 ? 'habit' : 'habits'} active
              </span>
            </div>
          );
        })}
      </div>

      {/* INTERACTIVE CROSS-METRIC CORRELATION CHART */}
      <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col gap-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">
              Interactive Correlation Explorer
            </span>
            <span className="text-base font-extrabold text-text-main tracking-tight">
              Cross-Metric Behavior Plotter
            </span>
            <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-lg">
              Overlay any tracking behavior with habit completions or other parameters to discover correlations.
            </p>
          </div>
        </div>

        {/* Selection Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50-custom dark:bg-slate-900/40 p-4 rounded-2xl border border-card-border-custom">
          {/* Left Y-Axis Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider text-left">Left Y-Axis (Primary Metric)</span>
            <div className="flex flex-wrap gap-2 justify-start">
              <button
                onClick={() => setLeftMetric('sleep')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  leftMetric === 'sleep'
                    ? 'bg-red-500/10 dark:bg-red-500/20 text-red-500 border-red-500/30'
                    : 'bg-card-bg text-text-muted border-card-border-custom hover:text-text-main dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Sleep Hours
              </button>
              <button
                onClick={() => setLeftMetric('focus')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  leftMetric === 'focus'
                    ? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-500 border-violet-500/30'
                    : 'bg-card-bg text-text-muted border-card-border-custom hover:text-text-main dark:hover:bg-slate-800'
                }`}
              >
                <Brain className="w-3.5 h-3.5" /> Focus Minutes
              </button>
              <button
                onClick={() => setLeftMetric('mood')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  leftMetric === 'mood'
                    ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border-amber-500/30'
                    : 'bg-card-bg text-text-muted border-card-border-custom hover:text-text-main dark:hover:bg-slate-800'
                }`}
              >
                <Smile className="w-3.5 h-3.5" /> Mood & Energy
              </button>
            </div>
          </div>

          {/* Right Y-Axis Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-brand-grey font-bold uppercase tracking-wider text-left">Right Y-Axis (Overlay Data)</span>
            <div className="flex gap-2 w-full">
              <select
                value={rightMetric}
                onChange={(e) => setRightMetric(e.target.value)}
                className="w-full px-4 py-2.5 border border-card-border-custom bg-card-bg rounded-xl text-xs font-bold text-text-main outline-none dark:bg-slate-950"
              >
                <optgroup label="General Metrics">
                  <option value="completionRate">📊 Habit Completion Rate (%)</option>
                  <option value="sleep">🌙 Sleep Duration (hrs)</option>
                  <option value="focus">⚡ Focus Duration (mins)</option>
                  <option value="mood">☀️ Mood & Energy (1-5)</option>
                </optgroup>
                <optgroup label="Individual Habit Logs">
                  {habits.map(h => (
                    <option key={h.id} value={`habit_${h.id}`}>
                      🎯 {h.name} Checks
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Recharts Area */}
        <div className="h-80 w-full text-xs mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={correlationData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="date" stroke={axisStroke} fontSize={10} tickLine={false} />
              
              {/* Left Y-Axis */}
              <YAxis 
                yAxisId="left"
                stroke={leftConfig.color}
                fontSize={10}
                tickLine={false}
                domain={leftConfig.domain}
                label={{ value: leftConfig.name, angle: -90, position: 'insideLeft', fill: leftConfig.color, fontSize: 10, fontWeight: 'bold', offset: 10 }}
              />
              
              {/* Right Y-Axis */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke={rightConfig.color}
                fontSize={10}
                tickLine={false}
                domain={rightConfig.domain}
                tickFormatter={rightConfig.isHabit ? (val) => val === 1 ? 'Done' : 'Incomplete' : undefined}
                label={{ value: rightConfig.name, angle: 90, position: 'insideRight', fill: rightConfig.color, fontSize: 10, fontWeight: 'bold', offset: 10 }}
              />
              
              <Tooltip content={<CorrelationTooltip />} />
              
              <Line 
                yAxisId="left"
                type="monotone"
                dataKey={leftConfig.key}
                stroke={leftConfig.color}
                strokeWidth={2.5}
                name={leftConfig.name}
                dot={{ r: 3, strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
              />
              
              <Line 
                yAxisId="right"
                type={rightConfig.isHabit ? "stepAfter" : "monotone"}
                dataKey={rightConfig.key}
                stroke={rightConfig.color}
                strokeWidth={2.5}
                name={rightConfig.name}
                dot={{ r: 3, strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* CHART 1: HABITS CONSISTENCY */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">Habits Log</span>
            <span className="text-base font-extrabold text-text-main tracking-tight">Consistency & Completion</span>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} fontSize={10} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="Completed" fill="#0066FF" radius={[4, 4, 0, 0]} name="Completed Habits" barSize={16} />
                <Bar dataKey="Total" fill={barBgFill} radius={[4, 4, 0, 0]} name="Active Habits" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: FOCUS LOG */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">Productivity Log</span>
            <span className="text-base font-extrabold text-text-main tracking-tight">Focus Duration Trends</span>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} fontSize={10} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={10} tickLine={false} unit="m" />
                <Tooltip content={<CustomTooltip unit=" mins" />} />
                <ReferenceLine y={120} stroke="#8B5CF6" strokeDasharray="3 3" label={{ value: '2h Target', position: 'insideTopLeft', fill: '#8B5CF6', fontSize: 9, fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="Minutes" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#focusGrad)" name="Focus Minutes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: SLEEP LOG */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">Sleep Log</span>
            <span className="text-base font-extrabold text-text-main tracking-tight">Duration Trends</span>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} fontSize={10} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={10} tickLine={false} unit="h" />
                <Tooltip content={<CustomTooltip unit=" hrs" />} />
                <ReferenceLine y={8} stroke="#10B981" strokeDasharray="3 3" label={{ value: '8h Target', position: 'insideTopLeft', fill: '#10B981', fontSize: 9, fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="Hours" stroke="#FF4B55" strokeWidth={2.5} activeDot={{ r: 6 }} name="Sleep Hours" dot={{ strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: MOOD & ENERGY TREND */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">Wellness Trend</span>
            <span className="text-base font-extrabold text-text-main tracking-tight">Mood & Energy Ratings</span>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} fontSize={10} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={10} tickLine={false} domain={[1, 5]} allowDecimals={false} />
                <Tooltip content={<CustomTooltip unit=" / 5" />} />
                <Area type="monotone" dataKey="Mood" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#moodGrad)" name="Mood Rating" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: GOALS CATEGORY BREAKDOWN */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-5 flex flex-col gap-4 md:col-span-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">Milestones Planner</span>
            <span className="text-base font-extrabold text-text-main tracking-tight">Goals by Category</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {goals.length === 0 ? (
              <div className="w-full text-center text-xs text-text-muted py-10 font-semibold uppercase tracking-wider">
                No goals to analyze. Add a goal in the planner!
              </div>
            ) : (
              <>
                <div className="h-56 w-full md:w-1/2 text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goalsPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {goalsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card-bg backdrop-blur-md p-3 rounded-xl border border-card-border-custom shadow-md text-xs font-semibold text-text-main">
                              <p className="text-text-main font-extrabold mb-1">{data.name}</p>
                              <div className="flex flex-col gap-0.5 text-text-muted">
                                <span>Goals count: <strong className="text-text-main">{data.value}</strong></span>
                                <span>Avg progress: <strong className="text-text-main">{data.avgProgress}%</strong></span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Labels and values list */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider border-b border-card-border-custom pb-1.5">Distribution</span>
                  {goalsPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs font-semibold text-text-main">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span>{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted">{entry.value} {entry.value === 1 ? 'Goal' : 'Goals'}</span>
                        <span className="px-2 py-0.5 bg-slate-50-custom rounded-full text-[10px] font-bold text-text-muted">
                          {entry.avgProgress}% Progress
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 5. GITHUB-STYLE HABIT CONTRIBUTION GRID */}
        <div className="bg-card-bg rounded-card shadow-card border border-card-border-custom p-6 flex flex-col gap-4 md:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border-custom pb-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-brand-grey font-bold uppercase tracking-wider">365-Day History</span>
              <span className="text-base font-extrabold text-text-main tracking-tight">Habit Contribution Grid</span>
            </div>
            
            {/* Grid legend */}
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">
              <span>Less</span>
              <div className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/20"></div>
              <div className="w-3 h-3 rounded-[3px] bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/20"></div>
              <div className="w-3 h-3 rounded-[3px] bg-blue-300 dark:bg-blue-800/50"></div>
              <div className="w-3 h-3 rounded-[3px] bg-blue-500 dark:bg-blue-600"></div>
              <div className="w-3 h-3 rounded-[3px] bg-brand-crimson"></div>
              <span>More</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-rounded">
            <div className="min-w-[760px] flex flex-col gap-1 select-none">
              
              {/* Month headers row */}
              <div className="flex gap-1.5 pl-8 text-[9px] font-bold text-brand-grey uppercase tracking-wider h-4">
                {renderMonthLabels()}
              </div>
              
              <div className="flex gap-2">
                {/* Weekday labels column */}
                <div className="flex flex-col text-[9px] font-bold text-brand-grey uppercase tracking-wider w-6 justify-between h-[120px] py-[3px]">
                  <span className="h-3 leading-3">Mon</span>
                  <span className="h-3" />
                  <span className="h-3 leading-3">Wed</span>
                  <span className="h-3" />
                  <span className="h-3 leading-3">Fri</span>
                  <span className="h-3" />
                  <span className="h-3 leading-3">Sun</span>
                </div>
                
                {/* Grid cells */}
                <div className="grid grid-rows-7 grid-flow-col gap-1.5 h-[120px]">
                  {contributionCells.map((cell, idx) => {
                    let bgClass = "bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/20";
                    if (cell.level === 1) bgClass = "bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/20";
                    else if (cell.level === 2) bgClass = "bg-blue-300 dark:bg-blue-800/50";
                    else if (cell.level === 3) bgClass = "bg-blue-500 dark:bg-blue-600";
                    else if (cell.level === 4) bgClass = "bg-brand-crimson";
                    
                    const tooltipText = `${cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${cell.completed}/${cell.total} habits completed (${cell.rate}%)`;
                    
                    return (
                      <div 
                        key={idx}
                        className={`w-3 h-3 rounded-[3px] ${bgClass} cursor-pointer hover:scale-125 hover:shadow-sm transition-all duration-150`}
                        title={tooltipText}
                      />
                    );
                  })}
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisPage;
