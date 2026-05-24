"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  CheckIcon,
  BookOpen,
  FileText,
  BarChart3,
} from "lucide-react";

interface Student {
  user_id: string;
  full_name: string;
  role: string;
}

interface Subject {
  id: number;
  title: string;
  subject_code: string;
  regulation: string;
  status: string;
}

interface Assignment {
  id: number;
  user_id: string;
  subject_id: number;
  status: string;
  assigned_at: string;
  assigned_by: string;
  student: {
    full_name: string;
  };
  subject: {
    title: string;
    subject_code: string;
  };
}

interface ProgressData {
  totalResources: number;
  completedResources: number;
  progressPercentage: number;
  resources: Array<{
    id: number;
    title: string;
    type: string;
    completed: boolean;
  }>;
}

export function CourseAssignmentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const supabase = createClient();
    const channel = supabase
      .channel("course_assignments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_assignments",
        },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Load students
    const { data: studentsData, error: studentsError } = await supabase
      .from("profiles")
      .select("user_id, full_name, role")
      .eq("role", "student")
      .order("full_name");

    if (studentsError) {
      console.error("Error loading students:", studentsError);
    }

    // Load approved subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from("subjects")
      .select("id, title, subject_code, regulation, status")
      .eq("status", "approved")
      .order("title");

    if (subjectsError) {
      console.error("Error loading subjects:", subjectsError);
    }

    // Load existing assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("course_assignments")
      .select(
        `
        id,
        user_id,
        subject_id,
        status,
        assigned_at,
        assigned_by
      `,
      )
      .order("assigned_at", { ascending: false });

    if (assignmentsError) {
      console.error("Error loading assignments:", assignmentsError);
      setError(`Failed to load assignments: ${assignmentsError.message}`);
    }

    // Manually join with profiles and subjects to avoid RLS issues
    if (assignmentsData && assignmentsData.length > 0) {
      const enrichedAssignments = await Promise.all(
        assignmentsData.map(async (assignment: any) => {
          // Get student name
          const { data: student } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", assignment.user_id)
            .single();

          // Get subject details
          const { data: subject } = await supabase
            .from("subjects")
            .select("title, subject_code")
            .eq("id", assignment.subject_id)
            .single();

          return {
            ...assignment,
            student: student || { full_name: "Unknown" },
            subject: subject || { title: "Unknown", subject_code: "N/A" },
          };
        }),
      );
      setAssignments(enrichedAssignments);
    } else {
      setAssignments([]);
    }

    if (studentsData) setStudents(studentsData);
    if (subjectsData) setSubjects(subjectsData);
    setLoading(false);
  };

  const assignCourse = async () => {
    if (!selectedStudent || !selectedSubject) {
      setError("Please select both student and course");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to assign courses");
      setLoading(false);
      return;
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from("course_assignments")
      .select("id")
      .eq("user_id", selectedStudent)
      .eq("subject_id", parseInt(selectedSubject))
      .single();

    if (existing) {
      setError("This course is already assigned to this student");
      setLoading(false);
      return;
    }

    // Create assignment
    const { error: insertError } = await supabase
      .from("course_assignments")
      .insert({
        user_id: selectedStudent,
        subject_id: parseInt(selectedSubject),
        assigned_by: user.id,
        status: "active",
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Course assigned successfully!");
      setSelectedStudent("");
      setSelectedSubject("");
      setDialogOpen(false);
      loadData();
    }

    setLoading(false);
  };

  const updateAssignmentStatus = async (
    assignmentId: number,
    newStatus: string,
  ) => {
    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("course_assignments")
      .update({ status: newStatus })
      .eq("id", assignmentId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(`Assignment status updated to ${newStatus}`);
      loadData();
    }

    setLoading(false);
  };

  const removeAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this course assignment?")) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("course_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSuccess("Assignment removed successfully");
      loadData();
    }

    setLoading(false);
  };

  const fetchProgress = async (userId: string, subjectId: number) => {
    setLoadingProgress(true);
    const supabase = createClient();

    try {
      // Fetch all resources for this subject
      const { data: resources, error: resourcesError } = await supabase
        .from("resources")
        .select("id, title, type")
        .eq("subject_id", subjectId)
        .order("title");

      if (resourcesError) throw resourcesError;

      // Fetch user's progress for these resources
      const { data: progressRecords, error: progressError } = await supabase
        .from("user_resource_progress")
        .select("resource_id, completed")
        .eq("user_id", userId)
        .in("resource_id", resources?.map((r) => r.id) || []);

      if (progressError) throw progressError;

      // Create a map of completed resources
      const completedMap = new Map(
        progressRecords?.map((p) => [p.resource_id, p.completed]) || [],
      );

      // Combine data
      const resourcesWithProgress =
        resources?.map((resource) => ({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          completed: completedMap.get(resource.id) || false,
        })) || [];

      const totalResources = resources?.length || 0;
      const completedResources = resourcesWithProgress.filter(
        (r) => r.completed,
      ).length;
      const progressPercentage =
        totalResources > 0
          ? Math.round((completedResources / totalResources) * 100)
          : 0;

      setProgressData({
        totalResources,
        completedResources,
        progressPercentage,
        resources: resourcesWithProgress,
      });
    } catch (error: any) {
      console.error("Error fetching progress:", error);
      setError("Failed to load progress data");
    } finally {
      setLoadingProgress(false);
    }
  };

  const openProgressDialog = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setProgressDialogOpen(true);
    await fetchProgress(assignment.user_id, assignment.subject_id);
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.student.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.subject.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.subject.subject_code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge className="bg-[#4CAF8F]/20 text-[#4CAF8F] border-[#4CAF8F]/30">
          Active
        </Badge>
      );
    } else if (status === "suspended") {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
          Suspended
        </Badge>
      );
    } else if (status === "completed") {
      return (
        <Badge variant="outline" className="border-[#BFA55A]/30">
          Completed
        </Badge>
      );
    }
    return <Badge variant="default">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Assignment Management</CardTitle>
              <CardDescription>
                Assign courses to students and manage their access
              </CardDescription>
            </div>
            <DialogPrimitive.Root
              open={dialogOpen}
              onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] hover:bg-[#E6C76A] text-[#0B0D10]">
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Course
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#14181D] border-[#BFA55A]/30">
                <DialogHeader>
                  <DialogTitle className="text-[#EAEAEA]">
                    Assign Course to Student
                  </DialogTitle>
                  <DialogDescription className="text-[#B0B0B0]">
                    Select a student and course to create an assignment
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="student"
                      className="text-[#EAEAEA] mb-2 block">
                      Student
                    </Label>
                    <DialogPrimitive.Root
                      open={studentSearchOpen}
                      onOpenChange={setStudentSearchOpen}>
                      <DialogPrimitive.Trigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between bg-[#0B0D10] border-[#BFA55A]/30 text-[#EAEAEA] hover:bg-[#14181D]">
                          {selectedStudent
                            ? students.find(
                                (s) => s.user_id === selectedStudent,
                              )?.full_name
                            : "Select a student"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DialogPrimitive.Trigger>
                      <DialogPrimitive.Portal>
                        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
                        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-[#14181D] rounded-lg border border-[#BFA55A]/30 shadow-md p-4">
                          <DialogPrimitive.Title className="text-lg font-semibold text-[#D4AF37] mb-4">
                            Select a student
                          </DialogPrimitive.Title>
                          <div className="space-y-3">
                            <Input
                              placeholder="Search students..."
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="w-full"
                            />
                            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                              {students
                                .filter((student) =>
                                  student.full_name
                                    .toLowerCase()
                                    .includes(studentSearch.toLowerCase())
                                )
                                .map((student) => (
                                  <div
                                    key={student.user_id}
                                    onClick={() => {
                                      setSelectedStudent(student.user_id);
                                      setStudentSearchOpen(false);
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                                      selectedStudent === student.user_id
                                        ? "bg-[#BFA55A]/20 text-[#D4AF37]"
                                        : "hover:bg-[#1A1F25] text-[#EAEAEA]"
                                    )}>
                                    <CheckIcon
                                      className={cn(
                                        "h-4 w-4",
                                        selectedStudent === student.user_id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {student.full_name}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </DialogPrimitive.Content>
                      </DialogPrimitive.Portal>
                    </DialogPrimitive.Root>
                  </div>

                  <div>
                    <Label
                      htmlFor="subject"
                      className="text-[#EAEAEA] mb-2 block">
                      Course
                    </Label>
                    <DialogPrimitive.Root
                      open={courseSearchOpen}
                      onOpenChange={setCourseSearchOpen}>
                      <DialogPrimitive.Trigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between bg-[#0B0D10] border-[#BFA55A]/30 text-[#EAEAEA] hover:bg-[#14181D]">
                          {selectedSubject
                            ? subjects.find(
                                (s) => s.id.toString() === selectedSubject,
                              )
                              ? `${subjects.find((s) => s.id.toString() === selectedSubject)?.subject_code} - ${subjects.find((s) => s.id.toString() === selectedSubject)?.title}`
                              : "Select a course"
                            : "Select a course"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DialogPrimitive.Trigger>
                      <DialogPrimitive.Portal>
                        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
                        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-[#14181D] rounded-lg border border-[#BFA55A]/30 shadow-md p-4">
                          <DialogPrimitive.Title className="text-lg font-semibold text-[#D4AF37] mb-4">
                            Select a course
                          </DialogPrimitive.Title>
                          <div className="space-y-3">
                            <Input
                              placeholder="Search courses..."
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              className="w-full"
                            />
                            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                              {subjects
                                .filter(
                                  (subject) =>
                                    subject.title
                                      .toLowerCase()
                                      .includes(courseSearch.toLowerCase()) ||
                                    subject.subject_code
                                      .toLowerCase()
                                      .includes(courseSearch.toLowerCase())
                                )
                                .map((subject) => (
                                  <div
                                    key={subject.id}
                                    onClick={() => {
                                      setSelectedSubject(subject.id.toString());
                                      setCourseSearchOpen(false);
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                                      selectedSubject === subject.id.toString()
                                        ? "bg-[#BFA55A]/20 text-[#D4AF37]"
                                        : "hover:bg-[#1A1F25] text-[#EAEAEA]"
                                    )}>
                                    <CheckIcon
                                      className={cn(
                                        "h-4 w-4",
                                        selectedSubject === subject.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {subject.subject_code} - {subject.title}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </DialogPrimitive.Content>
                      </DialogPrimitive.Portal>
                    </DialogPrimitive.Root>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={assignCourse}
                      disabled={loading || !selectedStudent || !selectedSubject}
                      className="flex-1 bg-[#D4AF37] hover:bg-[#E6C76A] text-[#0B0D10]">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Assign Course
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setDialogOpen(false)}
                      variant="outline"
                      className="border-[#BFA55A]/30 text-[#EAEAEA]">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </DialogPrimitive.Root>
          </div>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4 bg-[#4CAF8F]/10 border-[#4CAF8F]/30">
              <Check className="h-4 w-4 text-[#4CAF8F]" />
              <AlertDescription className="text-[#EAEAEA]">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#707070]" />
              <Input
                placeholder="Search by student name, course title, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0B0D10] border-[#BFA55A]/30 text-[#EAEAEA]"
              />
            </div>
          </div>

          <div className="border border-[#BFA55A]/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#BFA55A]/20 hover:bg-[#0B0D10]/50">
                  <TableHead className="text-[#B0B0B0]">Student</TableHead>
                  <TableHead className="text-[#B0B0B0]">Course</TableHead>
                  <TableHead className="text-[#B0B0B0]">Code</TableHead>
                  <TableHead className="text-[#B0B0B0]">Status</TableHead>
                  <TableHead className="text-[#B0B0B0]">
                    Assigned Date
                  </TableHead>
                  <TableHead className="text-[#B0B0B0]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#D4AF37]" />
                    </TableCell>
                  </TableRow>
                ) : filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-[#707070]">
                      No course assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow
                      key={assignment.id}
                      onClick={() => openProgressDialog(assignment)}
                      className="border-[#BFA55A]/20 hover:bg-[#0B0D10]/50 cursor-pointer transition-colors">
                      <TableCell className="text-[#EAEAEA]">
                        {assignment.student.full_name}
                      </TableCell>
                      <TableCell className="text-[#EAEAEA]">
                        {assignment.subject.title}
                      </TableCell>
                      <TableCell className="text-[#B0B0B0]">
                        {assignment.subject.subject_code}
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell className="text-[#B0B0B0]">
                        {formatDate(assignment.assigned_at)}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}>
                          {assignment.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateAssignmentStatus(
                                  assignment.id,
                                  "suspended",
                                )
                              }
                              className="border-[#BFA55A]/30 text-[#EAEAEA] hover:bg-[#D4AF37]/10">
                              Suspend
                            </Button>
                          )}
                          {assignment.status === "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateAssignmentStatus(assignment.id, "active")
                              }
                              className="border-[#BFA55A]/30 text-[#EAEAEA] hover:bg-[#D4AF37]/10">
                              Activate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeAssignment(assignment.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Progress Dialog */}
      <DialogPrimitive.Root
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}>
        <DialogContent className="bg-[#14181D] border-[#BFA55A]/30 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[#EAEAEA] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
              Student Progress
            </DialogTitle>
            <DialogDescription className="text-[#B0B0B0]">
              {selectedAssignment && (
                <>
                  {selectedAssignment.student.full_name} -{" "}
                  {selectedAssignment.subject.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {loadingProgress ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
              </div>
            ) : progressData ? (
              <>
                {/* Progress Summary */}
                <Card className="bg-[#0B0D10] border-[#BFA55A]/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#EAEAEA]">
                      Overall Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#B0B0B0]">Completion</span>
                        <span className="text-[#D4AF37] font-semibold">
                          {progressData.progressPercentage}%
                        </span>
                      </div>
                      <Progress
                        value={progressData.progressPercentage}
                        className="h-2 bg-[#2A2F35]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-[#14181D] p-3 rounded-lg border border-[#BFA55A]/20">
                        <div className="text-2xl font-bold text-[#4CAF8F]">
                          {progressData.completedResources}
                        </div>
                        <div className="text-xs text-[#B0B0B0]">Completed</div>
                      </div>
                      <div className="bg-[#14181D] p-3 rounded-lg border border-[#BFA55A]/20">
                        <div className="text-2xl font-bold text-[#EAEAEA]">
                          {progressData.totalResources}
                        </div>
                        <div className="text-xs text-[#B0B0B0]">
                          Total Resources
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resources List */}
                <Card className="bg-[#0B0D10] border-[#BFA55A]/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#EAEAEA] flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progressData.resources.length === 0 ? (
                      <div className="text-center py-8 text-[#707070]">
                        No resources available for this course
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {progressData.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-colors",
                              resource.completed
                                ? "bg-[#4CAF8F]/10 border-[#4CAF8F]/30"
                                : "bg-[#14181D] border-[#2A2F35] hover:border-[#BFA55A]/30",
                            )}>
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {resource.completed ? (
                                  <div className="w-5 h-5 rounded-full bg-[#4CAF8F] flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-[#2A2F35]" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-[#EAEAEA]">
                                  {resource.title}
                                </div>
                                <div className="text-xs text-[#707070]">
                                  {resource.type}
                                </div>
                              </div>
                            </div>
                            {resource.completed && (
                              <Badge className="bg-[#4CAF8F]/20 text-[#4CAF8F] border-[#4CAF8F]/30">
                                Completed
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-[#707070]">
                No progress data available
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#2A2F35]">
            <Button
              onClick={() => setProgressDialogOpen(false)}
              className="w-full bg-[#D4AF37] hover:bg-[#E6C76A] text-[#0B0D10]">
              Close
            </Button>
          </div>
        </DialogContent>
      </DialogPrimitive.Root>
    </div>
  );
}
