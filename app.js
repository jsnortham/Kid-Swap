let CONFIG = {
    parents: ["Dad", "Mom"],
    colors: ["#60a5fa", "#f472b6"],
    cycleDays: 7,
    swapDay: 5, // 5 = Friday
    scheduleType: 'weekly', // 'weekly' or 'weekend'
    anchorDate: new Date('2026-01-23T00:00:00'),
    anchorParentIndex: 1
};

const state = {
    viewDate: new Date()
};

function loadSettings() {
    const saved = localStorage.getItem('kidswap_config');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scheduleType) CONFIG.scheduleType = parsed.scheduleType;
        if (parsed.swapDay !== undefined) CONFIG.swapDay = parseInt(parsed.swapDay);
        if (parsed.parents) CONFIG.parents = parsed.parents;
        if (parsed.anchorDate) CONFIG.anchorDate = new Date(parsed.anchorDate);
        if (parsed.anchorParentIndex !== undefined) CONFIG.anchorParentIndex = parsed.anchorParentIndex;

        // UI Sync
        document.getElementById('schedule-type-select').value = CONFIG.scheduleType;
        document.getElementById('swap-day-select').value = CONFIG.swapDay;
        document.getElementById('p1-name').value = CONFIG.parents[0];
        document.getElementById('p2-name').value = CONFIG.parents[1];

        updateSyncLabel();
        syncDropdownToCurrent();
    }
}

function saveSettings() {
    localStorage.setItem('kidswap_config', JSON.stringify({
        scheduleType: CONFIG.scheduleType,
        swapDay: CONFIG.swapDay,
        parents: CONFIG.parents,
        anchorDate: CONFIG.anchorDate.toISOString(),
        anchorParentIndex: CONFIG.anchorParentIndex
    }));
}

function updateSyncLabel() {
    const questionLabel = document.getElementById('sync-question-label');
    const options = document.getElementById('current-parent-sync').options;

    if (CONFIG.scheduleType === 'weekend') {
        questionLabel.textContent = "Who has the next weekend?";
        options[0].text = CONFIG.parents[0] + "'s weekend";
        options[1].text = CONFIG.parents[1] + "'s weekend";
    } else {
        questionLabel.textContent = "Who's week is it currently?";
        options[0].text = CONFIG.parents[0] + "'s week";
        options[1].text = CONFIG.parents[1] + "'s week";
    }
}

function updateSwapDayOptions() {
    const swapSelect = document.getElementById('swap-day-select');
    const currentValue = swapSelect.value;

    if (CONFIG.scheduleType === 'weekend') {
        swapSelect.innerHTML = `
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
        `;
        if (currentValue !== "5" && currentValue !== "6") {
            CONFIG.swapDay = 5;
            swapSelect.value = "5";
        } else {
            swapSelect.value = currentValue;
        }
    } else {
        swapSelect.innerHTML = `
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
            <option value="0">Sunday</option>
        `;
        swapSelect.value = CONFIG.swapDay;
    }
}

function syncDropdownToCurrent() {
    const today = new Date();
    const currentIndex = getParentForDate(today);
    document.getElementById('current-parent-sync').value = currentIndex;
}

function init() {
    loadSettings();
    updateSwapDayOptions();
    updateSyncLabel();
    updateUI();
    renderCalendar();

    // Schedule Type
    document.getElementById('schedule-type-select').addEventListener('change', (e) => {
        CONFIG.scheduleType = e.target.value;
        updateSwapDayOptions();
        updateSyncLabel();
        saveSettings();
        updateUI();
        renderCalendar();
    });

    // Navigation
    document.getElementById('prev-week').addEventListener('click', () => {
        state.viewDate.setDate(state.viewDate.getDate() - 7);
        updateUI();
        renderCalendar();
    });

    document.getElementById('next-week').addEventListener('click', () => {
        state.viewDate.setDate(state.viewDate.getDate() + 7);
        updateUI();
        renderCalendar();
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        state.viewDate = new Date();
        updateUI();
        renderCalendar();
    });

    // Lookup
    document.getElementById('jump-btn').addEventListener('click', () => {
        const input = document.getElementById('jump-date-input').value;
        if (input) {
            const targetDate = new Date(input + 'T12:00:00');
            const parentIndex = getParentForDate(targetDate);
            const parentName = CONFIG.parents[parentIndex];
            const resultEl = document.getElementById('lookup-result');

            const suffix = CONFIG.scheduleType === 'weekend' ? "'s weekend" : "'s week";
            resultEl.textContent = `${parentName}${suffix}`;
            resultEl.style.color = CONFIG.colors[parentIndex];

            state.viewDate = targetDate;
            updateUI();
            renderCalendar();
        }
    });

    // Config Listeners
    document.getElementById('swap-day-select').addEventListener('change', (e) => {
        CONFIG.swapDay = parseInt(e.target.value);
        saveSettings();
        updateUI();
        renderCalendar();
    });

    document.getElementById('p1-name').addEventListener('input', (e) => {
        CONFIG.parents[0] = e.target.value;
        updateSyncLabel();
        saveSettings();
        updateUI();
    });

    document.getElementById('p2-name').addEventListener('input', (e) => {
        CONFIG.parents[1] = e.target.value;
        updateSyncLabel();
        saveSettings();
        updateUI();
    });

    document.getElementById('current-parent-sync').addEventListener('change', (e) => {
        const selectedParentIndex = parseInt(e.target.value);
        const today = new Date();

        let startPoint;
        if (CONFIG.scheduleType === 'weekend') {
            // For weekend sync, we find the NEXT weekend start (Friday)
            startPoint = getNextSwapDate(today);
        } else {
            // For weekly sync, we find the start of the CURRENT week
            startPoint = getStartOfWeek(today, CONFIG.swapDay);
        }

        CONFIG.anchorDate = startPoint;
        CONFIG.anchorParentIndex = selectedParentIndex;

        saveSettings();
        updateUI();
        renderCalendar();
    });
}

