// ============================================================
//  TaskFlow App
// ============================================================

let _currentProjectId = null;
let _currentTaskId = null;

// ---- INIT ----
function initApp() {
  const user = getSession();
  if (!user) {
    document.getElementById('app-auth').classList.remove('hidden');
    document.getElementById('app-main').classList.add('hidden');
    return;
  }
  currentUser = user;

  document.getElementById('app-auth').classList.add('hidden');
  document.getElementById('app-main').classList.remove('hidden');

  // Update sidebar user info
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-role').textContent = user.role;

  // Role-based UI
  document.querySelectorAll('.admin-only').forEach(el => {
    if (user.role === 'admin') el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  navigateTo('dashboard');
}

// ---- NAVIGATION ----
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`page-${page}`)?.classList.remove('hidden');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'projects': renderProjects(); break;
    case 'tasks': renderMyTasks(); break;
    case 'team': renderTeam(); break;
  }
}

// ---- DASHBOARD ----
function renderDashboard() {
  const user = currentUser;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greeting').textContent = `${greeting}, ${user.name.split(' ')[0]}!`;

  const allTasks = DB.tasks.forUser(user.id, user.role);
  const todo = allTasks.filter(t => t.status === 'todo');
  const inprogress = allTasks.filter(t => t.status === 'inprogress');
  const done = allTasks.filter(t => t.status === 'done');
  const overdue = allTasks.filter(t => DB.tasks.isOverdue(t));
  const projects = DB.projects.forUser(user.id, user.role);

  // Stats
  const statsData = [
    { label: 'Total Tasks', value: allTasks.length, sub: 'across all projects', color: 'var(--accent)' },
    { label: 'In Progress', value: inprogress.length, sub: 'being worked on', color: '#f59e0b' },
    { label: 'Completed', value: done.length, sub: `${allTasks.length ? Math.round(done.length/allTasks.length*100) : 0}% completion rate`, color: 'var(--success)' },
    { label: 'Overdue', value: overdue.length, sub: 'need attention', color: 'var(--danger)' },
  ];

  document.getElementById('stats-grid').innerHTML = statsData.map(s => `
    <div class="stat-card" style="--accent-color:${s.color}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" style="color:${s.color}">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>
  `).join('');

  // Recent tasks (last 5)
  const recent = [...allTasks].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  document.getElementById('recent-tasks-list').innerHTML = recent.length
    ? recent.map(t => taskItemHTML(t)).join('')
    : emptyState('◻', 'No tasks yet');

  // Overdue tasks
  document.getElementById('overdue-tasks-list').innerHTML = overdue.length
    ? overdue.map(t => taskItemHTML(t, true)).join('')
    : `<div class="empty-state"><div class="empty-icon">✓</div><div class="empty-text">No overdue tasks!</div></div>`;
}

function taskItemHTML(task, showDue = false) {
  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' }[task.priority];
  const proj = DB.projects.find(task.projectId);
  const assignee = DB.users.find(task.assigneeId);
  return `
    <div class="task-item" onclick="openTaskDetail('${task.id}')">
      <div class="task-dot" style="background:${priorityColor}"></div>
      <div style="flex:1;min-width:0">
        <div class="task-item-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(task.title)}</div>
        <div class="task-item-meta">${proj?.name || ''} ${assignee ? '· ' + assignee.name : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <span class="badge badge-${task.status}">${statusLabel(task.status)}</span>
        ${task.dueDate ? `<span class="task-item-meta ${DB.tasks.isOverdue(task)?'overdue':''}">${formatDate(task.dueDate)}</span>` : ''}
      </div>
    </div>
  `;
}

