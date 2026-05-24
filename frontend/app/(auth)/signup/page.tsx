import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const roleOptions = [
    {
      role: "student",
      title: "Apply for Student Admission",
      description: "Begin your learning journey with us",
      benefits: [
        "Access high-quality courses and learning materials",
        "Learn from experienced faculty members",
        "Track your progress with detailed analytics",
        "Interactive learning with chat support",
        "24/7 access to course content and resources",
      ],
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      href: "/signup/student",
      buttonText: "Continue as Student",
    },
    {
      role: "faculty",
      title: "Register as Faculty",
      description: "Join as an educator and share your knowledge",
      benefits: [
        "Upload and manage course materials and videos",
        "Create new subjects and organize content",
        "Create and manage student accounts",
        "Engage with students through dedicated chat rooms",
        "Build your teaching portfolio on the platform",
      ],
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
      href: "/signup/faculty",
      buttonText: "Continue as Faculty",
      note: "Requires admin approval",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[#B0B0B0] hover:text-[#D4AF37] mb-8 transition-colors group">
        <svg
          className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="font-medium">Back to Home</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl text-[#D4AF37] mb-3 font-semibold">
          Join StudentLMS
        </h1>
        <p className="text-[#B0B0B0] text-lg">
          Choose your role to get started
        </p>
      </div>

      {/* Registration Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {roleOptions.map((option) => (
          <div
            key={option.role}
            className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-8 hover:border-[#D4AF37] transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] group">
            {/* Icon */}
            <div className="w-20 h-20 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37]/20 transition-colors">
              {option.icon}
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl text-[#EAEAEA] mb-2 font-semibold">
              {option.title}
            </h2>
            <p className="text-[#B0B0B0] mb-6">{option.description}</p>

            {/* Benefits List */}
            <ul className="space-y-3 mb-8">
              {option.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[#4CAF8F] flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-[#B0B0B0] text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link
              href={option.href}
              className="block w-full bg-[#D4AF37] text-[#0B0D10] text-center py-3 rounded-lg font-medium hover:bg-[#E6C76A] transition-colors">
              {option.buttonText}
            </Link>
          </div>
        ))}
      </div>

      {/* Already have an account */}
      <p className="text-center text-[#B0B0B0] mt-10">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#D4AF37] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
