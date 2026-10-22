// ============================================================
// # 🗓️ 🖥️  THE YEAR ON ONE SCREEN
// # 🔤 JavaScript
// # 🎯 Everything the visitor sees of the board: the strip on top, the
// #    twelve months of day rows, the squares, and the result of each
// #    day. Clicking a square turns it, and the page saves itself
// # 🔗 All the knowing lives in the store file: what the thirty things
// #    are, how a day is written down, and how it is counted. This
// #    file only draws them and hands clicks back. The names here sit
// #    inside one wrapper, so nothing of it can clash with the account
// #    files that load before it
// ============================================================
(() => {
  const B = window.CheckMeDayBoard;

  const MONTHS = ['يناير', 'فبراير', 'مارس', 'ابريل', 'ماي', 'يونيو',
    'جولاي', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2, '0');
  const key = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

  // Dates are built in UTC and read in UTC. A date made the ordinary
  // way is made in the browser's own zone, and then the day of the
  // week of the first of a month can come back as the day before --
  // which would quietly slide every weekday in the year by one
  const dayOfWeek = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const lengthOf = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  const nowLocal = new Date();
  const TODAY = key(nowLocal.getFullYear(), nowLocal.getMonth() + 1, nowLocal.getDate());

  let year = nowLocal.getFullYear();
  let board = B.read();
  let saveTimer = null;

  // ============================================================
  // # 🧱 🏷️  THE BANDS INSIDE A GROUP
  // # 🔤 JavaScript
  // # 🎯 Walks the item list once and reports, for every group, the
  // #    bands inside it and how many items each band holds
  // # 🔗 Worked out from the list instead of written down a second
  // #    time, because a second copy is a second thing to keep right.
  // #    The religious group is five prayers by three things done
  // #    about them, and the crossing is UNEVEN -- four extra prayers,
  // #    not five, since Asr has none. Counting beats assuming
  // ============================================================
  const layout = B.GROUPS.map(g => {
    const items = [];
    B.ITEMS.forEach((it, i) => { if (it.g === g.id) items.push({ ...it, i }); });
    const bands = [];
    items.forEach(it => {
      const last = bands[bands.length - 1];
      if (last && last.sub === it.sub) last.items.push(it);
      else bands.push({ sub: it.sub, items: [it] });
    });
    return { ...g, items, bands };
  });

  const hueStyle = () => {
    const css = layout.map(g =>
      `.g-${g.id} { --hue: ${g.hue}; }`).join('\n');
    const tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);
  };

  // ============================================================
  // # 🏗️ 🧾  BUILDING THE GRID AS TEXT
  // # 🔤 JavaScript
  // # 🎯 Writes the three head rows and then every day of the year as
  // #    one piece of HTML
  // # 🔗 Built as a string and handed over in one go, not element by
  // #    element: a year is three hundred and sixty five rows of
  // #    thirty squares, which is near eleven thousand cells, and
  // #    making them one at a time is the difference between a page
  // #    that opens and a page that hangs. Each cell carries its date
  // #    and its place in the day, so a click knows what it touched
  // #    without the code holding a map of eleven thousand things
  // ============================================================
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  function head() {
    let r1 = '<tr><th class="month" rowspan="3"></th><th class="day" rowspan="3">اليوم</th>';
    let r2 = '<tr>';
    let r3 = '<tr>';

    layout.forEach((g, gi) => {
      const first = gi === 0 ? ' first' : '';
      r1 += `<th class="group g-${g.id}${first}" colspan="${g.items.length}">${esc(g.label)}</th>`;
      g.bands.forEach((b, bi) => {
        const edge = gi === 0 && bi === 0 ? ' first' : '';
        r2 += `<th class="band g-${g.id}${edge}" colspan="${b.items.length}">${esc(b.sub)}</th>`;
        b.items.forEach(it => {
          r3 += `<th class="item g-${g.id}${edgeOf(it.i)}" title="${esc(it.label)}">` +
            `<span>${esc(it.short)}</span></th>`;
        });
      });
    });

    r1 += '<th class="res-head" colspan="2" rowspan="3">نتيجة اليوم</th>';
    return `<thead>${r1}</tr>${r2}</tr>${r3}</tr></thead>`;
  }

  const edgeOf = (() => {
    const marks = [];
    layout.forEach((g, gi) => g.bands.forEach((b, bi) => b.items.forEach((it, ii) => {
      marks[it.i] = ii === 0 ? (bi === 0 ? ' group-start' : ' band-start') : '';
      if (gi === 0 && bi === 0 && ii === 0) marks[it.i] = ' group-start';
    })));
    return i => marks[i] || '';
  })();

  const groupOf = B.ITEMS.map(it => it.g);

  function dayRow(y, m, d) {
    const date = key(y, m, d);
    const line = board.days[date] || B.blank();
    const w = dayOfWeek(y, m, d);
    const flags = (date === TODAY ? ' is-today' : '') + (w === 5 ? ' is-friday' : '');

    let cells = '';
    for (let i = 0; i < B.N; i++) {
      cells += `<td class="cell g-${groupOf[i]}${edgeOf(i)}" data-d="${date}" data-i="${i}"` +
        ` data-v="${line[i]}" tabindex="-1" title="${esc(B.ITEMS[i].label)}"></td>`;
    }

    return `<tr class="row${flags}" data-d="${date}">` +
      `<th class="day"><b>${d}</b> <i>${DAYS[w]}</i></th>${cells}` +
      `<td class="res">${resText(line)}</td>` +
      `<td class="bar">${barHtml(line)}</td></tr>`;
  }

  // ============================================================
  // # 🚫 0️⃣  A DAY NEVER OPENED IS NOT A DAY OF NOUGHT
  // # 🔤 JavaScript
  // # 🎯 Writes the result of a day, or a dash when the day holds no
  // #    answer at all
  // # 🔗 This was wrong on the first run and the measuring caught it:
  // #    an untouched day read `0 / 30 · 0%`, which says the day was
  // #    lived and nothing was done. The owner's own sheet leaves such
  // #    a row blank, and three hundred empty days all claiming nought
  // #    per cent would drown the days that really were nought. The
  // #    bar is emptied too, or the dash would sit beside a bar
  // ============================================================
  const resText = line =>
    line === B.blank()
      ? '<span class="none">—</span>'
      : (s => `<b>${s.done}</b> / ${s.total}<span class="pct"> · ${s.pct}%</span>`)(B.score(line));

  // The bar is not drawn at all on an untouched day. Drawing it at
  // nought still leaves a mark, because a bar that can reach zero
  // needs a floor to stay visible at one out of thirty -- and that
  // floor was showing a two pixel green tick on three hundred days
  // nobody had opened
  const barHtml = line =>
    line === B.blank() ? '' : `<div style="width:${B.score(line).pct}%"></div>`;

  function monthBlock(y, m) {
    const n = lengthOf(y, m);
    let rows = '';
    for (let d = 1; d <= n; d++) rows += dayRow(y, m, d);
    const first = rows.indexOf('<th class="day">');
    const withMonth = rows.slice(0, first) +
      `<th class="month" rowspan="${n}"><span>${MONTHS[m - 1]}</span></th>` + rows.slice(first);
    return `<tbody id="m-${m}" data-m="${m}">${withMonth}</tbody>`;
  }

  function grid() {
    let html = head();
    for (let m = 1; m <= 12; m++) html += monthBlock(year, m);
    return `<table class="year">${html}</table>`;
  }

  // ============================================================
  // # 🧮 🔁  WHAT CHANGES WHEN ONE SQUARE CHANGES
  // # 🔤 JavaScript
  // # 🎯 Turns the square, rewrites that day's result, that month's
  // #    share and the year's share, then saves
  // # 🔗 Only the four places that actually moved are rewritten. The
  // #    plain way would be to draw the year again, and drawing eleven
  // #    thousand cells on every click would make a board that fights
  // #    back. Saving waits a moment after the last click, because a
  // #    morning of ticking is thirty clicks and the whole year would
  // #    otherwise be written out thirty times
  // ============================================================
  const monthShare = m => {
    const n = lengthOf(year, m);
    let done = 0, filled = 0;
    for (let d = 1; d <= n; d++) {
      const line = board.days[key(year, m, d)];
      if (!line || line === B.blank()) continue;
      filled++;
      done += B.score(line).done;
    }
    return { pct: filled ? Math.round((done / (filled * B.N)) * 100) : 0, filled };
  };

  function paintMonthChip(m) {
    const chip = $(`chip-${m}`);
    if (!chip) return;
    const s = monthShare(m);
    chip.querySelector('em').textContent = s.filled ? `${s.pct}%` : '—';
  }

  function paintYear() {
    let done = 0, filled = 0;
    for (const [date, line] of Object.entries(board.days)) {
      if (!date.startsWith(`${year}-`)) continue;
      filled++;
      done += B.score(line).done;
    }
    $('tally-done').textContent = done;
    $('tally-days').textContent = filled ? `من ${filled * B.N} في ${filled} يومًا مُدخَلًا` : 'لا شيء مُدخَل بعد';
  }

  function paintDay(date) {
    const row = document.querySelector(`tr.row[data-d="${date}"]`);
    if (!row) return;
    const line = board.days[date] || B.blank();
    row.querySelector('td.res').innerHTML = resText(line);
    const bar = row.querySelector('td.bar');
    if (bar) bar.innerHTML = barHtml(line);
  }

  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const ok = B.write(board);
      const note = $('board-note');
      if (note) note.textContent = ok ? '' : 'لم يُحفَظ: متصفّحك يمنع التخزين لهذا الموقع.';
    }, 400);
  };

  function turn(cell) {
    const date = cell.dataset.d, i = Number(cell.dataset.i);
    const line = board.days[date] || B.blank();
    const value = B.next(line[i]);
    const updated = B.put(line, i, value);
    if (updated === B.blank()) delete board.days[date]; else board.days[date] = updated;
    cell.dataset.v = value;
    paintDay(date);
    paintMonthChip(Number(date.slice(5, 7)));
    paintYear();
    save();
  }

  // ============================================================
  // # 👆 ⌨️  CLICKING AND WALKING
  // # 🔤 JavaScript
  // # 🎯 One listener for every square, and the arrow keys to move
  // #    between them
  // # 🔗 One listener on the table instead of one on each square: the
  // #    other way would hang eleven thousand listeners on the page.
  // #    The arrows matter more than they look: a day is thirty
  // #    squares in a row, and filling it by aiming the mouse thirty
  // #    times at a box twenty six pixels wide is a worse evening than
  // #    holding the arrow and tapping the space bar
  // ============================================================
  function wireGrid(wrap) {
    const table = wrap.querySelector('table.year');

    table.addEventListener('click', e => {
      const cell = e.target.closest('td.cell');
      if (!cell) return;
      cell.focus();
      turn(cell);
    });

    table.addEventListener('keydown', e => {
      const cell = e.target.closest('td.cell');
      if (!cell) return;
      const i = Number(cell.dataset.i);

      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); turn(cell); return; }

      // The page is right to left, so the RIGHT arrow walks towards the
      // lower numbered item, which is the one drawn further right
      const step = { ArrowRight: -1, ArrowLeft: 1 }[e.key];
      if (step !== undefined) {
        const to = table.querySelector(`td.cell[data-d="${cell.dataset.d}"][data-i="${i + step}"]`);
        if (to) { e.preventDefault(); to.focus(); }
        return;
      }

      const vert = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (vert !== undefined) {
        const row = cell.closest('tr');
        const rows = [...table.querySelectorAll('tr.row')];
        const at = rows.indexOf(row) + vert;
        const to = rows[at]?.querySelector(`td.cell[data-i="${i}"]`);
        if (to) { e.preventDefault(); to.focus(); }
      }
    });

    const first = table.querySelector('td.cell');
    if (first) first.tabIndex = 0;
  }

  // ============================================================
  // # 🧭 🔝  THE STRIP, AND GETTING TO A MONTH
  // # 🔤 JavaScript
  // # 🎯 Draws the year arrows, the running total, the twelve month
  // #    buttons and the legend, and scrolls the grid where asked
  // # 🔗 Twelve buttons are drawn whether or not a month holds
  // #    anything, because the owner asked for all the months of the
  // #    year to be there. An empty month shows a dash instead of a
  // #    share, which is a different thing from nought per cent and
  // #    has to look different
  // ============================================================
  function chips() {
    return MONTHS.map((name, k) =>
      `<button class="month-chip" type="button" id="chip-${k + 1}" data-m="${k + 1}">` +
      `${name} <em>—</em></button>`).join('');
  }

  function legend() {
    const keys = '<div class="keys">' +
      '<span><i class="k-done"></i>تم</span>' +
      '<span><i class="k-miss"></i>ماش</span>' +
      '<span><i class="k-none"></i>لم يُسجَّل</span>' +
      '</div>';
    const groups = layout.map(g =>
      `<div class="legend-group g-${g.id}"><h4>${esc(g.label)}</h4>` +
      g.items.map(it => esc(it.label)).join(' · ') + '</div>').join('');
    return keys + groups;
  }

  function scrollToMonth(m, smooth) {
    const wrap = $('grid-wrap'), body = $(`m-${m}`);
    if (!wrap || !body) return;
    const top = body.offsetTop - wrap.querySelector('thead').offsetHeight - 6;
    wrap.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    [...document.querySelectorAll('.month-chip')].forEach(c =>
      c.classList.toggle('is-now', Number(c.dataset.m) === m));
  }

  function draw() {
    $('year-now').textContent = year;
    const wrap = $('grid-wrap');
    wrap.innerHTML = grid();

    // Measured, not guessed: the three head rows are different heights
    // and the turned item labels decide the tallest one. The month name
    // sticks just under whatever that comes to
    const head = wrap.querySelector('thead');
    wrap.style.setProperty('--head-h', `${Math.round(head.getBoundingClientRect().height)}px`);

    wireGrid(wrap);
    for (let m = 1; m <= 12; m++) paintMonthChip(m);
    paintYear();
  }

  // ============================================================
  // # 🔑 🪟  THE ACCOUNT BUTTON AND ITS SHEET
  // # 🔤 JavaScript
  // # 🎯 Says whether the Drive is linked, opens the account sheet,
  // #    and closes it
  // # 🔗 The account panels are not rebuilt or moved: their own file
  // #    still drives them by the same ids. This only opens and shuts
  // #    the sheet they sit in, and reads the two messages that file
  // #    already sends out so the button can say which state we are in
  // ============================================================
  function wireAccount() {
    const sheet = $('account-sheet'), btn = $('who-btn');

    const setOff = () => { btn.textContent = 'اربط حسابك ودرايفك'; btn.classList.add('is-off'); };
    const setOn = () => { btn.textContent = 'الحساب ودرايف'; btn.classList.remove('is-off'); };

    setOff();
    document.addEventListener('signed-in', setOn);
    document.addEventListener('signed-out', setOff);
    if (window.checkMeSignedIn) setOn();

    btn.onclick = () => { sheet.hidden = false; };
    $('sheet-close').onclick = () => { sheet.hidden = true; };
    sheet.addEventListener('click', e => { if (e.target === sheet) sheet.hidden = true; });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !sheet.hidden) sheet.hidden = true;
    });
  }

  // ============================================================
  // # 🚀 🧩  PUTTING IT ON THE PAGE
  // # 🔤 JavaScript
  // # 🎯 Writes the strip, draws the year, wires everything, and lands
  // #    the view on this month
  // # 🔗 The body is given a class so the stylesheet can undo the
  // #    centring the shell does, instead of the shell having to know
  // #    that a board exists. The view lands on the current month
  // #    because the day being filled in is almost always today
  // ============================================================
  function start() {
    document.body.classList.add('has-board');
    hueStyle();

    $('board-top').innerHTML =
      '<div class="year-nav">' +
      '<button class="step" type="button" id="year-back" title="السنة السابقة">‹</button>' +
      '<span class="year-now" id="year-now"></span>' +
      '<button class="step" type="button" id="year-next" title="السنة التالية">›</button>' +
      '</div>' +
      '<div class="tally"><b id="tally-done">0</b><span id="tally-days"></span></div>' +
      '<button class="who-btn" type="button" id="who-btn"></button>' +
      `<div class="months">${chips()}</div>`;

    $('legend').innerHTML = legend();

    draw();
    wireAccount();

    $('year-back').onclick = () => { year--; draw(); scrollToMonth(1); };
    $('year-next').onclick = () => { year++; draw(); scrollToMonth(1); };
    $('board-top').addEventListener('click', e => {
      const chip = e.target.closest('.month-chip');
      if (chip) scrollToMonth(Number(chip.dataset.m), true);
    });

    scrollToMonth(nowLocal.getMonth() + 1);
  }

  start();
})();
