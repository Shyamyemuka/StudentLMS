"use client";

export default function AboutSection() {
  return (
    <section id="contact" className="py-24 bg-card border-t-2 border-border relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-primary mb-4 font-bold font-heading">
            Meet the Builder
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left - About */}
          <div className="lg:pr-8">
            <h3 className="text-2xl text-foreground mb-6 font-bold font-heading">
              Who and Why StudentLMS?
            </h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed font-bold">
              <p>
                This platform is built by an engineering student who believes
                learning should be accessible, structured, and student-centric.
              </p>
              <p>
                The idea behind this project came from real gaps observed in
                everyday college life — unrecorded lectures, scattered
                resources, and the lack of a single space where students can
                truly learn at their own pace.
              </p>
              <p>
                This is not a one-time project, but an evolving system designed
                to grow with its users and adapt to real academic needs.
              </p>
            </div>
          </div>

          {/* Center - Photo */}
          <div className="flex flex-col items-center">
            {/* Circular Photo with Sketchy Border */}
            <div className="relative">
              <div 
                style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                className="w-48 h-48 overflow-hidden border-4 border-border shadow-hard-md"
              >
                <img
                  src="/images/builder.jpg"
                  alt="Shyam Yemuka"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name */}
            <h4 className="text-xl text-primary mt-6 font-bold font-heading">
              Shyam Yemuka
            </h4>
            <p className="text-muted-foreground text-sm font-bold mt-1">Creator & Developer</p>
          </div>

          {/* Right - Contact */}
          <div className="lg:pl-8">
            <h3 className="text-2xl text-foreground mb-6 font-bold font-heading">
              Contact Details
            </h3>
            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-border flex items-center justify-center flex-shrink-0 wobbly-border">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold">Name</p>
                  <p className="text-foreground font-bold">Shyam Yemuka</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-border flex items-center justify-center flex-shrink-0 wobbly-border">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bold">Email</p>
                  <a
                    href="mailto:StudentLMSofficial@gmail.com"
                    className="text-foreground font-bold hover:text-primary transition-colors">
                    StudentLMSofficial@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
