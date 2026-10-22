// ============================================================
// # 🔌 🔑  CONNECT TO THE SERVICE AND ASK IT
// # 🔤 JavaScript
// # 🎯 Nothing here shows on screen. It opens the line to the sign in
// #    service, and hands the page four ways to ask: make an account,
// #    log in, log out, and is anyone still logged in
// # 🔗 The screen file calls these four and then draws the answer. The
// #    key below is the public one, so it is safe to show: what keeps
// #    the data safe is the rules on the service, not this key. All the
// #    names sit inside one wrapper, so only CheckMeAuth leaves this file
// #    The two values are CheckMe's OWN project, never MyTerm's: the two
// #    sites sit on one GitHub Pages address, and one project for both
// #    would make a login on either a login on the other. A different
// #    project means a different store key, so the two cannot mix
// ============================================================
(() => {
  const SERVICE_URL = 'PASTE_CHECKME_SUPABASE_URL';
  const PUBLIC_KEY = 'PASTE_CHECKME_PUBLISHABLE_KEY';

  // --- An unfilled value has to SAY SO on the page. Left to itself the
  // --- line below throws, the two screen files then read a name that was
  // --- never made, and every throw after that lands in a promise nobody
  // --- is waiting on -- so the visitor gets a page with two buttons that
  // --- answer nothing and no reason anywhere. One visible line instead
  if (SERVICE_URL.startsWith('PASTE_') || PUBLIC_KEY.startsWith('PASTE_')) {
    document.getElementById('choice')?.setAttribute('hidden', '');
    const say = document.createElement('p');
    say.className = 'note';
    say.textContent = 'مفاتيح Supabase لم تُركَّب بعد. ضعها في ' +
      '🔐accounts/B-End/ProfilesSupabase.js من مشروع CheckMe في Supabase.';
    document.body.prepend(say);
    return;
  }

  const db = supabase.createClient(SERVICE_URL, PUBLIC_KEY);

  window.CheckMeAuth = {
    db,
    signUp: (email, password) => db.auth.signUp({ email, password }),
    signIn: (email, password) => db.auth.signInWithPassword({ email, password }),
    signOut: () => db.auth.signOut(),
    session: () => db.auth.getSession()
  };
})();
