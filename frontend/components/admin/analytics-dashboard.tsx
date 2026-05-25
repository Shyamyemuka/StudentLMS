"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Activity,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MonthlyData {
  month: string;
  users: number;
  subjects: number;
  resources: number;
  submissions: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface RoleData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [submissionStatusData, setSubmissionStatusData] = useState<
    StatusData[]
  >([]);
  const [userRoleData, setUserRoleData] = useState<RoleData[]>([]);
  const [subjectStatusData, setSubjectStatusData] = useState<StatusData[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all data needed for analytics
      const [
        { data: profiles },
        { data: subjects },
        { data: resources },
        { data: submissions },
      ] = await Promise.all([
        supabase.from("profiles").select("created_at, role"),
        supabase.from("subjects").select("created_at, status"),
        supabase.from("resources").select("created_at"),
        supabase.from("resource_submissions").select("created_at, status"),
      ]);

      // Process monthly growth data (last 6 months)
      const monthlyStats = processMonthlyData(
        profiles || [],
        subjects || [],
        resources || [],
        submissions || [],
      );
      setMonthlyData(monthlyStats);

      // Process submission status data
      const submissionStats = [
        {
          name: "Pending",
          value: submissions?.filter((s) => s.status === "pending").length || 0,
          color: "#D4AF37",
        },
        {
          name: "Approved",
          value:
            submissions?.filter((s) => s.status === "approved").length || 0,
          color: "#4CAF8F",
        },
        {
          name: "Rejected",
          value:
            submissions?.filter((s) => s.status === "rejected").length || 0,
          color: "#C94A4A",
        },
      ];
      setSubmissionStatusData(submissionStats);

      // Process user role data
      const roleStats = [
        {
          name: "Students",
          value: profiles?.filter((p) => p.role === "student").length || 0,
        },
        {
          name: "Faculty",
          value: profiles?.filter((p) => p.role === "faculty").length || 0,
        },
        {
          name: "Pending",
          value:
            profiles?.filter(
              (p) =>
                p.role === "faculty_pending",
            ).length || 0,
        },
      ];
      setUserRoleData(roleStats);

      // Process subject status data
      const subjectStats = [
        {
          name: "Approved",
          value: subjects?.filter((s) => s.status === "approved").length || 0,
          color: "#4CAF8F",
        },
        {
          name: "Pending",
          value: subjects?.filter((s) => s.status === "pending").length || 0,
          color: "#D4AF37",
        },
        {
          name: "Rejected",
          value: subjects?.filter((s) => s.status === "rejected").length || 0,
          color: "#C94A4A",
        },
      ];
      setSubjectStatusData(subjectStats);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (
    profiles: any[],
    subjects: any[],
    resources: any[],
    submissions: any[],
  ): MonthlyData[] => {
    const months = [];
    const now = new Date();

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const usersCount = profiles.filter((p) => {
        const createdAt = new Date(p.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const subjectsCount = subjects.filter((s) => {
        const createdAt = new Date(s.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const resourcesCount = resources.filter((r) => {
        const createdAt = new Date(r.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const submissionsCount = submissions.filter((s) => {
        const createdAt = new Date(s.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      months.push({
        month: monthName,
        users: usersCount,
        subjects: subjectsCount,
        resources: resourcesCount,
        submissions: submissionsCount,
      });
    }

    return months;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-[#707070]">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin">
          <Button
            variant="outline"
            size="sm"
            className="mb-4 bg-transparent border-[#2A2F35] text-[#B0B0B0] hover:bg-[#1A1F25] hover:text-[#D4AF37] hover:border-[#D4AF37]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-[#EAEAEA] mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-[#B0B0B0]">Platform insights and activity trends</p>
      </div>

      {/* Monthly Growth Trends */}
      <Card className="bg-[#14181D] border-[#2A2F35] p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
          <h2 className="text-xl font-semibold text-[#EAEAEA]">
            Monthly Growth Trends
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2F35" />
            <XAxis dataKey="month" stroke="#707070" />
            <YAxis stroke="#707070" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#14181D",
                border: "1px solid #2A2F35",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#EAEAEA" }}
              itemStyle={{ color: "#B0B0B0" }}
            />
            <Legend wrapperStyle={{ color: "#B0B0B0" }} />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#D4AF37"
              strokeWidth={2}
              name="New Users"
            />
            <Line
              type="monotone"
              dataKey="subjects"
              stroke="#4CAF8F"
              strokeWidth={2}
              name="New Subjects"
            />
            <Line
              type="monotone"
              dataKey="resources"
              stroke="#6B9FDB"
              strokeWidth={2}
              name="New Resources"
            />
            <Line
              type="monotone"
              dataKey="submissions"
              stroke="#C94A4A"
              strokeWidth={2}
              name="Submissions"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold text-[#EAEAEA]">
              User Distribution
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userRoleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2F35" />
              <XAxis dataKey="name" stroke="#707070" />
              <YAxis stroke="#707070" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#14181D",
                  border: "1px solid #2A2F35",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#EAEAEA" }}
                cursor={{ fill: "rgba(212, 175, 55, 0.1)" }}
              />
              <Bar dataKey="value" fill="#D4AF37" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Submission Status */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold text-[#EAEAEA]">
              Submission Status
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={submissionStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ value }) => (value > 0 ? value : "")}>
                {submissionStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#14181D",
                  border: "1px solid #2A2F35",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#EAEAEA" }}
              />
              <Legend
                wrapperStyle={{ color: "#B0B0B0" }}
                formatter={(value, entry: any) =>
                  `${entry.payload.name}: ${entry.payload.value} (${(
                    (entry.payload.value /
                      submissionStatusData.reduce(
                        (acc, curr) => acc + curr.value,
                        0,
                      )) *
                    100
                  ).toFixed(0)}%)`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject Status */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold text-[#EAEAEA]">
              Subject Status
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={subjectStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ value }) => (value > 0 ? value : "")}>
                {subjectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#14181D",
                  border: "1px solid #2A2F35",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#EAEAEA" }}
              />
              <Legend
                wrapperStyle={{ color: "#B0B0B0" }}
                formatter={(value, entry: any) =>
                  `${entry.payload.name}: ${entry.payload.value} (${(
                    (entry.payload.value /
                      subjectStatusData.reduce(
                        (acc, curr) => acc + curr.value,
                        0,
                      )) *
                    100
                  ).toFixed(0)}%)`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Summary */}
        <Card className="bg-[#14181D] border-[#2A2F35] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-xl font-semibold text-[#EAEAEA]">
              Activity Summary
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0B0D10] rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[#B0B0B0]">Total Users</span>
              </div>
              <span className="text-2xl font-bold text-[#EAEAEA]">
                {userRoleData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0B0D10] rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-[#4CAF8F]" />
                <span className="text-[#B0B0B0]">Total Subjects</span>
              </div>
              <span className="text-2xl font-bold text-[#EAEAEA]">
                {subjectStatusData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0B0D10] rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#6B9FDB]" />
                <span className="text-[#B0B0B0]">Total Submissions</span>
              </div>
              <span className="text-2xl font-bold text-[#EAEAEA]">
                {submissionStatusData.reduce(
                  (acc, curr) => acc + curr.value,
                  0,
                )}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
