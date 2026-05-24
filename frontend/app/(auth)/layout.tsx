export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0D10] flex flex-col">
      {/* Simple Header */}
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <a href="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img
                src="/images/logo.png"
                alt="Student LMS Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-[#D4AF37] leading-tight">
                Student LMS
              </span>
              <span className="text-xs text-[#B0B0B0] leading-tight">
                Knowledge Archive
              </span>
            </div>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="py-4 px-4 border-t border-[#2A2F35]">
        <p className="text-center text-[#707070] text-sm">
          © StudentLMS {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