// ---- PROJECTS ----
function renderProjects() {
  const projects = DB.projects.forUser(currentUser.id, currentUser.role);
  const grid = document.getElementById('projects-grid');

  if (!projects.length) {
    grid.innerHTML = emptyState('◫', 'No projects yet. Create one!');
    return;
  }

  grid.innerHTML = projects.map(p => {
    const tasks = DB.tasks.forProject(p.id);
    const done = tasks.filter(t => t.status === 'done').length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const members = p.memberIds.map(id => DB.users.find(id)).filter(Boolean);
    return `
      <div class="project-card" onclick="openProjectDetail('${p.id}')">
        <div class="project-name">${escHtml(p.name)}</div>
        <div class="project-desc">${escHtml(p.description || 'No description')}</div>
        <div class="project-stats">
          <span class="proj-stat"><strong>${tasks.length}</strong> tasks</span>
          <span class="proj-stat"><strong>${members.length}</strong> members</span>
          <span class="proj-stat"><strong>${done}</strong> done</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--text-muted);flex-shrink:0">${pct}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function openProjectDetail(projectId) {
  _currentProjectId = projectId;
  const proj = DB.projects.find(projectId);
  if (!proj) return;

  const tasks = DB.tasks.forProject(projectId);
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const members = proj.memberIds.map(id => DB.users.find(id)).filter(Boolean);

  document.getElementById('proj-detail-title').textContent = proj.name;
  document.getElementById('proj-detail-desc').textContent = proj.description || 'No description provided.';
  document.getElementById('proj-detail-members').textContent = `👥 ${members.map(m=>m.name).join(', ') || 'None'}`;
  document.getElementById('proj-detail-tasks').textContent = `📋 ${tasks.length} tasks`;
  document.getElementById('proj-detail-pct').textContent = pct + '%';
  document.getElementById('proj-detail-bar').style.width = pct + '%';

  document.getElementById('proj-detail-tasks').innerHTML = tasks.length
    ? tasks.map(t => taskItemHTML(t, true)).join('')
    : emptyState('◻', 'No tasks in this project');

  // admin delete
  document.querySelector('#modal-project-detail .modal-actions')?.remove();

  openModal('modal-project-detail');
}

function openAddTaskToProject() {
  closeModal('modal-project-detail');
  populateNewTaskModal(_currentProjectId);
  openModal('modal-new-task');
}

// ---- MY TASKS (KANBAN) ----
function renderMyTasks() {
  const statusF = document.getElementById('task-filter-status')?.value || 'all';
  const priorityF = document.getElementById('task-filter-priority')?.value || 'all';

  let tasks = DB.tasks.forUser(currentUser.id, currentUser.role);
  if (statusF !== 'all') tasks = tasks.filter(t => t.status === statusF);
  if (priorityF !== 'all') tasks = tasks.filter(t => t.priority === priorityF);

  const cols = [
    { status: 'todo', label: '◻ To Do', color: 'var(--text-secondary)' },
    { status: 'inprogress', label: '⟳ In Progress', color: 'var(--accent)' },
    { status: 'done', label: '✓ Done', color: 'var(--success)' },
  ];

  const board = document.getElementById('kanban-board');
  board.innerHTML = cols.map(col => {
    const colTasks = tasks.filter(t => t.status === col.status);
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <div class="kanban-col-title" style="color:${col.color}">${col.label}</div>
          <span class="col-count">${colTasks.length}</span>
        </div>
        ${colTasks.length
          ? colTasks.map(t => kanbanTaskHTML(t)).join('')
          : `<div class="empty-state" style="padding:20px"><div class="empty-text">No tasks</div></div>`
        }
      </div>
    `;
  }).join('');
}

function kanbanTaskHTML(task) {
  const proj = DB.projects.find(task.projectId);
  const overdue = DB.tasks.isOverdue(task);
  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' }[task.priority];
  return `
    <div class="kanban-task" onclick="openTaskDetail('${task.id}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
        <div class="kt-title">${escHtml(task.title)}</div>
        <div class="task-dot" style="background:${priorityColor};flex-shrink:0;margin-top:3px"></div>
      </div>
      <div class="kt-meta">
        <span class="kt-project">${proj?.name || ''}</span>
        ${task.dueDate ? `<span class="kt-due ${overdue?'overdue':''}">${overdue?'⚠ ':''}${formatDate(task.dueDate)}</span>` : ''}
      </div>
      <div style="margin-top:8px"><span class="badge badge-${task.priority}">${task.priority}</span></div>
    </div>
  `;
}

