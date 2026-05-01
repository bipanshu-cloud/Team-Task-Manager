// ============================================================
//  TaskFlow DB — LocalStorage-based data layer
// ============================================================

const DB = {
  // ---- KEY HELPERS ----
  _key: (table) => `taskflow_${table}`,

  // ---- GENERIC CRUD ----
  getAll(table) {
    try { return JSON.parse(localStorage.getItem(this._key(table))) || []; }
    catch { return []; }
  },
  save(table, data) {
    localStorage.setItem(this._key(table), JSON.stringify(data));
  },
  insert(table, record) {
    const rows = this.getAll(table);
    rows.push(record);
    this.save(table, rows);
    return record;
  },
  update(table, id, patch) {
    const rows = this.getAll(table).map(r => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r);
    this.save(table, rows);
  },
  delete(table, id) {
    this.save(table, this.getAll(table).filter(r => r.id !== id));
  },
  findById(table, id) {
    return this.getAll(table).find(r => r.id === id) || null;
  },
  findWhere(table, predicate) {
    return this.getAll(table).filter(predicate);
  },

  // ---- ID GENERATOR ----
  newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  // ---- SEED ----
  seed() {
    if (localStorage.getItem('taskflow_seeded')) return;

    // Users
    const users = [
      { id: 'u1', name: 'Admin User', email: 'admin@taskflow.com', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
      { id: 'u2', name: 'Alex Rivera', email: 'member@taskflow.com', password: 'member123', role: 'member', createdAt: new Date().toISOString() },
      { id: 'u3', name: 'Jordan Kim', email: 'jordan@taskflow.com', password: 'jordan123', role: 'member', createdAt: new Date().toISOString() },
      { id: 'u4', name: 'Sam Chen', email: 'sam@taskflow.com', password: 'sam123', role: 'member', createdAt: new Date().toISOString() },
    ];
    this.save('users', users);

    // Projects
    const projects = [
      {
        id: 'p1', name: 'Website Redesign', description: 'Complete overhaul of the company website with modern design and improved UX.',
        memberIds: ['u1', 'u2', 'u3'], createdBy: 'u1', createdAt: new Date().toISOString()
      },
      {
        id: 'p2', name: 'Mobile App v2', description: 'New features and performance improvements for the mobile application.',
        memberIds: ['u1', 'u2', 'u4'], createdBy: 'u1', createdAt: new Date().toISOString()
      },
      {
        id: 'p3', name: 'Marketing Campaign', description: 'Q4 marketing push across social media and email channels.',
        memberIds: ['u1', 'u3', 'u4'], createdBy: 'u1', createdAt: new Date().toISOString()
      },
    ];
    this.save('projects', projects);

    // Tasks
    const now = new Date();
    const days = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

    const tasks = [
      { id: 't1', title: 'Design homepage mockup', description: 'Create wireframes and high-fidelity designs for the new homepage.', projectId: 'p1', assigneeId: 'u2', status: 'done', priority: 'high', dueDate: days(-2), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't2', title: 'Implement responsive layout', description: 'Build responsive CSS layout based on approved designs.', projectId: 'p1', assigneeId: 'u3', status: 'inprogress', priority: 'high', dueDate: days(3), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't3', title: 'Write copy for About page', description: 'Draft compelling copy for the about us section.', projectId: 'p1', assigneeId: 'u2', status: 'todo', priority: 'medium', dueDate: days(7), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't4', title: 'Setup push notifications', description: 'Integrate Firebase for push notification support.', projectId: 'p2', assigneeId: 'u4', status: 'inprogress', priority: 'high', dueDate: days(-1), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't5', title: 'Redesign onboarding flow', description: 'Simplify the new user onboarding to 3 steps.', projectId: 'p2', assigneeId: 'u2', status: 'todo', priority: 'medium', dueDate: days(10), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't6', title: 'Fix login crash on Android', description: 'Debug and fix app crash on Android 12 during login.', projectId: 'p2', assigneeId: 'u4', status: 'done', priority: 'high', dueDate: days(-5), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't7', title: 'Create social media assets', description: 'Design banners and posts for Instagram, LinkedIn, Twitter.', projectId: 'p3', assigneeId: 'u3', status: 'todo', priority: 'medium', dueDate: days(5), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't8', title: 'Draft email newsletter', description: 'Write and design October newsletter for subscribers.', projectId: 'p3', assigneeId: 'u4', status: 'inprogress', priority: 'low', dueDate: days(2), createdBy: 'u1', createdAt: new Date().toISOString() },
      { id: 't9', title: 'Influencer outreach list', description: 'Compile list of 20 relevant influencers with contact info.', projectId: 'p3', assigneeId: 'u3', status: 'todo', priority: 'low', dueDate: days(-3), createdBy: 'u1', createdAt: new Date().toISOString() },
    ];
    this.save('tasks', tasks);

    localStorage.setItem('taskflow_seeded', '1');
  },

  // ---- TYPED QUERIES ----
  users: {
    all: () => DB.getAll('users'),
    find: (id) => DB.findById('users', id),
    findByEmail: (email) => DB.getAll('users').find(u => u.email.toLowerCase() === email.toLowerCase()),
    create: (data) => DB.insert('users', { id: DB.newId(), createdAt: new Date().toISOString(), ...data }),
    update: (id, patch) => DB.update('users', id, patch),
  },

  projects: {
    all: () => DB.getAll('projects'),
    find: (id) => DB.findById('projects', id),
    forUser: (userId, role) => {
      if (role === 'admin') return DB.getAll('projects');
      return DB.getAll('projects').filter(p => p.memberIds.includes(userId) || p.createdBy === userId);
    },
    create: (data) => DB.insert('projects', { id: DB.newId(), createdAt: new Date().toISOString(), ...data }),
    delete: (id) => { DB.delete('projects', id); DB.save('tasks', DB.getAll('tasks').filter(t => t.projectId !== id)); },
  },

  tasks: {
    all: () => DB.getAll('tasks'),
    find: (id) => DB.findById('tasks', id),
    forUser: (userId, role) => {
      if (role === 'admin') return DB.getAll('tasks');
      return DB.getAll('tasks').filter(t => t.assigneeId === userId);
    },
    forProject: (projectId) => DB.getAll('tasks').filter(t => t.projectId === projectId),
    create: (data) => DB.insert('tasks', { id: DB.newId(), createdAt: new Date().toISOString(), ...data }),
    update: (id, patch) => DB.update('tasks', id, patch),
    delete: (id) => DB.delete('tasks', id),
    isOverdue: (task) => {
      if (!task.dueDate || task.status === 'done') return false;
      return new Date(task.dueDate) < new Date(new Date().toDateString());
    },
  },
};

// Seed on first load
DB.seed();
