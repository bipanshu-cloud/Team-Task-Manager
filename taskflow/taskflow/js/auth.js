// ============================================================
//  TaskFlow Auth
// ============================================================

let currentUser = null;

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('taskflow_user')); }
  catch { return null; }
}

function setSession(user) {
  sessionStorage.setItem('taskflow_user', JSON.stringify(user));
  currentUser = user;
}

function clearSession() {
  sessionStorage.removeItem('taskflow_user');
  currentUser = null;
}

function showPage(page) {
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-signup').classList.add('hidden');
  document.getElementById(`page-${page}`).classList.remove('hidden');
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!email || !pass) return showError(errEl, 'Please fill in all fields.');

  const user = DB.users.findByEmail(email);
  if (!user || user.password !== pass) return showError(errEl, 'Invalid email or password.');

  setSession(user);
  initApp();
}

function handleSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-pass').value;
  const role = document.getElementById('signup-role').value;
  const errEl = document.getElementById('signup-error');
  errEl.classList.add('hidden');

  if (!name || !email || !pass) return showError(errEl, 'Please fill in all fields.');
  if (pass.length < 6) return showError(errEl, 'Password must be at least 6 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError(errEl, 'Please enter a valid email.');
  if (DB.users.findByEmail(email)) return showError(errEl, 'An account with this email already exists.');

  const user = DB.users.create({ name, email, password: pass, role });
  setSession(user);
  initApp();
}

function handleLogout() {
  clearSession();
  document.getElementById('app-main').classList.add('hidden');
  document.getElementById('app-auth').classList.remove('hidden');
  showPage('login');
  // Clear form fields
  ['login-email','login-pass','signup-name','signup-email','signup-pass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
