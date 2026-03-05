import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
    const { filename } = await params;

    // In production, Next.js blocks runtime additions to the public folder.
    // This dynamic route intercepts 404s for /uploads/* and streams the raw file from the disk directly.
    const filePath = join(process.cwd(), "public", "uploads", filename);

    if (!existsSync(filePath)) {
        return new NextResponse("Not found", { status: 404 });
    }

    try {
        const file = await readFile(filePath);

        let contentType = "image/jpeg";
        if (filename.endsWith(".png")) contentType = "image/png";
        else if (filename.endsWith(".gif")) contentType = "image/gif";
        else if (filename.endsWith(".webp")) contentType = "image/webp";

        return new NextResponse(file, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (e) {
        return new NextResponse("Error reading file", { status: 500 });
    }
}
