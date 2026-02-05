# KidSwap | Custody & Week Tracker

KidSwap is a simple, intuitive web application designed to help co-parents track custody schedules. It visualizes "Who has the kids?" for weekly rotations, alternating weekends, or split-day schedules, removing the need to count weeks on a calendar manually.

## Features

-   **Flexible Schedule Types**:
    -   **Weekly Rotation**: Standard week-on/week-off schedule.
    -   **Alternating Weekends**: Track who has the weekend (Fri-Sun).
    -   **Split Days**: Custom day rotations (e.g., 2 days Mom, 2 days Dad, 5 days Mom, 5 days Dad, or any custom split like 3/4).
-   **Customizable**:
    -   Set custom parent names (e.g., "Mom", "Dad", "House A", "House B").
    -   Choose your specific "Swap Day" (e.g., Fridays).
-   **Sync Helper**: Easily "anchor" the schedule by answering a simple question: "Who has the kids right now?"
-   **Future & Past Lookup**:
    -   Interactive mini-calendar to scroll through weeks.
    -   "Jump to Date" feature to quickly check a specific holiday or future date (e.g., "Who has the kids on Christmas?").
-   **Privacy Focused**:
    -   **No Login Required**.
    -   **Local Storage Only**: All settings are saved directly to your browser/device. No data is sent to any server.

## Usage

1.  Open the application in your browser.
2.  **Setup**:
    -   Select your **Schedule Type** (Weekly, Weekend, or Split).
    -   Enter **Parent Names**.
    -   (If Split) Define how many days each parent has in the rotation.
3.  **Sync**:
    -   Under "Who's week is it currently?", select the correct parent.
    -   The app effectively "anchors" the rotation to today's date.
4.  **View**:
    -   The main status card shows who is currently on duty or who has the upcoming weekend.
    -   Use the calendar or date picker to plan ahead.

## Tech Stack

-   **Frontend**: HTML5, Vanilla JavaScript.
-   **Styling**: CSS3 with Glassmorphism effects (`backdrop-filter`) and a modern dark theme.
-   **Storage**: `localStorage` for persisting user preferences.

## License

This project is for personal use and educational purposes.
