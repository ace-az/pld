# PLD Management App - Specification

## Project Overview
The **PLD Management App** is a comprehensive platform designed to facilitate and manage Peer Learning Days (PLD). It streamlines the interaction between Mentors and Students, provides tools for live session management, collaborative coding workshops, and AI-assisted learning.

## Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Editor**: CodeMirror (via `@uiw/react-codemirror`)
- **Routing**: React Router Dom 7
- **Utilities**: Axios, jwt-decode, jspdf, mammoth

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (Access & Refresh Tokens) with `cookie-parser`
- **Database**: 
    - **Primary**: Supabase (PostgreSQL)
    - **Lightweight/Local**: lowdb (`models.json`)
- **AI Integration**: Google Generative AI (`@google/generative-ai`) and OpenRouter

### Integrations
- **Discord**: Discord.js for notifications and user identification.

---

## User Roles & Permissions

### 1. Admin
- Access to the Admin Panel.
- Management of users and system settings.

### 2. Mentor
- **Student Management**: Add, view, and manage student profiles.
- **Question Bank**: Create and organize question sets by topic.
- **Live Sessions**: Start and run PLD sessions, track student status, and provide grades.
- **Workshops**: Create collaborative coding environments.
- **History & Reports**: View past sessions and student performance history.

### 3. Student
- **Personal Dashboard**: Overview of progress and tasks.
- **Major Declaration**: One-time setup to categorize their learning path.
- **AI Practice**: Interactive coding practice with AI tutoring.
- **Leaderboard**: Multi-major based rankings.
- **Reports**: View personal grades and feedback.

---

## Core Features

### Session Management
- Mentors can initiate sessions for specific groups and topics.
- Real-time tracking of student progress during sessions.
- Integration with AI for question generation or assistance.

### Collaborative Workshops
- A shared workspace for coding tasks.
- Supports multiple languages (C++, JS, Python).
- Permissions-based editing (Mentor/Student).

### AI-Assisted Learning
- "AI Practice" page allows students to interact with an AI tutor.
- Context-aware assistance based on current tasks or topics.

### Discord Synchronization
- Linked Discord accounts for identity verification and notifications.

---

## Database Architecture (Supabase)

### Principal Tables:
- **`users`**: Auth data, roles (admin/mentor/student), and majors.
- **`students`**: Detailed student profiles linked to mentors.
- **`questions`**: Topic-based question collections (JSONB storage).
- **`sessions`**: Active and past PLD session data, including student grades.
- **`chats`**: Message history for specific sessions/students.
- **`refresh_tokens`**: Secure token management for persistent sessions.

---

## API Structure

- **`/auth`**: Login, registration, and logout.
- **`/api/verify`**: Token verification and session restoration.
- **`/api/users`**: User profile and settings management.
- **`/api/students`**: CRUD operations for student management.
- **`/api/sessions`**: Logic for running and recording PLD sessions.
- **`/api/questions`**: Question bank management.
- **`/api/ai`**: Interface for Google AI and OpenRouter services.
- **`/api/announcements`**: System-wide notifications.
- **`/api/majors`**: Major declaration and management.
- **`/api/admin`**: Administrative controls and user roles.
