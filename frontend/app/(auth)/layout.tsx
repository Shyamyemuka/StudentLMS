import Navigation from "@/components/landing/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-24 relative overflow-x-hidden">
      {/* Universal Theme Sticky Header */}
      <Navigation />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="py-6 px-4 border-t-2 border-dashed border-border bg-card/50">
        <p className="text-center text-muted-foreground text-sm font-bold">
          © Student LMS {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
