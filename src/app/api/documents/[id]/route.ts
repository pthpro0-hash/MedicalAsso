import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ message: "문서를 찾을 수 없습니다." }, { status: 404 });
  const file = await fs.readFile(document.filePath);
  return new NextResponse(file, {
    headers: {
      "content-type": document.mimeType,
      "content-disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`
    }
  });
}
