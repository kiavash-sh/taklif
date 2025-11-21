const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'متفرقه'];

async function loadAndRender() {
    try {
        const res = await fetch('data.json', { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        // تغییر اصلی اینجاست: دریافت کل آبجکت
        const data = await res.json();
        // استخراج آرایه تسک‌ها
        const tasks = data.tasks || []; 

        // Group tasks by day
        const grouped = {};
        DAYS.forEach(d => grouped[d] = []);
        tasks.forEach(t => {
            const day = t.day || 'متفرقه';
            if (grouped[day]) {
                grouped[day].push(t);
            }
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
                empty.style.opacity = '0.6'; // کمی کمرنگ‌تر برای زیبایی
                empty.textContent = 'تکلیفی ثبت نشده';
                list.appendChild(empty);
            } else {
                tasksForDay.forEach(t => {
                    const el = document.createElement('div');
                    el.className = 'task';

                    const title = document.createElement('div');
                    title.className = 'title';
                    title.textContent = t.title || '';
                    el.appendChild(title);

                    const desc = document.createElement('div');
                    desc.className = 'desc';
                    desc.textContent = t.description || '';
                    el.appendChild(desc);

                    if (t.categories && t.categories.length > 0) {
                        const cat = document.createElement('div');
                        cat.className = 'categories';
                        cat.textContent = 'دسته‌ها: ' + t.categories.join(', ');
                        el.appendChild(cat);
                    }
                    
                    list.appendChild(el);
                });
            }

            card.appendChild(list);
            cardsContainer.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        document.getElementById('cards').innerHTML = '<div class="card error-card" style="color: #ff7b72;">خطا در بارگذاری تکالیف. لطفا فایل data.json را بررسی کنید.</div>';
    }
}

window.addEventListener('DOMContentLoaded', loadAndRender);