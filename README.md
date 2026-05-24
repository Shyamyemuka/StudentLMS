<div align="center">
  <img src="frontend/public/images/logo.png" alt="Tenspick LMS Logo" width="120" height="120">
  
  # Tenspick LMS
  
  **A Modern Learning Management System for Educational Institutions**
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  
  [Live Demo](https://tenspicklms.online) • [Report Bug](https://github.com/Shyamyemuka/TenspickLMS/issues) • [Request Feature](https://github.com/Shyamyemuka/TenspickLMS/issues)
</div>

---

## ��� About

Tenspick LMS is a comprehensive Learning Management System built with Next.js and Supabase. It provides course management, progress tracking, user approval workflows, and interactive learning features for educational institutions.

### ✨ Key Features

- ��� **Course Management** - Multi-unit structure with approval workflows
- ��� **Progress Tracking** - Real-time student progress monitoring with analytics
- ��� **Role-Based Access** - Admin, Faculty, and Student roles with granular permissions
- ��� **Course Assignments** - Faculty/Admin controlled course access for students
- ��� **Resource Management** - Upload and organize PDFs, documents, videos
- ��� **Notifications** - Real-time updates for approvals and submissions
- ��� **Notice Board** - Announcements with pinning capabilities
- ��� **Fun Zone** - AI-powered interactive games (Mood Analyzer, Hand Drawing, Gesture Control)
- ��� **Secure Auth** - Email/password + Google OAuth with approval-based registration

---

## ���️ Tech Stack

**Frontend:** Next.js 16.1, React 19.2, TypeScript, TailwindCSS 4  
**Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)  
**UI Components:** Radix UI, Lucide Icons, Sonner Notifications  
**Forms & Validation:** React Hook Form, Zod  
**AI/ML:** MediaPipe (Face Mesh, Hand Tracking)  
**3D Graphics:** Three.js  
**Charts:** Recharts

---

## ��� Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/Shyamyemuka/TenspickLMS.git
cd TenspickLMS

# Install dependencies
npm run setup

# Set up environment variables
cd frontend
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Backend Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run SQL scripts from `backend/` folder in order (01_schema.sql, 02_rls_policies.sql, etc.)
3. Create admin account using `backend/05_admin_setup.sql`
4. Configure storage buckets as specified in `backend/04_storage.sql`

---

## ��� Project Structure

```
TenspickLMS/
├── frontend/          # Next.js application
│   ├── app/           # App router pages
│   ├── components/    # React components
│   ├── lib/           # Utilities and hooks
│   └── types/         # TypeScript types
├── backend/           # SQL scripts (60+ migrations)
└── package.json       # Root configuration
```

---

## ��� User Roles & Authentication

- **Admin**: Full system access, approve all users, manage all content
- **Faculty**: Create courses, approve students, assign courses, view progress (admin approval required)
- **Student**: Access assigned courses, track progress (faculty/admin approval required)

**Authentication:** Email/password or Google OAuth with approval-based registration system.

---

---

## ��� Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# Deploy on Vercel
# 1. Import repository at vercel.com
# 2. Add environment variables
# 3. Deploy
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ��� Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ��� License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ���‍��� Author

**Shyam Yemuka**  
GitHub: [@Shyamyemuka](https://github.com/Shyamyemuka)

---

## ��� Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend Platform
- [MediaPipe](https://mediapipe.dev/) - ML Solutions
- [Radix UI](https://www.radix-ui.com/) - UI Components
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework

---

<div align="center">
  Made with ❤️ for Education by Shyam Yemuka
</div>
