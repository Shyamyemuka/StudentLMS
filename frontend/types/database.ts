export type UserRole = "admin" | "faculty" | "faculty_pending" | "student";

export type SubjectStatus = "pending" | "approved" | "rejected";

export type ResourceType = "video" | "pdf" | "notes";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Profile {
  user_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  subject_code: string;
  title: string;
  regulation: string;
  description: string | null;
  status: SubjectStatus;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  price: number;
  access_duration_months: number | null;
  certificate_enabled: boolean;
  // Joined data
  creator?: Profile;
  approver?: Profile;
}

export interface CreateSubject {
  subject_code: string;
  title: string;
  regulation: string;
  description?: string;
  price: number;
  access_duration_months: number | null;
  certificate_enabled?: boolean;
}

export interface Resource {
  id: number;
  subject_id: number;
  type: ResourceType;
  title: string;
  source: "upload" | "external";
  storage_path: string | null;
  external_url: string | null;
  created_by: string;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  subject?: Subject;
}

export interface ResourceSubmission {
  id: number;
  subject_id: number;
  type: "pdf" | "notes";
  title: string;
  storage_path: string;
  submitted_by: string;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  submitter?: Profile;
  reviewer?: Profile;
  subject?: Subject;
}

export interface Message {
  id: number;
  subject_id: number;
  sender_id: string;
  body: string;
  created_at: string;
  // Joined data
  sender?: Profile;
}

export interface VideoBookmark {
  id: number;
  user_id: string;
  resource_id: number;
  timestamp_sec: number;
  note: string;
  created_at: string;
  updated_at: string;
}



export interface CreateResource {
  subject_id: number;
  type: ResourceType;
  title: string;
  source: "upload" | "external";
  storage_path?: string;
  external_url?: string;
}

export interface CreateMessage {
  subject_id: number;
  body: string;
}

export interface CreateBookmark {
  resource_id: number;
  timestamp_sec: number;
  note: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: Profile;
}

export interface CreateNotice {
  title: string;
  content: string;
}

// Notification types
export type NotificationType =
  | "subject_approved"
  | "subject_rejected"
  | "resource_approved"
  | "resource_rejected"
  | "new_submission"
  | "new_faculty_signup"
  | "new_student_signup"
  | "course_assigned"
  | "enrollment";

export interface Notification {
  id: number;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  reference_id?: number | null;
}

export interface CreateNotification {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  reference_id?: number;
}

// Enrollment types

export interface CourseEnrollment {
  id: number;
  user_id: string;
  subject_id: number;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Profile;
  subject?: Subject;
}

export interface CoursePricing {
  id: number;
  subject_id: number;
  price: number;
  currency: string;
  is_free: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  subject?: Subject;
}

export interface StudentCredential {
  id: number;
  user_id: string;
  temporary_password: string | null;
  password_reset_required: boolean;
  created_by: string | null;
  distributed_at: string | null;
  first_login_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Profile;
  creator?: Profile;
}

// Create types for new entities
export interface CreateCourseEnrollment {
  user_id: string;
  subject_id: number;
}

export interface CreateCoursePricing {
  subject_id: number;
  price: number;
  currency?: string;
  is_free?: boolean;
}

export interface CreateStudentAccount {
  full_name: string;
  email: string;
  password: string;
  student_id?: string;
  role?: "student";
}

// Extended Profile interface for admin-created students
export interface ExtendedProfile extends Profile {
  created_by?: string;
  account_type?: "self_created" | "admin_created" | "faculty_created";
  student_id?: string;
}

// Course Progress Tracking
export interface UserResourceProgress {
  id: number;
  user_id: string;
  subject_id: number;
  resource_id: number;
  completed: boolean;
  completed_at: string | null;
  last_accessed: string | null;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Profile;
  resource?: Resource;
  subject?: Subject;
}

export interface CourseProgress {
  subject_id: number;
  user_id: string;
  total_resources: number;
  completed_resources: number;
  progress_percentage: number;
  last_accessed: string | null;
  started_at: string | null;
  completed_at: string | null;
  // Joined data
  subject?: Subject;
  user?: Profile;
}

export interface CreateResourceProgress {
  user_id: string;
  subject_id: number;
  resource_id: number;
  completed?: boolean;
  time_spent_seconds?: number;
}

export interface UpdateResourceProgress {
  completed?: boolean;
  time_spent_seconds?: number;
  last_accessed?: string;
}