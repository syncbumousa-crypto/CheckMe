// ============================================================
// # 📊 🖥️  DRAWING THE FIVE MEASURES OF A MONTH
// # 🔤 JavaScript
// # 🎯 Builds the month screen: five cards on one screenful, each
// #    with its figure, its chart and a line or two under it
// # 🔗 Every number here comes from the engine and none is worked
// #    out in this file. This one only chooses the SHAPE, and the
// #    shape was chosen by the job the data has to do -- a line for
// #    change over time, cells for runs, a track for one ratio
// #    against a limit, ranked bars for `am I even`. The reasons are
// #    written out in `MonthMetricsRoadmap.md`.
// #    And the words were cut to the bone: what each card used to
// #    say in a subtitle and a paragraph now lives in the `title` of
// #    the thing it describes, one hover away and nought pixels tall
// ============================================================
(() => {
  const M = window.CheckMeMetrics;
  const B = window.CheckMeDayBoard;

  const MONTHS = ['يناير', 'فبراير', 'مارس', 'ابريل', 'ماي', 'يونيو',
    'جولاي', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];

  // The five hues passed the validator on this site's own surface:
  // every pair clears the colour-blind floor and the 3:1 contrast
  // bar against #2b2f35. They are NOT eyeballed, and none of them is
  // green or red -- those two mean done and not done on the board
  const HUE = {
    love: '#3987e5', body: '#d95926', mind: '#9085e9',
    study: '#c98500', grit: '#d55181'
  };

  const pct = v => (v === null || v === undefined ? null : Math.round(v * 100));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  // ============================================================
  // # 📐 🧭  THE DRAWING BOARD, READ FROM THE RIGHT
  // # 🔤 JavaScript
  // # 🎯 Turns a day number into an x and a share into a y, inside
  // #    one fixed viewBox
  // # 🔗 Day one sits on the RIGHT and the month runs leftward,
  // #    because the page and its reader run that way. The y scale
  // #    is pinned to nought and one always, never to the data's own
  // #    range -- a chart rescaled to its contents makes a flat bad
  // #    month look like a dramatic one. And the right margin is
  // #    now wide enough to hold the axis figures CLEAR of the plot:
  // #    they were being drawn into the same column as the first
  // #    day's label and sat on top of it
  // ============================================================
  const W = 320, H = 100, TOP = 7, BOT = 14, LEFT = 4, RIGHT = 32;

  const geo = n => ({
    x: day => (W - RIGHT) - ((day - 1) / Math.max(1, n - 1)) * (W - RIGHT - LEFT),
    y: v => TOP + (1 - v) * (H - TOP - BOT)
  });

  // Every axis figure is anchored at its END against one fixed edge,
  // so `0%`, `50%` and `100%` line up on the right however many
  // digits they carry. Anchored at the start, as they were, each one
  // began wherever its own text happened to begin and the three of
  // them came out ragged
  function frame(n) {
    const g = geo(n);
    let out = '';
    [0, 0.5, 1].forEach(v => {
      out += `<line class="grid-line" x1="${LEFT}" x2="${W - RIGHT}" y1="${g.y(v)}" y2="${g.y(v)}"/>` +
        `<text class="axis-text" x="${W - 2}" y="${g.y(v) + 3}" text-anchor="end">${v * 100}%</text>`;
    });
    out += `<line class="floor-line" x1="${LEFT}" x2="${W - RIGHT}" y1="${g.y(M.FLOOR)}" y2="${g.y(M.FLOOR)}"/>`;
    [1, n].forEach(d => {
      out += `<text class="axis-text" x="${g.x(d)}" y="${H - 2}" text-anchor="middle">${d}</text>`;
    });
    return out;
  }

  const path = (series, n) => {
    const g = geo(n);
    let d = '', pen = false;
    series.forEach(p => {
      if (p.value === null || p.value === undefined) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${g.x(p.day).toFixed(1)} ${g.y(p.value).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };

  // ============================================================
  // # 🖱️ 💬  THE HOVER LAYER, WHICH NOW CARRIES THE PROSE TOO
  // # 🔤 JavaScript
  // # 🎯 A crosshair and a label that follow the pointer across a
  // #    chart, and a label on any single mark
  // # 🔗 Shipped by default: a chart that cannot be asked `which day
  // #    was that` is a picture of data rather than the data. The
  // #    hit area is the whole plot, never the two pixel line -- a
  // #    target the width of a stroke is a target nobody hits
  // ============================================================
  const tip = (() => {
    let el = null;
    return {
      show(html, ev) {
        if (!el) { el = document.createElement('div'); el.id = 'mtip'; document.body.appendChild(el); }
        el.innerHTML = html;
        el.hidden = false;
        el.style.left = Math.max(8, Math.min(ev.clientX + 14, innerWidth - el.offsetWidth - 10)) + 'px';
        el.style.top = Math.max(8, ev.clientY - 38) + 'px';
      },
      hide() { if (el) el.hidden = true; }
    };
  })();

  function wireLine(svg, rows, n, label) {
    if (!svg) return;
    const g = geo(n);
    const cross = svg.querySelector('.cross'), dot = svg.querySelector('.dot'), hit = svg.querySelector('.hit');
    if (!hit) return;

    hit.addEventListener('mousemove', ev => {
      const box = svg.getBoundingClientRect();
      // The svg is letterboxed inside its box, so the pointer is put
      // back through the SAME transform the browser used to draw it.
      // Reading it off the box alone drifts by the letterbox margin,
      // and the crosshair lands on the wrong day by a day or two
      const scale = Math.min(box.width / W, box.height / H);
      const sx = (ev.clientX - box.left - (box.width - W * scale) / 2) / scale;
      let near = null, best = 1e9;
      rows.forEach(p => {
        if (p.value === null || p.value === undefined) return;
        const d = Math.abs(g.x(p.day) - sx);
        if (d < best) { best = d; near = p; }
      });
      if (!near) return;
      cross.setAttribute('x1', g.x(near.day)); cross.setAttribute('x2', g.x(near.day));
      cross.style.opacity = 1;
      dot.setAttribute('cx', g.x(near.day)); dot.setAttribute('cy', g.y(near.value));
      dot.style.opacity = 1;
      tip.show(`${label} · <span class="n">${near.day}</span> — <span class="n">${pct(near.value)}%</span>`, ev);
    });

    hit.addEventListener('mouseleave', () => {
      cross.style.opacity = 0; dot.style.opacity = 0; tip.hide();
    });
  }

  const lineSvg = (rows, n) =>
    `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">` +
    frame(n) +
    `<path class="series" d="${path(rows, n)}"/>` +
    `<line class="cross" y1="${TOP}" y2="${H - BOT}" x1="0" x2="0" style="opacity:0"/>` +
    `<circle class="dot" r="3.5" cx="0" cy="0" style="opacity:0"/>` +
    `<rect class="hit" x="${LEFT}" y="${TOP}" width="${W - RIGHT - LEFT}" height="${H - TOP - BOT}" fill="transparent"/>` +
    '</svg>';

  // ============================================================
  // # 🟩 🎞️  A ROW OF DAYS
  // # 🔤 JavaScript
  // # 🎯 One small cell per day of the month, in the three answers
  // #    or in on/off
  // # 🔗 The right form when the question is about RUNS. A line
  // #    through a yes-or-no series draws a sawtooth that says
  // #    nothing; a row of cells shows where the streak was and
  // #    where it broke. Day one on the right, like everything else
  // ============================================================
  function ribbon(series, n, onOff) {
    const gap = 2, cw = (W - (n - 1) * gap) / n;
    let out = `<svg viewBox="0 0 ${W} 20" preserveAspectRatio="none" role="img">`;
    for (let d = 1; d <= n; d++) {
      const hit = series.find(p => p.day === d);
      const v = hit ? hit.value : null;
      const cls = v === null || v === undefined ? 'cell-none'
        : onOff ? (v ? 'cell-on' : 'cell-off') : (v ? 'cell-done' : 'cell-miss');
      const x = W - cw - (d - 1) * (cw + gap);
      out += `<rect class="${cls}" x="${x.toFixed(1)}" y="0" width="${cw.toFixed(1)}" height="20" rx="2"` +
        ` data-day="${d}" data-v="${v === null || v === undefined ? '' : v}"/>`;
    }
    return out + '</svg>';
  }

  function wireRibbon(host, words) {
    if (!host) return;
    host.querySelectorAll('rect[data-day]').forEach(r => {
      r.addEventListener('mouseenter', ev => {
        const v = r.dataset.v;
        tip.show(`<span class="n">${r.dataset.day}</span> — ${v === '' ? words.none : (Number(v) ? words.on : words.off)}`, ev);
      });
      r.addEventListener('mouseleave', () => tip.hide());
    });
  }

  // ============================================================
  // # ▁ 🔢  ONE ROW, ONE RATIO
  // # 🔤 JavaScript
  // # 🎯 A name, a slim track and a share, with the count it came
  // #    from held in the row's tooltip
  // # 🔗 The count is not dropped, only moved. `100%` off two
  // #    answered days and `100%` off twenty eight are not the same
  // #    claim, and that is the commonest way a dashboard lies
  // #    without printing an untruth -- so it stays reachable, just
  // #    not at the cost of doubling the height of every row
  // ============================================================
  const meter = (name, ratio, note, weak) =>
    `<div class="meter-row" title="${esc(note || name)}">` +
    `<span class="name">${esc(name)}</span>` +
    `<span class="track"><span class="fill${weak ? ' weak' : ''}" style="width:${ratio === null ? 0 : Math.round(ratio * 100)}%"></span></span>` +
    `<span class="num">${ratio === null ? '—' : Math.round(ratio * 100) + '%'}</span></div>`;

  const delta = (now, before) => {
    if (now === null || before === null || before === undefined) return '';
    const d = Math.round((now - before) * 100);
    return `<span class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' : ''}${d}</span>`;
  };

  const hero = (value, before) =>
    '<div class="hero">' +
    (value === null ? '<span class="none">—</span>' : `<b>${pct(value)}%</b>`) +
    delta(value, before) + '</div>';

  const card = (id, title, body, wide) =>
    `<article class="mcard${wide ? ' wide' : ''}" style="--c:${HUE[id]}" data-card="${id}">` +
    `<h3>${title}</h3>${body}</article>`;

  const num = (label, value) => `<div>${label}<b>${value}</b></div>`;

  // ============================================================
  // # 🧱 🃏  THE FIVE CARDS
  // # 🔤 JavaScript
  // # 🎯 Each measure's body: its figure, its chart, and the few
  // #    rows that say what the figure is made of
  // # 🔗 The mind card draws ONE line now, not three. Its two inputs
  // #    used to run behind it in grey so the reader could see which
  // #    pulled it down -- and then the five cards were put on one
  // #    screen together, which makes those two their own cards an
  // #    inch away. A ghost of a chart already on the screen is
  // #    clutter, and dropping it drops its legend with it
  // ============================================================
  function loveCard(r, prev, n) {
    const p = r.love.parts;
    const c = g => `${g.done} من ${g.answered} إجابة`;
    return card('love', 'محبة الله',
      hero(r.love.value, prev && prev.love.value) +
      `<div class="plot">${lineSvg(r.love.daily, n)}</div>` +
      '<div class="meters">' +
      meter('الواجبات', p.fard.ratio, `الواجبات · وزن ٥٠٪ · ${c(p.fard)}`) +
      meter('اجتناب النواهي', p.avoid.ratio, `اجتناب النواهي · وزن ٢٥٪ · ${c(p.avoid)}`) +
      meter('النوافل', p.nafl.ratio, `النوافل · وزن ٢٥٪ · ${c(p.nafl)}`) +
      '</div>');
  }

  function bodyCard(r, prev, n) {
    const note = 'النقاط اليومية فيها الأكل والقهوة والنوم فقط. ' +
      'النادي هدف أسبوعي فلا قيمة له في يوم بعينه، وهو محسوب كاملًا في الرقم الأعلى.';
    return card('body', 'الصحة الجسدية',
      hero(r.body.value, prev && prev.body.value) +
      `<div class="plot" title="${esc(note)}">${lineSvg(r.body.daily, n)}</div>` +
      '<div class="meters">' +
      r.body.items.map(i => meter(i.label, i.ratio, `${i.label} · ${i.done} من ${i.target}`)).join('') +
      '</div>');
  }

  const mindCard = (r, prev, n) => card('mind', 'الصحة النفسية',
    hero(r.mind.value, prev && prev.mind.value) +
    `<div class="plot" title="نصفُه محبة الله ونصفُه الصحة الجسدية">${lineSvg(r.mind.daily, n)}</div>` +
    '<div class="meters">' +
    meter('محبة الله', r.mind.inputs.love) +
    meter('الصحة الجسدية', r.mind.inputs.body) +
    '</div>');

  function studyCard(r, prev, n) {
    const s = r.study;
    const note = 'التعافي: كم انقطاعًا تلاه «تم» في اليوم المكتوب التالي.';
    return card('study', 'المرونة الذهنية',
      hero(s.value, prev && prev.study.value) +
      `<div class="plot strip" data-ribbon="study" title="${esc(note)}">${ribbon(s.daily, n)}</div>` +
      '<div class="pair">' +
      num('الإنجاز', s.achievement === null ? '—' : pct(s.achievement) + '%') +
      num('التعافي', s.recovery === null ? '—' : pct(s.recovery) + '%') +
      num('أطول سلسلة', s.longest) +
      '</div>');
  }

  function gritCard(r, prev, n) {
    const bars = r.grit.ranked.map((m, k) => meter(m.label, m.value, m.label, k === 0)).join('');
    return card('grit', 'الصلابة والالتزام',
      hero(r.grit.value, prev && prev.grit.value) +
      '<div class="pair">' +
      num('أيام ملتزمة', `${r.grit.committed} / ${r.grit.written}`) +
      num('أطول سلسلة', r.grit.longest) +
      num('الأضعف', r.grit.weakest ? r.grit.weakest.label : '—') +
      '</div>' +
      `<div class="plot strip" data-ribbon="grit" title="يوم ملتزم: بلغ فيه ${M.NEED} من ٤ مقاييس حدّ ${pct(M.FLOOR)}٪">` +
      `${ribbon(r.grit.daily, n, true)}</div>` +
      `<div class="meters" title="مرتّبة من الأضعف. السلسلة بقوة أضعف حلقاتها">${bars}</div>`,
      true);
  }

  // ============================================================
  // # 🚪 🖌️  PUTTING THE MONTH ON THE SCREEN
  // # 🔤 JavaScript
  // # 🎯 Asks the engine for this month and the one before, draws
  // #    the five cards, and hangs the hover on each
  // # 🔗 The month before is fetched only for the change beside each
  // #    figure. A month with nothing written says so in one line
  // #    instead of drawing five empty charts: an empty chart reads
  // #    as a thing that broke rather than a month not yet lived
  // ============================================================
  function render(year, month, host) {
    const days = B.read().days;
    const r = M.forMonth(year, month, days);
    const before = month === 1 ? null : M.forMonth(year, month - 1, days);
    const prev = before && before.written ? before : null;
    const n = daysIn(year, month);

    const head = '<div class="mhead">' +
      `<h2>${MONTHS[month - 1]} ${year}</h2>` +
      `<p class="sub">${r.written ? `${r.written} يومًا` : 'لا يوم مكتوبًا'}` +
      (r.sortingWrong.length ? ` · <b style="color:#d03b3b">فرز البنود مختلّ: ${r.sortingWrong.join(' ')}</b>` : '') +
      '</p></div>';

    if (!r.written) {
      host.innerHTML = head + '<p class="empty-month">لا شيء مكتوبٌ في هذا الشهر بعد.</p>';
      return;
    }

    host.innerHTML = head +
      loveCard(r, prev, n) + bodyCard(r, prev, n) + mindCard(r, prev, n) +
      studyCard(r, prev, n) + gritCard(r, prev, n);

    const svgOf = id => host.querySelector(`.mcard[data-card="${id}"] .plot svg`);
    wireLine(svgOf('love'), r.love.daily, n, 'محبة الله');
    wireLine(svgOf('body'), r.body.daily, n, 'الصحة الجسدية');
    wireLine(svgOf('mind'), r.mind.daily, n, 'الصحة النفسية');
    wireRibbon(host.querySelector('[data-ribbon="study"]'), { on: 'ذاكر', off: 'لم يذاكر', none: 'لم يُسجَّل' });
    wireRibbon(host.querySelector('[data-ribbon="grit"]'), { on: 'ملتزم', off: 'غير ملتزم', none: 'لم يُسجَّل' });
  }

  window.CheckMeMetricsScreen = { render, HUE };
})();
