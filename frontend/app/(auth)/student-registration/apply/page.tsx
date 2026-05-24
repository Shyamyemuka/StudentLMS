import { StudentRegistrationForm } from "@/components/auth/student-registration-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application Form | Student LMS",
  description: "Complete your student registration form",
};

export default function StudentRegistrationApplyPage() {
  return (
    <div className="w-full min-h-screen py-16 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <StudentRegistrationForm />
      </div>
    </div>
  );
}
