"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const Certificate = dynamic(() => import("./Certificate"), {
  ssr: false,
  loading: () => (
    <div className="w-[1123px] h-[794px] flex items-center justify-center bg-card border-4 border-border rounded-xl font-heading font-bold text-foreground">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading verified certificate...</p>
      </div>
    </div>
  ),
});

interface CertificatePanelProps {
  subjectId: number;
  initialCertificateEnabled: boolean;
  userRole: string;
  studentName: string;
  courseName: string;
}

export default function CertificatePanel({
  subjectId,
  initialCertificateEnabled,
  userRole,
  studentName,
  courseName,
}: CertificatePanelProps) {
  const [enabled, setEnabled] = useState(initialCertificateEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const certRef = useRef<any>(null);

  const isAdmin = userRole === "admin";
  const isFaculty = userRole === "faculty";

  // Sync state if initial prop changes (e.g. server component re-fetches)
  useEffect(() => {
    setEnabled(initialCertificateEnabled);
  }, [initialCertificateEnabled]);


  const handleToggle = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("subjects")
        .update({ certificate_enabled: !enabled })
        .eq("id", subjectId);

      if (error) throw error;

      setEnabled(!enabled);
      toast.success(
        !enabled
          ? "Certificate is now available to students!"
          : "Certificate has been disabled."
      );
    } catch (err: any) {
      console.error("Error updating certificate status:", err);
      toast.error("Failed to update certificate status.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hide the panel completely for faculty users
  if (isFaculty) {
    return null;
  }

  // If user is student and certificate is not enabled, hide panel completely
  if (!isAdmin && !enabled) {
    return null;
  }

  return (
    <>
      <div 
        style={{ borderRadius: "12px 225px 12px 255px / 255px 12px 225px 12px" }}
        className="w-full bg-card border-2 border-border p-5 shadow-hard-sm wobbly-border"
      >
        {isAdmin ? (
          <div className="flex flex-col gap-3 font-heading">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <h3 className="text-lg font-bold text-foreground">
                Certificate Status
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-bold">
              Control if students can generate completion certificates for this subject.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div 
                className={`px-3 py-1 text-xs font-bold border-2 rounded-md ${
                  enabled 
                    ? "bg-success/15 border-success text-success" 
                    : "bg-muted border-border text-muted-foreground"
                }`}
                style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              >
                {enabled ? "Available" : "Not Available"}
              </div>
              <button
                disabled={isLoading}
                onClick={handleToggle}
                style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
                className={`ml-auto font-bold text-xs px-4 py-2 border-2 shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 ${
                  enabled
                    ? "bg-[#C94A4A] text-white border-border hover:bg-[#B33E3E]"
                    : "bg-yellow-500 text-[#2d2d2d] border-border hover:bg-yellow-400"
                }`}
              >
                {isLoading 
                  ? "Saving..." 
                  : enabled 
                    ? "Disable Certificate" 
                    : "Make certificate available"
                }
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 font-heading">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-sketch-bounce">🎓</span>
              <h3 className="text-lg font-bold text-foreground">
                Course Certificate
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">
              Congratulations! You have completed all content. Your verified completion certificate is ready.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 text-[#2d2d2d] font-bold py-2.5 px-4 border-2 border-border shadow-hard-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm"
            >
              Get the certificate 🎓
            </button>
          </div>
        )}
      </div>

      {/* Modal for Certificate Preview & Download */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-[1200px] bg-card border-4 border-border rounded-2xl p-4 shadow-hard-lg flex flex-col items-center max-h-[95vh] overflow-hidden">
            {/* Modal Header Controls */}
            <div className="w-full flex justify-between items-center mb-4 px-2">
              <h4 className="font-heading font-black text-lg text-foreground flex items-center gap-2">
                <span>🏆</span> Verified Certificate Preview
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center border-2 border-border font-bold shadow-hard-sm rounded-lg hover:scale-105 active:scale-95 bg-[#C94A4A] text-white transition-all cursor-pointer text-sm"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Certificate Wrapper */}
            <div className="w-full overflow-auto flex-1 min-h-0 py-2 border-2 border-dashed border-border rounded-xl bg-background/50 flex justify-start lg:justify-center">
              <div className="min-w-[1140px] px-4 flex justify-center items-start py-6">
                <Certificate ref={certRef} studentName={studentName} courseName={courseName} />
              </div>
            </div>
            
            {/* Note & Download Box */}
            <div 
              style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
              className="w-full mt-4 p-4 bg-muted border-2 border-border flex flex-col sm:flex-row items-center justify-between gap-4 font-heading"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <p className="text-xs text-foreground font-bold leading-relaxed">
                  <strong>Note:</strong> For best results, download as a high-fidelity vector landscape PDF document.
                </p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
                  className="bg-[#C94A4A] hover:bg-[#B33E3E] text-white font-bold py-2.5 px-5 border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-sm shrink-0"
                >
                  Close ❌
                </button>
                <button
                  onClick={() => certRef.current?.downloadPDF()}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-[#2d2d2d] font-bold py-2.5 px-6 border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-sm shrink-0"
                >
                  <svg className="w-4 h-4 animate-sketch-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
