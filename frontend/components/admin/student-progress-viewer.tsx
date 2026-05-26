"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Loader2,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface Student {
  user_id: string;
  full_name: string;
}

interface CourseProgress {
  subject_id: number;
  subject_title: string;
  subject_code: string;
  total_resources: number;
  completed_resources: number;
  progress_percentage: number;
  last_accessed: string | null;
  time_spent_seconds: number;
}

interface ResourceProgress {
  resource_id: number;
  resource_title: string;
  resource_type: string;
  completed: boolean;
  completed_at: string | null;
  time_spent_seconds: number;
}

export function StudentProgressViewer() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [resourceProgress, setResourceProgress] = useState<ResourceProgress[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("role", "student")
      .order("full_name");

    if (data) setStudents(data);
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()),
  );

  const loadStudentProgress = async (studentId: string) => {
    setLoading(true);
    const supabase = createClient();

    // Get all courses assigned to the student
    const { data: assignments } = await supabase
      .from("course_assignments")
      .select(
        `
        subject_id,
        subject:subjects(
          id,
          title,
          subject_code
        )
      `,
      )
      .eq("user_id", studentId)
      .eq("status", "active");

    if (!assignments || assignments.length === 0) {
      setCourseProgress([]);
      setLoading(false);
      return;
    }

    // For each course, calculate progress
    const progressData: CourseProgress[] = [];

    for (const assignment of assignments) {
      const subjectId = assignment.subject_id;
      const subject = Array.isArray(assignment.subject)
        ? assignment.subject[0]
        : assignment.subject;

      // Get total resources for this subject
      const { count: totalResources } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subjectId)
        .eq("approved", true);

      // Get completed resources count
      const { count: completedResources } = await supabase
        .from("user_resource_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", studentId)
        .eq("subject_id", subjectId)
        .eq("completed", true);

      // Get last accessed and total time spent
      const { data: progressStats } = await supabase
        .from("user_resource_progress")
        .select("last_accessed, time_spent_seconds")
        .eq("user_id", studentId)
        .eq("subject_id", subjectId)
        .order("last_accessed", { ascending: false })
        .limit(1)
        .single();

      const progress_percentage =
        totalResources && totalResources > 0
          ? Math.round((completedResources! / totalResources) * 100)
          : 0;

      progressData.push({
        subject_id: subjectId,
        subject_title: subject?.title || "Unknown",
        subject_code: subject?.subject_code || "N/A",
        total_resources: totalResources || 0,
        completed_resources: completedResources || 0,
        progress_percentage,
        last_accessed: progressStats?.last_accessed || null,
        time_spent_seconds: progressStats?.time_spent_seconds || 0,
      });
    }

    setCourseProgress(progressData);
    setLoading(false);
  };

  const loadResourceProgress = async (studentId: string, courseId: number) => {
    setLoading(true);
    const supabase = createClient();

    // Get all resources for the course
    const { data: resources } = await supabase
      .from("resources")
      .select("id, title, type")
      .eq("subject_id", courseId)
      .eq("approved", true)
      .order("created_at");

    if (!resources) {
      setResourceProgress([]);
      setLoading(false);
      return;
    }

    // Get progress for each resource
    const progressData: ResourceProgress[] = [];

    for (const resource of resources) {
      const { data: progress } = await supabase
        .from("user_resource_progress")
        .select("completed, completed_at, time_spent_seconds")
        .eq("user_id", studentId)
        .eq("resource_id", resource.id)
        .single();

      progressData.push({
        resource_id: resource.id,
        resource_title: resource.title,
        resource_type: resource.type,
        completed: progress?.completed || false,
        completed_at: progress?.completed_at || null,
        time_spent_seconds: progress?.time_spent_seconds || 0,
      });
    }

    setResourceProgress(progressData);
    setLoading(false);
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    setSelectedCourse(null);
    setResourceProgress([]);
    if (studentId) {
      loadStudentProgress(studentId);
    } else {
      setCourseProgress([]);
    }
  };

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourse(courseId);
    if (selectedStudent) {
      loadResourceProgress(selectedStudent, courseId);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredProgress = courseProgress.filter(
    (course) =>
      course.subject_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subject_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedStudentData = students.find(
    (s) => s.user_id === selectedStudent,
  );

  return (
    <div className="space-y-6">
      <Card className="bg-card border-2 border-border shadow-hard-xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-foreground font-heading">Student Progress Tracker</CardTitle>
          <CardDescription className="text-muted-foreground font-medium font-body">
            View individual student progress across all courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2 font-body">
                Select Student
              </label>
              {/* Search Input for Students */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl"
                />
              </div>
              {/* Student Dropdown */}
              <Select
                value={selectedStudent}
                onValueChange={handleStudentChange}>
                <SelectTrigger className="bg-background border-2 border-border text-foreground rounded-xl">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent className="bg-card border-2 border-border max-h-[300px]">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <SelectItem
                        key={student.user_id}
                        value={student.user_id}
                        className="text-foreground focus:bg-primary/10">
                        {student.full_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground/80 text-center font-bold font-body">
                      No students found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t-2 border-border">
                  <h3 className="text-lg font-bold text-foreground font-heading">
                    Progress for {selectedStudentData?.full_name}
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl"
                    />
                  </div>
                </div>

                {loading && !selectedCourse ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredProgress.length === 0 ? (
                  <Alert className="bg-background border-2 border-border rounded-xl">
                    <AlertDescription className="text-muted-foreground font-bold font-body">
                      No courses assigned to this student yet.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4">
                    {filteredProgress.map((course) => (
                      <Card
                        key={course.subject_id}
                        className="bg-background border-2 border-border hover:border-primary transition-colors cursor-pointer shadow-hard-sm rounded-xl"
                        onClick={() => handleCourseSelect(course.subject_id)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-foreground font-heading text-base">
                                {course.subject_title}
                              </h4>
                              <p className="text-sm text-muted-foreground font-medium font-body">
                                {course.subject_code}
                              </p>
                            </div>
                            <Badge
                              className={
                                course.progress_percentage === 100
                                  ? "bg-success/20 text-success border-success/30 font-bold"
                                  : course.progress_percentage > 50
                                    ? "bg-primary/20 text-primary border-primary/30 font-bold"
                                    : "bg-warning/20 text-warning border-warning/30 font-bold"
                              }>
                              {course.progress_percentage}% Complete
                            </Badge>
                          </div>

                          <Progress
                            value={course.progress_percentage}
                            className="mb-3"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-bold font-body">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground">
                                {course.completed_resources}/
                                {course.total_resources} Resources
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground">
                                {formatTime(course.time_spent_seconds)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-muted-foreground">
                                {course.last_accessed
                                  ? `Last: ${formatDate(course.last_accessed)}`
                                  : "Not started"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Resource-level progress */}
                {selectedCourse && (
                  <Card className="mt-6 bg-background border-2 border-border shadow-hard-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-foreground font-heading">
                        Resource Progress
                      </CardTitle>
                      <CardDescription className="text-muted-foreground font-medium font-body">
                        Detailed progress for{" "}
                        {
                          courseProgress.find(
                            (c) => c.subject_id === selectedCourse,
                          )?.subject_title
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="border-2 border-border rounded-xl overflow-hidden shadow-hard-sm bg-card">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b-2 border-border hover:bg-muted/50">
                                <TableHead className="text-muted-foreground font-bold font-body">
                                  Resource
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold font-body">
                                  Type
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold font-body">
                                  Status
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold font-body">
                                  Time Spent
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold font-body">
                                  Completed At
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resourceProgress.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={5}
                                    className="text-center py-8 text-muted-foreground font-bold font-body">
                                    No resources found for this course
                                  </TableCell>
                                </TableRow>
                              ) : (
                                resourceProgress.map((resource) => (
                                  <TableRow
                                    key={resource.resource_id}
                                    className="border-b-2 border-border/50 hover:bg-muted/50 font-body">
                                    <TableCell className="text-foreground font-bold">
                                      {resource.resource_title}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="border-2 border-border text-muted-foreground font-bold">
                                        {resource.resource_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {resource.completed ? (
                                        <div className="flex items-center gap-2 text-success font-bold">
                                          <CheckCircle2 className="h-4 w-4" />
                                          Completed
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground/80 font-bold">
                                          In Progress
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-bold">
                                      {formatTime(resource.time_spent_seconds)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-bold">
                                      {resource.completed_at
                                        ? formatDate(resource.completed_at)
                                        : "-"}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
