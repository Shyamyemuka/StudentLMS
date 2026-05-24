import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeFilename } from "@/lib/utils/filename";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get resource details (with debug info)
  const { data: resource, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", resourceId)
    .single();

  if (error) {
    console.error("Resource fetch error:", error);
    return NextResponse.json({ 
      error: "Resource not found", 
      debug: { resourceId, errorMessage: error.message } 
    }, { status: 404 });
  }

  if (!resource) {
    return NextResponse.json({ 
      error: "Resource not found", 
      debug: { resourceId, message: "No resource returned" } 
    }, { status: 404 });
  }

  // If external URL, redirect
  if (resource.source === "external" && resource.external_url) {
    return NextResponse.redirect(resource.external_url);
  }

  // If uploaded file, get signed URL
  if (resource.source === "upload" && resource.storage_path) {
    // Extract bucket and path from storage_path (format: bucket/path/to/file)
    const pathParts = resource.storage_path.split("/");
    const bucket = pathParts[0];
    const filePath = pathParts.slice(1).join("/");

    console.log("Generating signed URL:", { bucket, filePath, fullPath: resource.storage_path });

    // Generate signed URL without download parameter to allow in-browser viewing
    // The browser will display PDFs inline and use the title for download filename if user chooses to download
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry, no download parameter

    if (signedUrlError || !signedUrlData) {
      console.error("Signed URL error:", signedUrlError);
      return NextResponse.json(
        { 
          error: "Failed to generate download URL",
          debug: { bucket, filePath, signedUrlError: signedUrlError?.message }
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  }

  return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
}
