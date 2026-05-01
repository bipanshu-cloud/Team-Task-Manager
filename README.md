# TaskFlow — Team Task Manager

A full-featured team task management web app with role-based access control, project management, and a beautiful dark UI theme.

## 🚀 Live Demo

https://69f45574ecde977a03c439ed--tranquil-starlight-1935ed.netlify.app/

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskflow.com | admin123 |
| Member | member@taskflow.com | member123 |

## ✨ Features

- **Authentication** — Signup / Login with session management
- **Role-Based Access** — Admin can create projects, tasks, delete; Members can view & update status
- **Projects** — Create projects, assign team members, track progress with visual progress bars
- **Task Management** — Create tasks with priority, due dates, assignee; Kanban board view
- **Dashboard** — Stats overview (total, in-progress, completed, overdue), recent + overdue tasks
- **Team Page** — View all members and their task stats (Admin only)
- **Filters** — Filter tasks by status and priority
- **Overdue Detection** — Visual warnings for past-due tasks

## 🎨 Design

- Dark premium theme with purple accent palette
- Syne + DM Sans typography
- Animated blobs, smooth transitions, glass-morphism cards
- Fully responsive layout

## 📦 Deployment (Netlify)

1. Download the ZIP file
2. Go to [netlify.com](https://netlify.com)
3. Drag & drop the extracted folder onto the Netlify dashboard
4. Your app is live instantly!

Or via Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=taskflow
```

## 🗄️ Data Storage

All data is stored in `localStorage` — perfect for Netlify static hosting. Data persists across sessions in the same browser.

## 📁 File Structure

