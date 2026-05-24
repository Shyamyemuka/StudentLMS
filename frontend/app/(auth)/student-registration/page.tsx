import { redirect } from "next/navigation";

export default function StudentRegistrationPage() {
  // Redirect to signup page instead of showing landing page
  redirect("/signup");
}
