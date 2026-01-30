let CONFIG = {
    parents: ["", ""],
    colors: ["#60a5fa", "#f472b6"],
    cycleDays: 7,
    swapDay: 5, // 5 = Friday
    scheduleType: 'weekly', // 'weekly', 'weekend', or 'split'
    anchorDate: null,
    anchorParentIndex: null,
    anchorDayOffset: 0, // Day X of their turn
    p1Days: 3,
    p2Days: 4,
    isSynced: false
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
        if (parsed.anchorDate) {
            CONFIG.anchorDate = new Date(parsed.anchorDate);
            CONFIG.isSynced = true;
        }
        if (parsed.anchorParentIndex !== undefined) CONFIG.anchorParentIndex = parsed.anchorParentIndex;
        if (parsed.anchorDayOffset !== undefined) CONFIG.anchorDayOffset = parsed.anchorDayOffset;
        if (parsed.p1Days !== undefined) CONFIG.p1Days = parsed.p1Days;
        if (parsed.p2Days !== undefined) CONFIG.p2Days = parsed.p2Days;

        // UI Sync
        document.getElementById('schedule-type-select').value = CONFIG.scheduleType;
        document.getElementById('swap-day-select').value = CONFIG.swapDay;
        document.getElementById('p1-name').value = CONFIG.parents[0];
        document.getElementById('p2-name').value = CONFIG.parents[1];
        document.getElementById('p1-days-select').value = CONFIG.p1Days;
        document.getElementById('p2-days-select').value = CONFIG.p2Days;

        updateSyncLabel();
        syncDropdownToCurrent();
        toggleModeUI();
    }
}

function saveSettings() {
    localStorage.setItem('kidswap_config', JSON.stringify({
        scheduleType: CONFIG.scheduleType,
        swapDay: CONFIG.swapDay,
        parents: CONFIG.parents,
        anchorDate: CONFIG.anchorDate ? CONFIG.anchorDate.toISOString() : null,
        anchorParentIndex: CONFIG.anchorParentIndex,
        anchorDayOffset: CONFIG.anchorDayOffset,
        p1Days: CONFIG.p1Days,
        p2Days: CONFIG.p2Days
    }));
}

function updateSyncLabel() {
    const questionLabel = document.getElementById('sync-question-label');
    const syncDropdown = document.getElementById('current-parent-sync');
    const splitSyncDetails = document.getElementById('split-sync-details');

    // Add placeholder if not synced
    if (!CONFIG.isSynced) {
        if (!document.getElementById('sync-placeholder')) {
            const placeholder = document.createElement('option');
            placeholder.id = 'sync-placeholder';
            placeholder.value = "";
            placeholder.text = "Select...";
            placeholder.disabled = true;
            placeholder.selected = true;
            syncDropdown.prepend(placeholder);
        }
    }

    const p1 = CONFIG.parents[0] || "";
    const p2 = CONFIG.parents[1] || "";

    const p1Days = parseInt(document.getElementById('p1-days-select').value);
    const p2Days = parseInt(document.getElementById('p2-days-select').value);

    const p1Label = document.getElementById('p1-days-label');
    const p2Label = document.getElementById('p2-days-label');

    if (p1Label) {
        if (p1) {
            const suffix = p1Days === 1 ? "Day On" : "Days On";
            p1Label.textContent = `${p1}'s ${suffix}`;
        } else {
            p1Label.textContent = "";
        }
    }
    if (p2Label) {
        if (p2) {
            const suffix = p2Days === 1 ? "Day On" : "Days On";
            p2Label.textContent = `${p2}'s ${suffix}`;
        } else {
            p2Label.textContent = "";
        }
    }

    if (CONFIG.scheduleType === 'split') {
        questionLabel.textContent = "Which parent is currently on duty?";
        syncDropdown.querySelector('option[value="0"]').text = p1;
        syncDropdown.querySelector('option[value="1"]').text = p2;
        splitSyncDetails.style.display = 'block';
        updateTurnDayOptions();
    } else if (CONFIG.scheduleType === 'weekend') {
        questionLabel.textContent = "Who has the next weekend?";
        syncDropdown.querySelector('option[value="0"]').text = p1 + "'s weekend";
        syncDropdown.querySelector('option[value="1"]').text = p2 + "'s weekend";
        splitSyncDetails.style.display = 'none';
    } else {
        questionLabel.textContent = "Who's week is it currently?";
        syncDropdown.querySelector('option[value="0"]').text = p1 + "'s week";
        syncDropdown.querySelector('option[value="1"]').text = p2 + "'s week";
        splitSyncDetails.style.display = 'none';
    }
}

function updateTurnDayOptions() {
    const turnDaySelect = document.getElementById('current-turn-day');
    const selectedParent = parseInt(document.getElementById('current-parent-sync').value);
    const dayCount = (selectedParent === 1) ? CONFIG.p2Days : CONFIG.p1Days;

    let html = '';
    for (let i = 1; i <= dayCount; i++) {
        html += `<option value="${i}">Day ${i} of ${dayCount}</option>`;
    }
    turnDaySelect.innerHTML = html;
}

