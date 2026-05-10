🌿 Orbit — Project Management App

A role-based project and task management web app built with React. Manage teams, track tasks on a Kanban board, and monitor progress — all in a clean, distraction-free interface.

📸 Overview
Orbit is a full-featured project management tool that supports Admin and Member roles, giving teams the right level of access without the clutter. Built as a modular React app with localStorage persistence — drop in a real API and it's production-ready.

✨ Features

🔐 Authentication

Signup and Login with client-side validation
Role selection at signup (Admin or Member)
Session persisted across page refreshes

📁 Project Management

Create, colour-code, and delete projects (Admin only)
Per-project progress bar based on task completion
Project status tracking: Active / On Hold / Completed
Due date tracking with overdue indicators

🗂️ Kanban Task Board

Four columns: Todo → In Progress → Review → Done
Create, edit, and delete tasks with full detail fields
Assign tasks to team members
Set priority levels: Low / Medium / High / Critical
Add tags for quick categorisation
One-click status move buttons on each card
Overdue tasks highlighted automatically

👥 Team Management (Admin only)

View all workspace users with their stats
Edit display names and roles
Remove members from the workspace
Add / remove members per project

📊 Dashboard

KPI stats: active projects, open tasks, completed, overdue
Recent activity feed across all your projects
Per-project progress cards with quick navigation
