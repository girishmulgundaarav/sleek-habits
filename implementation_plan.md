# Implementation Plan - Daily Quick Log Center Modal

We will design and implement a unified **Daily Quick Log Center Modal** to let users record all daily habits, sleep, focus minutes, and mood logs at once.

---

## User Review Required

> [!IMPORTANT]
> - A new **"⚡ Quick Log Day"** button will be positioned next to the calendar navigation bar in the header.
> - Clicking this button will display a full-featured, glassmorphic Quick Log Dashboard.
> - The modal automatically fetches all active user habits scheduled for the selected date and renders matching input fields.
> - **Unified Submission**: Clicking **"Save Daily Logs"** submits all metric updates to the context state, updates Supabase logs, checks off progress, and triggers celebrations (confetti & SleekCoach feedback) in a single action.

---

## Proposed Changes

### Components & Layout

#### [NEW] [QuickLogModal.jsx](file:///Users/girishmulgund/Learnings/habit-tracker/src/components/QuickLogModal.jsx)
- Create a new state-driven modal component.
- **Visual Design**: Sleek glassmorphic overlay, structured section grids, dark mode support, and Outfit typography.
- **Section 1: Daily Wellness Stats**:
  - **Sleep**: Input slider/box for sleep hours (range: `0 - 16` hrs).
  - **Focus Mins**: Quick increment buttons (`+15m`, `+30m`, `+60m`) or a number input.
  - **Mood & Energy**: Interactive face buttons (Awful, Meh, Good, High, Peak).
  - **Water Intake**: Quick loggers (`+250ml`, `+500ml`) alongside standard input.
- **Section 2: Dynamic Habits checklist**:
  - Automatically fetches habits scheduled for `selectedDate` from context.
  - Renders custom loggers:
    - **Progress-based habits**: Displays current value, target value, unit, and `+`/`-` quick step adjustment buttons.
    - **Boolean habits**: Renders a glassmorphic checkmark checkbox.
- **Unified Actions**:
  - **Save Logs**: Checks updated states, fires context mutators (`updateSleepLog`, `changeFocus`, `updateMoodEnergy`, `changeHabitProgress`, `toggleHabit`), plays sound feedback, triggers confetti on complete, and closes.
  - Supports Esc key closures and clicking outside to dismiss.

#### [MODIFY] [Header.jsx](file:///Users/girishmulgund/Learnings/habit-tracker/src/components/Header.jsx)
- Import `<QuickLogModal />` from `./QuickLogModal`.
- Add local state `const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);`.
- Render a **"⚡ Quick Log"** button in the Date Navigator strip (next to the Chevron navigation controls, line 436).
- Trigger `setIsQuickLogOpen(true)` on click.
- Conditionally render `<QuickLogModal onClose={() => setIsQuickLogOpen(false)} />` when `isQuickLogOpen` is true.

---

## Verification Plan

### Automated Tests
- Run `npm run lint` to guarantee clean imports and syntax.
- Run `npm run build` to confirm clean compiler bundle execution.

### Manual Verification
- Open `http://localhost:5174/` as a guest.
- Click the **"⚡ Quick Log"** button in the header date bar.
- Modify all inputs (e.g. log 8h sleep, add 30m focus, set mood to Peak, log 500ml water, and complete 2 habits).
- Click **"Save Daily Logs"**.
- Verify that:
  - The Quick Log modal closes cleanly.
  - Dashboard cards for Sleep, Focus, Mood, and Habits update instantly to match the logged inputs.
  - XP progress levels increase dynamically in the header profile.
