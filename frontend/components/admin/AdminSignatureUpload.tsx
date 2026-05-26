"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { toast } from "sonner";
import { Upload, FileImage, RefreshCw } from "lucide-react";

export default function AdminSignatureUpload() {
  const [signatureExists, setSignatureExists] = useState<boolean>(false);
  const [imgUrl, setImgUrl] = useState<string>("/admin-signature.png");
  const [checking, setChecking] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkSignature = async (): Promise<void> => {
    try {
      const res = await fetch("/admin-signature.png", { method: "HEAD", cache: "no-store" });
      if (res.ok) {
        setSignatureExists(true);
        setImgUrl(`/admin-signature.png?t=${Date.now()}`);
      } else {
        setSignatureExists(false);
      }
    } catch (err) {
      setSignatureExists(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkSignature();
  }, []);

  const handleButtonClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate type (must be image)
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, etc.).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading("Uploading signature...");

    try {
      const res = await fetch("/api/admin/signature-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      toast.success("Signature uploaded successfully!");
      setSignatureExists(true);
      setImgUrl(`/admin-signature.png?t=${Date.now()}`);
    } catch (error: any) {
      console.error("Signature upload failed:", error);
      toast.error(error?.message || "Failed to upload signature.");
    } finally {
      setUploading(false);
      toast.dismiss(toastId);
      // Reset input value so same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold animate-pulse">
        <RefreshCw className="size-4 animate-spin text-primary" />
        <span>Checking signature...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-muted/30 border border-border/40 p-2 px-3 rounded-xl shadow-hard-sm">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {signatureExists ? (
        <div className="flex items-center gap-3">
          {/* Signature Preview */}
          <div 
            style={{ borderRadius: "6px 12px 6px 12px / 12px 6px 12px 6px" }}
            className="h-10 bg-white border border-border flex items-center justify-center p-1 px-3 shadow-inner overflow-hidden max-w-[120px]"
          >
            <img
              src={imgUrl}
              alt="Admin Signature"
              className="max-h-full object-contain filter"
              onError={() => setSignatureExists(false)}
            />
          </div>
          <button
            onClick={handleButtonClick}
            disabled={uploading}
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileImage className="size-3.5" />
            {uploading ? "Uploading..." : "Change Signature"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleButtonClick}
          disabled={uploading}
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {uploading ? "Uploading..." : "Upload Signature"}
        </button>
      )}
    </div>
  );
}
