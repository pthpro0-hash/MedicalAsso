"use client";

import { X } from "lucide-react";
import { useState } from "react";

export function ActionModal({
  triggerLabel,
  title,
  description,
  disabled,
  children
}: {
  triggerLabel: string;
  title: string;
  description?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button" disabled={disabled} type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="action-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2 id="action-modal-title">{title}</h2>
                {description ? <p className="muted">{description}</p> : null}
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="팝업 닫기">
                <X size={20} />
              </button>
            </header>
            {children}
          </section>
        </div>
      ) : null}
    </>
  );
}
