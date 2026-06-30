import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

type LetterData = {
  facilityName: string;
  requestedAt: Date;
  candidates: Array<{
    name: string;
    specialty: string;
    medicalInstitutionName: string;
    phone: string;
  }>;
  associationName: string;
  managerName: string;
};

export function getUploadDir() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");
}

export function buildRecommendationLetterText(data: LetterData, today = new Date()) {
  const candidateLines = data.candidates
    .map((doctor, index) => `${index + 1}. ${doctor.name} / ${doctor.specialty} / ${doctor.medicalInstitutionName} / ${doctor.phone}`)
    .join("\n");

  return [
    `수신: ${data.facilityName}`,
    "제목: 촉탁의사 추천의 건",
    "",
    `추천 요청일: ${formatDate(data.requestedAt)}`,
    "",
    "귀 시설의 촉탁의사 추천 요청에 따라 아래와 같이 촉탁의사 후보자를 추천합니다.",
    "",
    candidateLines,
    "",
    "추천 후보 중 최종 지정 결과를 지역의사협의회로 회신하여 주시기 바랍니다.",
    "",
    `추천일: ${formatDate(today)}`,
    `지역의사협의회: ${data.associationName}`,
    `담당자: ${data.managerName}`
  ].join("\n");
}

export async function createRecommendationPdf(data: LetterData, fileName: string) {
  const uploadDir = getUploadDir();
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const fontPath = "C:\\Windows\\Fonts\\malgun.ttf";
  if (fs.existsSync(fontPath)) {
    doc.font(fontPath);
  }

  doc.fontSize(18).text("촉탁의사 추천의 건", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(11).text(buildRecommendationLetterText(data), { lineGap: 8 });
  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const stat = await fs.promises.stat(filePath);
  return { filePath, size: stat.size };
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}
