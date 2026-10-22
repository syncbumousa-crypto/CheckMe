// ============================================================
// # 📈 🖥️  THE WINDOWS AT THE BOTTOM OF THE SCREEN
// # 🔤 JavaScript
// # 🎯 Builds the twelve month buttons, and opens the one window
// #    that serves both the performance button and every month
// # 🔗 Loads after the board, and reads the board's live days through
// #    the hook it leaves behind rather than out of the store: the
// #    store holds what was last SAVED, and saving waits a moment
// #    after the last click. All the counting here is done with
// #    `CheckMeDayBoard.score`, the same one the grid used before the
// #    result column was taken off it -- the figure was never thrown
// #    away, it only moved to where it is read on purpose
// ============================================================
(() => {
  const B = window.CheckMeDayBoard;

  const MONTHS = ['يناير', 'فبراير', 'مارس', 'ابريل', 'ماي', 'يونيو',
    'جولاي', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const now = new Date();
  const YEAR = now.getFullYear();

  const days = () => (window.CheckMeBoardLive ? window.CheckMeBoardLive() : B.read()).days;

  // Only days that hold an answer are counted. An untouched day is
  // not a day of nought: counting three hundred blank days into the
  // share would bury every day that was actually lived
  const written = (month) => Object.entries(days())
    .filter(([date, line]) => date.startsWith(`${YEAR}-`) &&
      (!month || Number(date.slice(5, 7)) === month) && line !== B.blank());

  // ============================================================
  // # 🪟 🔀  OPENING AND SHUTTING THE ONE WINDOW
  // # 🔤 JavaScript
  // # 🎯 Puts a title and a body into the window and shows it, and
  // #    closes it on the cross, on the dark around it, and on Escape
  // # 🔗 Three ways out, because a window over the whole board with
  // #    one way out is a trap on a phone, where the cross is the
  // #    smallest thing on the screen. The board underneath keeps its
  // #    scroll, so closing puts the reader back exactly where he was
  // ============================================================
  const panel = () => $('panel');

  function open(title, html) {
    $('panel-title').textContent = title;
    $('panel-body').innerHTML = html;
    panel().hidden = false;
  }

  const close = () => { panel().hidden = true; };

  // ============================================================
  // # 🧮 📊  WHAT THE PERFORMANCE WINDOW COUNTS
  // # 🔤 JavaScript
  // # 🎯 The year in one figure, then every month, then every one of
  // #    the thirty things with how often it was done
  // # 🔗 Two different denominators, and keeping them apart is the
  // #    whole honesty of this window. A MONTH is measured against
  // #    the days in it that were written in, times thirty. An ITEM
  // #    is measured against the number of days written in, because
  // #    an item has exactly one chance a day. Mixing the two would
  // #    make a line look strong in a month that was barely filled in
  // ============================================================
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  const doneIn = rows => rows.reduce((sum, [, line]) => sum + B.score(line).done, 0);

  function yearBlock() {
    const rows = written();
    const done = doneIn(rows);
    const possible = rows.length * B.N;
    return `<p class="big"><b>${pct(done, possible)}%</b>` +
      `<span>${done} من ${possible} · ${rows.length} يومًا مكتوبًا من سنة ${YEAR}</span></p>`;
  }

  function monthsBlock() {
    let out = '<h3>الأشهر</h3><table class="stat"><tr>' +
      '<th>الشهر</th><th>أيام مكتوبة</th><th>تم</th><th>النسبة</th><th></th></tr>';
    for (let m = 1; m <= 12; m++) {
      const rows = written(m);
      const done = doneIn(rows);
      const share = pct(done, rows.length * B.N);
      out += `<tr${m === now.getMonth() + 1 ? ' class="lead"' : ''}><td>${MONTHS[m - 1]}</td>` +
        (rows.length
          ? `<td class="n">${rows.length}</td><td class="n">${done}</td><td class="n">${share}%</td>` +
            `<td class="meter"><div style="width:${share}%"></div></td>`
          : '<td class="none">—</td><td class="none">—</td><td class="none">—</td><td class="meter empty"><div></div></td>') +
        '</tr>';
    }
    return out + '</table>';
  }

  function itemsBlock() {
    const rows = written();
    const hue = {};
    B.GROUPS.forEach(g => (hue[g.id] = g.hue));

    const tally = B.ITEMS.map((it, i) => {
      let done = 0;
      rows.forEach(([, line]) => { if (line[i] === B.DONE) done++; });
      return { ...it, done, share: pct(done, rows.length) };
    }).sort((a, b) => b.share - a.share);

    let out = '<h3>البنود الثلاثون، من الأكثر إلى الأقلّ</h3>' +
      '<table class="stat"><tr><th>البند</th><th>تم</th><th>من الأيام المكتوبة</th><th></th></tr>';
    tally.forEach(t => {
      out += `<tr><td><i class="group-dot" style="--hue:${hue[t.g]}"></i>${esc(t.label)}</td>` +
        `<td class="n">${t.done}</td><td class="n">${t.share}%</td>` +
        `<td class="meter${t.done ? '' : ' empty'}"><div style="width:${t.share}%"></div></td></tr>`;
    });
    return out + '</table>';
  }

  const trackHtml = () => written().length
    ? yearBlock() + monthsBlock() + itemsBlock()
    : '<p class="awaiting"><b>لا شيء مكتوبٌ بعد</b>' +
      'اضغط مربّعات يومك في الجدول، ثمّ عُد إلى هنا.</p>';

  // ============================================================
  // # 🗓️ 🚧  A WINDOW FOR EACH MONTH, STILL EMPTY
  // # 🔤 JavaScript
  // # 🎯 Opens a window named after the month that was pressed, and
  // #    says in it that its contents are still to be decided
  // # 🔗 Built as a shell on purpose. The owner said he would spell
  // #    out what goes in these and asked to leave them a while, so
  // #    the button, the window and the title are ready and the body
  // #    waits. Filling it with a guess would be work to undo
  // ============================================================
  const monthHtml = m => {
    const rows = written(m);
    const line = rows.length
      ? `${rows.length} يومًا مكتوبًا في هذا الشهر.`
      : 'لا يوم مكتوبًا في هذا الشهر بعد.';
    return `<p class="awaiting"><b>${line}</b>` +
      'وما يُعرَض في هذه النافذة بانتظار تفصيلك.</p>';
  };

  // ============================================================
  // # 🧰 🔘  THE BUTTONS IN THE DOCK
  // # 🔤 JavaScript
  // # 🎯 Writes the twelve month buttons and hangs every press on the
  // #    one window
  // # 🔗 The twelve names live here and not in the page, so there is
  // #    one list to change and not two. The month of today is marked,
  // #    because it is the one the reader is almost always after
  // ============================================================
  function start() {
    $('dock-months').innerHTML = MONTHS.map((name, k) =>
      `<button class="month-btn${k === now.getMonth() ? ' is-now' : ''}" type="button" ` +
      `data-m="${k + 1}">${name}</button>`).join('');

    $('track-btn').onclick = () => open('تتبّع أدائك', trackHtml());

    $('dock-months').addEventListener('click', e => {
      const btn = e.target.closest('.month-btn');
      if (btn) open(`${MONTHS[Number(btn.dataset.m) - 1]} ${YEAR}`, monthHtml(Number(btn.dataset.m)));
    });

    $('panel-close').onclick = close;
    panel().addEventListener('click', e => { if (e.target === panel()) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel().hidden) close();
    });
  }

  start();
})();
