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
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group font-bold">
        <svg
          className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="font-bold">Back to Home</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl text-primary mb-3 font-bold font-heading">
          Join Student LMS
        </h1>
        <p className="text-muted-foreground text-lg font-bold">
          Choose your role to get started
        </p>
      </div>

      {/* Registration Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {roleOptions.map((option) => (
          <div
            key={option.role}
            style={{ borderRadius: option.role === "student" ? "15px 225px 15px 255px / 255px 15px 225px 15px" : "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="bg-card border-2 border-border p-8 hover:border-primary transition-all duration-300 shadow-hard-md hover:shadow-hard-lg group relative">
            <div className="tape-decor" />
            
            {/* Icon */}
            <div 
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-all border-2 border-border shadow-hard-sm wobbly-border"
            >
              {option.icon}
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl text-foreground mb-2 font-bold font-heading">
              {option.title}
            </h2>
            <p className="text-muted-foreground mb-6 font-bold">{option.description}</p>

            {/* Benefits List */}
            <ul className="space-y-3 mb-8">
              {option.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-muted-foreground text-sm font-medium">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link
              href={option.href}
              style={{ borderRadius: option.role === "student" ? "255px 15px 225px 15px / 15px 225px 15px 255px" : "15px 225px 15px 255px / 255px 15px 225px 15px" }}
              className="block w-full bg-primary text-primary-foreground text-center py-3 border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
              {option.buttonText}
            </Link>
          </div>
        ))}
      </div>

      {/* Already have an account */}
      <p className="text-center text-muted-foreground mt-10 font-bold">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-accent font-bold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
