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
  Video,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MonthlyData {
  month: string;
  users: number;
  subjects: number;
  resources: number;
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
  const [resourceTypeData, setResourceTypeData] = useState<StatusData[]>([]);
  const [userRoleData, setUserRoleData] = useState<RoleData[]>([]);
  const [subjectStatusData, setSubjectStatusData] = useState<StatusData[]>([]);
  const [totalResourcesCount, setTotalResourcesCount] = useState(0);

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
      ] = await Promise.all([
        supabase.from("profiles").select("created_at, role"),
        supabase.from("subjects").select("created_at, status"),
        supabase.from("resources").select("created_at, type"),
      ]);

      setTotalResourcesCount(resources?.length || 0);

      // Process monthly growth data (last 6 months)
      const monthlyStats = processMonthlyData(
        profiles || [],
        subjects || [],
        resources || [],
      );
      setMonthlyData(monthlyStats);

      // Process resource type distribution
      const resourceTypeStats = [
        {
          name: "Videos",
          value: resources?.filter((r) => r.type === "video").length || 0,
          color: "#4CAF8F", // Green
        },
        {
          name: "PDFs",
          value: resources?.filter((r) => r.type === "pdf").length || 0,
          color: "#6B9FDB", // Blue
        },
        {
          name: "Notes",
          value: resources?.filter((r) => r.type === "notes").length || 0,
          color: "#D4AF37", // Gold
        },
      ];
      setResourceTypeData(resourceTypeStats);

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

      months.push({
        month: monthName,
        users: usersCount,
        subjects: subjectsCount,
        resources: resourcesCount,
      });
    }

    return months;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground font-bold font-body">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors duration-200">
      {/* Header */}
      <div>
        <Link href="/admin" className="cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            className="mb-4 bg-transparent border-2 border-border text-muted-foreground hover:bg-muted font-bold font-body cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground font-heading mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground font-medium font-body">Platform insights and activity trends</p>
      </div>

      {/* Monthly Growth Trends */}
      <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground font-heading">
            Monthly Growth Trends
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.15} />
            <XAxis dataKey="month" stroke="var(--foreground)" fontSize={12} fontFamily="var(--font-patrick-hand)" />
            <YAxis stroke="var(--foreground)" fontSize={12} fontFamily="var(--font-patrick-hand)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "2px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-patrick-hand)",
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Legend wrapperStyle={{ color: "var(--foreground)", fontFamily: "var(--font-patrick-hand)", fontWeight: "bold" }} />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#D4AF37"
              strokeWidth={3}
              name="New Users"
            />
            <Line
              type="monotone"
              dataKey="subjects"
              stroke="#4CAF8F"
              strokeWidth={3}
              name="New Subjects"
            />
            <Line
              type="monotone"
              dataKey="resources"
              stroke="#6B9FDB"
              strokeWidth={3}
              name="New Resources"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-heading">
              User Distribution
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userRoleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.15} />
              <XAxis dataKey="name" stroke="var(--foreground)" fontSize={12} fontFamily="var(--font-patrick-hand)" />
              <YAxis stroke="var(--foreground)" fontSize={12} fontFamily="var(--font-patrick-hand)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "2px solid var(--border)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-patrick-hand)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                cursor={{ fill: "rgba(212, 175, 55, 0.05)" }}
              />
              <Bar dataKey="value" fill="#D4AF37" name="Users" stroke="var(--border)" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Resource Distribution */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-heading">
              Resource Distribution
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={resourceTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                stroke="var(--border)"
                strokeWidth={2}
                label={({ value }) => (value > 0 ? value : "")}>
                {resourceTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "2px solid var(--border)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-patrick-hand)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
              />
              <Legend
                wrapperStyle={{ color: "var(--foreground)", fontFamily: "var(--font-patrick-hand)", fontWeight: "bold" }}
                formatter={(value, entry: any) =>
                  `${entry.payload.name}: ${entry.payload.value} (${(
                    (entry.payload.value /
                      (resourceTypeData.reduce(
                        (acc, curr) => acc + curr.value,
                        0,
                      ) || 1)) *
                    100
                  ).toFixed(0)}%)`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject Status */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-heading">
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
                stroke="var(--border)"
                strokeWidth={2}
                label={({ value }) => (value > 0 ? value : "")}>
                {subjectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "2px solid var(--border)",
                  borderRadius: "8px",
                  fontFamily: "var(--font-patrick-hand)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
              />
              <Legend
                wrapperStyle={{ color: "var(--foreground)", fontFamily: "var(--font-patrick-hand)", fontWeight: "bold" }}
                formatter={(value, entry: any) =>
                  `${entry.payload.name}: ${entry.payload.value} (${(
                    (entry.payload.value /
                      (subjectStatusData.reduce(
                        (acc, curr) => acc + curr.value,
                        0,
                      ) || 1)) *
                    100
                  ).toFixed(0)}%)`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Summary */}
        <Card className="bg-card border-2 border-border shadow-hard-sm p-6 wobbly-border">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-heading">
              Activity Summary
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background border-2 border-border shadow-hard-sm rounded-lg wobbly-border transition-colors duration-200">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground font-bold font-body">Total Users</span>
              </div>
              <span className="text-2xl font-bold text-foreground font-body">
                {userRoleData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background border-2 border-border shadow-hard-sm rounded-lg wobbly-border transition-colors duration-200">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-secondary" />
                <span className="text-muted-foreground font-bold font-body">Total Subjects</span>
              </div>
              <span className="text-2xl font-bold text-foreground font-body">
                {subjectStatusData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background border-2 border-border shadow-hard-sm rounded-lg wobbly-border transition-colors duration-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground font-bold font-body">Total Resources</span>
              </div>
              <span className="text-2xl font-bold text-foreground font-body">
                {totalResourcesCount}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
