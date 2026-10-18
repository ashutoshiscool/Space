import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".php",
  ".phtml",
  ".py",
  ".pl",
  ".cgi",
  ".jar",
  ".vbs",
  ".js",
]);

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 15MB maximum limit" },
        { status: 400 }
      );
    }

    const originalName = file.name || "attachment";
    const ext = path.extname(originalName).toLowerCase();

    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "Executable or potentially harmful file extensions are not permitted" },
        { status: 400 }
      );
    }

    const sanitizedBase = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);

    const uniqueId = crypto.randomUUID();
    const safeFilename = `${uniqueId}-${sanitizedBase}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, safeFilename);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeFilename}`;

    return NextResponse.json({
      url: fileUrl,
      fileName: originalName,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
