const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'متفرقه'];

async function loadAndRender() {
    try {
        // Fetch data from the JSON file
        const res = await fetch('data.json', { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const tasks = await res.json();

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
        cardsContainer.innerHTML = ''; // Clear previous content

        // Render cards for each day
        DAYS.forEach((day, index) => {
            const card = document.createElement('article');
            card.className = 'card';
            // Add a staggered animation delay
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
        document.getElementById('cards').innerHTML = '<div class="card error-card">خطا در بارگذاری تکالیف. لطفا از وجود فایل data.json و درستی محتوای آن اطمینان حاصل کنید.</div>';
    }
}

// Run the function when the page is loaded
window.addEventListener('DOMContentLoaded', loadAndRender);