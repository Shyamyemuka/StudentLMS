<div align="center">
  <img src="public/images/logo.png" alt="Student LMS Logo" width="120" height="120">
  
  # Student LMS
  
  **A Modern Learning Management System for Educational Institutions**
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  
  [Live Demo](https://StudentLMS.online) • [Report Bug](https://github.com/Shyamyemuka/StudentLMS/issues) • [Request Feature](https://github.com/Shyamyemuka/StudentLMS/issues)
</div>

---

## 📚 About The Project

Student LMS is a comprehensive Learning Management System designed for universities and educational institutions. It provides a seamless platform for students, faculty, and administrators to manage courses, resources, submissions, and interactive learning experiences.

### ✨ Key Features

#### 🎓 **Course Management**

- Create, edit, and manage courses with subject codes and regulations
- Multi-unit course structure with organized content hierarchy
- Course approval workflow for quality control
- Filter and search courses by regulation, subject code, or title

#### 📖 **Resource Management**

- Upload and organize learning materials (PDFs, documents, videos)
- Video player with advanced controls and bookmarking
- Integrated document viewer for PDFs and Office documents
- Cloud storage with Supabase Storage


#### 👥 **User Roles & Permissions**

- **Students**: Access courses, track progress
- **Faculty**: Create courses, manage content
- **Admin**: Full system access, user management, analytics dashboard

#### 📢 **Notice Board**

- Real-time announcements with role-based posting
- Pin important notices (max 3)
- Faculty and admin can post announcements
- Real-time updates via Supabase subscriptions

#### 🔔 **Notification System**

- Role-based notifications
- New course approvals, submission updates
- In-app notification bell with unread count
- Mark as read functionality

#### 🎮 **Fun Zone** (Interactive Games)

- **Mood Analyzer**: Real-time facial expression detection using MediaPipe FaceMesh
- **Hand Drawing**: Draw using hand gestures with camera tracking
- **Hand Gesture Sphere**: 3D interactive sphere controlled by hand movements

---

## 🛠️ Tech Stack

| Category        | Technologies                         |
| --------------- | ------------------------------------ |
| **Frontend**    | Next.js 16, React 19, TypeScript     |
| **Styling**     | TailwindCSS 4, Radix UI Components   |
| **Backend**     | Supabase (PostgreSQL, Auth, Storage) |
| **AI/ML**       | MediaPipe (Face Mesh, Hand Tracking) |
| **3D Graphics** | Three.js                             |
| **Charts**      | Recharts                             |
| **Forms**       | React Hook Form, Zod Validation      |

---

## 📂 Project Structure

```
frontend/
├── app/
│   ├── (auth)/           # Authentication pages (login, signup)
│   ├── (main)/           # Protected main app routes
│   │   ├── dashboard/    # Main dashboard
│   │   ├── my-courses/   # User's courses
│   │   ├── subjects/     # Course/subject details
│   │   ├── create-course/# Course creation
│   │   └── fun/          # Fun Zone games
│   ├── admin/            # Admin panel
│   │   ├── analytics/    # System analytics
│   │   ├── course-approvals/
│   │   ├── faculty-approvals/
│   │   └── users/        # User management
│   └── api/              # API routes
├── components/
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication forms
│   ├── fun/              # Fun Zone game components
│   ├── layout/           # Header, sidebar, notice board
│   ├── notifications/    # Notification components
│   ├── resources/        # Resource management
│   ├── subjects/         # Course/subject components
│   ├── ui/               # Reusable UI components
│   └── video-player/     # Video player components
└── lib/
    ├── supabase/         # Supabase client configuration
    ├── hooks/            # Custom React hooks
    └── games/            # Game configurations
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Shyamyemuka/StudentLMS.git
   cd StudentLMS/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the `frontend` directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see `supabase/` folder)
   - Enable Google OAuth in Authentication settings
   - Configure Storage buckets for resources

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Screenshots

|                     Dashboard                     |                  Course View                  |                Fun Zone                |
| :-----------------------------------------------: | :-------------------------------------------: | :------------------------------------: |
| Main user dashboard with courses and notice board | Detailed course view with units and resources | Interactive games with camera tracking |

---

## 🔐 Authentication

Student LMS supports multiple authentication methods:

- **Email/Password**: Traditional sign-up and login
- **Google OAuth**: One-click sign-in with Google
- **Role Selection**: Choose between Student and Faculty on signup
- **Faculty Approval**: Faculty accounts require admin approval

---

## 📊 Admin Features

- **Analytics Dashboard**: System-wide statistics and metrics
- **User Management**: View, edit, and manage all users
- **Course Approvals**: Review and approve new courses
- **Faculty Approvals**: Approve pending faculty registrations

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Shyam Yemuka**

- GitHub: [@Shyamyemuka](https://github.com/Shyamyemuka)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [MediaPipe](https://mediapipe.dev/) - ML solutions for live and streaming media
- [Three.js](https://threejs.org/) - 3D graphics library
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) - Beautiful open-source icons

---

<div align="center">
  Made with ❤️ for Education
</div>
