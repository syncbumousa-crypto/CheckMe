// ============================================================
// # 🪟 🔀  WHICH MAIN SCREEN IS SHOWING
// # 🔤 JavaScript
// # 🎯 Builds the twelve month buttons and switches the page between
// #    the board and a month's own screen
// # 🔗 The dock is a row of tabs, not a row of windows: pressing one
// #    takes the reader somewhere instead of covering where he was.
// #    The board keeps its name `تتبّع أدائك` because that is what
// #    the grid IS. The months lead to screens with nothing in them
// #    yet, on purpose: their contents are still to be decided, and
// #    filling them with a guess would be work to undo
// ============================================================
(() => {
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'ابريل', 'ماي', 'يونيو',
    'جولاي', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];

  const $ = id => document.getElementById(id);
  const thisMonth = new Date().getMonth() + 1;
  const YEAR = new Date().getFullYear();

  let keptScroll = 0;

  // ============================================================
  // # 📜 🧠  PUTTING THE GRID BACK WHERE IT WAS
  // # 🔤 JavaScript
  // # 🎯 Remembers how far down the board was scrolled when it is
  // #    left, and scrolls back to it on return
  // # 🔗 A hidden element is not laid out at all, and a box that is
  // #    not laid out forgets how far it was scrolled. Without these
  // #    two lines, glancing at a month and coming back would throw
  // #    the reader to the first of January every time
  // ============================================================
  function show(which, title) {
    const board = $('view-board'), blank = $('view-blank'), grid = $('grid-wrap');

    if (which === 'board') {
      blank.hidden = true;
      board.hidden = false;
      grid.scrollTop = keptScroll;
    } else {
      if (!board.hidden) keptScroll = grid.scrollTop;
      board.hidden = true;
      $('blank-title').textContent = title;
      blank.hidden = false;
    }

    $('track-btn').classList.toggle('is-on', which === 'board');
    [...document.querySelectorAll('.month-btn')].forEach(b =>
      b.classList.toggle('is-on', which !== 'board' && b.dataset.m === which));
  }

  // ============================================================
  // # 🧰 🔘  THE MONTH BUTTONS
  // # 🔤 JavaScript
  // # 🎯 Writes the twelve of them into the dock and hangs every
  // #    press on the switch above
  // # 🔗 The twelve names live here and not in the page, so there is
  // #    one list to change and not two. One listener on the row
  // #    rather than twelve on the buttons, which is the same reason
  // #    the grid has one listener for eleven thousand squares
  // ============================================================
  function start() {
    $('dock-months').innerHTML = MONTHS.map((name, k) =>
      `<button class="month-btn${k + 1 === thisMonth ? ' is-now' : ''}" type="button" ` +
      `data-m="${k + 1}">${name}</button>`).join('');

    $('track-btn').onclick = () => show('board');

    $('dock-months').addEventListener('click', e => {
      const btn = e.target.closest('.month-btn');
      if (btn) show(btn.dataset.m, `${MONTHS[Number(btn.dataset.m) - 1]} ${YEAR}`);
    });

    // Take the board's scroll as it already stands before the first
    // switch. This file loads after the board file, which has just
    // scrolled the grid down to today -- and `show` restores what it
    // remembers, so without this line the opening move of the page
    // would be to throw the reader back to the first of January
    keptScroll = $('grid-wrap').scrollTop;
    show('board');
  }

  start();
})();
