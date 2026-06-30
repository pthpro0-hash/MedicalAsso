import Link from "next/link";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createRecommendationRequestAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { requestStatusLabels, requestTypeLabels } from "@/server/constants";
import { ActionModal } from "@/components/action-modal";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const [requests, facilities] = await Promise.all([
    prisma.recommendationRequest.findMany({
      where: {
        AND: [
          params.status ? { status: params.status } : {},
          params.q ? { OR: [{ facility: { name: { contains: params.q } } }, { requestedSpecialty: { contains: params.q } }, { reason: { contains: params.q } }] } : {}
        ]
      },
      include: { facility: true, creator: true },
      orderBy: { requestedAt: "desc" }
    }),
    prisma.facility.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <>
      <PageHeader
        title="추천 요청 관리"
        description="요양원의 촉탁의 추천 요청을 접수하고 상태별로 관리합니다."
        actions={
          <ActionModal triggerLabel="추천 요청 등록" title="추천 요청 등록" description="요양원의 촉탁의 추천 요청을 접수합니다." disabled={user.role === "READ_ONLY"}>
            <form action={createRecommendationRequestAction} className="form-grid">
              <div className="field"><label>요양원</label><select name="facilityId" required>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></div>
              <div className="field"><label>요청 유형</label><select name="requestType" defaultValue="NEW">{Object.entries(requestTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="field"><label>요청일</label><input name="requestedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
              <div className="field"><label>희망 전문과목</label><input name="requestedSpecialty" /></div>
              <div className="field"><label>희망 요일</label><input name="preferredDays" placeholder="월,수" /></div>
              <div className="field full"><label>요청 사유</label><textarea name="reason" required /></div>
              <div className="field full"><label>메모</label><textarea name="memo" /></div>
              <div className="field full"><button className="button" disabled={user.role === "READ_ONLY"} type="submit">추천 요청 등록</button></div>
            </form>
          </ActionModal>
        }
      />
      {user.role === "READ_ONLY" ? <div className="notice">READ_ONLY 계정은 추천 요청을 생성하거나 상태를 변경할 수 없습니다.</div> : null}
      <section className="panel">
        <h2>검색/필터</h2>
        <form className="toolbar">
          <input name="q" placeholder="요양원, 전문과목, 사유" defaultValue={params.q ?? ""} />
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">상태 전체</option>
            {Object.entries(requestStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="button secondary" type="submit">검색</button>
        </form>
      </section>
      <section style={{ marginTop: 16 }} className="table-wrap">
        <table>
          <thead><tr><th>요청일</th><th>요양원</th><th>유형</th><th>희망 전문과목</th><th>상태</th><th>담당자</th><th>수정일</th></tr></thead>
          <tbody>{requests.map((request) => (
            <tr key={request.id}>
              <td>{formatDate(request.requestedAt)}</td>
              <td><Link href={`/admin/requests/${request.id}`}>{request.facility.name}</Link></td>
              <td>{requestTypeLabels[request.requestType]}</td>
              <td>{request.requestedSpecialty ?? "-"}</td>
              <td><StatusBadge label={requestStatusLabels[request.status]} value={request.status} /></td>
              <td>{request.creator.name}</td>
              <td>{formatDate(request.updatedAt)}</td>
            </tr>
          ))}</tbody>
        </table>
        {requests.length === 0 ? <div className="empty">등록된 추천 요청이 없습니다.</div> : null}
      </section>
    </>
  );
}
