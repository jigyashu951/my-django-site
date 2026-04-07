/**
 * HabitFlow Logic
 * Handles Streaks, History Tracking, and LocalStorage
 */

// 1. Data Initialization
let habits = JSON.parse(localStorage.getItem('habitFlowData')) || [];
let history = JSON.parse(localStorage.getItem('habitFlowHistory')) || {}; 

// 2. Core Functions
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDateDisplay');
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString(undefined, options);
    }
}

function addHabit() {
    const input = document.getElementById('habitInput');
    if (!input.value.trim()) return;

    const newHabit = {
        id: Date.now(),
        name: input.value,
        completedToday: false,
        lastCompletedDate: null,
        streak: 0
    };

    habits.push(newHabit);
    input.value = "";
    saveAndRender();
}

function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    const todayStr = new Date().toLocaleDateString();
    
    // Calculate Yesterday string for streak validation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();

    if (!habit.completedToday) {
        // If last completion was yesterday, increment streak
        if (habit.lastCompletedDate === yesterdayStr) {
            habit.streak++;
        } 
        // If they missed days, reset streak to 1
        else if (habit.lastCompletedDate !== todayStr) {
            habit.streak = 1;
        }
        
        habit.completedToday = true;
        habit.lastCompletedDate = todayStr;
    } else {
        // Undo completion
        habit.completedToday = false;
        // Logic: if they "undo" today, we revert streak to what it was
        if (habit.streak > 0) habit.streak--;
        habit.lastCompletedDate = yesterdayStr; 
    }
    
    saveAndRender();
}

function checkDailyReset() {
    const todayStr = new Date().toLocaleDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();

    habits.forEach(h => {
        // If the date has changed since last visit, uncheck the visual 'done' state
        if (h.lastCompletedDate !== todayStr) {
            h.completedToday = false;
        }
        
        // If the last completion wasn't today AND wasn't yesterday, the streak is broken
        if (h.lastCompletedDate !== todayStr && h.lastCompletedDate !== yesterdayStr) {
            h.streak = 0;
        }
    });
}

function clearAll() {
    if(confirm("This will delete all habits and history. Proceed?")) {
        habits = [];
        history = {};
        localStorage.clear();
        render();
    }
}

// 3. Storage & UI Rendering
function saveAndRender() {
    const todayStr = new Date().toLocaleDateString();
    
    // Update the history object with today's actual performance
    const total = habits.length;
    const done = habits.filter(h => h.completedToday).length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    
    history[todayStr] = percentage;

    // Save to LocalStorage
    localStorage.setItem('habitFlowData', JSON.stringify(habits));
    localStorage.setItem('habitFlowHistory', JSON.stringify(history));
    
    render();
}

function render() {
    checkDailyReset();
    
    const pendingList = document.getElementById('pendingHabits');
    const completedList = document.getElementById('completedHabits');
    
    if (!pendingList || !completedList) return;

    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    habits.forEach(habit => {
        const item = document.createElement('div');
        item.className = 'habit-item';
        item.innerHTML = `
            <div>
                <strong>${habit.name}</strong>
                <span class="streak-badge">🔥 ${habit.streak}</span>
            </div>
            <button onclick="toggleHabit(${habit.id})" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">
                ${habit.completedToday ? '✨' : '⭕'}
            </button>
        `;
        
        if (habit.completedToday) {
            completedList.appendChild(item);
        } else {
            pendingList.appendChild(item);
        }
    });

    drawGraph();
}

// 4. Graph Logic (Strict History)
function drawGraph() {
    const graph = document.getElementById('progressGraph');
    if (!graph) return;
    
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    graph.innerHTML = "";

    // Generate a rolling 7-day window
    for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() - i);
        const dStr = targetDate.toLocaleDateString();
        const dayLabel = daysShort[targetDate.getDay()];
        
        // Fetch actual percentage from our history object
        const percentage = history[dStr] || 0;

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${Math.max(percentage, 5)}%`; // 5% min height for visibility
        bar.setAttribute('data-day', dayLabel);

        // Styling for the current day
        if (i === 0) {
            bar.style.background = 'var(--accent)';
            bar.style.boxShadow = '0 0 15px var(--accent)';
            bar.style.filter = 'brightness(1.2)';
        } else {
            bar.style.background = 'rgba(255, 255, 255, 0.2)';
        }

        graph.appendChild(bar);
    }
}

// 5. App Initialization
window.onload = () => {
    updateDate();
    render();
};