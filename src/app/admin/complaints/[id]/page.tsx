import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createRerecommendationFromComplaintAction, updateComplaintStatusAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { complaintStatusLabels, complaintTypeLabels } from "@/server/constants";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { facility: true, doctor: true, assignment: true }
  });
  if (!complaint) notFound();
  const canWrite = user.role !== "READ_ONLY";
  return (
    <>
      <PageHeader title={complaint.title} description={`${complaint.facility.name} · ${formatDate(complaint.receivedAt)}`} />
      <div className="notice">이 화면은 촉탁의 추천·계약·소통 관련 행정 민원 관리를 위한 화면입니다. 환자 진료기록, 처방 내용, 민감한 건강정보는 입력하지 마세요.</div>
      <section className="grid two">
        <div className="panel">
          <h2>민원 정보</h2>
          <p><strong>유형</strong> {complaintTypeLabels[complaint.type]}</p>
          <p><strong>상태</strong> <StatusBadge label={complaintStatusLabels[complaint.status]} value={complaint.status} /></p>
          <p><strong>요양원</strong> {complaint.facility.name}</p>
          <p><strong>촉탁의사</strong> {complaint.doctor?.name ?? "-"}</p>
          <p><strong>내용</strong><br />{complaint.content}</p>
          <p><strong>메모</strong><br />{complaint.memo ?? "-"}</p>
        </div>
        <div className="panel">
          <h2>처리 상태 변경</h2>
          <form action={updateComplaintStatusAction} className="form-grid">
            <input type="hidden" name="id" value={complaint.id} />
            <div className="field full"><label>상태</label><select name="status" defaultValue={complaint.status}>{Object.entries(complaintStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="field full"><label>처리 메모</label><textarea name="memo" defaultValue={complaint.memo ?? ""} /></div>
            <div className="field full"><button className="button" disabled={!canWrite} type="submit">상태 저장</button></div>
          </form>
          <form action={createRerecommendationFromComplaintAction} className="toolbar">
            <input type="hidden" name="complaintId" value={complaint.id} />
            <button className="button secondary" disabled={!canWrite || complaint.status !== "RERECOMMENDATION_NEEDED"} type="submit">재추천 요청 생성</button>
          </form>
        </div>
      </section>
    </>
  );
}
