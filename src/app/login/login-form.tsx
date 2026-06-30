"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { message: "" });

  return (
    <form action={formAction} className="grid">
      <div className="field">
        <label htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue="admin@example.com" />
      </div>
      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required defaultValue="Admin123!" />
      </div>
      {state.message ? <div className="notice">{state.message}</div> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "로그인 중" : "로그인"}
      </button>
    </form>
  );
}
