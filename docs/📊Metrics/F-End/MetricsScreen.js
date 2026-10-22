// ============================================================
// # 📊 🖥️  DRAWING THE FIVE MEASURES OF A MONTH
// # 🔤 JavaScript
// # 🎯 Builds the month screen: five cards, each with its figure,
// #    its chart and its parts
// # 🔗 Every number on this screen comes from the engine and none is
// #    worked out here. This file only chooses the SHAPE, and the
// #    shape was chosen by the job the data has to do -- a line for
// #    change over time, cells for runs, a track for one ratio
// #    against a limit, ranked bars for `am I even`. The reasons are
// #    written out in `MonthMetricsRoadmap.md`
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
  // # 🎯 Turns a day number into an x, and a share into a y
  // #    inside one fixed viewBox
  // # 🔗 Day one sits on the RIGHT and the month runs leftward,
  // #    because the page and its reader run that way: a chart that
  // #    starts its time axis on the left asks an Arabic reader to
  // #    read the one thing on the screen backwards. The y scale is
  // #    pinned to nought and one always, never to the data's own
  // #    range -- a chart rescaled to its contents makes a flat bad
  // #    month look like a dramatic one
  // ============================================================
  const W = 320, H = 108, TOP = 8, BOT = 16, LEFT = 6, RIGHT = 30;

  const geo = n => ({
    x: day => (W - RIGHT) - ((day - 1) / Math.max(1, n - 1)) * (W - RIGHT - LEFT),
    y: v => TOP + (1 - v) * (H - TOP - BOT)
  });

  function frame(n, extra = '') {
    const g = geo(n);
    let out = '';
    [0, 0.5, 1].forEach(v => {
      out += `<line class="grid-line" x1="${LEFT}" x2="${W - RIGHT}" y1="${g.y(v)}" y2="${g.y(v)}"/>` +
        `<text class="axis-text" x="${W - RIGHT + 5}" y="${g.y(v) + 3}">${v * 100}%</text>`;
    });
    out += `<line class="floor-line" x1="${LEFT}" x2="${W - RIGHT}" y1="${g.y(M.FLOOR)}" y2="${g.y(M.FLOOR)}"/>`;
    [1, Math.ceil(n / 2), n].forEach(d => {
      out += `<text class="axis-text" x="${g.x(d)}" y="${H - 3}" text-anchor="middle">${d}</text>`;
    });
    return out + extra;
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
  // # 🖱️ 💬  THE HOVER LAYER
  // # 🔤 JavaScript
  // # 🎯 A crosshair and a label that follow the pointer across a
  // #    line chart, and a label on any single mark
  // # 🔗 Shipped by default, not as a flourish: a chart on a screen
  // #    that cannot be asked `which day was that` is a picture of
  // #    data rather than the data. The hit area is the whole plot,
  // #    not the two pixel line -- a target the width of the stroke
  // #    is a target nobody hits
  // ============================================================
  const tip = (() => {
    let el = null;
    return {
      show(html, ev) {
        if (!el) { el = document.createElement('div'); el.id = 'mtip'; document.body.appendChild(el); }
        el.innerHTML = html;
        el.style.insetInlineStart = 'auto';
        el.style.left = Math.min(ev.clientX + 14, innerWidth - el.offsetWidth - 10) + 'px';
        el.style.top = Math.max(8, ev.clientY - 40) + 'px';
        el.hidden = false;
      },
      hide() { if (el) el.hidden = true; }
    };
  })();

  function wireLine(svg, rows, n, label) {
    const g = geo(n);
    const cross = svg.querySelector('.cross');
    const dot = svg.querySelector('.dot');
    const hit = svg.querySelector('.hit');
    if (!hit) return;

    hit.addEventListener('mousemove', ev => {
      const box = svg.getBoundingClientRect();
      const sx = ((ev.clientX - box.left) / box.width) * W;
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
      tip.show(`${label} · يوم <span class="n">${near.day}</span> — <span class="n">${pct(near.value)}%</span>`, ev);
    });

    hit.addEventListener('mouseleave', () => {
      cross.style.opacity = 0; dot.style.opacity = 0; tip.hide();
    });
  }

  const lineSvg = (rows, n, ghosts = []) =>
    `<svg viewBox="0 0 ${W} ${H}" role="img">` +
    frame(n) +
    ghosts.map((gh, k) => `<path class="series ghost${k ? ' dashed' : ''}" d="${path(gh, n)}"/>`).join('') +
    `<path class="series" d="${path(rows, n)}"/>` +
    `<line class="cross" y1="${TOP}" y2="${H - BOT}" x1="0" x2="0" style="opacity:0"/>` +
    `<circle class="dot" r="4" cx="0" cy="0" style="opacity:0"/>` +
    `<rect class="hit" x="${LEFT}" y="${TOP}" width="${W - RIGHT - LEFT}" height="${H - TOP - BOT}" fill="transparent"/>` +
    '</svg>';

  // ============================================================
  // # 🟩 🎞️  A ROW OF DAYS
  // # 🔤 JavaScript
  // # 🎯 One small square per day of the month, in the three answers
  // #    or in on/off
  // # 🔗 The right form when the question is about RUNS. A line
  // #    through a yes-or-no series draws a sawtooth that says
  // #    nothing; a row of cells shows at a glance where the streak
  // #    was and where it broke. Day one is on the right, like
  // #    everything else here
  // ============================================================
  function ribbon(series, n, klass) {
    const gap = 2, cw = (W - (n - 1) * gap) / n;
    let out = `<svg viewBox="0 0 ${W} 26" role="img">`;
    for (let d = 1; d <= n; d++) {
      const hit = series.find(p => p.day === d);
      const v = hit ? hit.value : null;
      const cls = v === null || v === undefined ? 'cell-none' : (klass ? (v ? 'cell-on' : 'cell-off') : (v ? 'cell-done' : 'cell-miss'));
      const x = W - cw - (d - 1) * (cw + gap);
      out += `<rect class="${cls}" x="${x.toFixed(1)}" y="4" width="${cw.toFixed(1)}" height="18" rx="3" data-day="${d}" data-v="${v === null || v === undefined ? '' : v}"/>`;
    }
    return out + '</svg>';
  }

  function wireRibbon(host, words) {
    host.querySelectorAll('rect[data-day]').forEach(r => {
      r.addEventListener('mouseenter', ev => {
        const v = r.dataset.v;
        tip.show(`يوم <span class="n">${r.dataset.day}</span> — ${v === '' ? words.none : (Number(v) ? words.on : words.off)}`, ev);
      });
      r.addEventListener('mouseleave', () => tip.hide());
    });
  }

  // ============================================================
  // # 📏 🧮  A TRACK FOR ONE RATIO
  // # 🔤 JavaScript
  // # 🎯 A named row with a filled track, its share, and the count
  // #    it came from
  // # 🔗 The count travels with the share always. `100%` off two
  // #    answered days and `100%` off twenty eight are not the same
  // #    claim, and a share printed on its own cannot tell them
  // #    apart -- which is the commonest way a number on a dashboard
  // #    lies without anybody writing an untruth
  // ============================================================
  const meter = (name, ratio, done, of, weak) =>
    '<div class="meter-row">' +
    `<span class="name" title="${esc(name)}">${esc(name)}</span>` +
    `<span class="track"><span class="fill${weak ? ' weak' : ''}" style="width:${ratio === null ? 0 : Math.round(ratio * 100)}%"></span></span>` +
    `<span class="num">${ratio === null ? '—' : Math.round(ratio * 100) + '%'}</span>` +
    '</div>' +
    (of === undefined ? '' : `<div class="meter-row"><span></span><span class="of">${done} / ${of}</span><span></span></div>`);

  const delta = (now, before) => {
    if (now === null) return '<span class="delta">—</span>';
    if (before === null || before === undefined) return '<span class="delta">لا شهر قبله</span>';
    const d = Math.round((now - before) * 100);
    const cls = d > 0 ? 'up' : d < 0 ? 'down' : '';
    return `<span class="delta ${cls}">${d > 0 ? '+' : ''}${d} نقطة عن الشهر السابق</span>`;
  };

  const hero = (value, before) =>
    '<div class="hero">' +
    (value === null ? '<span class="none">—</span>' : `<b>${pct(value)}%</b>`) +
    delta(value, before) + '</div>';

  const card = (id, title, why, body) =>
    `<article class="mcard${id === 'grit' ? ' wide' : ''}" style="--c:${HUE[id]}" data-card="${id}">` +
    `<div><h3>${title}</h3><p class="why">${why}</p></div>${body}</article>`;

  // ============================================================
  // # 🧱 🃏  THE FIVE CARDS
  // # 🔤 JavaScript
  // # 🎯 Each measure's own body: its chart and the parts under it
  // # 🔗 The body card says in its small print that the gym is not
  // #    in its daily dots. That sentence is not politeness: the
  // #    month's figure counts the gym against a weekly target while
  // #    the dots cannot, so the line and the headline are measuring
  // #    slightly different things, and a reader who is not told
  // #    will read the gap as an error
  // ============================================================
  function loveCard(r, prev, n) {
    const p = r.love.parts;
    return card('love', 'مقياس محبة الله', 'الواجبات · اجتناب النواهي · النوافل',
      hero(r.love.value, prev && prev.love.value) +
      `<div class="plot" data-line="love">${lineSvg(r.love.daily, n)}</div>` +
      '<div class="meters">' +
      meter('الواجبات (وزن ٥٠٪)', p.fard.ratio, p.fard.done, p.fard.answered) +
      meter('اجتناب النواهي (٢٥٪)', p.avoid.ratio, p.avoid.done, p.avoid.answered) +
      meter('النوافل (٢٥٪)', p.nafl.ratio, p.nafl.done, p.nafl.answered) +
      '</div>');
  }

  function bodyCard(r, prev, n) {
    const weakest = r.body.items.filter(i => i.ratio !== null).sort((a, b) => a.ratio - b.ratio)[0];
    return card('body', 'مقياس الصحة الجسدية', 'النوم · الأكل · النادي · القهوة',
      hero(r.body.value, prev && prev.body.value) +
      `<div class="plot" data-line="body">${lineSvg(r.body.daily, n)}</div>` +
      '<div class="meters">' +
      r.body.items.map(i => meter(i.label, i.ratio, i.done, i.target)).join('') +
      '</div>' +
      '<p class="fine">النقاط اليومية فيها الأكل والقهوة والنوم فقط. ' +
      'النادي هدفٌ أسبوعيّ، فلا قيمة له في يومٍ بعينه، وهو محسوبٌ كاملًا في الرقم الأعلى.' +
      (weakest ? ` وأضعفها هذا الشهر: ${esc(weakest.label)}.` : '') + '</p>');
  }

  function mindCard(r, prev, n) {
    const ghosts = [r.love.daily, r.body.daily];
    return card('mind', 'مقياس الصحة النفسية', 'نصفُه محبة الله ونصفُه الصحة الجسدية',
      hero(r.mind.value, prev && prev.mind.value) +
      `<div class="plot" data-line="mind">${lineSvg(r.mind.daily, n, ghosts)}</div>` +
      '<div class="legend-row">' +
      `<span><i style="background:${HUE.mind}"></i>الصحة النفسية</span>` +
      '<span><i style="background:#6b7380"></i>محبة الله</span>' +
      '<span><i style="background:repeating-linear-gradient(90deg,#6b7380 0 4px,transparent 4px 7px)"></i>الصحة الجسدية</span>' +
      '</div>' +
      '<div class="meters">' +
      meter('محبة الله', r.mind.inputs.love) +
      meter('الصحة الجسدية', r.mind.inputs.body) +
      '</div>');
  }

  function studyCard(r, prev, n) {
    const s = r.study;
    return card('study', 'مقياس المرونة الذهنية', 'المذاكرة: الإنجاز، والعودة بعد الانقطاع',
      hero(s.value, prev && prev.study.value) +
      `<div class="plot" data-ribbon="study">${ribbon(s.daily, n)}</div>` +
      '<div class="pair">' +
      `<div>الإنجاز<b>${s.achievement === null ? '—' : pct(s.achievement) + '%'}</b></div>` +
      `<div>التعافي<b>${s.recovery === null ? '—' : pct(s.recovery) + '%'}</b></div>` +
      `<div>أطول سلسلة<b>${s.longest}</b></div>` +
      `<div>الانقطاعات<b>${s.breaks}</b></div>` +
      '</div>' +
      '<p class="fine">التعافي: كم انقطاعًا تلاه «تم» في اليوم المكتوب التالي. ' +
      'آخرُ يومٍ مكتوبٍ لا يُحسب انقطاعًا غيرَ مُتعافًى منه، إذ لا يومَ بعده يُحكم به.</p>');
  }

  function gritCard(r, prev, n) {
    const bars = r.grit.ranked.map((m, k) =>
      meter(m.label, m.value, undefined, undefined, k === 0)).join('');
    return card('grit', 'مقياس الصلابة والالتزام', `يومٌ ملتزم: بلغ فيه ${M.NEED} من ٤ مقاييس حدَّ ${pct(M.FLOOR)}٪`,
      hero(r.grit.value, prev && prev.grit.value) +
      '<div class="pair">' +
      `<div>أيامٌ ملتزمة<b>${r.grit.committed} / ${r.grit.written}</b></div>` +
      `<div>أطول سلسلة<b>${r.grit.longest}</b></div>` +
      `<div>الأضعف<b style="font-size:0.95rem">${r.grit.weakest ? esc(r.grit.weakest.label) : '—'}</b></div>` +
      '</div>' +
      `<div class="plot" data-ribbon="grit">${ribbon(r.grit.daily, n, true)}</div>` +
      '<div class="meters">' + bars + '</div>' +
      '<p class="fine">الأشرطة الأربعة مرتّبةٌ من الأضعف، والأضعفُ بلون الحياد: ' +
      'السلسلة بقوّة أضعف حلقاتها، وهذه هي الحلقة.</p>');
  }

  // ============================================================
  // # 🚪 🖌️  PUTTING THE MONTH ON THE SCREEN
  // # 🔤 JavaScript
  // # 🎯 Asks the engine for this month and the one before it, draws
  // #    the five cards, and hangs the hover on each
  // # 🔗 The month before is fetched only so the change can be shown
  // #    beside each figure. And a month with nothing written in it
  // #    says so in one line instead of drawing five empty charts:
  // #    an empty chart reads as a thing that broke
  // ============================================================
  function render(year, month, host) {
    const days = B.read().days;
    const r = M.forMonth(year, month, days);
    const before = month === 1 ? null : M.forMonth(year, month - 1, days);
    const prev = before && before.written ? before : null;
    const n = daysIn(year, month);

    const head = '<div class="mhead">' +
      `<h2>${MONTHS[month - 1]} ${year}</h2>` +
      `<p class="sub">${r.written ? `${r.written} يومًا مكتوبًا` : 'لا يوم مكتوبًا'}` +
      (r.sortingWrong.length ? ` · <b style="color:#d03b3b">فرزُ البنود مختلّ: ${r.sortingWrong.join(' ')}</b>` : '') +
      '</p></div>';

    if (!r.written) {
      host.innerHTML = head + '<p class="empty-month">لا شيء مكتوبٌ في هذا الشهر بعد، فلا شيء يُقاس.</p>';
      return;
    }

    host.innerHTML = head +
      loveCard(r, prev, n) + bodyCard(r, prev, n) + mindCard(r, prev, n) +
      studyCard(r, prev, n) + gritCard(r, prev, n);

    wireLine(host.querySelector('[data-line="love"] svg'), r.love.daily, n, 'محبة الله');
    wireLine(host.querySelector('[data-line="body"] svg'), r.body.daily, n, 'الصحة الجسدية');
    wireLine(host.querySelector('[data-line="mind"] svg'), r.mind.daily, n, 'الصحة النفسية');
    wireRibbon(host.querySelector('[data-ribbon="study"]'), { on: 'ذاكر', off: 'لم يذاكر', none: 'لم يُسجَّل' });
    wireRibbon(host.querySelector('[data-ribbon="grit"]'), { on: 'يوم ملتزم', off: 'غير ملتزم', none: 'لم يُسجَّل' });
  }

  window.CheckMeMetricsScreen = { render, HUE };
})();
