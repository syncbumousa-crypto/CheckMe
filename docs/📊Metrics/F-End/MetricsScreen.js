// ============================================================
// # 📊 🖥️  THE FIVE MEASURES, EACH IN ITS OWN SHAPE
// # 🔤 JavaScript
// # 🎯 Builds the month screen: five cards on one screenful, and no
//  #   two of them drawn alike
// # 🔗 Every number comes from the engine; this file only chooses the
// #    SHAPE. And the five shapes are deliberately different from
// #    one another, because five identical charts in a row are read
// #    as one chart repeated and the reader stops looking. Each form
// #    was picked to BE the idea it carries: nested rings for three
// #    duties inside one devotion, four standing columns for four
// #    separate habits, an arc between two marks for a thing derived
// #    from two others, a row of days for a streak, and a month
// #    drawn as a closed circle for holding the line.
// #    The reasons behind the numbers are in `MonthMetricsRoadmap.md`
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

  // Three steps of ONE hue for the three parts of devotion, not three
  // different hues. They are parts of a single measure, so they are
  // shades of a single colour -- three unrelated colours would say
  // they were three unrelated things
  const LOVE_STEPS = ['#3987e5', '#5598e7', '#86b6ef'];

  const pct = v => (v === null || v === undefined ? null : Math.round(v * 100));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  // ============================================================
  // # 💬 🫧  ONE FLOATING LABEL FOR THE WHOLE SCREEN
  // # 🔤 JavaScript
  // # 🎯 Shows what a mark is when the pointer is on it
  // # 🔗 It is what pays for the silence everywhere else. Nothing on
  // #    these cards is captioned any more -- not the rings, not the
  // #    columns, not the days -- and every one of those names is
  // #    still here, one hover away and nought pixels tall
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

  function wireTips(host) {
    host.querySelectorAll('[data-tip]').forEach(el => {
      el.addEventListener('mouseenter', ev => tip.show(el.dataset.tip, ev));
      el.addEventListener('mousemove', ev => tip.show(el.dataset.tip, ev));
      el.addEventListener('mouseleave', () => tip.hide());
    });
  }

  // ============================================================
  // # ⭕ 🔵  RINGS
  // # 🔤 JavaScript
  // # 🎯 Draws any number of parts as rings inside one another, each
  // #    opening from the top and running clockwise
  // # 🔗 A ring is a meter bent into a circle: one ratio against one
  // #    limit, which is exactly what each part is. It is not a pie
  // #    and never a slice of one -- nothing here is a share of a
  // #    whole. The gap left in the track is the part not done, and
  // #    a reader takes in three of them at once in a way three bars
  // #    stacked down a card never allow
  // ============================================================
  const RING = 120;

  function rings(parts) {
    const cx = RING / 2, stroke = 13, gap = 4;
    let out = `<svg viewBox="0 0 ${RING} ${RING}" class="rings" role="img">`;
    parts.forEach((p, k) => {
      const r = cx - stroke / 2 - k * (stroke + gap);
      const c = 2 * Math.PI * r;
      const v = p.value === null || p.value === undefined ? 0 : Math.min(1, p.value);
      out += `<g data-tip="${esc(p.tip)}">` +
        `<circle class="ring-track" cx="${cx}" cy="${cx}" r="${r.toFixed(1)}" stroke-width="${stroke}"/>` +
        `<circle class="ring-fill" cx="${cx}" cy="${cx}" r="${r.toFixed(1)}" stroke-width="${stroke}"` +
        ` stroke="${p.color}" stroke-dasharray="${c.toFixed(1)}"` +
        ` stroke-dashoffset="${(c * (1 - v)).toFixed(1)}"/>` +
        `<circle class="ring-hit" cx="${cx}" cy="${cx}" r="${r.toFixed(1)}" stroke-width="${stroke + gap}"/>` +
        '</g>';
    });
    return out + '</svg>';
  }

  // ============================================================
  // # 🎚️ 📶  FOUR COLUMNS STANDING SIDE BY SIDE
  // # 🔤 JavaScript
  // # 🎯 One upright capsule per habit, filled from the floor
  // # 🔗 Four separate things, so four separate uprights -- and
  // #    height against a common floor is the one encoding a reader
  // #    compares without thinking. Rings would have said these four
  // #    were parts of one thing, which they are not: sleeping well
  // #    is not a quarter of anything
  // ============================================================
  function columns(items) {
    const w = 132, top = 98, bw = 18, gapW = (w - items.length * bw) / (items.length - 1 || 1);
    const h = top + 14;                       // room under the floor for one word
    let out = `<svg viewBox="0 0 ${w} ${h}" class="cols" role="img">`;
    items.forEach((it, k) => {
      const x = w - bw - k * (bw + gapW);
      const v = it.value === null || it.value === undefined ? 0 : Math.min(1, it.value);
      const fh = Math.max(v > 0 ? bw : 0, v * top);
      out += `<g data-tip="${esc(it.tip)}">` +
        `<rect class="col-track" x="${x.toFixed(1)}" y="0" width="${bw}" height="${top}" rx="${bw / 2}"/>` +
        `<rect class="col-fill" x="${x.toFixed(1)}" y="${(top - fh).toFixed(1)}" width="${bw}"` +
        ` height="${fh.toFixed(1)}" rx="${bw / 2}"/>` +
        // One word under each. Four unlabelled columns is a guessing
        // game, and three of the four rings on the devotion card are
        // learnable in a way four habits are not
        `<text class="col-name" x="${(x + bw / 2).toFixed(1)}" y="${h - 2}" text-anchor="middle">${esc(it.short)}</text>` +
        '</g>';
    });
    return out + '</svg>';
  }

  // ============================================================
  // # 🌗 📐  AN ARC BETWEEN THE TWO IT CAME FROM
  // # 🔤 JavaScript
  // # 🎯 A three quarter arc filled to the value, with a notch on it
  // #    for each of the two measures it is made of
  // # 🔗 The only card whose number is not its own. Instead of
  // #    redrawing its two parents beside it -- they are cards of
  // #    their own an inch away -- it marks where each of them falls
  // #    on the same arc, so the reader sees the middle it was
  // #    pulled to and which end pulled hardest, in two small ticks
  // #    and no words at all
  // ============================================================
  function arc(value, marks, color) {
    const s = 120, cx = s / 2, r = 46, stroke = 13;
    const SPAN = 270, START = 135;                       // opens at the bottom
    const pos = t => {
      const a = (START + SPAN * t) * Math.PI / 180;
      return [cx + r * Math.cos(a), cx + r * Math.sin(a)];
    };
    const sweep = t => {
      const [x0, y0] = pos(0), [x1, y1] = pos(t);
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${SPAN * t > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };
    const v = value === null || value === undefined ? 0 : Math.min(1, value);

    let out = `<svg viewBox="0 0 ${s} ${s}" class="arc" role="img">` +
      `<path class="arc-track" d="${sweep(1)}" stroke-width="${stroke}"/>` +
      (v > 0 ? `<path class="arc-fill" d="${sweep(v)}" stroke-width="${stroke}" stroke="${color}"/>` : '');

    marks.forEach(mk => {
      if (mk.value === null || mk.value === undefined) return;
      const [x, y] = pos(Math.min(1, mk.value));
      out += `<g data-tip="${esc(mk.tip)}"><circle class="arc-mark" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/>` +
        `<circle class="ring-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" stroke-width="0" fill="transparent"/></g>`;
    });
    return out + '</svg>';
  }

  // ============================================================
  // # ⚫ 🔗  A ROW OF DAYS, AND THE RUN JOINED UP
  // # 🔤 JavaScript
  // # 🎯 One dot per day, solid when kept, and the longest unbroken
  // #    run drawn as a bar behind its dots
  // # 🔗 The joined run is the whole point of this card. Springiness
  // #    is not how many dots are filled, it is whether they come
  // #    back together after a gap -- and a bar under the longest
  // #    stretch makes that one thing visible before any number is
  // #    read. Day one on the right, like every other chart here
  // ============================================================
  function dots(series, n, longest) {
    const w = 320, h = 26, step = w / n, r = Math.min(4.5, step / 2 - 1.2);
    const x = d => w - step / 2 - (d - 1) * step;

    // Find where the longest run sits, so it can be underlined
    let best = { start: 0, len: 0 }, run = 0, runStart = 0;
    for (let d = 1; d <= n; d++) {
      const hit = series.find(p => p.day === d);
      const on = hit && hit.value === 1;
      if (on) { if (!run) runStart = d; run++; if (run > best.len) best = { start: runStart, len: run }; }
      else run = 0;
    }

    let out = `<svg viewBox="0 0 ${w} ${h}" class="dots" role="img">`;
    if (best.len > 1) {
      const x1 = x(best.start + best.len - 1), x2 = x(best.start);
      out += `<rect class="dot-run" x="${(x1 - r).toFixed(1)}" y="${(h / 2 - r - 2).toFixed(1)}"` +
        ` width="${(x2 - x1 + 2 * r).toFixed(1)}" height="${(2 * r + 4).toFixed(1)}" rx="${r + 2}"/>`;
    }
    for (let d = 1; d <= n; d++) {
      const hit = series.find(p => p.day === d);
      const v = hit ? hit.value : null;
      const cls = v === null || v === undefined ? 'dot-none' : v ? 'dot-on' : 'dot-off';
      out += `<circle class="${cls}" cx="${x(d).toFixed(1)}" cy="${h / 2}" r="${r.toFixed(1)}"` +
        ` data-tip="${d} — ${v === null || v === undefined ? 'لم يُسجَّل' : v ? 'ذاكر' : 'لم يذاكر'}"/>`;
    }
    return out + `</svg>` + (longest > 1 ? '' : '');
  }

  // ============================================================
  // # 🔘 🗓️  THE MONTH AS A CLOSED CIRCLE
  // # 🔤 JavaScript
  // # 🎯 One notch per day around a ring, lit on a day that held
  // # 🔗 Holding the line is a thing you either close or leave open,
  // #    and a circle is the only shape that says so: a row of cells
  // #    has no end to reach, a ring plainly does. The notches are
  // #    separate marks rather than one swept arc, because the days
  // #    that count are scattered through the month and an arc would
  // #    draw them as one unbroken stretch they never were
  // ============================================================
  function dayRing(series, n) {
    const s = 120, cx = s / 2, r = 46, len = 9;
    let out = `<svg viewBox="0 0 ${s} ${s}" class="dayring" role="img">`;
    for (let d = 1; d <= n; d++) {
      const a = (-90 + (360 * (d - 1)) / n) * Math.PI / 180;
      const hit = series.find(p => p.day === d);
      const v = hit ? hit.value : null;
      const cls = v === null || v === undefined ? 'notch-none' : v ? 'notch-on' : 'notch-off';
      const x1 = cx + (r - len / 2) * Math.cos(a), y1 = cx + (r - len / 2) * Math.sin(a);
      const x2 = cx + (r + len / 2) * Math.cos(a), y2 = cx + (r + len / 2) * Math.sin(a);
      out += `<line class="${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"` +
        ` data-tip="${d} — ${v === null || v === undefined ? 'لم يُسجَّل' : v ? 'ملتزم' : 'غير ملتزم'}"/>`;
    }
    return out + '</svg>';
  }

  // ============================================================
  // # 🧱 🃏  PUTTING A CARD TOGETHER
  // # 🔤 JavaScript
  // # 🎯 The shell every measure sits in: its name, its figure, and
  // #    the shape under them
  // # 🔗 Three things on a card and no fourth. The subtitle, the
  // #    small print, the legend and the row of named percentages
  // #    are all gone: what each of them said is on the shape itself
  // #    now, in the tooltip of the mark it belonged to
  // ============================================================
  const big = (value, before) => {
    let d = '';
    if (value !== null && before !== null && before !== undefined) {
      const n = Math.round((value - before) * 100);
      d = `<span class="delta ${n > 0 ? 'up' : n < 0 ? 'down' : ''}">${n > 0 ? '+' : ''}${n}</span>`;
    }
    return '<div class="hero">' +
      (value === null ? '<span class="none">—</span>' : `<b>${pct(value)}%</b>`) + d + '</div>';
  };

  const card = (id, title, body, wide) =>
    `<article class="mcard${wide ? ' wide' : ''}" style="--c:${HUE[id]}" data-card="${id}">` +
    `<h3>${title}</h3>${body}</article>`;

  const tick = (label, value) => `<div class="tick"><span>${label}</span><b>${value}</b></div>`;

  // ============================================================
  // # 🗂️ 🖼️  THE FIVE
  // # 🔤 JavaScript
  // # 🎯 Each measure's own body
  // # 🔗 Every label that used to be printed beside a mark is now in
  // #    that mark's tooltip. The only words left on a card are its
  // #    name and, where a figure would be meaningless without one,
  // #    a word of three letters
  // ============================================================
  function loveCard(r, prev) {
    const p = r.love.parts;
    const t = (name, w, g) => `${name} · وزن ${w} · ${g.done} من ${g.answered}`;
    return card('love', 'محبة الله',
      big(r.love.value, prev && prev.love.value) +
      '<div class="shape">' + rings([
        { value: p.fard.ratio, color: LOVE_STEPS[0], tip: t('الواجبات', '٥٠٪', p.fard) },
        { value: p.avoid.ratio, color: LOVE_STEPS[1], tip: t('اجتناب النواهي', '٢٥٪', p.avoid) },
        { value: p.nafl.ratio, color: LOVE_STEPS[2], tip: t('النوافل', '٢٥٪', p.nafl) }
      ]) + '</div>');
  }

  // The short name is cut from the owner's own words rather than
  // invented: the first word of each is already the thing itself
  const SHORT = { 'الاكل معد منزليا': 'أكل', 'النادي': 'نادي',
    'عدم شرب قهوة/ الا سبت': 'قهوة', 'النوم المبكر قبل 9': 'نوم' };

  function bodyCard(r, prev) {
    const items = r.body.items.map(i => ({
      value: i.ratio,
      short: SHORT[i.label] || i.label.split(' ')[0],
      tip: `${i.label} · ${i.done} من ${i.target} · ${i.ratio === null ? '—' : Math.round(i.ratio * 100) + '٪'}`
    }));
    return card('body', 'الصحة الجسدية',
      big(r.body.value, prev && prev.body.value) +
      `<div class="shape">${columns(items)}</div>`);
  }

  const mindCard = (r, prev) => card('mind', 'الصحة النفسية',
    big(r.mind.value, prev && prev.mind.value) +
    '<div class="shape">' + arc(r.mind.value, [
      { value: r.mind.inputs.love, tip: `محبة الله · ${pct(r.mind.inputs.love)}٪` },
      { value: r.mind.inputs.body, tip: `الصحة الجسدية · ${pct(r.mind.inputs.body)}٪` }
    ], HUE.mind) + '</div>');

  function studyCard(r, prev, n) {
    const s = r.study;
    return card('study', 'المرونة الذهنية',
      big(s.value, prev && prev.study.value) +
      `<div class="shape row">${dots(s.daily, n, s.longest)}</div>` +
      '<div class="ticks">' +
      tick('إنجاز', s.achievement === null ? '—' : pct(s.achievement) + '٪') +
      tick('تعافٍ', s.recovery === null ? '—' : pct(s.recovery) + '٪') +
      tick('أطول', s.longest) +
      '</div>');
  }

  function gritCard(r, prev, n) {
    const bars = r.grit.ranked.map((m, k) =>
      `<div class="gbar${k === 0 ? ' weak' : ''}" data-tip="${esc(m.label)} · ${pct(m.value)}٪">` +
      `<span style="height:${Math.round(m.value * 100)}%"></span></div>`).join('');
    return card('grit', 'الصلابة والالتزام',
      '<div class="split">' +
      '<div class="half">' +
      big(r.grit.value, prev && prev.grit.value) +
      '<div class="ticks">' +
      tick('ملتزمة', `${r.grit.committed}/${r.grit.written}`) +
      tick('أطول', r.grit.longest) +
      '</div></div>' +
      `<div class="shape" data-tip="يوم ملتزم: بلغ فيه ${M.NEED} من ٤ مقاييس حدّ ${pct(M.FLOOR)}٪">${dayRing(r.grit.daily, n)}</div>` +
      `<div class="gbars" data-tip="المقاييس الأربعة، والأضعف باهت">${bars}</div>` +
      '</div>', true);
  }

  // ============================================================
  // # 🚪 🖌️  PUTTING THE MONTH ON THE SCREEN
  // # 🔤 JavaScript
  // # 🎯 Asks the engine for this month and the one before, draws
  // #    the five cards, and hangs the one tooltip on every mark
  // # 🔗 The month before is fetched only for the change beside each
  // #    figure. A month with nothing written says so in a line
  // #    rather than drawing five empty shapes: an empty chart reads
  // #    as a thing that broke, not a month not yet lived
  // ============================================================
  function render(year, month, host) {
    // The same read-only rule the board draws by: a blank square on a
    // day already past is counted as not done. The numbers have to be
    // measured off exactly what the reader is looking at, or he reads
    // a red month and is told it scored well
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

    host.innerHTML = head +
      loveCard(r, prev) + bodyCard(r, prev) + mindCard(r, prev) +
      studyCard(r, prev, n) + gritCard(r, prev, n);

    wireTips(host);
  }

  window.CheckMeMetricsScreen = { render, HUE };
})();
