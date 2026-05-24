import { StudentRegistrationForm } from "@/components/auth/student-registration-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application Form | Student LMS",
  description: "Complete your student registration form",
};

export default function StudentRegistrationApplyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] to-[#14181D] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <StudentRegistrationForm />
      </div>
    </div>
  );
}
