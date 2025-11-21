const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'متفرقه'];
let globalTasks = []; 

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " سال پیش";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ماه پیش";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " روز پیش";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ساعت پیش";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " دقیقه پیش";
    return "لحظاتی پیش";
}

function generateTaskId(task) {
    const str = `${task.title}-${task.day}-${task.description?.substring(0,10)}`;
    return str.replace(/\s/g, '').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '');
}

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function checkNewTasks(tasks) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const storedTaskIds = JSON.parse(localStorage.getItem('knownTasks') || '[]');
    const currentTaskIds = tasks.map(t => generateTaskId(t));
    const newItems = tasks.filter(t => !storedTaskIds.includes(generateTaskId(t)));

    if (newItems.length > 0 && storedTaskIds.length > 0) {
        const msg = newItems.length === 1 
            ? `تکلیف جدید: ${newItems[0].title}` 
            : `${newItems.length} تکلیف جدید اضافه شد!`;
            
        new Notification("سیستم کلاسی 904", {
            body: msg,
            icon: 'favicon.ico'
        });
    }
    localStorage.setItem('knownTasks', JSON.stringify(currentTaskIds));
}

// پارامتر دوم (isFilterUpdate) مشخص می‌کند که آیا این رندر ناشی از فیلتر است یا لود اولیه
function renderTasks(tasksToRender, isFilterUpdate = false) {
    const cardsContainer = document.getElementById('cards');
    cardsContainer.innerHTML = '';

    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');
    const grouped = {};
    DAYS.forEach(d => grouped[d] = []);
    
    tasksToRender.forEach(t => {
        const day = t.day || 'متفرقه';
        if (grouped[day]) grouped[day].push(t);
    });

    DAYS.forEach((day, index) => {
        const tasksForDay = grouped[day] || [];

        // اگر فیلتر شده و تسک ندارد، نمایش نده
        if (tasksForDay.length === 0 && globalTasks.length !== tasksToRender.length) {
            return; 
        }

        const card = document.createElement('article');
        card.className = 'card';

        // --- مدیریت انیمیشن ---
        if (isFilterUpdate) {
            // اگر فیلتر است، انیمیشن حذف شود تا پرش نداشته باشد
            card.style.animation = 'none';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        } else {
            // اگر لود اولیه است، انیمیشن داشته باشد
            card.style.animation = `fadeIn 0.5s ease forwards ${index * 50}ms`;
        }

        const h3 = document.createElement('h3');
        h3.className = 'day-title';
        h3.textContent = day;
        card.appendChild(h3);

        const list = document.createElement('div');

        if (tasksForDay.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'task';
            empty.style.opacity = '0.6';
            empty.textContent = 'تکلیفی برای این روز ثبت نشده';
            list.appendChild(empty);
        } else {
            tasksForDay.forEach(t => {
                const taskId = generateTaskId(t);
                const isDone = completedTasks[taskId];

                const el = document.createElement('div');
                el.className = `task ${isDone ? 'completed' : ''}`;

                const checkWrapper = document.createElement('label');
                checkWrapper.className = 'task-checkbox-wrapper';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-checkbox';
                checkbox.checked = isDone || false;
                
                checkbox.addEventListener('change', (e) => {
                    const currentStatus = JSON.parse(localStorage.getItem('completedTasks') || '{}');
                    if (e.target.checked) {
                        el.classList.add('completed');
                        currentStatus[taskId] = true;
                    } else {
                        el.classList.remove('completed');
                        delete currentStatus[taskId];
                    }
                    localStorage.setItem('completedTasks', JSON.stringify(currentStatus));
                    
                    const statusFilter = document.getElementById('status-filter').value;
                    if (statusFilter !== 'all') {
                        // اینجا هم چون کاربر کلیک کرده، انیمیشن نمیخواهیم
                        applyFilters();
                    }
                });

                checkWrapper.appendChild(checkbox);
                el.appendChild(checkWrapper);

                const title = document.createElement('div');
                title.className = 'title';
                title.textContent = t.title || '';
                el.appendChild(title);

                const desc = document.createElement('div');
                desc.className = 'desc';
                desc.textContent = t.description || '';
                el.appendChild(desc);

                if (t.created_at) {
                    const timeBadge = document.createElement('div');
                    timeBadge.className = 'time-badge';
                    timeBadge.innerHTML = `<span>⏱ ${timeAgo(t.created_at)}</span>`;
                    el.appendChild(timeBadge);
                }
                
                list.appendChild(el);
            });
        }

        card.appendChild(list);
        cardsContainer.appendChild(card);
    });

    if (cardsContainer.innerHTML === '') {
        cardsContainer.innerHTML = '<div style="text-align:center; color:var(--text-secondary); width:100%; padding:20px;">هیچ تکلیفی با این مشخصات یافت نشد.</div>';
    }
}

