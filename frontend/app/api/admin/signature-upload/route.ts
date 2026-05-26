import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in form data." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to public/admin-signature.png
    const publicDirPath = path.join(process.cwd(), "public");
    const filePath = path.join(publicDirPath, "admin-signature.png");

    // Ensure directory exists (just in case)
    await fs.mkdir(publicDirPath, { recursive: true });

    // Write file directly (overwrites if already exists)
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/admin-signature.png?t=${Date.now()}`,
    });
  } catch (error: any) {
    console.error("Signature upload API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error occurred." },
      { status: 500 }
    );
  }
}
