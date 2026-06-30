"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import type { DashboardKpiCard } from "@/server/services/dashboard";

export function DashboardKpiCards({ cards }: { cards: DashboardKpiCard[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeCard = cards.find((card) => card.key === activeKey);

  return (
    <>
      <section className="grid four">
        {cards.map((card) => (
          <button className="panel kpi kpi-button" key={card.key} type="button" onClick={() => setActiveKey(card.key)}>
            <span className="muted">{card.label}</span>
            <strong>{card.value}</strong>
            <span className="kpi-hint">상세 보기</span>
          </button>
        ))}
      </section>

      {activeCard ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveKey(null)}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="dashboard-kpi-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2 id="dashboard-kpi-title">{activeCard.detailTitle}</h2>
                <p className="muted">{activeCard.label} {activeCard.value}건의 상세 내역입니다.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setActiveKey(null)} aria-label="팝업 닫기">
                <X size={20} />
              </button>
            </header>

            <div className="modal-actions">
              <Link className="button" href={activeCard.managementHref} onClick={() => setActiveKey(null)}>
                {activeCard.managementLabel}
              </Link>
            </div>

            {activeCard.rows.length === 0 ? (
              <div className="empty">{activeCard.emptyMessage}</div>
            ) : (
              <div className="table-wrap modal-table">
                <table>
                  <tbody>
                    {activeCard.rows.map((row) => (
                      <tr key={`${row.href}-${row.title}-${row.meta}`}>
                        <td>
                          <Link href={row.href} onClick={() => setActiveKey(null)}>{row.title}</Link>
                          <div className="muted">{row.meta}</div>
                        </td>
                        <td>{row.badge ? <StatusBadge label={row.badge} value={row.status} /> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
