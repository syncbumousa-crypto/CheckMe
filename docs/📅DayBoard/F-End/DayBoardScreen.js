// ============================================================
// # 🗓️ 🖥️  THE YEAR ON ONE SCREEN
// # 🔤 JavaScript
// # 🎯 Everything the visitor sees of the board: the strip on top and
// #    the twelve months of day rows. Clicking a square turns it, the
// #    page saves itself, and the year rides up to the owner's Drive
// # 🔗 All the knowing lives in the store file: what the thirty things
// #    are, how a day is written down, how it is counted, and how it
// #    travels to Drive. This file only draws them and hands clicks
// #    back. The names here sit inside one wrapper, so nothing of it
// #    can clash with the account files that load before it
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

  // ============================================================
  // # 🍂 🔴  WHAT A PAST BLANK IS DRAWN AS
  // # 🔤 JavaScript
  // # 🎯 Turns the stored value of one square into the value shown
  // #    on screen: a blank on a day already past is drawn as not
  // #    done
  // # 🔗 Only the DRAWING changes. The square underneath is still
  // #    blank, so clicking it runs the ordinary round -- blank to
  // #    done to not-done and back -- and the third press returns
  // #    it to the red it was showing before anyone touched it.
  // #    The rule starts at the first day ever written, because a
  // #    board not yet in use is not a board being failed
  // ============================================================
  const TODAY_ISO = B.todayISO();
  let ripeFrom = null;

  const findRipeFrom = () => {
    const written = Object.keys(board.days).filter(d => board.days[d] !== B.blank()).sort();
    ripeFrom = written[0] || null;
  };

  const shown = (date, ch) =>
    (ch === B.NONE && ripeFrom && date >= ripeFrom && date < TODAY_ISO) ? B.MISS : ch;
  let place = null;
  let saveTimer = null, pushTimer = null;

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
    const tag = document.createElement('style');
    tag.textContent = layout.map(g => `.g-${g.id} { --hue: ${g.hue}; }`).join('\n');
    document.head.appendChild(tag);
  };

  const edgeOf = (() => {
    const marks = [];
    layout.forEach((g, gi) => g.bands.forEach((b, bi) => b.items.forEach((it, ii) => {
      marks[it.i] = ii === 0 ? (bi === 0 ? ' group-start' : ' band-start') : '';
    })));
    return i => marks[i] || '';
  })();

  const groupOf = B.ITEMS.map(it => it.g);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

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
  // #    without the code holding a map of eleven thousand things.
  // #    There is no result column: the owner asked for the score to
  // #    live behind the page, and it does -- `CheckMeDayBoard.score`
  // #    works it out from the day whenever anything needs it, so
  // #    nothing is stored twice and nothing can fall out of step
  // ============================================================
  // ============================================================
  // # 📏 🪚  THE COLUMNS ARE TOLD THEIR WIDTH, NOT ASKED
  // # 🔤 JavaScript
  // # 🎯 Writes one `col` per column with a width worked out from how
  // #    much room the group name needs over the columns it spans
  // # 🔗 Without this the table measures its own contents and every
  // #    column came out forty odd pixels instead of thirty, which
  // #    pushed the grid past the edge of the screen for no reason the
  // #    eye could see. The widest demand is never a square -- it is a
  // #    GROUP NAME stretched over its columns, and a group of one
  // #    column has to carry its whole name alone. So each group is
  // #    asked what it needs, divided by how many columns it has, and
  // #    nothing is wider than it must be
  // ============================================================
  const MONTH_W = 46, DAY_W = 104;

  const colWidths = (() => {
    const per = g => Math.max(30, Math.ceil((g.label.length * 7 + 16) / g.items.length));
    const out = [];
    layout.forEach(g => g.items.forEach(() => out.push(per(g))));
    return out;
  })();

  // The table is given the sum as its own width. The `col` widths plus
  // `table-layout: fixed` ought to be enough on their own, and they
  // were not: the table went on drawing itself two hundred pixels
  // wider than the columns it contains, because a table whose width is
  // `auto` is free to decide, and it decided from the contents the
  // fixed layout was supposed to stop it reading. Told a number, it
  // has nothing left to decide
  const TABLE_W = MONTH_W + DAY_W + colWidths.reduce((a, b) => a + b, 0);

  const columns = () =>
    `<colgroup><col style="width:${MONTH_W}px"><col style="width:${DAY_W}px">` +
    colWidths.map(w => `<col style="width:${w}px">`).join('') + '</colgroup>';

  function head() {
    let r1 = '<tr><th class="month" rowspan="3"></th>' +
      '<th class="day" rowspan="3"><button class="jump" type="button" id="go-today" ' +
      'title="اذهب إلى يومك">اليوم</button></th>';
    let r2 = '<tr>';
    let r3 = '<tr>';

    layout.forEach(g => {
      r1 += `<th class="group g-${g.id} group-start" colspan="${g.items.length}">${esc(g.label)}</th>`;
      g.bands.forEach(b => {
        r2 += `<th class="band g-${g.id}${edgeOf(b.items[0].i)}" colspan="${b.items.length}">` +
          `${esc(b.sub)}</th>`;
        b.items.forEach(it => {
          r3 += `<th class="item g-${g.id}${edgeOf(it.i)}"><span>${esc(it.label)}</span></th>`;
        });
      });
    });

    return columns() + `<thead>${r1}</tr>${r2}</tr>${r3}</tr></thead>`;
  }

  function dayRow(y, m, d) {
    const date = key(y, m, d);
    const line = board.days[date] || B.blank();
    const w = dayOfWeek(y, m, d);
    const flags = (date === TODAY ? ' is-today' : '') + (w === 5 ? ' is-friday' : '');

    let cells = '';
    for (let i = 0; i < B.N; i++) {
      cells += `<td class="cell g-${groupOf[i]}${edgeOf(i)}" data-d="${date}" data-i="${i}"` +
        ` data-v="${shown(date, line[i])}" tabindex="-1" title="${esc(B.ITEMS[i].label)}"></td>`;
    }

    return `<tr class="row${flags}" data-d="${date}">` +
      `<th class="day"><b>${d}</b> <i>${DAYS[w]}</i></th>${cells}</tr>`;
  }

  function monthBlock(y, m) {
    const n = lengthOf(y, m);
    let rows = '';
    for (let d = 1; d <= n; d++) rows += dayRow(y, m, d);
    const first = rows.indexOf('<th class="day">');
    const withMonth = rows.slice(0, first) +
      `<th class="month" rowspan="${n}"><span>${MONTHS[m - 1]}</span></th>` + rows.slice(first);
    return `<tbody id="m-${m}" data-m="${m}">${withMonth}</tbody>`;
  }

  const grid = () => {
    let html = head();
    for (let m = 1; m <= 12; m++) html += monthBlock(year, m);
    return `<table class="year" style="width:${TABLE_W}px">${html}</table>`;
  };

  // ============================================================
  // # 💾 ☁️  SAVING HERE, THEN SAVING THERE
  // # 🔤 JavaScript
  // # 🎯 Writes every change into this browser at once, and up into
  // #    the Drive file a few seconds later
  // # 🔗 Two waits, not one, and they are different lengths on
  // #    purpose. The browser write is cheap, so it only waits long
  // #    enough to let a burst of clicks settle. The Drive write
  // #    crosses the network and rewrites the whole year, so it waits
  // #    longer: a morning of ticking is thirty clicks, and thirty
  // #    uploads of the same file would be thirty chances to collide
  // #    with each other. Nothing is lost by waiting, because the
  // #    browser copy is already safe before the first second passes
  // ============================================================
  const badge = state => {
    const btn = $('who-btn');
    if (!btn) return;
    btn.classList.toggle('is-off', state === 'out');
    btn.classList.toggle('is-synced', state === 'drive');
    btn.textContent =
      state === 'drive' ? 'محفوظ في درايفك' :
      state === 'out' ? 'اربط حسابك ودرايفك' : 'على هذا الجهاز فقط';
  };

  const say = text => { const n = $('board-note'); if (n) n.textContent = text; };

  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!B.write(board)) say('لم يُحفَظ: متصفّحك يمنع التخزين لهذا الموقع.');
    }, 300);

    if (!place) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      try {
        const n = await B.push(place.drive_file_id);
        say(`حُفظ في درايفك: ${n} يومًا.`);
      } catch (e) { say('تعذّر الحفظ في درايف: ' + e.message); }
    }, 2500);
  };

  function turn(cell) {
    const date = cell.dataset.d, i = Number(cell.dataset.i);
    const line = board.days[date] || B.blank();
    const value = B.next(line[i]);
    const updated = B.put(line, i, value);
    if (updated === B.blank()) delete board.days[date]; else board.days[date] = updated;
    cell.dataset.v = shown(date, value);
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
  // #    times is a worse evening than holding the arrow and tapping
  // #    the space bar
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
        const rows = [...table.querySelectorAll('tr.row')];
        const to = rows[rows.indexOf(cell.closest('tr')) + vert]?.querySelector(`td.cell[data-i="${i}"]`);
        if (to) { e.preventDefault(); to.focus(); }
      }
    });

    const first = table.querySelector('td.cell');
    if (first) first.tabIndex = 0;
  }

  // ============================================================
  // # 🎯 📍  BRINGING A ROW OUT FROM UNDER THE HEAD
  // # 🔤 JavaScript
  // # 🎯 Scrolls the grid so a given element sits just below the three
  // #    frozen head rows instead of behind them
  // # 🔗 Measured from where things actually ARE on screen, not from
  // #    `offsetTop`. A row's offsetTop is counted from whichever
  // #    ancestor happens to be positioned, which is not the scrolling
  // #    box here, so it only looked right while the box happened to
  // #    sit near the top of the page. Subtracting the head is the
  // #    whole point: a frozen head floats OVER the grid, so a row
  // #    scrolled to the top of the box lands underneath it unseen
  // ============================================================
  function bring(el, smooth) {
    const wrap = $("grid-wrap");
    if (!wrap || !el) return;
    const headH = wrap.querySelector('thead').getBoundingClientRect().height;
    const offset = el.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
    wrap.scrollTo({ top: wrap.scrollTop + offset - headH - 8, behavior: smooth ? 'smooth' : 'auto' });
  }

  const goToToday = smooth => bring(document.querySelector(`tr.row[data-d="${TODAY}"]`), smooth);

  function draw() {
    findRipeFrom();
    const wrap = $("grid-wrap");
    wrap.innerHTML = grid();

    // Measured, not guessed: the three head rows are different heights
    // and the wrapped item names decide the tallest one. The month name
    // sticks just under whatever that comes to
    const headBox = wrap.querySelector('thead');
    wrap.style.setProperty('--head-h', `${Math.round(headBox.getBoundingClientRect().height)}px`);

    wireGrid(wrap);
    $('go-today').onclick = () => goToToday(true);
  }

  // ============================================================
  // # ☁️ 🤝  FINDING THE FILE, AND BRINGING THE YEAR DOWN
  // # 🔤 JavaScript
  // # 🎯 Works out whether there is a live Drive file to use, pulls
  // #    what is in it into the board, and pushes back what this
  // #    device knows that it did not
  // # 🔗 Three things have to be true and each is CHECKED, not hoped
  // #    for: a Google permission that has not expired, a remembered
  // #    place, and a file still sitting where the place says. The
  // #    owner may move, bin or delete his own file at any time, so a
  // #    remembered id is a claim and `fileAlive` is the proof. The
  // #    push after the pull is what carries a year typed before the
  // #    link ever existed up into the account on the first visit
  // ============================================================
  async function connectDrive() {
    const C = window.CheckMeCloud;
    place = null;

    if (!window.checkMeSignedIn) return badge('out');
    if (!C.remember()) { badge('local'); return say('درايف غير مربوط الآن. افتح الحساب واضغط تسجيل الدخول.'); }

    const found = await C.loadProfile().catch(() => null);
    const bad = C.placeTrouble ? C.placeTrouble() : '';
    if (!found || !found.drive_file_id) {
      badge('local');
      return say(bad ? 'قاعدة البيانات ردّت: ' + bad : 'لم تُحدَّد بعد مكان الحفظ في درايف.');
    }

    if (!(await C.fileAlive(found.drive_file_id).catch(() => false))) {
      badge('local');
      return say('ملفّك في درايف غير موجود. افتح الحساب واختر مكانًا جديدًا.');
    }

    place = found;
    try {
      const got = await B.pull(place.drive_file_id);
      board = B.read();
      draw();
      goToToday(false);
      const n = await B.push(place.drive_file_id);
      badge('drive');
      say(`متّصل بدرايفك: ${got.inFile} يومًا في الملفّ، و${n} يومًا بعد الدمج.` +
        (bad ? ' (المؤشّر محفوظ على هذا الجهاز فقط: ' + bad + ')' : ''));
    } catch (e) {
      badge('local');
      say('تعذّر الوصول إلى الملفّ: ' + e.message);
    }
  }

  // ============================================================
  // # 🔑 🪟  THE ACCOUNT BUTTON AND ITS SHEET
  // # 🔤 JavaScript
  // # 🎯 Opens the account sheet, closes it, and tries the Drive again
  // #    whenever the visitor signs in or out
  // # 🔗 The account panels are not rebuilt or moved: their own file
  // #    still drives them by the same ids. This only opens and shuts
  // #    the sheet they sit in, and listens for the two messages that
  // #    file already sends out
  // ============================================================
  function wireAccount() {
    const sheet = $('account-sheet');

    badge(window.checkMeSignedIn ? 'local' : 'out');
    document.addEventListener('signed-in', connectDrive);
    document.addEventListener('signed-out', () => { place = null; badge('out'); say(''); });

    $('who-btn').onclick = () => { sheet.hidden = false; };
    $('sheet-close').onclick = () => { sheet.hidden = true; connectDrive(); };
    sheet.addEventListener('click', e => { if (e.target === sheet) { sheet.hidden = true; connectDrive(); } });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !sheet.hidden) { sheet.hidden = true; connectDrive(); }
    });
  }

  // ============================================================
  // # 🚀 🧩  PUTTING IT ON THE PAGE
  // # 🔤 JavaScript
  // # 🎯 Draws the year, wires everything, lands the view on today,
  // #    and then reaches for Drive
  // # 🔗 The board is drawn from the browser copy FIRST and the Drive
  // #    is asked afterwards. The other order would leave the owner
  // #    looking at nothing while the network is thought about, and
  // #    would leave him with nothing at all on a morning with no
  // #    signal. The body is given a class so the stylesheet can undo
  // #    the centring the shell does, instead of the shell having to
  // #    know that a board exists
  // ============================================================
  function start() {
    document.body.classList.add('has-board');
    hueStyle();
    draw();
    wireAccount();
    goToToday(false);
    connectDrive();
  }

  start();
})();
