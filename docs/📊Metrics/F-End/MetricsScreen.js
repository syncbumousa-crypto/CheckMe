// ============================================================
// # 📊 📈  FIVE CURVES, ONE SHAPE, ONE SCREEN
// # 🔤 JavaScript
// # 🎯 Draws each of the five measures as a curve that rises and
// #    falls across the month, under one big figure
// # 🔗 One form for all five now, not five different ones. The five
// #    shapes before said `these are five unrelated things`, and
// #    they are not -- they are five readings of one month, and the
// #    only question worth asking of each is the same one: is it
// #    going up or down. One form is what lets the eye ask that of
// #    all five in a single pass. The numbers come from the engine;
// #    this file only draws them, and the rules behind them are in
// #    `MonthMetricsRoadmap.md`
// ============================================================
(() => {
  const M = window.CheckMeMetrics;
  const B = window.CheckMeDayBoard;

  const MONTHS = ['يناير', 'فبراير', 'مارس', 'ابريل', 'ماي', 'يونيو',
    'جولاي', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];

  // Validated against this site's own surface. None of them is green
  // or red: those two mean done and not done on the board itself
  const HUE = {
    love: '#3987e5', body: '#d95926', mind: '#9085e9',
    study: '#c98500', grit: '#d55181'
  };

  const pct = v => (v === null || v === undefined ? null : Math.round(v * 100));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  // ============================================================
  // # 🪟 7️⃣  A WINDOW OF SEVEN DAYS, FOR ALL FIVE ALIKE
  // # 🔤 JavaScript
  // # 🎯 Turns a day by day series into the share over the last
  // #    seven days ending on each day
  // # 🔗 Two of the five -- the study hour and the committed day --
  // #    are a yes or no each day, and a line through a yes or no
  // #    is a row of flagpoles, not a curve: it cannot rise or fall
  // #    because there is nothing between nought and one to be at.
  // #    A trailing week gives them a real slope, and it is the
  // #    honest reading of a habit anyway -- nobody judges a month
  // #    by a Tuesday. It is applied to ALL five and not only the
  // #    two that need it, because five cards measured in two
  // #    different ways cannot be compared by looking, which is the
  // #    one thing putting them side by side is for
  // ============================================================
  const WINDOW = 7;

  function trailing(daily, n) {
    const by = {};
    daily.forEach(d => { if (d.value !== null && d.value !== undefined) by[d.day] = d.value; });

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
  // # 🔗 Monotone cubic and not a plain spline. A plain smoothing
  // #    curve bulges past the points it joins, and on a scale that
  // #    stops at nought and one that bulge draws a day at a
  // #    hundred and six per cent, or below nothing at all -- a
  // #    chart telling a lie that is nobody's data. This method
  // #    flattens its own slope wherever the direction changes, so
  // #    the line only ever goes where the figures went
  // ============================================================
  function smooth(pts) {
    if (pts.length < 2) return pts.length ? `M${pts[0].x} ${pts[0].y}` : '';

    const n = pts.length;
    const dx = [], dy = [], slope = [];
    for (let i = 0; i < n - 1; i++) {
      dx.push(pts[i + 1].x - pts[i].x);
      dy.push(pts[i + 1].y - pts[i].y);
      slope.push(dy[i] / dx[i]);
    }

    const m = [slope[0]];
    for (let i = 1; i < n - 1; i++) {
      if (slope[i - 1] * slope[i] <= 0) { m.push(0); continue; }   // a turn: flatten
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
  // # 🖌️ 🌈  THE CHART ITSELF
  // # 🔤 JavaScript
  // # 🎯 One curve, a wash of colour fading away beneath it, and
  // #    the two end days in the smallest type on the page
  // # 🔗 No axis, no grid, no scale down the side. The figure above
  // #    the chart already says where the month stands, so a column
  // #    of percentages beside the line would only repeat it in
  // #    smaller letters. The wash is what gives a thin line weight
  // #    without thickening it. And the scale is pinned to nought
  // #    and one always -- a chart stretched to its own contents
  // #    draws a flat bad month as a dramatic one
  // ============================================================
  const W = 300, H = 112, PAD_T = 10, PAD_B = 16, PAD_X = 6;

  // The axis runs between the FIRST and LAST day that have a figure,
  // not from the first of the month to the last. March began being
  // written on the sixteenth, and spanning the whole month drew every
  // curve crushed into the left half of its card with an empty right
  // half beside it -- which reads as a chart that failed to load
  // rather than as a fortnight that was never lived. All five cards
  // on a screen share one month and so share one span, which is what
  // the comparison between them rests on
  const span = series => {
    const live = series.filter(p => p.value !== null);
    return live.length ? { from: live[0].day, to: live[live.length - 1].day } : null;
  };

  const geo = sp => ({
    x: day => (W - PAD_X) - ((day - sp.from) / Math.max(1, sp.to - sp.from)) * (W - 2 * PAD_X),
    y: v => PAD_T + (1 - v) * (H - PAD_T - PAD_B)
  });

  function chart(id, series, sp, color) {
    const g = geo(sp);
    const pts = series.filter(p => p.value !== null).map(p => ({ x: g.x(p.day), y: g.y(p.value), day: p.day }));
    if (!pts.length) return `<svg viewBox="0 0 ${W} ${H}" class="curve" role="img"></svg>`;

    const line = smooth(pts);
    const floor = H - PAD_B;
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${floor} L${pts[0].x.toFixed(1)} ${floor} Z`;

    return `<svg viewBox="0 0 ${W} ${H}" class="curve" role="img">` +
      `<defs><linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${color}" stop-opacity="0.38"/>` +
      `<stop offset="1" stop-color="${color}" stop-opacity="0"/>` +
      '</linearGradient></defs>' +
      `<path class="curve-area" d="${area}" fill="url(#g-${id})"/>` +
      `<path class="curve-line" d="${line}" stroke="${color}"/>` +
      `<text class="edge" x="${g.x(sp.from).toFixed(1)}" y="${H - 3}" text-anchor="end">${sp.from}</text>` +
      `<text class="edge" x="${g.x(sp.to).toFixed(1)}" y="${H - 3}" text-anchor="start">${sp.to}</text>` +
      `<line class="hair" x1="0" x2="0" y1="${PAD_T}" y2="${floor}" style="opacity:0"/>` +
      `<circle class="hair-dot" r="4" cx="0" cy="0" fill="${color}" style="opacity:0"/>` +
      `<rect class="hit" x="${PAD_X}" y="${PAD_T}" width="${W - 2 * PAD_X}" height="${floor - PAD_T}" fill="transparent"/>` +
      '</svg>';
  }

  // ============================================================
  // # 🖱️ 💬  THE HAIRLINE AND ITS LABEL
  // # 🔤 JavaScript
  // # 🎯 A thin upright and a dot that follow the pointer along the
  // #    curve, with the day and its figure floating beside them
  // # 🔗 This is where every word taken off the card went. The hit
  // #    area is the whole plot, not the two pixel line: a target
  // #    the width of a stroke is a target nobody hits. The pointer
  // #    is put back through the same transform the browser drew
  // #    with, or the letterboxing offsets it by a day or two
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

  function wire(svg, series, sp, label) {
    if (!svg) return;
    const g = geo(sp);
    const hair = svg.querySelector('.hair'), dot = svg.querySelector('.hair-dot'), hit = svg.querySelector('.hit');
    if (!hit) return;

    hit.addEventListener('mousemove', ev => {
      const box = svg.getBoundingClientRect();
      const scale = Math.min(box.width / W, box.height / H);
      const sx = (ev.clientX - box.left - (box.width - W * scale) / 2) / scale;
      let near = null, best = 1e9;
      series.forEach(p => {
        if (p.value === null) return;
        const d = Math.abs(g.x(p.day) - sx);
        if (d < best) { best = d; near = p; }
      });
      if (!near) return;
      hair.setAttribute('x1', g.x(near.day)); hair.setAttribute('x2', g.x(near.day));
      hair.style.opacity = 1;
      dot.setAttribute('cx', g.x(near.day)); dot.setAttribute('cy', g.y(near.value));
      dot.style.opacity = 1;
      tip.show(`${label} · يوم ${near.day} — ${pct(near.value)}٪ <span class="dim">(آخر ${Math.min(WINDOW, near.seen)} أيام)</span>`, ev);
    });

    hit.addEventListener('mouseleave', () => {
      hair.style.opacity = 0; dot.style.opacity = 0; tip.hide();
    });
  }

  // ============================================================
  // # 🃏 🔢  THE CARD: A NAME, A FIGURE, A CURVE
  // # 🔤 JavaScript
  // # 🎯 Three things and no fourth
  // # 🔗 The figure is the month as a whole and the curve is the
  // #    last seven days at each point, so they answer two
  // #    different questions on purpose: where the month stands,
  // #    and which way it is moving
  // ============================================================
  const card = (id, title, value, before, series, sp, wide) => {
    let d = '';
    if (value !== null && before !== null && before !== undefined) {
      const k = Math.round((value - before) * 100);
      d = `<span class="delta ${k > 0 ? 'up' : k < 0 ? 'down' : ''}">${k > 0 ? '+' : ''}${k}</span>`;
    }
    return `<article class="mcard${wide ? ' wide' : ''}" style="--c:${HUE[id]}" data-card="${id}">` +
      `<h3>${title}</h3>` +
      '<div class="hero">' +
      (value === null ? '<span class="none">—</span>' : `<b>${pct(value)}%</b>`) + d + '</div>' +
      `<div class="plot">${chart(id, series, sp, HUE[id])}</div></article>`;
  };

  // ============================================================
  // # 🚪 🖌️  PUTTING THE MONTH ON THE SCREEN
  // # 🔤 JavaScript
  // # 🎯 Asks the engine for this month and the one before, smooths
  // #    each series over a trailing week, and draws the five
  // # 🔗 The days are RIPENED first -- a blank square on a day
  // #    already past counts as not done -- so the curves are drawn
  // #    off exactly what the board shows. A month with nothing
  // #    written says so in a line instead of drawing five flat
  // #    curves at nought, which would read as a measured failure
  // #    rather than an unlived month
  // ============================================================
  function render(year, month, host) {
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

    const five = [
      ['love', 'محبة الله', r.love, prev && prev.love.value],
      ['body', 'الصحة الجسدية', r.body, prev && prev.body.value],
      ['mind', 'الصحة النفسية', r.mind, prev && prev.mind.value],
      ['study', 'المرونة الذهنية', r.study, prev && prev.study.value],
      ['grit', 'الصلابة والالتزام', r.grit, prev && prev.grit.value]
    ].map(([id, title, part, was]) => ({ id, title, part, was, series: trailing(part.daily, n) }));

    // ONE span for all five, taken as the widest of theirs. Five cards
    // each stretched to its own first and last day would put the same
    // date at five different places across the screen, and then
    // comparing one curve with the one beside it would be reading two
    // charts that only look alike
    const spans = five.map(f => span(f.series)).filter(Boolean);
    if (!spans.length) {
      host.innerHTML = head + '<p class="empty-month">لا شيء مكتوبٌ في هذا الشهر بعد.</p>';
      return;
    }
    const sp = {
      from: Math.min(...spans.map(s => s.from)),
      to: Math.max(...spans.map(s => s.to))
    };

    host.innerHTML = head + five.map((f, k) =>
      card(f.id, f.title, f.part.value, f.was, f.series, sp, k === 4)).join('');

    five.forEach(f => wire(host.querySelector(`.mcard[data-card="${f.id}"] svg`), f.series, sp, f.title));
  }

  window.CheckMeMetricsScreen = { render, HUE };
})();
