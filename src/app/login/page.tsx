import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <h1>촉탁의 추천관리 시스템</h1>
        <p className="muted">지역의사협의회 사무국 관리자 전용</p>
        <LoginForm />
      </section>
    </main>
  );
}