function populateSubjectFilter(tasks) {
    const subjectSelect = document.getElementById('subject-filter');
    while (subjectSelect.options.length > 1) subjectSelect.remove(1);
    const subjects = [...new Set(tasks.map(t => t.title.trim()))].sort();
    subjects.forEach(subj => {
        if(subj) {
            const option = document.createElement('option');
            option.value = subj;
            option.textContent = subj;
            subjectSelect.appendChild(option);
        }
    });
}

function applyFilters() {
    const subjectVal = document.getElementById('subject-filter').value;
    const timeVal = document.getElementById('time-filter').value; // مقدار فیلتر زمان
    const statusVal = document.getElementById('status-filter').value;
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');

    const now = new Date();

    const filtered = globalTasks.filter(t => {
        // 1. فیلتر درس
        if (subjectVal !== 'all' && t.title.trim() !== subjectVal) {
            return false;
        }

        // 2. فیلتر وضعیت
        if (statusVal !== 'all') {
            const taskId = generateTaskId(t);
            const isDone = !!completedTasks[taskId];
            if (statusVal === 'completed' && !isDone) return false;
            if (statusVal === 'pending' && isDone) return false;
        }

        // 3. فیلتر زمان (جدید)
        if (timeVal !== 'all') {
            if (!t.created_at) return false; // اگر زمان ندارد حذف شود
            
            const taskDate = new Date(t.created_at);
            const diffSeconds = (now - taskDate) / 1000; // اختلاف به ثانیه

            if (timeVal === '1h' && diffSeconds > 3600) return false;       // بیشتر از ۱ ساعت
            if (timeVal === '24h' && diffSeconds > 86400) return false;     // بیشتر از ۲۴ ساعت
            if (timeVal === '3d' && diffSeconds > 259200) return false;     // بیشتر از ۳ روز
            if (timeVal === '1w' && diffSeconds > 604800) return false;     // بیشتر از ۱ هفته
        }

        return true;
    });

    // ارسال true به معنی این است که این رندر ناشی از فیلتر است (انیمیشن خاموش)
    renderTasks(filtered, true);
}

async function init() {
    try {
        requestNotificationPermission();

        const res = await fetch('data.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('Network error');
        
        const data = await res.json();
        globalTasks = Array.isArray(data) ? data : (data.tasks || []);

        checkNewTasks(globalTasks);
        populateSubjectFilter(globalTasks);
        
        // رندر اولیه (false یعنی انیمیشن روشن باشد)
        renderTasks(globalTasks, false);

        document.getElementById('subject-filter').addEventListener('change', applyFilters);
        document.getElementById('time-filter').addEventListener('change', applyFilters); // ایونت جدید
        document.getElementById('status-filter').addEventListener('change', applyFilters);

    } catch (err) {
        console.error(err);
        document.getElementById('cards').innerHTML = '<div class="card error-card">خطا در دریافت اطلاعات</div>';
    }
}

window.addEventListener('DOMContentLoaded', init);