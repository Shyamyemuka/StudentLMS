"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import AdminSignatureUpload from "@/components/admin/AdminSignatureUpload";
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
        <div className="text-muted-foreground font-bold font-body">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground font-medium font-body">
            Manage users, subjects, and monitor platform activity
          </p>
        </div>
        <div className="shrink-0 bg-muted/20 p-1 rounded-xl border border-border/30">
          <AdminSignatureUpload />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-primary" />
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-body">
              Total Users
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {stats.totalUsers}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-bold font-body">
            <span>{stats.totalStudents} Students</span>
            <span>•</span>
            <span>{stats.totalFaculty} Faculty</span>
          </div>
        </Card>

        {/* Pending Faculty */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 text-primary" />
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-body">
              Pending Faculty
            </span>
          </div>
          <div className="text-3xl font-bold text-primary">
            {stats.pendingFaculty}
          </div>
          <Link
            href="/admin/faculty-approvals"
            className="text-xs text-primary font-bold hover:underline mt-2 inline-block font-body">
            Review approvals →
          </Link>
        </Card>

        {/* Total Subjects */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 text-secondary" />
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-body">
              Subjects
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {stats.totalSubjects}
          </div>
          <div className="text-xs text-muted-foreground font-medium font-body mt-2">
            Total subjects in platform
          </div>
        </Card>

        {/* Total Resources */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-body">
              Resources
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {stats.totalResources}
          </div>
          <div className="text-xs text-muted-foreground font-medium font-body mt-2">
            Available to students
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-foreground font-heading mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users" className="cursor-pointer">
            <Card className="bg-card border-2 border-border shadow-hard-sm p-6 hover:border-primary transition-all cursor-pointer group wobbly-border h-full">
              <Users className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-xl font-bold text-foreground font-heading mb-2 group-hover:text-primary transition-colors">
                Manage Users
              </h3>
              <p className="text-sm text-muted-foreground font-medium font-body">
                View, edit, and manage user accounts
              </p>
            </Card>
          </Link>

          <Link href="/admin/faculty-approvals" className="cursor-pointer">
            <Card className="bg-card border-2 border-border shadow-hard-sm p-6 hover:border-primary transition-all cursor-pointer group wobbly-border h-full">
              <UserCheck className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-xl font-bold text-foreground font-heading mb-2 group-hover:text-primary transition-colors">
                Faculty Approvals
              </h3>
              <p className="text-sm text-muted-foreground font-medium font-body">
                Approve or reject faculty account requests
              </p>
            </Card>
          </Link>

          <Link href="/admin/students" className="cursor-pointer">
            <Card className="bg-card border-2 border-border shadow-hard-sm p-6 hover:border-secondary transition-all cursor-pointer group wobbly-border h-full">
              <Users className="w-8 h-8 text-secondary mb-3" />
              <h3 className="text-xl font-bold text-foreground font-heading mb-2 group-hover:text-secondary transition-colors">
                Manage Students
              </h3>
              <p className="text-sm text-muted-foreground font-medium font-body">
                View and manage all student accounts
              </p>
            </Card>
          </Link>

          <Link href="/admin/subjects" className="cursor-pointer">
            <Card className="bg-card border-2 border-border shadow-hard-sm p-6 hover:border-primary transition-all cursor-pointer group wobbly-border h-full">
              <BookOpen className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-xl font-bold text-foreground font-heading mb-2 group-hover:text-primary transition-colors">
                Manage Subjects
              </h3>
              <p className="text-sm text-muted-foreground font-medium font-body">
                View and manage all subjects
              </p>
            </Card>
          </Link>

          <Link href="/admin/analytics" className="cursor-pointer">
            <Card className="bg-card border-2 border-border shadow-hard-sm p-6 hover:border-primary transition-all cursor-pointer group wobbly-border h-full">
              <BarChart3 className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-xl font-bold text-foreground font-heading mb-2 group-hover:text-primary transition-colors">
                Analytics
              </h3>
              <p className="text-sm text-muted-foreground font-medium font-body">
                View platform insights and trends
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