function getStartOfWeek(dt, swapDay) {
    const res = new Date(dt);
    const day = res.getDay();
    const diff = (day - swapDay + 7) % 7;
    res.setDate(res.getDate() - diff);
    res.setHours(0, 0, 0, 0);
    return res;
}

function getParentForDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // Weekly logic: Every 7 days
    if (CONFIG.scheduleType === 'weekly') {
        const weekStartAnchor = getStartOfWeek(CONFIG.anchorDate, CONFIG.swapDay);
        const weekStartTarget = getStartOfWeek(d, CONFIG.swapDay);
        const diffTime = weekStartTarget.getTime() - weekStartAnchor.getTime();
        const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
        let parentIndex = (CONFIG.anchorParentIndex + diffWeeks) % 2;
        if (parentIndex < 0) parentIndex += 2;
        return parentIndex;
    }

    // Weekend logic: Alternating weekends
    // A weekend is defined by the week it falls in (the swapDay cycle)
    const weekStartAnchor = getStartOfWeek(CONFIG.anchorDate, CONFIG.swapDay);
    const weekStartTarget = getStartOfWeek(d, CONFIG.swapDay);
    const diffTime = weekStartTarget.getTime() - weekStartAnchor.getTime();
    const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
    let parentIndex = (CONFIG.anchorParentIndex + diffWeeks) % 2;
    if (parentIndex < 0) parentIndex += 2;
    return parentIndex;
}

function getNextSwapDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const currentDay = d.getDay();
    let daysToWait = (CONFIG.swapDay - currentDay + 7) % 7;
    if (daysToWait === 0) daysToWait = 7;
    d.setDate(d.getDate() + daysToWait);
    return d;
}

function updateUI() {
    const parentIndex = getParentForDate(state.viewDate);
    const parentName = CONFIG.parents[parentIndex];
    const parentColor = CONFIG.colors[parentIndex];

    const parentDisplay = document.getElementById('current-parent-display');

    if (CONFIG.scheduleType === 'weekend') {
        // Find if viewDate is a weekend (Fri-Sun)
        const day = state.viewDate.getDay();
        const isWeekend = (day === 5 || day === 6 || day === 0);

        if (isWeekend) {
            parentDisplay.textContent = `Weekend with ${parentName}`;
        } else {
            parentDisplay.textContent = `Next weekend: ${parentName}`;
        }
    } else {
        parentDisplay.textContent = `${parentName}'s week`;
    }

    parentDisplay.style.color = parentColor;

    const nextSwap = getNextSwapDate(state.viewDate);
    document.getElementById('next-swap-info').textContent = `Next swap: ${nextSwap.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const baseDate = new Date(state.viewDate);
    baseDate.setDate(baseDate.getDate() - 7);
    const start = new Date(baseDate);
    start.setDate(start.getDate() - start.getDay());

    for (let i = 0; i < 21; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.textContent = d.getDate();

        const pIndex = getParentForDate(d);
        const color = CONFIG.colors[pIndex];

        // In weekend mode, only color the actual weekends
        if (CONFIG.scheduleType === 'weekend') {
            const dayNum = d.getDay();
            const isWeekend = (dayNum === 5 || dayNum === 6 || dayNum === 0);
            if (isWeekend) {
                dayDiv.style.borderBottom = `3px solid ${color}`;
            } else {
                dayDiv.style.borderBottom = `none`;
            }
        } else {
            dayDiv.style.borderBottom = `3px solid ${color}`;
        }

        if (d.getMonth() !== state.viewDate.getMonth()) {
            dayDiv.style.opacity = '0.3';
        }

        if (d.toDateString() === state.viewDate.toDateString()) {
            dayDiv.classList.add('active');
            dayDiv.setAttribute('style', `--glow-color: ${color};`);
            if (CONFIG.scheduleType === 'weekly' || (d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0)) {
                dayDiv.style.borderBottom = `3px solid ${color}`;
            }
        }

        grid.appendChild(dayDiv);
    }
}

init();
