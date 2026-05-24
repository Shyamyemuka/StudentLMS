"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Users,
  BookOpen,
  FileText,
  UserCheck,
  TrendingUp,
  GraduationCap,
  BarChart3,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  pendingFaculty: number;
  pendingStudents: number;
  totalSubjects: number;
  totalResources: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    pendingFaculty: 0,
    pendingStudents: 0,
    totalSubjects: 0,
    totalResources: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch user stats
      const { data: users } = await supabase.from("profiles").select("role");

      const totalUsers = users?.length || 0;
      const totalStudents =
        users?.filter((u) => u.role === "student").length || 0;
      const totalFaculty =
        users?.filter((u) => u.role === "faculty").length || 0;
      const pendingFaculty =
        users?.filter((u) => u.role === "faculty_pending").length || 0;

      // Count pending students from profiles with student_pending role
      const pendingStudents =
        users?.filter((u) => u.role === "student_pending").length || 0;

      // Fetch subject stats
      const { data: subjects } = await supabase.from("subjects").select("id");

      const totalSubjects = subjects?.length || 0;

      // Fetch resource stats
      const { data: resources } = await supabase.from("resources").select("id");
      const totalResources = resources?.length || 0;

      setStats({
        totalUsers,
        totalStudents,
        totalFaculty,
        pendingFaculty,
        pendingStudents,
        totalSubjects,
        totalResources,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-[#707070]">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#EAEAEA] mb-2">
          Admin Dashboard
        </h1>
        <p className="text-[#B0B0B0]">
          Manage users, subjects, and monitor platform activity
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Total Users
            </span>
          </div>
          <div className="text-3xl font-bold text-[#EAEAEA]">
            {stats.totalUsers}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#B0B0B0]">
            <span>{stats.totalStudents} Students</span>
            <span>•</span>
            <span>{stats.totalFaculty} Faculty</span>
          </div>
        </Card>

        {/* Pending Faculty */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Pending Faculty
            </span>
          </div>
          <div className="text-3xl font-bold text-[#D4AF37]">
            {stats.pendingFaculty}
          </div>
          <Link
            href="/admin/faculty-approvals"
            className="text-xs text-[#D4AF37] hover:underline mt-2 inline-block">
            Review approvals →
          </Link>
        </Card>

        {/* Pending Students */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center justify-between mb-4">
            <GraduationCap className="w-8 h-8 text-[#4CAF8F]" />
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Pending Students
            </span>
          </div>
          <div className="text-3xl font-bold text-[#4CAF8F]">
            {stats.pendingStudents}
          </div>
          <Link
            href="/admin/student-registrations"
            className="text-xs text-[#4CAF8F] hover:underline mt-2 inline-block">
            Review approvals →
          </Link>
        </Card>

        {/* Total Subjects */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 text-[#6B9FDB]" />
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Subjects
            </span>
          </div>
          <div className="text-3xl font-bold text-[#EAEAEA]">
            {stats.totalSubjects}
          </div>
          <div className="text-xs text-[#B0B0B0] mt-2">
            Total subjects in platform
          </div>
        </Card>

        {/* Total Resources */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-[#9F7AEA]" />
            <span className="text-xs text-[#707070] uppercase tracking-wider">
              Resources
            </span>
          </div>
          <div className="text-3xl font-bold text-[#EAEAEA]">
            {stats.totalResources}
          </div>
          <div className="text-xs text-[#B0B0B0] mt-2">
            Available to students
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[#EAEAEA] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#D4AF37] transition-colors cursor-pointer group">
              <Users className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="text-lg font-semibold text-[#EAEAEA] mb-2 group-hover:text-[#D4AF37] transition-colors">
                Manage Users
              </h3>
              <p className="text-sm text-[#707070]">
                View, edit, and manage user accounts
              </p>
            </Card>
          </Link>

          <Link href="/admin/faculty-approvals">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#D4AF37] transition-colors cursor-pointer group">
              <UserCheck className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="text-lg font-semibold text-[#EAEAEA] mb-2 group-hover:text-[#D4AF37] transition-colors">
                Faculty Approvals
              </h3>
              <p className="text-sm text-[#707070]">
                Approve or reject faculty account requests
              </p>
            </Card>
          </Link>

          <Link href="/admin/student-registrations">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#4CAF8F] transition-colors cursor-pointer group">
              <GraduationCap className="w-8 h-8 text-[#4CAF8F] mb-3" />
              <h3 className="text-lg font-semibold text-[#EAEAEA] mb-2 group-hover:text-[#4CAF8F] transition-colors">
                Student Approvals
              </h3>
              <p className="text-sm text-[#707070]">
                Approve or reject student registration applications
              </p>
            </Card>
          </Link>

          <Link href="/admin/students">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#6B9FDB] transition-colors cursor-pointer group">
              <Users className="w-8 h-8 text-[#6B9FDB] mb-3" />
              <h3 className="text-lg font-semibold text-[#EAEAEA] mb-2 group-hover:text-[#6B9FDB] transition-colors">
                Manage Students
              </h3>
              <p className="text-sm text-[#707070]">
                View and manage all student accounts
              </p>
            </Card>
          </Link>

          <Link href="/admin/subjects">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#D4AF37] transition-colors cursor-pointer group">
              <BookOpen className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="text-lg font-semibold text-[#EAEAEA] mb-2 group-hover:text-[#D4AF37] transition-colors">
                Manage Subjects
              </h3>
              <p className="text-sm text-[#707070]">
                View and manage all subjects
              </p>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#D4AF37] transition-colors cursor-pointer group">
              <BarChart3 className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="text-lg font-semibold text-[#EAEAEA] mb-2 group-hover:text-[#D4AF37] transition-colors">
                Analytics
              </h3>
              <p className="text-sm text-[#707070]">
                View platform insights and trends
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
