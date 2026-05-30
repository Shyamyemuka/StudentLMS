"use client";

import React, { useRef, useEffect, useState } from "react";

interface CertificateProps {
  studentName: string;
  courseName: string;
}

const Certificate = React.forwardRef<any, CertificateProps>(
  ({ studentName, courseName }, ref) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [timestamp] = useState<number>(Date.now());
    const [formattedDate, setFormattedDate] = useState<string>("");
    const [sigSrc, setSigSrc] = useState<string>("/admin-signature.png");
    const [sigError, setSigError] = useState<boolean>(false);

    useEffect(() => {
      const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
      setFormattedDate(new Date().toLocaleDateString("en-US", options));

      // Pre-load signature as base64 to avoid CORS issues during PDF export
      fetch("/admin-signature.png")
        .then((r) => {
          if (!r.ok) throw new Error("not found");
          return r.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => setSigSrc(reader.result as string);
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          setSigError(true);
        });
    }, []);

    React.useImperativeHandle(ref, () => ({
      downloadPDF,
    }));

    const downloadPDF = (): void => {
      if (!certificateRef.current) return;

      // Copy all parent document stylesheets (Tailwind, loaded Google Fonts, global styles)
      const parentStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
        .map(el => el.outerHTML)
        .join("\n");

      // Capture cert HTML — signature img will have base64 src if loaded,
      // or the relative path if still loading. Fix relative paths to absolute.
      let certHtml = certificateRef.current.outerHTML;
      const origin = window.location.origin;
      // Replace any relative src="/..." with absolute src="http://localhost:3000/..."
      certHtml = certHtml.replace(/src="(\/[^"]+)"/g, `src="${origin}$1"`);

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups for this site, then try again.");
        return;
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${studentName} - Certificate of Completion</title>
  ${parentStyles}
  <style>
    /* ── LANDSCAPE page — forces landscape orientation ── */
    @page { size: landscape; margin: 0 }

    @media print {
      html, body {
        width: 297mm !important;
        height: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #fdfbf7 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        overflow: hidden !important;
      }
      #certificate-wrapper {
        width: 297mm !important;
        height: 210mm !important;
        max-width: 297mm !important;
        max-height: 210mm !important;
        box-shadow: none !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        padding: 12mm !important;
      }
      /* Ensure text and SVGs scale down to print bounds */
      * {
        animation: none !important;
        transition: none !important;
      }
    }
  </style>
</head>
<body>
  ${certHtml}
  <script>
    document.fonts.ready.then(function() {
      setTimeout(function() { window.print(); }, 500);
    });
  </script>
