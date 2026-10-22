// ============================================================
// # 📋 🧱  WHAT IS BEING CHECKED
// # 🔤 JavaScript
// # 🎯 Nothing here shows on screen. It is the list of the thirty
// #    things, in five groups, and the three answers a square can hold
// # 🔗 The order of this list IS the storage order: a day is thirty
// #    characters, and the character at a place belongs to the item at
// #    the same place. So a line may be renamed freely, but moving one
// #    or dropping one rewrites the meaning of every day already saved.
// #    Add at the END of a group and the old days still read right
// ============================================================
(() => {
  const DONE = '1', MISS = '0', NONE = '-';

  // The labels are the owner's own words, kept exactly as he writes
  // them, and the column heads show them whole.
  // The five hues keep away from green and from red on purpose. Those
  // two now belong to the squares and mean done and not done, and a
  // group whose heading was green would be read as a column of things
  // already finished before a single square was looked at
  const GROUPS = [
    { id: 'morning', label: 'الصبحيات', hue: 38 },
    { id: 'evening', label: 'المسائيات', hue: 280 },
    { id: 'faith', label: 'دينية على طول اليوم', hue: 196 },
    { id: 'life', label: 'حياتية على طول اليوم', hue: 325 },
    { id: 'study', label: 'دراسة', hue: 62 }
  ];

  // ============================================================
  // # 🕌 🧩  THE SIXTEEN THAT ARE REALLY FIVE BY THREE
  // # 🔤 JavaScript
  // # 🎯 Gives every item its group, the band it sits in, its name,
  // #    and what is expected of it
  // # 🔗 The religious group is not a flat list of sixteen. It is the
  // #    five prayers crossed with three things done about each one --
  // #    in congregation, its remembrances, its extra prayers -- and
  // #    two more that belong to no prayer. The crossing is not even:
  // #    there are four `sunan`, not five, because Asr has none. That
  // #    is why the band is stored and not worked out, and it is what
  // #    lets the head group five prayer names under one band name
  // #    instead of standing sixteen long ones side by side.
  // #    AND NOT EVERY LINE IS A DAILY DUTY.
  // #    Three of the thirty are not daily, and measuring them as if
  // #    they were caps their score at a number that can never be
  // #    reached. The gym is a WEEKLY target: counted against every
  // #    day it reads as a failure four days out of seven. And the
  // #    coffee line carries its own exception in its own name --
  // #    `الا سبت` -- so Saturday is not a day it can be failed on,
  // #    and a Saturday answered `ماش` there is the rule being kept
  // #    and not broken. `null` means daily, which is most of them
  // ============================================================
  const row = (g, sub, label, expect = null) => ({ g, sub, label, expect });

  const PER_WEEK = n => ({ perWeek: n });
  const EXCEPT = weekday => ({ exceptWeekday: weekday });   // 0 الأحد .. 6 السبت

  const BASE = [
    row('morning', '', 'قيام الليل'),
    row('morning', '', 'الصدقة'),
    row('morning', '', 'اذكار الصباح'),
    row('morning', '', 'الصلاة عالنبي'),
    row('morning', '', 'الأمر والنهي'),
    row('morning', '', 'صلاة الضحى'),

    row('evening', '', 'أذكار المساء'),
    row('evening', '', 'أذكار النوم'),

    row('faith', 'جماعة', 'الفجر جماعة'),
    row('faith', 'جماعة', 'الظهر جماعة'),
    row('faith', 'جماعة', 'العصر جماعة'),
    row('faith', 'جماعة', 'المغرب جماعة'),
    row('faith', 'جماعة', 'العشا جماعة'),
    row('faith', 'اذكار', 'الفجر اذكار'),
    row('faith', 'اذكار', 'الظهر اذكار'),
    row('faith', 'اذكار', 'العصر اذكار'),
    row('faith', 'اذكار', 'المغرب اذكار'),
    row('faith', 'اذكار', 'العشا اذكار'),
    row('faith', 'سنن', 'الفجر سنن'),
    row('faith', 'سنن', 'الظهر سنن'),
    row('faith', 'سنن', 'المغرب سنن'),
    row('faith', 'سنن', 'العشاء سنن'),
    row('faith', 'النواهي', 'عدم ال7'),
    row('faith', 'النواهي', 'لا موسيقى'),

    row('life', '', 'الاكل معد منزليا'),
    row('life', '', 'النادي', PER_WEEK(4)),
    row('life', '', 'لاغرق سوشال'),
    row('life', '', 'عدم شرب قهوة/ الا سبت', EXCEPT(6)),
    row('life', '', 'النوم المبكر قبل 9'),

    row('study', '', 'هدف المذاكرة')
  ];

  const N0 = BASE.length;

  // ============================================================
  // # ✏️ 🧷  THE OWNER'S OWN CHANGES, LAID OVER THE LIST
  // # 🔤 JavaScript
  // # 🎯 Keeps renames, hidings and new lines in their own store and
  // #    folds them over the base list to make the live one
  // # 🔗 The list's ORDER is the storage order: the character at a
  // #    place in a day belongs to the line at the same place. So
  // #    three things are allowed and a fourth is not.
  // #    RENAME is free -- a name is not an index.
  // #    ADD only ever APPENDS, so every index that already means
  // #    something goes on meaning it, and a day saved thirty
  // #    characters long is simply read as blank in the new place.
  // #    HIDE sets a line aside without removing it, so the line
  // #    keeps its index and its history: the day it is deleted
  // #    outright, every answer after it in every saved day shifts
  // #    one place and a hundred and sixty nine days quietly become
  // #    a record of something else. That is why there is no delete
  // ============================================================
  const EDITS = 'checkme.itemedits';

  const readEdits = () => {
    try {
      const e = JSON.parse(localStorage.getItem(EDITS) || 'null') || {};
      return {
        renamed: e.renamed && typeof e.renamed === 'object' ? e.renamed : {},
        hidden: Array.isArray(e.hidden) ? e.hidden.filter(Number.isInteger) : [],
        added: Array.isArray(e.added) ? e.added.filter(a => a && a.label && a.g) : []
      };
    } catch { return { renamed: {}, hidden: [], added: [] }; }
  };

  let edits = readEdits();

  const build = () => BASE
    .map((it, i) => (edits.renamed[i] ? { ...it, label: edits.renamed[i] } : it))
    .concat(edits.added.map(a => row(a.g, a.sub || '', a.label, a.expect || null)));

  let ITEMS = build();
  let N = ITEMS.length;
  let hidden = new Set(edits.hidden);

  const refresh = () => {
    ITEMS = build();
    N = ITEMS.length;
    hidden = new Set(edits.hidden);
    window.CheckMeDayBoard.ITEMS = ITEMS;
    window.CheckMeDayBoard.N = N;
    window.CheckMeDayBoard.hidden = hidden;
    document.dispatchEvent(new CustomEvent('items-changed'));
  };

  const saveEdits = () => {
    try { localStorage.setItem(EDITS, JSON.stringify(edits)); } catch {}
    refresh();
  };

  const renameItem = (i, label) => {
    const name = String(label || '').trim();
    if (!name || i < 0 || i >= N) return false;
    if (i < N0) edits.renamed[i] = name; else edits.added[i - N0].label = name;
    saveEdits();
    return true;
  };

  const addItem = ({ g, sub, label, expect }) => {
    const name = String(label || '').trim();
    if (!name || !GROUPS.some(x => x.id === g)) return false;
    edits.added.push({ g, sub: sub || '', label: name, expect: expect || null });
    saveEdits();
    return true;
  };

  const setHidden = (i, on) => {
    edits.hidden = edits.hidden.filter(x => x !== i);
    if (on) edits.hidden.push(i);
    saveEdits();
    return true;
  };

  const isBase = i => i < N0;

  // ============================================================
  // # 🔢 📅  A DAY IS THIRTY CHARACTERS
  // # 🔤 JavaScript
  // # 🎯 Makes an empty day, reads one square out of a day, puts one
  // #    square back, and counts how many were done
  // # 🔗 Thirty characters instead of thirty named fields, because a
  // #    year is three hundred and sixty five days and the file this
  // #    lands in belongs to the user's Drive: forty bytes a day keeps
  // #    a whole year near sixteen thousand, which is one small write.
  // #    Every reader is forgiving: a day that came back short, long
  // #    or not a string at all is read as an empty day rather than
  // #    throwing, because this file is the user's to edit by hand
  // ============================================================
  const blank = () => NONE.repeat(N);

  const clean = s => {
    if (typeof s !== 'string') return blank();
    const fixed = (s + blank()).slice(0, N);
    return [...fixed].map(c => (c === DONE || c === MISS ? c : NONE)).join('');
  };

  const at = (day, i) => clean(day)[i];

  const put = (day, i, value) => {
    const chars = [...clean(day)];
    chars[i] = value === DONE || value === MISS ? value : NONE;
    return chars.join('');
  };

  const score = day => {
    const s = clean(day);
    let done = 0;
    for (const c of s) if (c === DONE) done++;
    return { done, total: N, pct: Math.round((done / N) * 100) };
  };

  const next = value => (value === NONE ? DONE : value === DONE ? MISS : NONE);

  // ============================================================
  // # 💾 🗄️  WHERE THE YEAR IS KEPT
  // # 🔤 JavaScript
  // # 🎯 Reads and writes the whole board in the browser's own lasting
  // #    store, under a name that belongs to this site alone
  // # 🔗 This is a stop on the way, the same stop MyTerm made: the
  // #    board's home is the user's Drive file, and this becomes the
  // #    quick copy beside it. The name carries the site because
  // #    MyTerm and CheckMe share one browser store, sitting as they
  // #    do on one GitHub Pages address. Every call is wrapped: a
  // #    browser with its shields up refuses the store and throws
  // #    instead of answering, and a board that cannot be saved must
  // #    still be a board that can be read
  // ============================================================
  const KEY = 'checkme.dayboard';

  const read = () => {
    try {
      const kept = JSON.parse(localStorage.getItem(KEY) || 'null');
      const days = kept && typeof kept.days === 'object' && kept.days ? kept.days : {};
      const out = {};
      for (const [date, line] of Object.entries(days)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) out[date] = clean(line);
      }
      return { days: out };
    } catch { return { days: {} }; }
  };

  const write = board => {
    try {
      const days = {};
      for (const [date, line] of Object.entries(board.days || {})) {
        if (clean(line) !== blank()) days[date] = clean(line);
      }
      localStorage.setItem(KEY, JSON.stringify({ app: 'CheckMe', days }));
      return true;
    } catch { return false; }
  };

  // ============================================================
  // # ☁️ 🔁  THE SAME YEAR, IN THE USER'S OWN DRIVE
  // # 🔤 JavaScript
  // # 🎯 Pulls the days out of the Drive file into the board, and
  // #    pushes the board back into it
  // # 🔗 The browser store is this device. The Drive file is the
  // #    account: it is what makes the year the owner's and not his
  // #    laptop's. Pushing reads the file FIRST and puts the days back
  // #    into whatever else it holds, because the same file carries
  // #    the linking stamp and anything a later feature adds, and a
  // #    blind overwrite would quietly drop a neighbour's field.
  // #    Pulling MERGES rather than replaces: a day typed on a phone
  // #    while the laptop was shut must not be wiped by the laptop
  // ============================================================
  const cloud = () => window.CheckMeCloud;

  const pull = async fileId => {
    const file = await cloud().readFile(fileId);
    const theirs = file && typeof file.days === 'object' && file.days ? file.days : {};
    const mine = read().days;
    const merged = { ...mine };
    let taken = 0;
    for (const [date, line] of Object.entries(theirs)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const c = clean(line);
      if (c === blank()) continue;
      if (!merged[date]) { merged[date] = c; taken++; }
      else if (merged[date] !== c) {
        // Two devices answered the same day. Neither is thrown away:
        // an answer beats a blank, square by square
        merged[date] = [...merged[date]]
          .map((ch, i) => (ch === NONE ? c[i] : ch)).join('');
        taken++;
      }
    }
    write({ days: merged });
    return { days: merged, taken, inFile: Object.keys(theirs).length };
  };

  const push = async fileId => {
    const file = (await cloud().readFile(fileId)) || { app: 'CheckMe' };
    file.days = read().days;
    file.days_saved_at = new Date().toISOString();
    await cloud().writeFile(fileId, file);
    return Object.keys(file.days).length;
  };

  // ============================================================
  // # 🍂 🔴  A DAY THAT HAS GONE BY WAS NOT `NOT RECORDED`
  // # 🔤 JavaScript
  // # 🎯 Gives back a READ-ONLY copy of the days in which every
  // #    blank square on a day already past counts as not done
  // # 🔗 The rule the owner asked for, and the one place it lives.
  // #    A blank means `I have not written this down`, which is
  // #    honest about today and a fiction about a day that is over:
  // #    the day ended, and what was not marked done was not done.
  // #    It is applied on the way OUT and never written back, for
  // #    two reasons. His file stays truthful about what his own
  // #    hand typed. And the months he has not imported yet are
  // #    still BLANK underneath, so when their real answers arrive
  // #    they simply land -- whereas a board filled in with
  // #    `missed` would have to be fought to make room for them.
  // #    It starts at the first day he ever recorded, never at the
  // #    first of January: before that the board was not in use,
  // #    and a board not in use is not a failure to use it
  // ============================================================
  const nextDate = iso => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const todayISO = () => {
    const n = new Date();
    const p = x => String(x).padStart(2, '0');
    return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
  };

  const ripen = (days, today) => {
    const stop = today || todayISO();
    const written = Object.keys(days).filter(d => clean(days[d]) !== blank()).sort();
    const out = {};
    for (const [date, line] of Object.entries(days)) out[date] = clean(line);
    if (!written.length) return out;

    // Every day from the first one he ever wrote up to YESTERDAY,
    // whether or not it exists in the store: a day with no row at
    // all is the emptiest kind of past day, not an absent one
    for (let d = written[0]; d < stop; d = nextDate(d)) {
      out[d] = [...(out[d] || blank())].map(c => (c === NONE ? MISS : c)).join('');
    }
    return out;
  };

  window.CheckMeDayBoard = {
    DONE, MISS, NONE, N, GROUPS, ITEMS, hidden, N0,
    blank, clean, at, put, score, next,
    read, write, KEY, pull, push,
    ripen, todayISO,
    renameItem, addItem, setHidden, isBase, editsOf: () => edits
  };
})();
