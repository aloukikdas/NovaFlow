# NovaFlow (⚠️Work in Progress!!)

> Plan intelligently. Collaborate instantly. Deliver confidently.

NovaFlow is an AI-powered collaborative work-management SaaS. It provides a single workspace for teams to organize projects, manage tasks, communicate in real time, and use AI with project context.

## 🚀 Features
* **Multi-tenant Workspaces**: Create workspaces and invite members with Role-Based Access Control (RBAC).
* **Real-Time Kanban**: Drag-and-drop task boards that update instantly across all clients using WebSockets.
* **Task Collaboration**: Live commenting and task activity tracking.
* **Modern Stack**: Next.js 15, Tailwind v4, NestJS, Prisma, PostgreSQL.

## 🛠️ Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Backend:** NestJS, Socket.IO
* **Database:** PostgreSQL, Prisma ORM

## ⚙️ Local Development
1. Clone the repository.
2. Run `pnpm install` in the root.
3. Configure your `.env` variables.
4. Run `pnpm dlx prisma db push` (or `npx prisma db push`) to sync the database.
5. Run `pnpm run dev` to start both the frontend and backend.