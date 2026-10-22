// ============================================================
// # 📊 📈  FIVE CURVES, ONE SHAPE, ONE SCREEN
// # 🔤 JavaScript
// # 🎯 Draws each of the five measures as a curve that rises and
// #    falls across the month, under one big figure, with a way in
// #    to how that figure was arrived at
// # 🔗 One form for all five. They are five readings of one month,
// #    and the only question worth asking of each is the same --
// #    is it going up or down -- so one form is what lets the eye
// #    ask it of all five in a single pass. The numbers come from
// #    the engine; this file only draws them, and the rules behind
// #    them are in `MonthMetricsRoadmap.md`
// ============================================================
(() => {
  const M = window.CheckMeMetrics;
  const B = window.CheckMeDayBoard;

  const MONTHS = ['يناير', 'فبراير', 'مارس', 'ابريل', 'ماي', 'يونيو',
    'جولاي', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];

  const HUE = {
    love: '#3987e5', body: '#d95926', mind: '#9085e9',
    study: '#c98500', grit: '#d55181'
  };
  const LOVE_2 = '#86b6ef';          // a lighter step of the same blue

  const pct = v => (v === null || v === undefined ? null : Math.round(v * 100));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  // ============================================================
  // # 🎨 🚦  THE FIGURE WEARS ITS OWN VERDICT
  // # 🔤 JavaScript
  // # 🎯 Picks the colour of a percentage from where it stands
  // # 🔗 Four bands, and they are the owner's own: under half is
  // #    red, up to seventy is a deep orange, up to eighty a light
  // #    one, and above eighty green. The steps are the validated
  // #    status colours, which are kept apart from the five series
  // #    hues on purpose -- so a figure can go red without being
  // #    mistaken for a sixth measure. A number is the one place a
  // #    status colour belongs, because it already carries its own
  // #    label: the digits say how much, the colour says how it is
  // ============================================================
  const BANDS = [
    { at: 80, color: '#0ca30c' },
    { at: 70, color: '#fab219' },
    { at: 50, color: '#ec835a' },
    { at: 0, color: '#d03b3b' }
  ];

  const bandOf = p => (BANDS.find(b => p >= b.at) || BANDS[BANDS.length - 1]).color;

  // ============================================================
  // # 🪟 7️⃣  A WINDOW OF SEVEN DAYS, FOR ALL FIVE ALIKE
  // # 🔤 JavaScript
  // # 🎯 Turns a day by day series into the share over the last
  // #    seven days ending on each day
  // # 🔗 Two of the five are a yes or no each day, and a line
  // #    through a yes or no is a row of flagpoles: it cannot rise
  // #    or fall because there is nothing between nought and one to
  // #    be at. A trailing week gives them a real slope, and it is
  // #    the honest reading of a habit anyway. Applied to all five
  // #    and not only the two that need it, because five cards
  // #    measured two different ways cannot be compared by looking
  // ============================================================
  const WINDOW = 7;

  function trailing(daily, n) {
    const by = {};
    (daily || []).forEach(d => { if (d.value !== null && d.value !== undefined) by[d.day] = d.value; });

    const out = [];
    for (let day = 1; day <= n; day++) {
      let sum = 0, count = 0;
      for (let k = day - WINDOW + 1; k <= day; k++) {
        if (by[k] === undefined) continue;
        sum += by[k]; count++;
      }
      out.push({ day, value: count ? sum / count : null, seen: count });
    }
    return out;
  }

  // ============================================================
  // # 〰️ 📐  A CURVE THAT NEVER OVERSHOOTS
  // # 🔤 JavaScript
  // # 🎯 Turns a run of points into a smooth cubic path
  // # 🔗 Monotone cubic, not a plain spline. A plain smoothing
  // #    curve bulges past the points it joins, and on a scale that
  // #    stops at one that bulge draws a day at a hundred and six
  // #    per cent -- a chart telling a lie that is nobody's data
  // ============================================================
  function smooth(pts) {
    if (pts.length < 2) return pts.length ? `M${pts[0].x} ${pts[0].y}` : '';

    const n = pts.length, dx = [], slope = [];
    for (let i = 0; i < n - 1; i++) {
      dx.push(pts[i + 1].x - pts[i].x);
      slope.push((pts[i + 1].y - pts[i].y) / dx[i]);
    }

    const m = [slope[0]];
    for (let i = 1; i < n - 1; i++) {
      if (slope[i - 1] * slope[i] <= 0) { m.push(0); continue; }
      const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1];
      m.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]));
    }
    m.push(slope[n - 2]);

    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += ` C${(pts[i].x + h).toFixed(1)} ${(pts[i].y + m[i] * h).toFixed(1)}` +
        ` ${(pts[i + 1].x - h).toFixed(1)} ${(pts[i + 1].y - m[i + 1] * h).toFixed(1)}` +
        ` ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
    }
    return d;
  }

  // ============================================================
  // # 🖌️ 🌈  THE CHART
  // # 🔤 JavaScript
  // # 🎯 One or two curves, a wash beneath the first, and the two
  // #    end days in the smallest type on the page
  // # 🔗 No axis, no grid, no scale: the figure above already says
  // #    where the month stands. The wash is only drawn under a
  // #    LONE curve -- two washes over one another make a third
  // #    colour in the overlap that means nothing, and the chart
  // #    would be read as having three series
  // ============================================================
  const W = 300, H = 112, PAD_T = 10, PAD_B = 16, PAD_X = 6;

  const span = lines => {
    let from = Infinity, to = -Infinity;
    lines.forEach(l => l.series.forEach(p => {
      if (p.value === null) return;
      if (p.day < from) from = p.day;
      if (p.day > to) to = p.day;
    }));
    return from <= to ? { from, to } : null;
  };

  const geo = sp => ({
    x: day => (W - PAD_X) - ((day - sp.from) / Math.max(1, sp.to - sp.from)) * (W - 2 * PAD_X),
    y: v => PAD_T + (1 - v) * (H - PAD_T - PAD_B)
  });

  function chart(id, lines, sp) {
    const g = geo(sp), floor = H - PAD_B;
    let out = '';
    let defs = '';

    lines.forEach((l, k) => {
      const pts = l.series.filter(p => p.value !== null)
        .map(p => ({ x: g.x(p.day), y: g.y(p.value) }));
      if (!pts.length) return;
      const d = smooth(pts);
      if (lines.length === 1) {
        defs += `<linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1">` +
          `<stop offset="0" stop-color="${l.color}" stop-opacity="0.38"/>` +
          `<stop offset="1" stop-color="${l.color}" stop-opacity="0"/></linearGradient>`;
        out += `<path class="curve-area" d="${d} L${pts[pts.length - 1].x.toFixed(1)} ${floor}` +
          ` L${pts[0].x.toFixed(1)} ${floor} Z" fill="url(#g-${id})"/>`;
      }
      out += `<path class="curve-line${l.dash ? ' dashed' : ''}" d="${d}" stroke="${l.color}"/>`;
    });

    return `<svg viewBox="0 0 ${W} ${H}" class="curve" role="img">` +
      (defs ? `<defs>${defs}</defs>` : '') + out +
      `<text class="edge" x="${g.x(sp.from).toFixed(1)}" y="${H - 3}" text-anchor="end">${sp.from}</text>` +
      `<text class="edge" x="${g.x(sp.to).toFixed(1)}" y="${H - 3}" text-anchor="start">${sp.to}</text>` +
      `<line class="hair" x1="0" x2="0" y1="${PAD_T}" y2="${floor}" style="opacity:0"/>` +
      lines.map((l, k) => `<circle class="hair-dot d${k}" r="4" cx="0" cy="0" fill="${l.color}" style="opacity:0"/>`).join('') +
      `<rect class="hit" x="${PAD_X}" y="${PAD_T}" width="${W - 2 * PAD_X}" height="${floor - PAD_T}" fill="transparent"/>` +
      '</svg>';
  }

  // ============================================================
  // # 🖱️ 💬  THE HAIRLINE AND ITS LABEL
  // # 🔤 JavaScript
  // # 🎯 A thin upright and a dot per curve following the pointer
  // # 🔗 The hit area is the whole plot, never the line itself: a
  // #    target the width of a stroke is a target nobody hits. The
  // #    pointer is put back through the same transform the browser
  // #    drew with, or the letterboxing offsets it by a day or two
  // ============================================================
  const tip = (() => {
    let el = null;
    return {
      show(html, ev) {
        if (!el) { el = document.createElement('div'); el.id = 'mtip'; document.body.appendChild(el); }
        el.innerHTML = html;
        el.hidden = false;
        el.style.left = Math.max(8, Math.min(ev.clientX + 14, innerWidth - el.offsetWidth - 10)) + 'px';
        el.style.top = Math.max(8, ev.clientY - 40) + 'px';
      },
      hide() { if (el) el.hidden = true; }
    };
  })();

  function wire(svg, lines, sp) {
    if (!svg) return;
    const g = geo(sp);
    const hair = svg.querySelector('.hair'), hit = svg.querySelector('.hit');
    const dots = [...svg.querySelectorAll('.hair-dot')];
    if (!hit) return;

    hit.addEventListener('mousemove', ev => {
      const box = svg.getBoundingClientRect();
      const scale = Math.min(box.width / W, box.height / H);
      const sx = (ev.clientX - box.left - (box.width - W * scale) / 2) / scale;

      let day = null, best = 1e9;
      lines[0].series.forEach(p => {
        if (p.value === null) return;
        const d = Math.abs(g.x(p.day) - sx);
        if (d < best) { best = d; day = p; }
      });
      if (!day) return;

      hair.setAttribute('x1', g.x(day.day)); hair.setAttribute('x2', g.x(day.day));
      hair.style.opacity = 1;

      const parts = lines.map((l, k) => {
        const p = l.series.find(q => q.day === day.day);
        if (!p || p.value === null) { dots[k].style.opacity = 0; return null; }
        dots[k].setAttribute('cx', g.x(p.day)); dots[k].setAttribute('cy', g.y(p.value));
        dots[k].style.opacity = 1;
        return `${l.name} ${pct(p.value)}٪`;
      }).filter(Boolean);

      tip.show(`يوم ${day.day} — ${parts.join(' · ')} <span class="dim">(آخر ${Math.min(WINDOW, day.seen)} أيام)</span>`, ev);
    });

    hit.addEventListener('mouseleave', () => {
      hair.style.opacity = 0; dots.forEach(d => (d.style.opacity = 0)); tip.hide();
    });
  }

  // ============================================================
  // # ⚙️ 📖  HOW THIS FIGURE WAS ARRIVED AT
  // # 🔤 JavaScript
  // # 🎯 Builds, for one measure, the sentence that computes it and
  // #    the table of everything that feeds it
  // # 🔗 A percentage with no way to open it is a number the reader
  // #    has to take on trust, and a tracker nobody trusts is not
  // #    used twice. Every weight, every denominator and every
  // #    exception is in here in his own words -- including the two
  // #    rules that are easiest to get wrong about it: a blank is
  // #    not a failure, and a blank on a day already past IS one
  // ============================================================
  const num = v => (v === null || v === undefined ? '—' : Math.round(v * 100) + '٪');

  // One line per thing, and the line is the whole explanation: its
  // name, what it is worth, and where it stands. The paragraphs that
  // used to sit above each table said in forty words what the weights
  // in the formula line say in four
  const xpart = (name, weight, value, note) =>
    `<div class="xp"><span class="xp-n">${esc(name)}</span>` +
    (weight ? `<span class="xp-w">${weight}</span>` : '') +
    (note ? `<span class="xp-c">${esc(note)}</span>` : '') +
    `<span class="xp-v">${num(value)}</span></div>`;

  function explain(id, r) {
    const p = r.love.parts;

    if (id === 'love') {
      return '<p class="xform">٥٠٪ واجبات + ٢٥٪ نواهٍ + ٢٥٪ نوافل</p>' +
        xpart('الواجبات', '٥٠٪', p.fard.ratio, `${p.fard.done}/${p.fard.answered}`) +
        xpart('النواهي', '٢٥٪', p.avoid.ratio, `${p.avoid.done}/${p.avoid.answered}`) +
        xpart('النوافل', '٢٥٪', p.nafl.ratio, `${p.nafl.done}/${p.nafl.answered}`);
    }

    if (id === 'body') {
      return '<p class="xform">متوسط البنود، كلٌّ إلى هدفه</p>' +
        r.body.items.map(i => xpart(i.label, '',
          i.ratio, `${i.done}/${i.target}`)).join('');
    }

    if (id === 'mind') {
      return '<p class="xform">٥٠٪ محبة الله + ٥٠٪ الصحة الجسدية</p>' +
        xpart('محبة الله', '٥٠٪', r.mind.inputs.love) +
        xpart('الصحة الجسدية', '٥٠٪', r.mind.inputs.body) +
        (r.orphans.length ? `<p class="xwarn">خارج المقاييس: ${esc(r.orphans.join(' · '))}</p>` : '');
    }

    if (id === 'study') {
      const s = r.study;
      return '<p class="xform">٥٠٪ إنجاز + ٥٠٪ تعافٍ</p>' +
        xpart('الإنجاز', '٥٠٪', s.achievement, `${s.answered} يومًا`) +
        xpart('التعافي', '٥٠٪', s.recovery, `${s.recovered || 0}/${s.breaks}`);
    }

    return `<p class="xform">${M.NEED} من ٤ مقاييس فوق ${pct(M.FLOOR)}٪ = يوم ملتزم</p>` +
      r.grit.ranked.map((m, k) => xpart(m.label, '', m.value, k === 0 ? 'الأضعف' : '')).join('') +
      `<p class="xwarn" style="color:var(--ink-faint)">${r.grit.committed} من ${r.grit.written} يومًا · أطول سلسلة ${r.grit.longest}</p>`;
  }

  // ============================================================
  // # ✏️ ➕  EDITING THE LIST, AND THE ONE THING IT MAY NOT DO
  // # 🔤 JavaScript
  // # 🎯 Lists every line that feeds this measure with its name
  // #    editable in place, a way to set one aside, and a row for
  // #    adding a new one
  // # 🔗 There is no delete, and that is the whole safety of this
  // #    panel. A line's PLACE in the list is its place in every
  // #    saved day, so removing one shifts every answer after it and
  // #    a hundred and sixty nine days silently become a record of
  // #    other things. `أخفِ` keeps the line and its history and
  // #    takes it off the board and out of the sums, which is what
  // #    deleting was wanted for; and adding only ever appends, so
  // #    nothing that already means something changes meaning
  // ============================================================
  const FEEDS = {
    love: K => [...K.fard, ...K.avoid, ...K.nafl],
    body: K => K.body,
    study: K => K.study,
    mind: () => [],
    grit: () => []
  };

  const GROUP_FOR = { love: 'morning', body: 'life', study: 'study' };

  function editor(id) {
    const K = M.kinds;
    const list = (FEEDS[id] || (() => []))(K);

    if (!list.length) {
      return '<p class="xnote">هذا المقياس يُبنى من المقاييس الأخرى، فلا بنود تُضاف إليه.</p>';
    }

    const rows = list.map(i =>
      `<div class="xe" data-i="${i}">` +
      `<input class="xe-name" value="${esc(B.ITEMS[i].label)}" data-i="${i}">` +
      `<button class="xe-hide" type="button" data-i="${i}" title="أخفِ هذا البند">أخفِ</button>` +
      '</div>').join('');

    const hiddenRows = [...(B.hidden || [])].filter(i => B.ITEMS[i])
      .map(i => `<div class="xe off"><span>${esc(B.ITEMS[i].label)}</span>` +
        `<button class="xe-show" type="button" data-i="${i}">أعِدْه</button></div>`).join('');

    return '<div class="xlist">' + rows + hiddenRows + '</div>' +
      '<div class="xadd">' +
      `<input class="xadd-name" placeholder="بند جديد في ${esc(B.GROUPS.find(g => g.id === GROUP_FOR[id]).label)}">` +
      `<button class="xadd-go" type="button" data-g="${GROUP_FOR[id]}">أضِف</button>` +
      '</div>' +
      '<p class="xnote">الاسم يُحفظ حين تخرج من الخانة. ولا حذف: البند المخفيّ يبقى بمكانه في السجلّ، ' +
      'وحذفه يُزيح كلَّ إجابةٍ بعده في أيّامك المحفوظة.</p>';
  }

  // ============================================================
  // # 🃏 🔢  THE CARD
  // # 🔤 JavaScript
  // # 🎯 A name with a way into its workings, a figure that wears
  // #    its own verdict, and a curve
  // # 🔗 `حتى الآن` stands beside every figure because that is what
  // #    every one of them is: a month still being lived, not a
  // #    month closed and totalled. Without it a reader takes the
  // #    twenty second of October for a verdict on October
  // ============================================================
  const card = (id, title, value, before, lines, sp, wide, legend) => {
    let d = '';
    if (value !== null && before !== null && before !== undefined) {
      const k = Math.round((value - before) * 100);
      d = `<span class="delta ${k > 0 ? 'up' : k < 0 ? 'down' : ''}">${k > 0 ? '+' : ''}${k}</span>`;
    }
    const p = pct(value);
    return `<article class="mcard${wide ? ' wide' : ''}" style="--c:${HUE[id]}" data-card="${id}">` +
      '<div class="mtop">' +
      // The gear comes FIRST in the markup, which on a right to
      // left page puts it at the right edge with the name beside
      // it -- `to the right of the text`, which is where it was
      // asked for. Pushed to the opposite corner it read as a
      // window control rather than as something belonging to
      // the words next to it
      `<button class="xbtn" type="button" data-explain="${id}" title="كيف تُحسب هذه النسبة">` +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.6"/>' +
      '<path d="M8 1.2v2.1M8 12.7v2.1M1.2 8h2.1M12.7 8h2.1M3.2 3.2l1.5 1.5M11.3 11.3l1.5 1.5M12.8 3.2l-1.5 1.5M4.7 11.3l-1.5 1.5"/>' +
      '</svg></button>' +
      `<h3>${title}</h3></div>` +
      '<div class="hero">' +
      (value === null ? '<span class="none">—</span>'
        : `<b style="color:${bandOf(p)}">${p}%</b><span class="sofar">حتى الآن</span>`) +
      d + '</div>' +
      (legend || '') +
      `<div class="plot">${chart(id, lines, sp)}</div></article>`;
  };

  // ============================================================
  // # 🚪 🖌️  PUTTING THE MONTH ON THE SCREEN
  // # 🔤 JavaScript
  // # 🎯 Asks the engine, smooths each series over a trailing week,
  // #    draws the five, and wires the hover and the explanations
  // # 🔗 The days are RIPENED first -- a blank on a day already
  // #    past counts as not done -- so the curves are drawn off
  // #    exactly what the board shows. And ONE span serves all
  // #    five: a span per card would put the same date in five
  // #    different places and the comparison would be a fiction
  // ============================================================
  function render(year, month, host) {
    last = { year, month, host };
    const days = B.ripen(B.read().days);
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

    const one = (part, color) => [{ series: trailing(part.daily, n), color, name: '' }];

    const five = [
      { id: 'love', title: 'محبة الله', value: r.love.value, was: prev && prev.love.value,
        lines: [
          { series: trailing(r.love.duty.daily, n), color: HUE.love, name: 'واجبات ونواهٍ' },
          { series: trailing(r.love.nafl.daily, n), color: LOVE_2, dash: true, name: 'نوافل' }
        ],
        legend: '<div class="legend">' +
          `<span><i style="background:${HUE.love}"></i>واجبات ونواهٍ</span>` +
          `<span><i class="dash" style="background:${LOVE_2}"></i>نوافل</span></div>` },
      { id: 'body', title: 'الصحة الجسدية', value: r.body.value, was: prev && prev.body.value,
        lines: one(r.body, HUE.body) },
      { id: 'mind', title: 'الصحة النفسية', value: r.mind.value, was: prev && prev.mind.value,
        lines: one(r.mind, HUE.mind) },
      { id: 'study', title: 'المرونة الذهنية', value: r.study.value, was: prev && prev.study.value,
        lines: one(r.study, HUE.study) },
      { id: 'grit', title: 'الصلابة والالتزام', value: r.grit.value, was: prev && prev.grit.value,
        lines: one(r.grit, HUE.grit) }
    ];

    const spans = five.map(f => span(f.lines)).filter(Boolean);
    if (!spans.length) {
      host.innerHTML = head + '<p class="empty-month">لا شيء مكتوبٌ في هذا الشهر بعد.</p>';
      return;
    }
    const sp = { from: Math.min(...spans.map(s => s.from)), to: Math.max(...spans.map(s => s.to)) };

    host.innerHTML = head + five.map((f, k) =>
      card(f.id, f.title, f.value, f.was, f.lines, sp, k === 4, f.legend)).join('');

    five.forEach(f => wire(host.querySelector(`.mcard[data-card="${f.id}"] svg`), f.lines, sp));

    host.querySelectorAll('[data-explain]').forEach(btn => {
      btn.onclick = () => openExplain(btn.dataset.explain,
        five.find(f => f.id === btn.dataset.explain).title, r);
    });
  }

  // ============================================================
  // # 🪟 ⚙️  THE EXPLANATION WINDOW
  // # 🔤 JavaScript
  // # 🎯 Opens over the screen with the workings of one measure
  // # 🔗 One window reused by all five, built when it is asked for.
  // #    It closes on the cross, on the dark around it and on
  // #    Escape: a sheet over everything with one way out is a trap
  // #    on a phone, where the cross is the smallest thing on it
  // ============================================================
  function openExplain(id, title, r) {
    let pop = document.getElementById('xpop');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'xpop';
      pop.innerHTML = '<div class="xbox"><div class="xhead"><h3 id="xtitle"></h3>' +
        '<button class="xclose" type="button" title="إغلاق">×</button></div>' +
        '<div class="xbody" id="xbody"></div></div>';
      document.body.appendChild(pop);
      const close = () => { pop.hidden = true; };
      pop.querySelector('.xclose').onclick = close;
      pop.addEventListener('click', e => { if (e.target === pop) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) close(); });
    }
    document.getElementById('xtitle').textContent = title;
    const body = document.getElementById('xbody');
    body.innerHTML = explain(id, r) + editor(id);

    // Rewired on every opening, because the body is rebuilt each time
    body.querySelectorAll('.xe-name').forEach(inp => {
      inp.onchange = () => B.renameItem(Number(inp.dataset.i), inp.value);
      inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); };
    });
    body.querySelectorAll('.xe-hide').forEach(b => {
      b.onclick = () => { B.setHidden(Number(b.dataset.i), true); reopen(id, title); };
    });
    body.querySelectorAll('.xe-show').forEach(b => {
      b.onclick = () => { B.setHidden(Number(b.dataset.i), false); reopen(id, title); };
    });
    const addBtn = body.querySelector('.xadd-go'), addName = body.querySelector('.xadd-name');
    if (addBtn) {
      addBtn.onclick = () => {
        if (!B.addItem({ g: addBtn.dataset.g, label: addName.value })) return;
        addName.value = '';
        reopen(id, title);
      };
      addName.onkeydown = e => { if (e.key === 'Enter') addBtn.click(); };
    }

    pop.hidden = false;
  }

  // Rebuilt from a FRESH reading after any change, and the cards
  // behind it with it: a new line moves every figure on the card, and
  // a panel showing yesterday's numbers beside today's list is worse
  // than one that flickers
  let last = null;
  function reopen(id, title) {
    if (!last) return;
    render(last.year, last.month, last.host);
    openExplain(id, title, M.forMonth(last.year, last.month, B.ripen(B.read().days)));
  }

  window.CheckMeMetricsScreen = { render, HUE };
})();
