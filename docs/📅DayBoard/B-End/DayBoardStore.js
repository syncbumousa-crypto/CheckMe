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

  // The labels are the owner's own words, kept as he writes them. The
  // short one is what fits in a column head three letters wide; the
  // long one is what the tooltip and the legend say
  const GROUPS = [
    { id: 'morning', label: 'الصبحيات', hue: 38 },
    { id: 'evening', label: 'المسائيات', hue: 258 },
    { id: 'faith', label: 'دينية على طول اليوم', hue: 158 },
    { id: 'life', label: 'حياتية على طول اليوم', hue: 199 },
    { id: 'study', label: 'دراسية', hue: 0 }
  ];

  // ============================================================
  // # 🕌 🧩  THE SIXTEEN THAT ARE REALLY FIVE BY THREE
  // # 🔤 JavaScript
  // # 🎯 Gives every item its group, the band it sits in, and the two
  // #    labels
  // # 🔗 The religious group is not a flat list of sixteen. It is the
  // #    five prayers crossed with three things done about each one --
  // #    in congregation, its remembrances, its extra prayers -- and
  // #    two more that belong to no prayer. The crossing is not even:
  // #    there are four `sunan`, not five, because Asr has none. That
  // #    is why the band is stored and not worked out, and it is what
  // #    lets the head read as five short prayer letters under one
  // #    band name instead of sixteen long ones side by side
  // ============================================================
  const row = (g, sub, label, short) => ({ g, sub, label, short });

  const ITEMS = [
    row('morning', '', 'قيام الليل', 'قيام'),
    row('morning', '', 'الصدقة', 'صدقة'),
    row('morning', '', 'اذكار الصباح', 'أذكار'),
    row('morning', '', 'الصلاة عالنبي', 'نبي'),
    row('morning', '', 'الأمر والنهي', 'أمر'),
    row('morning', '', 'صلاة الضحى', 'ضحى'),

    row('evening', '', 'أذكار المساء', 'مساء'),
    row('evening', '', 'أذكار النوم', 'نوم'),

    row('faith', 'جماعة', 'الفجر جماعة', 'ف'),
    row('faith', 'جماعة', 'الظهر جماعة', 'ظ'),
    row('faith', 'جماعة', 'العصر جماعة', 'ع'),
    row('faith', 'جماعة', 'المغرب جماعة', 'م'),
    row('faith', 'جماعة', 'العشا جماعة', 'ش'),
    row('faith', 'اذكار', 'الفجر اذكار', 'ف'),
    row('faith', 'اذكار', 'الظهر اذكار', 'ظ'),
    row('faith', 'اذكار', 'العصر اذكار', 'ع'),
    row('faith', 'اذكار', 'المغرب اذكار', 'م'),
    row('faith', 'اذكار', 'العشا اذكار', 'ش'),
    row('faith', 'سنن', 'الفجر سنن', 'ف'),
    row('faith', 'سنن', 'الظهر سنن', 'ظ'),
    row('faith', 'سنن', 'المغرب سنن', 'م'),
    row('faith', 'سنن', 'العشاء سنن', 'ش'),
    row('faith', 'وغيرها', 'عدم ال7', '٧'),
    row('faith', 'وغيرها', 'لا موسيقى', '♪'),

    row('life', '', 'الاكل معد منزليا', 'أكل'),
    row('life', '', 'النادي', 'نادي'),
    row('life', '', 'عدم الغرق بالسوشال ويوتيوب', 'سوشال'),
    row('life', '', 'عدم شرب قهوة/ الا سبت', 'قهوة'),
    row('life', '', 'النوم المبكر قبل 9', 'نوم٩'),

    row('study', '', 'مذاكرة ساعة', 'مذاكرة')
  ];

  const N = ITEMS.length;

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

  window.CheckMeDayBoard = {
    DONE, MISS, NONE, N, GROUPS, ITEMS,
    blank, clean, at, put, score, next,
    read, write, KEY
  };
})();
