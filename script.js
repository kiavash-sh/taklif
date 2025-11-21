const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'متفرقه'];

// تابع تبدیل تاریخ به "چند وقت پیش"
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

// تولید شناسه یکتا برای هر تسک جهت ذخیره در لوکال استوریج
function generateTaskId(task) {
    // ترکیب عنوان، روز و تاریخ برای ساخت یک شناسه تقریبا یکتا
    const str = `${task.title}-${task.day}-${task.description?.substring(0,10)}`;
    // تبدیل به یک رشته ساده بدون فاصله
    return str.replace(/\s/g, '').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '');
}

// درخواست مجوز نوتیفیکیشن
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

// بررسی تکالیف جدید برای نوتیفیکیشن
function checkNewTasks(tasks) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const storedTaskIds = JSON.parse(localStorage.getItem('knownTasks') || '[]');
    const currentTaskIds = tasks.map(t => generateTaskId(t));
    
    // پیدا کردن تسک‌هایی که در لیست قبلی نبودند
    const newItems = tasks.filter(t => !storedTaskIds.includes(generateTaskId(t)));

    if (newItems.length > 0 && storedTaskIds.length > 0) {
        // اگر اولین بازدید نیست و تسک جدیدی هست
        const msg = newItems.length === 1 
            ? `تکلیف جدید: ${newItems[0].title}` 
            : `${newItems.length} تکلیف جدید اضافه شد!`;
            
        new Notification("سیستم کلاسی 904", {
            body: msg,
            icon: 'favicon.ico' // اگر آیکون دارید
        });
    }

    // ذخیره لیست فعلی برای بازدید بعدی
    localStorage.setItem('knownTasks', JSON.stringify(currentTaskIds));
}

async function loadAndRender() {
    try {
        requestNotificationPermission();

        const res = await fetch('data.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        const tasks = data.tasks || [];

        // بررسی نوتیفیکیشن
        checkNewTasks(tasks);

        // خواندن وضعیت تیک‌ها از لوکال استوریج
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');

        const grouped = {};
        DAYS.forEach(d => grouped[d] = []);
        tasks.forEach(t => {
            const day = t.day || 'متفرقه';
            if (grouped[day]) grouped[day].push(t);
        });

        const cardsContainer = document.getElementById('cards');
        cardsContainer.innerHTML = '';

        DAYS.forEach((day, index) => {
            const card = document.createElement('article');
            card.className = 'card';
            card.style.animationDelay = `${index * 50}ms`;

            const h3 = document.createElement('h3');
            h3.className = 'day-title';
            h3.textContent = day;
            card.appendChild(h3);

            const list = document.createElement('div');
            const tasksForDay = grouped[day] || [];

            if (tasksForDay.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'task';
                empty.style.opacity = '0.6';
                empty.style.paddingLeft = '15px'; // اصلاح پدینگ برای آیتم خالی
                empty.textContent = 'تکلیفی ثبت نشده';
                list.appendChild(empty);
            } else {
                tasksForDay.forEach(t => {
                    const taskId = generateTaskId(t);
                    const isDone = completedTasks[taskId];

                    const el = document.createElement('div');
                    el.className = `task ${isDone ? 'completed' : ''}`;

                    // --- چک‌باکس ---
                    const checkWrapper = document.createElement('label');
                    checkWrapper.className = 'task-checkbox-wrapper';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'task-checkbox';
                    checkbox.checked = isDone;
                    
                    // ایونت تغییر وضعیت چک‌باکس
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
                    });

                    checkWrapper.appendChild(checkbox);
                    el.appendChild(checkWrapper);
                    // ----------------

                    const title = document.createElement('div');
                    title.className = 'title';
                    title.textContent = t.title || '';
                    el.appendChild(title);

                    const desc = document.createElement('div');
                    desc.className = 'desc';
                    desc.textContent = t.description || '';
                    el.appendChild(desc);

                    // --- زمان انتشار ---
                    if (t.created_at) {
                        const timeBadge = document.createElement('span');
                        timeBadge.className = 'time-badge';
                        timeBadge.innerHTML = `⏱ ${timeAgo(t.created_at)}`;
                        el.appendChild(timeBadge);
                    }
                    
                    list.appendChild(el);
                });
            }

            card.appendChild(list);
            cardsContainer.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        document.getElementById('cards').innerHTML = '<div class="card error-card" style="color: #ff7b72;">خطا در بارگذاری.</div>';
    }
}

window.addEventListener('DOMContentLoaded', loadAndRender);