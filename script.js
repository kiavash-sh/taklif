const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه','متفرقه'];

async function loadAndRender() {
  try {
    const res = await fetch('data.json', { cache:'no-store' });
    const tasks = await res.json();
    const grouped = {};
    DAYS.forEach(d => grouped[d] = []);
    tasks.forEach(t => {
      const day = t.day || 'متفرقه';
      grouped[day].push(t);
    });

    const cards = document.getElementById('cards');
    cards.innerHTML = '';

    DAYS.forEach(day => {
      const card = document.createElement('article');
      card.className = 'card';
      const h = document.createElement('h3');
      h.className = 'day-title';
      h.textContent = day;
      card.appendChild(h);

      const list = document.createElement('div');

      if ((grouped[day] || []).length === 0) {
        const empty = document.createElement('div');
        empty.className = 'task';
        empty.textContent = 'تکلیفی ثبت نشده';
        list.appendChild(empty);
      } else {
        (grouped[day] || []).forEach(t => {
          const el = document.createElement('div');
          el.className = 'task';

          const title = document.createElement('div');
          title.className = 'title';
          title.textContent = t.title || '';

          const desc = document.createElement('div');
          desc.className = 'desc';
          desc.textContent = t.description || '';

          if (t.categories) {
            const cat = document.createElement('div');
            cat.className = 'categories';
            cat.textContent = 'دسته‌ها: ' + t.categories.join(', ');
            el.appendChild(cat);
          }

          el.appendChild(title);
          el.appendChild(desc);
          list.appendChild(el);
        });
      }

      card.appendChild(list);
      cards.appendChild(card);
    });
  } catch(err) {
    console.error(err);
    document.getElementById('cards').innerHTML = '<div class="card">خطا در بارگذاری تکالیف</div>';
  }
}

window.addEventListener('DOMContentLoaded', loadAndRender);
