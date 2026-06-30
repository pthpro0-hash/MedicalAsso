import Link from "next/link";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/components/format";
import { documentTypeLabels } from "@/server/constants";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="문서함" description="생성된 추천서와 첨부 문서 메타데이터를 확인합니다." />
      <section className="table-wrap">
        <table>
          <thead><tr><th>생성일</th><th>유형</th><th>파일명</th><th>연결 대상</th><th>크기</th></tr></thead>
          <tbody>{documents.map((document) => (
            <tr key={document.id}>
              <td>{formatDate(document.createdAt)}</td>
              <td>{documentTypeLabels[document.type]}</td>
              <td><Link href={`/api/documents/${document.id}`}>{document.fileName}</Link></td>
              <td>{document.relatedEntityType} / {document.relatedEntityId}</td>
              <td>{document.size.toLocaleString()} bytes</td>
            </tr>
          ))}</tbody>
        </table>
        {documents.length === 0 ? <div className="empty">생성된 문서가 없습니다.</div> : null}
      </section>
    </>
  );
}
