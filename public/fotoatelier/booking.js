const find = (id) => document.getElementById(id);
const form = find('inquiryForm');
const slot = find('slot');
const submit = form.querySelector('[type="submit"]');
const status = find('bookingStatus');
const pragueDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague' }).format(new Date());
const earliest = new Date(pragueDate + 'T12:00:00');
earliest.setDate(earliest.getDate() + 7);
const firstMonth = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
const month = new Date(firstMonth);
const times = Array.from({ length: 21 }, (_, i) =>
  String(10 + Math.floor(i / 3)) + ':' + String((i % 3) * 20).padStart(2, '0')
);
let selected = '';
let loadingSlots;
let sending = false;

function iso(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}

function calendar() {
  find('month').textContent = month.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
  find('prev').disabled = month <= firstMonth;
  const root = find('calendar');
  root.replaceChildren();
  for (const label of ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']) {
    const heading = document.createElement('span');
    heading.textContent = label;
    root.append(heading);
  }
  for (let i = 0; i < (month.getDay() + 6) % 7; i++) root.append(document.createElement('span'));

  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= days; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
    const button = document.createElement('button');
    const dateKey = iso(date);
    const active = dateKey === selected;
    button.type = 'button';
    button.textContent = day;
    button.disabled = date < earliest || ![0, 5, 6].includes(date.getDay());
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.dataset.date = dateKey;
    button.onclick = () => {
      if (sending) return;
      selected = dateKey;
      find('picked').textContent = 'Vybraný den: ' + date.toLocaleDateString('cs-CZ');
      status.textContent = '';
      calendar();
      root.querySelector('[aria-pressed="true"]').focus();
      loadSlots();
    };
    root.append(button);
  }
}

async function loadSlots() {
  loadingSlots?.abort();
  const controller = new AbortController();
  loadingSlots = controller;
  slot.replaceChildren(new Option('Načítám časy…', ''));
  slot.disabled = true;
  submit.disabled = true;
  try {
    const response = await fetch('/api/fotoatelier?date=' + encodeURIComponent(selected), {
      signal: controller.signal, cache: 'no-store',
    });
    if (!response.ok) throw new Error();
    const { booked } = await response.json();
    if (controller.signal.aborted) return;
    const occupied = new Set(booked);
    const available = times.some((time) => !occupied.has(time));
    slot.replaceChildren(new Option(available ? 'Vyberte čas' : 'Všechny časy jsou obsazené', ''));
    for (const time of times) {
      const taken = occupied.has(time);
      const option = new Option(time + (taken ? ' – obsazeno' : ''), time);
      option.disabled = taken;
      slot.add(option);
    }
    slot.disabled = !available;
  } catch {
    if (controller.signal.aborted) return;
    slot.replaceChildren(new Option('Časy se nepodařilo načíst', ''));
    status.textContent = 'Klikněte znovu na vybraný den a zkuste načíst časy.';
  }
}

find('prev').onclick = () => { month.setMonth(month.getMonth() - 1); calendar(); };
find('next').onclick = () => { month.setMonth(month.getMonth() + 1); calendar(); };
slot.onchange = () => { submit.disabled = !slot.value; };
submit.disabled = true;
calendar();

form.onsubmit = async (event) => {
  event.preventDefault();
  if (sending || !selected || !times.includes(slot.value)) return;
  sending = true;
  submit.disabled = true;
  const data = Object.fromEntries(new FormData(form));
  slot.disabled = true;
  status.textContent = 'Odesílám rezervaci…';
  try {
    const response = await fetch('/api/fotoatelier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, datum: selected }),
    });
    const result = await response.json();
    if (!response.ok) {
      status.textContent = result.error;
      if (response.status === 409) {
        await loadSlots();
      } else {
        slot.disabled = false;
        submit.disabled = false;
      }
      return;
    }
    form.reset();
    status.textContent = 'Žádost je přijatá. Fotograf vás kontaktuje s potvrzením termínu.';
    await loadSlots();
  } catch {
    status.textContent = 'Odeslání se nepodařilo ověřit. Zkontrolujte dostupnost termínu.';
    await loadSlots();
  } finally {
    sending = false;
  }
};
