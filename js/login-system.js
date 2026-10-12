/* n-gon account integration using the shared LoginSystem module.
 * Loaded after auth.js and Supabase JS by index.html.
 */
(() => {
  "use strict";
  const style = document.createElement("style");
  style.textContent = `
    #ngon-account { position:fixed; z-index:100000; top:12px; left:12px; font:14px Arial,sans-serif; color:#333; }
    #ngon-account button,#ngon-account input { font:inherit; margin:3px 2px; padding:6px 8px; }
    #ngon-account .panel { background:rgba(255,255,255,.97); border:1px solid #999; padding:10px; max-width:280px; }
    #ngon-account .status { font-size:12px; overflow-wrap:anywhere; }
    #ngon-admin-menu { position:fixed; z-index:100001; inset:6%; overflow:auto; padding:18px; background:#111; color:#eee; border:2px solid #0b5; font:14px monospace; }
    #ngon-admin-menu button { margin:4px; padding:6px 10px; }
  `;
  document.head.appendChild(style);
  const root = document.createElement("section");
  root.id = "ngon-account";
  root.innerHTML = `
    <div class="panel">
      <strong>n-gon account</strong>
      <div id="ngon-account-status" class="status">Connecting…</div>
      <div id="ngon-account-fields">
        <input id="ngon-account-email" type="email" placeholder="Email" autocomplete="email">
        <input id="ngon-account-password" type="password" placeholder="Password" autocomplete="current-password">
        <input id="ngon-account-username" placeholder="Username (for signup)" maxlength="24" style="display:none">
        <div id="ngon-account-error" class="status" role="status"></div>
        <button id="ngon-account-submit">Log in</button>
        <button id="ngon-account-toggle">Create account</button>
        <button id="ngon-account-forgot">Reset password</button>
        <button id="ngon-account-logout" style="display:none">Log out</button>
      </div>
      <div class="status">Admin full-menu shortcut: F8</div>
    </div>`;
  document.body.appendChild(root);
  const $ = id => document.getElementById(id);
  let signup = false;
  let isAdmin = false;
  let menuOpen = false;

  function status(message) { $("ngon-account-status").textContent = message || ""; }
  function error(message) { $("ngon-account-error").textContent = message || ""; }
  function render() {
    $("ngon-account-username").style.display = signup ? "block" : "none";
    $("ngon-account-submit").textContent = signup ? "Create account" : "Log in";
    $("ngon-account-toggle").textContent = signup ? "Back to login" : "Create account";
  }
  function renderState(user, profile) {
    isAdmin = !!(user && profile && profile.role === "admin");
    if (user) {
      status("Signed in as " + (profile?.username || user.email || "Account") + (isAdmin ? " · ADMIN" : ""));
      $("ngon-account-logout").style.display = "inline-block";
    } else {
      status("Not signed in");
      $("ngon-account-logout").style.display = "none";
      closeAdminMenu();
    }
  }
  async function submit() {
    error("");
    try {
      if (signup) {
        const result = await LoginSystem.signup($("ngon-account-email").value, $("ngon-account-password").value, $("ngon-account-username").value);
        status(result.session ? "Account created and signed in." : "Account created. Verify your email, then log in.");
      } else {
        await LoginSystem.login($("ngon-account-email").value, $("ngon-account-password").value);
      }
    } catch (e) { error(e?.message || String(e)); }
  }
  $("ngon-account-submit").addEventListener("click", submit);
  $("ngon-account-toggle").addEventListener("click", () => { signup = !signup; error(""); render(); });
  $("ngon-account-forgot").addEventListener("click", async () => {
    error("");
    try { await LoginSystem.forgotPassword($("ngon-account-email").value); status("Password reset email sent."); }
    catch (e) { error(e?.message || String(e)); }
  });
  $("ngon-account-logout").addEventListener("click", async () => {
    error("");
    try { await LoginSystem.logout(); renderState(null, null); }
    catch (e) { error(e?.message || String(e)); }
  });
  $("ngon-account-password").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  window.addEventListener("login-state", e => renderState(e.detail?.user, e.detail?.profile));
  window.addEventListener("login-banned", e => error("Account banned: " + (e.detail?.reason || "No reason provided.")));

  function closeAdminMenu() {
    document.getElementById("ngon-admin-menu")?.remove();
    menuOpen = false;
  }
  function unlockMenu() {
    if (!isAdmin || !LoginSystem?.isAdmin) {
      status("F8 requires an authenticated admin account.");
      return;
    }
    if (menuOpen) { closeAdminMenu(); return; }
    menuOpen = true;
    const panel = document.createElement("aside");
    panel.id = "ngon-admin-menu";
    panel.innerHTML = `
      <h2>n-gon · Admin / Full Testing Menu</h2>
      <p>Admin-only controls. These expose the game's existing testing hooks; they do not change server-side permissions.</p>
      <button data-action="testing">Toggle built-in testing mode (T)</button>
      <button data-action="pause">Pause / resume (P)</button>
      <button data-action="close">Close (F8)</button>
      <hr><div id="ngon-admin-feedback">Ready.</div>
      <p>Use the game's own testing controls after enabling testing mode. This panel does not fabricate a separate game menu or invoke unknown functions.</p>`;
    panel.addEventListener("click", event => {
      const action = event.target?.dataset?.action;
      if (action === "close") closeAdminMenu();
      if (action === "testing") {
        try {
          const key = document.getElementById("key-testing");
          if (key) key.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          else document.getElementById("ngon-admin-feedback").textContent = "Testing key control not found; press T in-game.";
        } catch (e) { document.getElementById("ngon-admin-feedback").textContent = e?.message || String(e); }
      }
      if (action === "pause") {
        try {
          const key = document.getElementById("key-pause");
          if (key) key.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          else document.getElementById("ngon-admin-feedback").textContent = "Pause key control not found; press P in-game.";
        } catch (e) { document.getElementById("ngon-admin-feedback").textContent = e?.message || String(e); }
      }
    });
    document.body.appendChild(panel);
  }
  window.addEventListener("keydown", event => {
    if (!(event.ctrlKey && event.code === "KeyP") || event.repeat || event.target?.matches("input,textarea,select,[contenteditable=true]")) return;
    if (!isAdmin || !LoginSystem?.isAdmin) return;
    event.preventDefault();
    unlockMenu();
  });
  render();
  if (!window.LoginSystem) {
    status("Login module is not loaded. Add Supabase JS and auth.js before this script.");
    return;
  }
  LoginSystem.init().catch(e => error(e?.message || String(e)));
})();