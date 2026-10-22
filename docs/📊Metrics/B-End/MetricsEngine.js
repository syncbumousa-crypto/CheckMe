// ============================================================
// # 📊 🧮  THE FIVE MEASURES OF A MONTH
// # 🔤 JavaScript
// # 🎯 Nothing here draws anything. Given a year, a month and the
// #    days, it returns the five measures with their parts and their
// #    day by day series
// # 🔗 Built before any chart on purpose. A wrong chart is seen; a
// #    division by the wrong denominator is not, and it reads as a
// #    fact for months. So the numbers come first, with a guard page
// #    that compares them against a second, independent count of the
// #    same days -- and only then is anything drawn.
// #    Every rule in here is written down in `MonthMetricsRoadmap.md`
// ============================================================
(() => {
  const B = window.CheckMeDayBoard;

  // ============================================================
  // # ⚖️ 🔢  THE NUMBERS THAT CAN BE ARGUED WITH
  // # 🔤 JavaScript
  // # 🎯 Every weight and threshold in the five measures, in one
  // #    place
  // # 🔗 They are judgements, not facts, so they are named and sit
  // #    together where they can be changed by one line and argued
  // #    about without reading any code. The religious weights are
  // #    the load bearing one: the voluntary acts are sixteen lines
  // #    of twenty four, so a flat average would hand them two
  // #    thirds of the measure and let a day full of extras outrank
  // #    a day of the five prayers kept. The weight belongs to the
  // #    KIND, not to how many lines happen to be in it
  // ============================================================
  const WEIGHTS = {
    love: { fard: 0.50, avoid: 0.25, nafl: 0.25 },
    mind: { love: 0.50, body: 0.50 },
    study: { achievement: 0.50, recovery: 0.50 }
  };

  const FLOOR = 0.60;          // a committed day clears this in EVERY measure

  // ============================================================
  // # 🏷️ 🧩  WHICH LINE BELONGS TO WHICH MEASURE
  // # 🔤 JavaScript
  // # 🎯 Sorts the thirty into the kinds the measures are built from,
  // #    and says out loud which lines belong to no measure yet
  // # 🔗 Worked out from the group and the band rather than from a
  // #    list of numbers, because a list of numbers silently means
  // #    something else the day a line is inserted. The one line
  // #    that cannot be worked out is named: `الأمر والنهي` sits in
  // #    the morning group but is counted a duty. And the counts are
  // #    CHECKED, not assumed -- six duties, two avoidances, sixteen
  // #    voluntary -- because a sorter that quietly drops a line
  // #    gives an answer that is wrong and looks fine
  // ============================================================
  const BY_NAME = { duty: 'الأمر والنهي', drown: 'عدم الغرق بالسوشال ويوتيوب' };

  const kinds = (() => {
    const fard = [], avoid = [], nafl = [], body = [], study = [], orphan = [];

    B.ITEMS.forEach((it, i) => {
      if (it.g === 'study') return study.push(i);
      if (it.g === 'life') return it.label === BY_NAME.drown ? orphan.push(i) : body.push(i);
      if (it.g === 'faith' && it.sub === 'جماعة') return fard.push(i);
      if (it.g === 'faith' && it.sub === 'وغيرها') return avoid.push(i);
      if (it.label === BY_NAME.duty) return fard.push(i);
      nafl.push(i);
    });

    const want = { fard: 6, avoid: 2, nafl: 16, body: 4, study: 1 };
    const got = { fard: fard.length, avoid: avoid.length, nafl: nafl.length, body: body.length, study: study.length };
    const wrong = Object.keys(want).filter(k => want[k] !== got[k]);

    return { fard, avoid, nafl, body, study, orphan, wrong, got };
  })();

  // ============================================================
  // # ➗ 📅  THE DENOMINATOR IS THE WHOLE ARGUMENT
  // # 🔤 JavaScript
  // # 🎯 Works out, for one line over one month, how many days it
  // #    could have been done on and how many it was
  // # 🔗 Three different denominators, one per kind of expectation.
  // #    A blank square means `I did not write this down`, never `I
  // #    failed`, so it is out of the count: one shared denominator
  // #    would turn every blank into a silent failure. A line with
  // #    a weekday exception drops that weekday entirely -- Saturday
  // #    is not a day the coffee rule can be broken on. And a weekly
  // #    target is measured against the target, pro rated over the
  // #    stretch actually written in, never against every day
  // ============================================================
  const answeredOn = (line, i) => line[i] !== B.NONE;

  function lineStats(rows, i) {
    const expect = B.ITEMS[i].expect;
    let answered = 0, done = 0;

    rows.forEach(({ line, weekday }) => {
      if (expect && expect.exceptWeekday === weekday) return;
      if (!answeredOn(line, i)) return;
      answered++;
      if (line[i] === B.DONE) done++;
    });

    if (!answered) return { done: 0, answered: 0, ratio: null, target: null };

    if (expect && expect.perWeek) {
      const target = Math.max(1, (expect.perWeek * answered) / 7);
      return { done, answered, target: Math.round(target * 10) / 10, ratio: Math.min(1, done / target) };
    }
    return { done, answered, target: answered, ratio: done / answered };
  }

  // A group of lines taken together: every answer in the group counts
  // once, so a kind with six lines is not six times a kind with two.
  // The weighting between kinds is done later, and only there
  function groupRatio(rows, list) {
    let done = 0, answered = 0;
    list.forEach(i => { const s = lineStats(rows, i); done += s.done; answered += s.answered; });
    return answered ? { ratio: done / answered, done, answered } : { ratio: null, done: 0, answered: 0 };
  }

  // ============================================================
  // # 🤝 ⚖️  MIXING PARTS WHEN ONE OF THEM IS MISSING
  // # 🔤 JavaScript
  // # 🎯 Adds up weighted parts, ignoring any part that has no answer
  // #    at all and sharing its weight among the rest
  // # 🔗 A day on which no voluntary act was written down is not a
  // #    day on which they were all failed. Dropping the part and
  // #    re-sharing its weight keeps that day comparable with its
  // #    neighbours; counting the missing part as nought would put a
  // #    hole in the line every time a square was left blank
  // ============================================================
  function blend(parts) {
    let sum = 0, weight = 0;
    parts.forEach(([value, w]) => {
      if (value === null || value === undefined) return;
      sum += value * w;
      weight += w;
    });
    return weight ? sum / weight : null;
  }

  // ============================================================
  // # 📆 🧾  THE DAYS OF ONE MONTH, IN ORDER
  // # 🔤 JavaScript
  // # 🎯 Turns the store's days into an ordered list of the written
  // #    days of one month, each with its date, its line and its
  // #    weekday
  // # 🔗 In order, because three of the five measures are about runs
  // #    and recovery and those cannot be read out of an unordered
  // #    bag. The weekday is worked out in UTC: built the ordinary
  // #    way a date takes the browser's zone, and the first of a
  // #    month can come back as the day before -- which would slide
  // #    the Saturday exception onto Friday
  // ============================================================
  function monthRows(year, month, days) {
    const pad = n => String(n).padStart(2, '0');
    const prefix = `${year}-${pad(month)}-`;
    return Object.keys(days)
      .filter(d => d.startsWith(prefix) && days[d] !== B.blank())
      .sort()
      .map(date => ({
        date,
        line: days[date],
        day: Number(date.slice(8, 10)),
        weekday: new Date(Date.UTC(year, month - 1, Number(date.slice(8, 10)))).getUTCDay()
      }));
  }

  const longestRun = flags => {
    let best = 0, run = 0;
    flags.forEach(ok => { run = ok ? run + 1 : 0; if (run > best) best = run; });
    return best;
  };

  // ============================================================
  // # 🕌 ❤️  LOVE OF GOD, AND THE SAME SUM DAY BY DAY
  // # 🔤 JavaScript
  // # 🎯 The month's figure from the three kinds, and one value for
  // #    every written day so the month can be drawn as a line
  // # 🔗 The day by day sum uses the same weights as the month, so
  // #    the line and the headline are the same measure and not two
  // #    that happen to share a name. They are NOT the same
  // #    arithmetic though, and that is on purpose: the month counts
  // #    every answer once across all its days, while a day counts
  // #    only its own -- so the month is not the average of the
  // #    dots, and a day with two answers cannot sway it like a day
  // #    with twenty four
  // ============================================================
  function love(rows) {
    const fard = groupRatio(rows, kinds.fard);
    const avoid = groupRatio(rows, kinds.avoid);
    const nafl = groupRatio(rows, kinds.nafl);
    const w = WEIGHTS.love;

    const daily = rows.map(r => {
      const one = [r];
      return {
        date: r.date, day: r.day, weekday: r.weekday,
        value: blend([
          [groupRatio(one, kinds.fard).ratio, w.fard],
          [groupRatio(one, kinds.avoid).ratio, w.avoid],
          [groupRatio(one, kinds.nafl).ratio, w.nafl]
        ])
      };
    });

    return {
      value: blend([[fard.ratio, w.fard], [avoid.ratio, w.avoid], [nafl.ratio, w.nafl]]),
      parts: { fard, avoid, nafl },
      daily
    };
  }

  // ============================================================
  // # 💪 🩺  THE BODY, AND WHY ITS DAYS LEAVE THE GYM OUT
  // # 🔤 JavaScript
  // # 🎯 The month's figure from the four lines, each against its own
  // #    expectation, and a day by day value from the daily ones only
  // # 🔗 The gym is a weekly target, so it HAS no honest daily value:
  // #    a day without it is not a day it was failed, and letting it
  // #    drag every such day would draw a line that dips four days
  // #    in seven by design. It counts in full in the month's figure,
  // #    where the target is what it is measured against. So the
  // #    month is deliberately not the average of the dots, and the
  // #    card says so under the chart
  // ============================================================
  function body(rows) {
    const items = kinds.body.map(i => ({ i, label: B.ITEMS[i].label, expect: B.ITEMS[i].expect, ...lineStats(rows, i) }));
    const present = items.filter(it => it.ratio !== null);
    const dailyOnly = kinds.body.filter(i => !(B.ITEMS[i].expect && B.ITEMS[i].expect.perWeek));

    const daily = rows.map(r => {
      const usable = dailyOnly.filter(i => {
        const e = B.ITEMS[i].expect;
        return !(e && e.exceptWeekday === r.weekday) && answeredOn(r.line, i);
      });
      return {
        date: r.date, day: r.day, weekday: r.weekday,
        value: usable.length
          ? usable.filter(i => r.line[i] === B.DONE).length / usable.length
          : null
      };
    });

    return {
      value: present.length ? present.reduce((s, it) => s + it.ratio, 0) / present.length : null,
      items,
      daily
    };
  }

  // ============================================================
  // # 🧠 🫧  THE MIND, WHICH HAS NO LINES OF ITS OWN
  // # 🔤 JavaScript
  // # 🎯 Half the love of God and half the body, for the month and
  // #    for every day
  // # 🔗 Exactly the two the owner named and nothing else. One line
  // #    of the thirty -- not drowning in social media -- belongs to
  // #    no measure at all, and the engine REPORTS it rather than
  // #    quietly folding it in here: adding it would be answering a
  // #    question that was asked and not yet answered
  // ============================================================
  function mind(loveOut, bodyOut, rows) {
    const w = WEIGHTS.mind;
    const byDate = {};
    bodyOut.daily.forEach(d => (byDate[d.date] = d.value));

    return {
      value: blend([[loveOut.value, w.love], [bodyOut.value, w.body]]),
      inputs: { love: loveOut.value, body: bodyOut.value },
      daily: loveOut.daily.map(d => ({
        date: d.date, day: d.day, weekday: d.weekday,
        value: blend([[d.value, w.love], [byDate[d.date] ?? null, w.body]]),
        love: d.value,
        body: byDate[d.date] ?? null
      }))
    };
  }

  // ============================================================
  // # 📚 🔁  MENTAL SPRING, WHICH IS RECOVERY AND NOT VOLUME
  // # 🔤 JavaScript
  // # 🎯 How often the study hour was kept, how often a miss was
  // #    answered by keeping it the very next written day, and the
  // #    longest unbroken run
  // # 🔗 One yes or no line a day cannot carry a measure called
  // #    springiness if it is only counted. What makes it that is
  // #    what happens AFTER a miss: a month of thirty with ten
  // #    misses that were each picked straight back up is a
  // #    different month from one with ten misses in a row, and
  // #    counting alone scores them the same. The last written day
  // #    is not counted as a failure to recover -- there is no next
  // #    day yet to judge it by
  // ============================================================
  function study(rows) {
    const i = kinds.study[0];
    const seen = rows.filter(r => answeredOn(r.line, i));
    const hits = seen.map(r => r.line[i] === B.DONE);

    let breaks = 0, recovered = 0;
    for (let k = 0; k < hits.length - 1; k++) {
      if (hits[k]) continue;
      breaks++;
      if (hits[k + 1]) recovered++;
    }

    const achievement = seen.length ? hits.filter(Boolean).length / seen.length : null;
    const recovery = breaks ? recovered / breaks : (seen.length ? 1 : null);
    const w = WEIGHTS.study;

    return {
      value: blend([[achievement, w.achievement], [recovery, w.recovery]]),
      achievement, recovery, breaks, recovered,
      longest: longestRun(hits),
      answered: seen.length,
      daily: rows.map(r => ({
        date: r.date, day: r.day, weekday: r.weekday,
        value: answeredOn(r.line, i) ? (r.line[i] === B.DONE ? 1 : 0) : null
      }))
    };
  }

  // ============================================================
  // # 🪨 🔗  GRIT, WHICH IS EVENNESS AND NOT AN AVERAGE
  // # 🔤 JavaScript
  // # 🎯 The share of days on which EVERY one of the four measures
  // #    cleared the floor, the longest run of them, and which
  // #    measure is the weakest of the four
  // # 🔗 An average of the four would be a fifth copy of what the
  // #    other cards already say, and it would hide the thing this
  // #    card exists to show: a month that was strong in one corner
  // #    and collapsed in another. The `every one of them` test is
  // #    what makes it a different number -- a day rich in worship
  // #    and empty of everything else does not count. A day is only
  // #    counted when all four HAVE a value: a measure with no
  // #    answer that day is not evidence of commitment
  // ============================================================
  function grit(loveOut, bodyOut, mindOut, studyOut, rows) {
    const pick = (series, date) => series.find(d => d.date === date)?.value ?? null;

    const flags = rows.map(r => {
      const four = [
        pick(loveOut.daily, r.date),
        pick(bodyOut.daily, r.date),
        pick(mindOut.daily, r.date),
        pick(studyOut.daily, r.date)
      ];
      return four.every(v => v !== null && v >= FLOOR);
    });

    const ranked = [
      { id: 'love', label: 'محبة الله', value: loveOut.value },
      { id: 'body', label: 'الصحة الجسدية', value: bodyOut.value },
      { id: 'mind', label: 'الصحة النفسية', value: mindOut.value },
      { id: 'study', label: 'المرونة الذهنية', value: studyOut.value }
    ].filter(m => m.value !== null).sort((a, b) => a.value - b.value);

    const committed = flags.filter(Boolean).length;

    return {
      value: rows.length ? committed / rows.length : null,
      committed,
      written: rows.length,
      longest: longestRun(flags),
      weakest: ranked[0] || null,
      ranked,
      floor: FLOOR,
      daily: rows.map((r, k) => ({ date: r.date, day: r.day, weekday: r.weekday, value: flags[k] ? 1 : 0 }))
    };
  }

  // ============================================================
  // # 🚪 📤  THE ONE WAY IN
  // # 🔤 JavaScript
  // # 🎯 Takes a year, a month and the days, and gives back the five
  // #    measures, what is wrong with the sorting if anything, and
  // #    the lines that belong to no measure
  // # 🔗 `wrong` and `orphans` leave with the answer rather than
  // #    being logged somewhere nobody reads. A sorter that lost a
  // #    line still returns a number, and that number looks exactly
  // #    as trustworthy as a right one -- so the doubt travels with
  // #    the figure and the guard page can fail on it
  // ============================================================
  function forMonth(year, month, days) {
    const rows = monthRows(year, month, days || B.read().days);
    const loveOut = love(rows);
    const bodyOut = body(rows);
    const mindOut = mind(loveOut, bodyOut, rows);
    const studyOut = study(rows);

    return {
      year, month, written: rows.length, rows,
      love: loveOut,
      body: bodyOut,
      mind: mindOut,
      study: studyOut,
      grit: grit(loveOut, bodyOut, mindOut, studyOut, rows),
      sortingWrong: kinds.wrong,
      counts: kinds.got,
      orphans: kinds.orphan.map(i => B.ITEMS[i].label)
    };
  }

  window.CheckMeMetrics = { WEIGHTS, FLOOR, kinds, lineStats, monthRows, forMonth };
})();