// ---- TEAM ----
function renderTeam() {
  const users = DB.users.all();
  const grid = document.getElementById('team-grid');
  grid.innerHTML = users.map(u => {
    const myTasks = DB.tasks.findWhere('tasks', t => t.assigneeId === u.id);
    const done = myTasks.filter(t => t.status === 'done').length;
    const initials = u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    return `
      <div class="team-card">
        <div class="team-avatar">${initials}</div>
        <div class="team-info">
          <div class="team-name">${escHtml(u.name)}</div>
          <div class="team-email">${escHtml(u.email)}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge-${u.role}">${u.role}</span>
            <span class="team-tasks">${myTasks.length} tasks · ${done} done</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- TASK DETAIL ----
function openTaskDetail(taskId) {
  _currentTaskId = taskId;
  const task = DB.tasks.find(taskId);
  if (!task) return;

  const proj = DB.projects.find(task.projectId);
  const assignee = DB.users.find(task.assigneeId);
  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' }[task.priority];
  const overdue = DB.tasks.isOverdue(task);

  document.getElementById('td-title').textContent = task.title;
  document.getElementById('td-desc').textContent = task.description || 'No description provided.';
  document.getElementById('td-project').textContent = proj?.name || '—';
  document.getElementById('td-assignee').textContent = assignee?.name || '—';
  document.getElementById('td-priority').innerHTML = `<span class="badge badge-${task.priority}">${task.priority}</span>`;
  document.getElementById('td-due').innerHTML = task.dueDate
    ? `<span ${overdue?'style="color:var(--danger);font-weight:600"':''} >${overdue?'⚠ ':''}${formatDate(task.dueDate)}</span>`
    : '—';
  document.getElementById('td-status').value = task.status;

  // Admin actions
  const adminActions = document.getElementById('td-admin-actions');
  if (currentUser.role === 'admin') {
    adminActions.innerHTML = `<button class="btn-danger" onclick="deleteTask('${task.id}')">Delete Task</button>`;
  } else {
    adminActions.innerHTML = '';
  }

  openModal('modal-task-detail');
}

function updateTaskStatus(newStatus) {
  if (!_currentTaskId) return;
  DB.tasks.update(_currentTaskId, { status: newStatus });
  showToast('Task status updated', 'success');
  closeModal('modal-task-detail');
  // Re-render current page
  const activePage = document.querySelector('.nav-item.active')?.dataset.page;
  if (activePage) navigateTo(activePage);
}

function deleteTask(taskId) {
  DB.tasks.delete(taskId);
  closeModal('modal-task-detail');
  showToast('Task deleted', 'success');
  const activePage = document.querySelector('.nav-item.active')?.dataset.page;
  if (activePage) navigateTo(activePage);
}

// ---- NEW PROJECT MODAL ----
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');

  if (id === 'modal-new-project') populateNewProjectModal();
  if (id === 'modal-new-task') populateNewTaskModal();
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function populateNewProjectModal() {
  const users = DB.users.all();
  document.getElementById('np-members-list').innerHTML = users.map(u => `
    <div class="checkbox-item">
      <input type="checkbox" id="npm-${u.id}" value="${u.id}" ${u.id === currentUser.id ? 'checked disabled' : ''}>
      <label for="npm-${u.id}">${escHtml(u.name)} <span style="color:var(--text-muted)">(${u.role})</span></label>
    </div>
  `).join('');
  document.getElementById('np-name').value = '';
  document.getElementById('np-desc').value = '';
  document.getElementById('np-error').classList.add('hidden');
}

function createProject() {
  const name = document.getElementById('np-name').value.trim();
  const desc = document.getElementById('np-desc').value.trim();
  const errEl = document.getElementById('np-error');
  errEl.classList.add('hidden');

  if (!name) return showError(errEl, 'Project name is required.');

  const checked = [...document.querySelectorAll('#np-members-list input:checked')].map(el => el.value);
  if (!checked.includes(currentUser.id)) checked.unshift(currentUser.id);

  DB.projects.create({ name, description: desc, memberIds: checked, createdBy: currentUser.id });
  closeModal('modal-new-project');
  showToast('Project created!', 'success');
  renderProjects();
}

// ---- NEW TASK MODAL ----
function populateNewTaskModal(preselectedProjectId = null) {
  const projects = DB.projects.forUser(currentUser.id, currentUser.role);
  const users = DB.users.all();

  document.getElementById('nt-project').innerHTML = projects.map(p =>
    `<option value="${p.id}" ${p.id === preselectedProjectId ? 'selected' : ''}>${escHtml(p.name)}</option>`
  ).join('');

  document.getElementById('nt-assignee').innerHTML = users.map(u =>
    `<option value="${u.id}">${escHtml(u.name)}</option>`
  ).join('');

  document.getElementById('nt-title').value = '';
  document.getElementById('nt-desc').value = '';
  document.getElementById('nt-priority').value = 'medium';
  document.getElementById('nt-due').value = '';
  document.getElementById('nt-error').classList.add('hidden');
}

function createTask() {
  const title = document.getElementById('nt-title').value.trim();
  const desc = document.getElementById('nt-desc').value.trim();
  const projectId = document.getElementById('nt-project').value;
  const assigneeId = document.getElementById('nt-assignee').value;
  const priority = document.getElementById('nt-priority').value;
  const dueDate = document.getElementById('nt-due').value;
  const errEl = document.getElementById('nt-error');
  errEl.classList.add('hidden');

  if (!title) return showError(errEl, 'Task title is required.');
  if (!projectId) return showError(errEl, 'Please select a project.');
  if (!assigneeId) return showError(errEl, 'Please assign this task.');

  DB.tasks.create({ title, description: desc, projectId, assigneeId, priority, dueDate, status: 'todo', createdBy: currentUser.id });
  closeModal('modal-new-task');
  showToast('Task created!', 'success');
  const activePage = document.querySelector('.nav-item.active')?.dataset.page;
  if (activePage) navigateTo(activePage);
}

// ---- TOAST ----
let _toastTimeout;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => toast.classList.add('hidden'), 2800);
}

// ---- HELPERS ----
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusLabel(s) {
  return { todo: 'To Do', inprogress: 'In Progress', done: 'Done' }[s] || s;
}

function emptyState(icon, text) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-text">${text}</div></div>`;
}

// Close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) this.classList.add('hidden');
  });
});

// ---- BOOT ----
window.addEventListener('DOMContentLoaded', () => {
  const user = getSession();
  if (user) {
    currentUser = user;
    // Refresh user data from DB in case of updates
    const freshUser = DB.users.find(user.id);
    if (freshUser) { setSession(freshUser); }
    initApp();
  } else {
    document.getElementById('app-auth').classList.remove('hidden');
    showPage('login');
  }
});
