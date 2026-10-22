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
// ============================================================
(() => {
  const SERVICE_URL = 'https://qpxltggjchspcmqwibqg.supabase.co';
  const PUBLIC_KEY = 'sb_publishable_2Zhv75beNB67TjU4FzuKow_usYx7HBP';

  // ============================================================
  // # 🚪 🚪  TWO SITES, ONE DATABASE, TWO DOORS
  // # 🔤 JavaScript
  // # 🎯 Gives this site its own name for the session it keeps in the
  // #    browser, instead of the one the library picks by itself
  // # 🔗 This is the whole reason the line exists. The two values above
  // #    are MyTerm's project, shared because the free plan allows two
  // #    live projects and both slots were taken. The library names the
  // #    stored session after the PROJECT, so without this line both
  // #    sites would reach for the same key -- and MyTerm and CheckMe
  // #    sit on one GitHub Pages address, which means one browser store
  // #    between them. A login on either would then be a login on the
  // #    other, and a logout would throw the visitor out of both. With
  // #    a name of its own the session is this site's alone. What is
  // #    still shared on purpose is the LIST OF ACCOUNTS: one email and
  // #    password opens both sites. What is never shared is the data,
  // #    which lives in its own table and in the user's own Drive
  // ============================================================
  const db = supabase.createClient(SERVICE_URL, PUBLIC_KEY, {
    auth: { storageKey: 'checkme.auth' }
  });

  window.CheckMeAuth = {
    db,
    signUp: (email, password) => db.auth.signUp({ email, password }),
    signIn: (email, password) => db.auth.signInWithPassword({ email, password }),
    signOut: () => db.auth.signOut(),
    session: () => db.auth.getSession()
  };
})();
