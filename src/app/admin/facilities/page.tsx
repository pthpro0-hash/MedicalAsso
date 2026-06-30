import Link from "next/link";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createFacilityAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { facilityStatusLabels } from "@/server/constants";
import { FacilityForm } from "@/components/entity-forms";
import { ActionModal } from "@/components/action-modal";

export default async function FacilitiesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const facilities = await prisma.facility.findMany({
    where: {
      AND: [
        params.q ? { OR: [{ name: { contains: params.q } }, { address: { contains: params.q } }, { facilityType: { contains: params.q } }] } : {},
        params.status ? { status: params.status } : {}
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <>
      <PageHeader
        title="요양원 관리"
        description="추천 요청 시설과 계약 상태를 관리합니다."
        actions={
          <ActionModal triggerLabel="요양원 등록" title="요양원 신규 등록" description="추천 요청과 계약 관리에 사용할 요양원 정보를 입력합니다." disabled={user.role === "READ_ONLY"}>
            <FacilityForm action={createFacilityAction} disabled={user.role === "READ_ONLY"} />
          </ActionModal>
        }
      />
      {user.role === "READ_ONLY" ? <div className="notice">READ_ONLY 계정은 요양원 정보를 생성하거나 수정할 수 없습니다.</div> : null}
      <section className="panel">
        <h2>검색/필터</h2>
        <form className="toolbar">
          <input name="q" placeholder="시설명, 주소, 유형" defaultValue={params.q ?? ""} />
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">상태 전체</option>
            {Object.entries(facilityStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="button secondary" type="submit">검색</button>
        </form>
      </section>
      <section style={{ marginTop: 16 }} className="table-wrap">
        <table>
          <thead><tr><th>시설명</th><th>유형</th><th>주소</th><th>정원/현원</th><th>담당자</th><th>연락처</th><th>상태</th><th>수정일</th></tr></thead>
          <tbody>{facilities.map((facility) => (
            <tr key={facility.id}>
              <td><Link href={`/admin/facilities/${facility.id}`}>{facility.name}</Link></td>
              <td>{facility.facilityType ?? "-"}</td>
              <td>{facility.address}</td>
              <td>{facility.capacity ?? "-"}/{facility.currentResidents ?? "-"}</td>
              <td>{facility.managerName ?? "-"}</td>
              <td>{facility.phone}</td>
              <td><StatusBadge label={facilityStatusLabels[facility.status]} value={facility.status} /></td>
              <td>{formatDate(facility.updatedAt)}</td>
            </tr>
          ))}</tbody>
        </table>
        {facilities.length === 0 ? <div className="empty">등록된 요양원이 없습니다.</div> : null}
      </section>
    </>
  );
}
