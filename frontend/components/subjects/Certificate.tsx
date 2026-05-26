"use client";

import React, { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface CertificateProps {
  studentName: string;
  courseName: string;
}

export default function Certificate({ studentName, courseName }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Format date beautifully: e.g. "May 26, 2026"
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
    setFormattedDate(new Date().toLocaleDateString("en-US", options));
    setTimestamp(Date.now());
  }, []);

  const downloadPDF = async (): Promise<void> => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#fdfbf7",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1123, 794],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 1123, 794);
      
      const safeName = studentName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      pdf.save(`${safeName}_certificate.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center py-6 font-sans">
      {/* Google Fonts Pre-fetch */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;600&family=Outfit:wght@300;400;600&display=swap"
        rel="stylesheet"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .wobbly-border-outer {
            border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
            box-shadow: 8px 8px 0px 0px #2d2d2d;
        }
        
        .wobbly-border-inner {
            border-radius: 15px 225px 15px 255px / 255px 15px 225px 15px;
        }

        .dot-grid {
            background-color: #fdfbf7;
            background-image: radial-gradient(#d1cfc9 1px, transparent 1px);
            background-size: 24px 24px;
        }

        .wobbly-underline {
            position: relative;
        }
        .wobbly-underline::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: #2d2d2d;
            border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
            transform: rotate(-1deg);
        }

        .cert-font-serif {
            font-family: 'Playfair Display', serif;
        }
        .cert-font-cursive {
            font-family: 'Dancing Script', cursive;
        }
        .cert-font-tech {
            font-family: 'Space Grotesk', sans-serif;
        }
        .cert-font-sans {
            font-family: 'Outfit', sans-serif;
        }
      `}} />

      {/* Controls */}
      <div className="mb-8 flex gap-4 no-print">
        <button
          onClick={downloadPDF}
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          className="bg-yellow-500 hover:bg-yellow-400 text-[#2d2d2d] font-bold py-3 px-6 border-4 border-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all font-tech text-lg flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5 animate-sketch-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Download Certificate
        </button>
      </div>

      {/* CERTIFICATE START */}
      <div
        id="certificate-wrapper"
        ref={certificateRef}
        className="relative bg-paper dot-grid p-4 wobbly-border-outer border-[4px] border-ink overflow-hidden group select-none text-ink flex flex-col justify-between"
        style={{ width: "1123px", height: "794px", color: "#2d2d2d", borderColor: "#2d2d2d" }}
      >
        
        {/* Inner Gold Border (Offset for sketchy look) */}
        <div className="absolute inset-4 border-[3px] border-yellow-500 border-dashed wobbly-border-inner opacity-70 pointer-events-none"></div>
        <div className="absolute inset-5 border-[2px] border-yellow-500 wobbly-border-outer pointer-events-none"></div>

        {/* Main Content Container */}
        <div className="relative w-full h-full flex flex-col justify-between p-12 z-10 flex-1">
            
          {/* Header section (Logo & ID) */}
          <div className="flex justify-between items-start">
            {/* Logo Block */}
            <div className="flex items-center gap-3">
              <div 
                className="w-16 h-16 bg-[#2d2d2d] text-yellow-500 flex items-center justify-center rounded-[10px_20px_10px_20px/20px_10px_20px_10px] transform -rotate-2 border-2 border-[#2d2d2d]"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"></path>
                </svg>
              </div>
              <div>
                <h2 className="cert-font-tech font-bold text-xl text-ink tracking-wide leading-tight">Student LMS</h2>
                <p className="cert-font-cursive text-md text-muted -mt-1 opacity-70">Knowledge Archive</p>
              </div>
            </div>

            {/* Certificate ID */}
            <div className="text-right">
              <p className="cert-font-tech text-xs text-muted uppercase tracking-widest opacity-80">Certificate ID</p>
              <p className="cert-font-tech text-sm text-ink font-bold border-b-2 border-ink border-dashed pb-0.5">
                #LMS-{new Date().getFullYear()}-{timestamp.toString(16).toUpperCase().substring(4, 9)}
              </p>
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center flex flex-col items-center transform rotate-[-0.5deg]">
            <h1 className="cert-font-serif text-7xl font-bold text-ink tracking-widest uppercase mb-2">Certificate</h1>
            <h3 className="cert-font-serif text-2xl text-yellow-600 tracking-[0.4em] uppercase italic font-semibold">Of Completion</h3>
          </div>

          {/* Body Section */}
          <div className="text-center flex flex-col items-center z-10 relative">
            <p className="cert-font-sans text-xl text-muted-foreground mb-4 uppercase tracking-wider font-light">This is proudly presented to</p>
            
            {/* Student Name */}
            <h2 className="cert-font-cursive text-7xl text-ink my-4 px-12 py-2 transform rotate-[-1deg] font-bold text-yellow-600">
              {studentName}
            </h2>
            
            <p className="cert-font-sans text-lg text-muted-foreground mb-6 w-2/3 mx-auto leading-relaxed font-medium">
              has successfully completed all requirements, assignments, and assessments for the course:
            </p>
            
            {/* Course Name */}
            <h3 className="cert-font-serif text-3xl font-bold text-ink wobbly-underline inline-block pb-2 px-6">
              {courseName}
            </h3>
          </div>

          {/* Footer Section (Date, Seal, Signature) */}
          <div className="flex justify-between items-end mt-4 px-8 w-full">
            
            {/* Date */}
            <div className="text-center w-48 flex flex-col items-center">
              <p className="cert-font-cursive text-3xl text-ink mb-1 transform rotate-[-2deg] font-semibold">{formattedDate}</p>
              <div className="h-0.5 w-full bg-[#2d2d2d] rounded-full mb-2"></div>
              <p className="cert-font-tech text-xs tracking-widest uppercase text-muted-foreground font-bold">Date of Issue</p>
            </div>

            {/* Hand-drawn Gold Seal/Badge */}
            <div className="relative flex justify-center items-center -mb-4 shrink-0">
              <svg className="w-32 h-32 text-yellow-500 absolute animate-[spin_30s_linear_infinite]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5 L55 20 L70 15 L65 30 L80 35 L70 45 L85 55 L70 60 L75 75 L60 70 L55 85 L50 70 L45 85 L40 70 L25 75 L30 60 L15 55 L30 45 L20 35 L35 30 L30 15 L45 20 Z" fill="currentColor" opacity="0.2"/>
                <path d="M50 10 L54 22 L66 18 L62 30 L74 34 L65 43 L77 52 L64 57 L68 69 L56 64 L53 76 L50 63 L47 76 L44 64 L32 69 L36 57 L23 52 L35 43 L26 34 L38 30 L34 18 L46 22 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
              </svg>
              <div className="cert-font-serif text-ink text-center z-10 transform rotate-[-3deg] bg-paper rounded-full w-16 h-16 flex items-center justify-center border-2 border-ink border-dashed">
                <span className="font-bold text-xs leading-tight">VERI<br/>FIED</span>
              </div>
            </div>

            {/* Signature */}
            <div className="text-center w-48 flex flex-col items-center">
              <div className="h-16 w-full flex items-end justify-center mb-1">
                <img
                  src={`/admin-signature.png?t=${timestamp}`}
                  alt="Authorized Signature"
                  className="max-h-16 max-w-[180px] object-contain filter"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Fallback to text signature if signature image is not found or fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallbackEl = document.getElementById("sig-fallback");
                    if (fallbackEl) fallbackEl.style.display = "block";
                  }}
                />
                <span
                  id="sig-fallback"
                  className="hidden cert-font-cursive text-5xl text-ink transform rotate-[-4deg] font-bold"
                >
                  Admin
                </span>
              </div>
              <div className="h-0.5 w-full bg-[#2d2d2d] rounded-full mb-2 opacity-50"></div>
              <p className="cert-font-tech text-xs tracking-widest uppercase text-muted-foreground font-bold">Authorized Signature</p>
            </div>

          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0">
            <svg className="w-96 h-96 text-ink" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
            </svg>
          </div>
        </div>
      </div>
      {/* CERTIFICATE END */}
    </div>
  );
}