function toggleModeUI() {
    const type = CONFIG.scheduleType;
    document.getElementById('standard-swap-section').style.display = type === 'split' ? 'none' : 'block';
    document.getElementById('split-quantity-section').style.display = type === 'split' ? 'flex' : 'none';
    updateSyncLabel();
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
    if (!CONFIG.isSynced) return;
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
        toggleModeUI();
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
        updateTurnDayOptions();
    });

    document.getElementById('current-turn-day').addEventListener('change', () => {
        performSync();
    });

    // Update single-click sync for Weekly/Weekend, but need multi-step for Split
    document.getElementById('current-parent-sync').addEventListener('change', (e) => {
        if (CONFIG.scheduleType !== 'split') {
            performSync();
        }
    });

    document.getElementById('p1-days-select').addEventListener('change', (e) => {
        CONFIG.p1Days = parseInt(e.target.value);
        if (CONFIG.scheduleType === 'split') {
            updateTurnDayOptions();
            updateSyncLabel();
        }
        saveSettings();
        updateUI();
        renderCalendar();
    });

    document.getElementById('p2-days-select').addEventListener('change', (e) => {
        CONFIG.p2Days = parseInt(e.target.value);
        if (CONFIG.scheduleType === 'split') {
            updateTurnDayOptions();
            updateSyncLabel();
        }
        saveSettings();
        updateUI();
        renderCalendar();
    });
}

function performSync() {
    const parentVal = document.getElementById('current-parent-sync').value;
    if (parentVal === "") return;
    const selectedParentIndex = parseInt(parentVal);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (CONFIG.scheduleType === 'split') {
        const turnDay = parseInt(document.getElementById('current-turn-day').value);
        CONFIG.isSynced = true;
        CONFIG.anchorDate = today;
        CONFIG.anchorParentIndex = selectedParentIndex;
        CONFIG.anchorDayOffset = turnDay;
    } else {
        let startPoint;
        if (CONFIG.scheduleType === 'weekend') {
            startPoint = getNextSwapDate(today);
        } else {
            startPoint = getStartOfWeek(today, CONFIG.swapDay);
        }
        CONFIG.isSynced = true;
        CONFIG.anchorDate = startPoint;
        CONFIG.anchorParentIndex = selectedParentIndex;
        CONFIG.anchorDayOffset = 1; // Not used for weekly/weekend, but set for consistency
    }

    const placeholder = document.getElementById('sync-placeholder');
    if (placeholder) placeholder.remove();

    saveSettings();
    updateUI();
    renderCalendar();
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
    if (!CONFIG.isSynced || !CONFIG.anchorDate) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (CONFIG.scheduleType === 'split') {
        const cycleTotal = CONFIG.p1Days + CONFIG.p2Days;
        const diffDays = Math.floor((d.getTime() - CONFIG.anchorDate.getTime()) / (1000 * 60 * 60 * 24));

        // anchorDayOffset is 1-based (Day 1 of turn)
        // We normalize everything to 0-based for the math
        let dayInSequence = (diffDays + (CONFIG.anchorDayOffset - 1)) % cycleTotal;
        if (CONFIG.anchorParentIndex === 1) {
            dayInSequence = (dayInSequence + CONFIG.p1Days) % cycleTotal;
        }

        if (dayInSequence < 0) dayInSequence += cycleTotal;
        return (dayInSequence < CONFIG.p1Days) ? 0 : 1;
    }

    // Weekly/Weekend logic (standard 7-day cycle)
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

    if (CONFIG.scheduleType === 'split') {
        let currentParent = getParentForDate(d);
        if (currentParent === null) return d;

        let checkDate = new Date(d);
        while (getParentForDate(checkDate) === currentParent) {
            checkDate.setDate(checkDate.getDate() + 1);
        }
        return checkDate;
    }

    const currentDay = d.getDay();
    let daysToWait = (CONFIG.swapDay - currentDay + 7) % 7;
    if (daysToWait === 0) daysToWait = 7;
    d.setDate(d.getDate() + daysToWait);
    return d;
}

function updateUI() {
    const parentIndex = getParentForDate(state.viewDate);
    const parentDisplay = document.getElementById('current-parent-display');
    const swapInfoEl = document.getElementById('next-swap-info');

    if (parentIndex === null) {
        parentDisplay.textContent = "";
        parentDisplay.style.color = "var(--text-muted)";
        swapInfoEl.textContent = "";
        return;
    }

    const parentName = CONFIG.parents[parentIndex] || `Parent ${parentIndex + 1}`;
    const parentColor = CONFIG.colors[parentIndex];

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
    swapInfoEl.textContent = `Next swap: ${nextSwap.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
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
        const color = pIndex !== null ? CONFIG.colors[pIndex] : "transparent";
        const hasColor = pIndex !== null;

        // In weekend mode, only color the actual weekends
        if (CONFIG.scheduleType === 'weekend') {
            const dayNum = d.getDay();
            const isWeekend = (dayNum === 5 || dayNum === 6 || dayNum === 0);
            if (isWeekend && hasColor) {
                dayDiv.style.borderBottom = `3px solid ${color}`;
            } else {
                dayDiv.style.borderBottom = `none`;
            }
        } else {
            if (hasColor) {
                dayDiv.style.borderBottom = `3px solid ${color}`;
            } else {
                dayDiv.style.borderBottom = `none`;
            }
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

        dayDiv.addEventListener('click', () => {
            state.viewDate = new Date(d);
            updateUI();
            renderCalendar();
        });

        grid.appendChild(dayDiv);
    }
}

init();
