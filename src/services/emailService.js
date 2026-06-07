const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const FROM_EMAIL = 'SleekHabits <onboarding@resend.dev>';

const MOOD_LABELS = { 1: 'Awful 😞', 2: 'Meh 😐', 3: 'Good 🙂', 4: 'High ⚡', 5: 'Peak ✨' };
const MOOD_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#10b981', 4: '#3b82f6', 5: '#8b5cf6' };

/**
 * Builds a rich HTML email summarizing the day's quick log.
 */
function buildEmailHTML({ date, sleepHours, focusMins, moodScore, habitUpdates, habits, userName }) {
  const formattedDate = (() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  })();

  const moodLabel = MOOD_LABELS[moodScore] || 'Good 🙂';
  const moodColor = MOOD_COLORS[moodScore] || '#10b981';
  const sleepRating = sleepHours >= 8 ? '🟢 Great' : sleepHours >= 6 ? '🟡 Fair' : '🔴 Low';
  const focusRating = focusMins >= 120 ? '🟢 Excellent' : focusMins >= 60 ? '🟡 Good' : '🔴 Low';

  // Build habit rows
  const habitRows = (habitUpdates || []).map(update => {
    const habit = habits?.find(h => h.id === update.id);
    if (!habit) return '';
    const isCompleted = habit.isProgressType
      ? Number(update.value) >= habit.targetValue
      : Boolean(update.value);

    const valueStr = habit.isProgressType
      ? `${update.value} / ${habit.targetValue} ${habit.unit}`
      : (Boolean(update.value) ? 'Done ✅' : 'Skipped');

    return `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #1e293b; color:#cbd5e1; font-size:13px;">${habit.name}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #1e293b; color:#94a3b8; font-size:13px; text-align:center;">${habit.category}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #1e293b; font-size:13px; text-align:right;">
          <span style="color:${isCompleted ? '#10b981' : '#f59e0b'}; font-weight:700;">${valueStr}</span>
        </td>
      </tr>
    `;
  }).join('');

  const completedCount = (habitUpdates || []).filter(update => {
    const habit = habits?.find(h => h.id === update.id);
    if (!habit) return false;
    return habit.isProgressType
      ? Number(update.value) >= habit.targetValue
      : Boolean(update.value);
  }).length;

  const totalHabits = (habitUpdates || []).length;
  const completionPct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const progressBarFill = Math.max(4, completionPct);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily Summary — SleekHabits</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0066FF 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <div style="font-size:28px;margin-bottom:6px;">✨</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Daily Habit Summary</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;">${formattedDate}</p>
            ${userName ? `<p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Hey ${userName}! Here's how your day went 👋</p>` : ''}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#0f172a;padding:32px 40px;">

            <!-- Habit Progress Bar -->
            <div style="margin-bottom:28px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="color:#e2e8f0;font-weight:700;font-size:14px;">Habits Completed</span>
                <span style="color:#0066FF;font-weight:800;font-size:14px;">${completedCount}/${totalHabits} &nbsp;·&nbsp; ${completionPct}%</span>
              </div>
              <div style="background:#1e293b;border-radius:999px;height:10px;overflow:hidden;">
                <div style="width:${progressBarFill}%;background:linear-gradient(90deg,#0066FF,#7c3aed);height:100%;border-radius:999px;"></div>
              </div>
            </div>

            <!-- Wellness Stats Grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <!-- Sleep -->
                <td width="33%" style="padding-right:8px;">
                  <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;border:1px solid #334155;">
                    <div style="font-size:22px;margin-bottom:4px;">🌙</div>
                    <div style="color:#f8fafc;font-size:20px;font-weight:800;line-height:1;">${sleepHours.toFixed(1)}<span style="font-size:11px;color:#94a3b8;font-weight:600;"> hrs</span></div>
                    <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Sleep</div>
                    <div style="color:#94a3b8;font-size:11px;margin-top:6px;">${sleepRating}</div>
                  </div>
                </td>
                <!-- Focus -->
                <td width="33%" style="padding:0 4px;">
                  <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;border:1px solid #334155;">
                    <div style="font-size:22px;margin-bottom:4px;">🧠</div>
                    <div style="color:#f8fafc;font-size:20px;font-weight:800;line-height:1;">${focusMins}<span style="font-size:11px;color:#94a3b8;font-weight:600;"> min</span></div>
                    <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Focus</div>
                    <div style="color:#94a3b8;font-size:11px;margin-top:6px;">${focusRating}</div>
                  </div>
                </td>
                <!-- Mood -->
                <td width="33%" style="padding-left:8px;">
                  <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;border:1px solid #334155;">
                    <div style="font-size:22px;margin-bottom:4px;">😊</div>
                    <div style="color:${moodColor};font-size:18px;font-weight:800;line-height:1;">${moodLabel.split(' ')[0]}</div>
                    <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Mood</div>
                    <div style="color:${moodColor};font-size:11px;margin-top:6px;">${moodLabel.split(' ').slice(1).join(' ')}</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Habits Table -->
            ${habitRows ? `
            <div style="margin-bottom:24px;">
              <h2 style="color:#e2e8f0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">Habit Log</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
                <thead>
                  <tr style="background:#1e293b;">
                    <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Habit</th>
                    <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Category</th>
                    <th style="padding:10px 12px;text-align:right;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  ${habitRows}
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Motivational Footer -->
            <div style="background:linear-gradient(135deg,rgba(0,102,255,0.1),rgba(124,58,237,0.1));border:1px solid rgba(0,102,255,0.2);border-radius:12px;padding:20px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                ${completionPct === 100
                  ? '🎉 <strong style="color:#10b981;">Perfect day!</strong> All habits completed. Keep the streak going!'
                  : completionPct >= 75
                  ? '💪 <strong style="color:#0066FF;">Strong effort!</strong> You\'re building great momentum.'
                  : completionPct >= 50
                  ? '🌱 <strong style="color:#f59e0b;">Solid progress.</strong> Every step forward counts!'
                  : '🔥 <strong style="color:#f59e0b;">Tomorrow is a new chance</strong> to crush your habits!'}
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#080d1a;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#334155;font-size:11px;">
              Sent by <strong style="color:#0066FF;">SleekHabits</strong> · Your personal habit tracker
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends the daily summary email via Resend API.
 * @param {object} params
 * @param {string} params.toEmail  - Recipient email address
 * @param {string} params.date     - "YYYY-MM-DD"
 * @param {number} params.sleepHours
 * @param {number} params.focusMins
 * @param {number} params.moodScore
 * @param {Array}  params.habitUpdates - [{ id, value }]
 * @param {Array}  params.habits       - full habits array from context (for names/targets)
 * @param {string} params.userName     - display name of the user
 */
export async function sendDailySummaryEmail({
  toEmail,
  date,
  sleepHours,
  focusMins,
  moodScore,
  habitUpdates,
  habits,
  userName
}) {
  if (!RESEND_API_KEY) {
    console.warn('[emailService] VITE_RESEND_API_KEY is not set. Skipping email.');
    return;
  }
  if (!toEmail) {
    console.warn('[emailService] No recipient email. Skipping.');
    return;
  }

  const [y, m, d] = date.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric'
  });

  const html = buildEmailHTML({ date, sleepHours, focusMins, moodScore, habitUpdates, habits, userName });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `✨ Your Daily Habit Summary — ${label}`,
        html
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[emailService] Resend API error:', err);
      return { success: false, error: err };
    }

    const data = await res.json();
    console.log('[emailService] Email sent successfully:', data.id);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[emailService] Network error sending email:', err);
    return { success: false, error: err.message };
  }
}