</body>
</html>`);
      printWindow.document.close();
    };



    return (
      <div className="flex flex-col items-center py-6 font-sans">
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;600&family=Outfit:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

        <style dangerouslySetInnerHTML={{
          __html: `
          .wobbly-border-outer {
              border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
              box-shadow: 8px 8px 0px 0px #2d2d2d;
          }
          .wobbly-border-inner {
              border-radius: 15px 225px 15px 255px / 255px 15px 225px 15px;
          }
          .dot-grid {
              background-color: #fdfbf7 !important;
              background-image: radial-gradient(#d1cfc9 1.5px, transparent 1.5px) !important;
              background-size: 24px 24px !important;
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
              background-color: #2d2d2d !important;
              border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
              transform: rotate(-1deg);
          }
          .cert-font-serif { font-family: 'Playfair Display', serif; }
          .cert-font-cursive { font-family: 'Dancing Script', cursive; }
          .cert-font-tech { font-family: 'Space Grotesk', sans-serif; }
          .cert-font-sans { font-family: 'Outfit', sans-serif; }
          /* --- THEME-PROOF CONTRAST LOCKS --- */
          .cert-text-dark  { color: #2d2d2d !important; }
          .cert-text-muted { color: #7c7a72 !important; }
          .cert-text-gold  { color: #d97706 !important; }
          .cert-border-dark{ border-color: #2d2d2d !important; }
          .cert-bg-paper   { background-color: #fdfbf7 !important; }
        `}} />

        {/* CERTIFICATE */}
        <div
          id="certificate-wrapper"
          ref={certificateRef}
          className="relative cert-bg-paper dot-grid p-4 wobbly-border-outer border-[4px] cert-border-dark overflow-hidden select-none cert-text-dark flex flex-col justify-between"
          style={{ width: "1123px", height: "794px", color: "#2d2d2d", borderColor: "#2d2d2d" }}
        >
          {/* Inner Gold Border */}
          <div className="absolute inset-4 border-[3px] border-[#d97706] border-dashed wobbly-border-inner opacity-70 pointer-events-none"></div>
          <div className="absolute inset-5 border-[2px] border-[#d97706] wobbly-border-outer pointer-events-none"></div>

          {/* Main Content */}
          <div className="relative w-full h-full flex flex-col justify-between p-12 z-10 flex-1">

            {/* Header: Logo + Certificate ID */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-[#2d2d2d] flex items-center justify-center rounded-[10px_20px_10px_20px/20px_10px_20px_10px] transform -rotate-2 border-2 border-[#2d2d2d] overflow-hidden">
                  <img
                    src="/images/logo.png"
                    alt="Student LMS Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="cert-font-tech font-bold text-xl cert-text-dark tracking-wide leading-tight">Student LMS</h2>
                  <p className="cert-font-cursive text-md cert-text-muted -mt-1 opacity-70">Knowledge Archive</p>
                </div>
              </div>

              <div className="text-right">
                <p className="cert-font-tech text-xs cert-text-muted uppercase tracking-widest opacity-80">Certificate ID</p>
                <p className="cert-font-tech text-sm cert-text-dark font-bold border-b-2 cert-border-dark border-dashed pb-0.5">
                  #LMS-{new Date().getFullYear()}-{timestamp.toString(16).toUpperCase().substring(4, 9)}
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center flex flex-col items-center transform rotate-[-0.5deg]">
              <h1 className="cert-font-serif text-7xl font-bold cert-text-dark tracking-widest uppercase mb-2">Certificate</h1>
              <h3 className="cert-font-serif text-2xl cert-text-gold tracking-[0.4em] uppercase italic font-semibold">Of Completion</h3>
            </div>

            {/* Body */}
            <div className="text-center flex flex-col items-center z-10 relative">
              <p className="cert-font-sans text-xl cert-text-muted mb-4 uppercase tracking-wider font-light">This is proudly presented to</p>
              <h2 className="cert-font-cursive text-7xl cert-text-gold my-4 px-12 py-2 transform rotate-[-1deg] font-bold">
                {studentName}
              </h2>
              <p className="cert-font-sans text-lg cert-text-dark mb-6 w-2/3 mx-auto leading-relaxed font-medium">
                for successfully completing all requirements, assignments, and assessments for the course:
              </p>
              <h3 className="cert-font-serif text-3xl font-bold cert-text-dark wobbly-underline inline-block pb-2 px-6">
                {courseName}
              </h3>
            </div>

            {/* Footer: Date + Seal + Signature */}
            <div className="flex justify-between items-end mt-4 px-8 w-full">

              {/* Date */}
              <div className="text-center w-48 flex flex-col items-center">
                <p className="cert-font-cursive text-3xl cert-text-dark mb-1 transform rotate-[-2deg] font-semibold">{formattedDate}</p>
                <div className="h-0.5 w-full bg-[#2d2d2d] rounded-full mb-2"></div>
                <p className="cert-font-tech text-xs tracking-widest uppercase cert-text-muted font-bold">Date of Issue</p>
              </div>

              {/* Gold Seal */}
              <div className="relative flex justify-center items-center -mb-4 shrink-0">
                <svg className="w-32 h-32 text-[#d97706] absolute" viewBox="0 0 100 100" fill="none">
                  <path d="M50 5 L55 20 L70 15 L65 30 L80 35 L70 45 L85 55 L70 60 L75 75 L60 70 L55 85 L50 70 L45 85 L40 70 L25 75 L30 60 L15 55 L30 45 L20 35 L35 30 L30 15 L45 20 Z" fill="currentColor" opacity="0.2" />
                  <path d="M50 10 L54 22 L66 18 L62 30 L74 34 L65 43 L77 52 L64 57 L68 69 L56 64 L53 76 L50 63 L47 76 L44 64 L32 69 L36 57 L23 52 L35 43 L26 34 L38 30 L34 18 L46 22 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
                <div className="cert-font-serif cert-text-dark text-center z-10 transform rotate-[-3deg] cert-bg-paper rounded-full w-16 h-16 flex items-center justify-center border-2 cert-border-dark border-dashed">
                  <span className="font-bold text-xs leading-tight">VERI<br />FIED</span>
                </div>
              </div>

              {/* Signature */}
              <div className="text-center w-48 flex flex-col items-center">
                <div className="h-16 w-full flex items-end justify-center mb-1">
                  {!sigError ? (
                    <img
                      src={sigSrc}
                      alt="Authorized Signature"
                      className="max-h-16 max-w-[180px] object-contain"
                      onError={() => setSigError(true)}
                    />
                  ) : (
                    <span className="cert-font-cursive text-5xl cert-text-dark transform rotate-[-4deg] font-bold">
                      Admin
                    </span>
                  )}
                </div>
                <div className="h-0.5 w-full bg-[#2d2d2d] rounded-full mb-2 opacity-50"></div>
                <p className="cert-font-tech text-xs tracking-widest uppercase cert-text-muted font-bold">Authorized Signature</p>
              </div>

            </div>

            {/* Faint background watermark */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0">
              <svg className="w-96 h-96" style={{ color: "#2d2d2d" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>
        </div>


      </div>
    );
  }
);

Certificate.displayName = "Certificate";
export default Certificate;
