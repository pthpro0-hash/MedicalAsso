import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createUserAction, updateUserRoleAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { roleLabels } from "@/server/constants";
import { ActionModal } from "@/components/action-modal";

export default async function UsersSettingsPage() {
  const user = await requireUser();
  const [users, auditLogs] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 50 })
  ]);
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  return (
    <>
      <PageHeader
        title="설정"
        description="관리자 계정과 최근 작업 이력을 확인합니다."
        actions={
          <ActionModal triggerLabel="관리자 계정 생성" title="관리자 계정 생성" description="내부 관리자 계정과 권한을 등록합니다." disabled={!isSuperAdmin}>
            <form action={createUserAction} className="form-grid">
              <div className="field"><label>이름</label><input name="name" required /></div>
              <div className="field"><label>이메일</label><input name="email" type="email" required /></div>
              <div className="field"><label>비밀번호</label><input name="password" type="password" required /></div>
              <div className="field"><label>권한</label><select name="role">{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="field full"><button className="button" disabled={!isSuperAdmin} type="submit">계정 생성</button></div>
            </form>
          </ActionModal>
        }
      />
      {!isSuperAdmin ? <div className="notice">사용자 생성과 권한 변경은 SUPER_ADMIN만 가능합니다.</div> : null}
      <section className="panel">
        <h2>관리자 계정</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>이름</th><th>이메일</th><th>권한</th><th>활성</th><th>변경</th></tr></thead>
            <tbody>{users.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td><StatusBadge label={roleLabels[item.role]} value={item.role} /></td>
                <td>{item.isActive ? "활성" : "비활성"}</td>
                <td>
                  <form action={updateUserRoleAction} className="toolbar">
                    <input type="hidden" name="id" value={item.id} />
                    <select name="role" defaultValue={item.role}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                    <label><input name="isActive" type="checkbox" defaultChecked={item.isActive} /> 활성</label>
                    <button className="button secondary" disabled={!isSuperAdmin} type="submit">저장</button>
                  </form>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>최근 AuditLog</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>일시</th><th>사용자</th><th>작업</th><th>대상</th></tr></thead>
            <tbody>{auditLogs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.actor?.name ?? "-"}</td>
                <td>{log.action}</td>
                <td>{log.entityType} / {log.entityId}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
