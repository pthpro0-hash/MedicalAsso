import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Building2, ClipboardList, FileText, Settings, Stethoscope, UserCog, MessageSquareWarning } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { logoutAction } from "@/server/actions";
import { roleLabels } from "@/server/constants";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: BarChart3 },
  { href: "/admin/doctors", label: "촉탁의사 관리", icon: Stethoscope },
  { href: "/admin/facilities", label: "요양원 관리", icon: Building2 },
  { href: "/admin/requests", label: "추천 요청 관리", icon: ClipboardList },
  { href: "/admin/assignments", label: "지정/계약 현황", icon: UserCog },
  { href: "/admin/complaints", label: "민원·재추천", icon: MessageSquareWarning },
  { href: "/admin/documents", label: "문서함", icon: FileText },
  { href: "/admin/settings/users", label: "설정", icon: Settings }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">촉탁의 추천관리 시스템</div>
        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Icon size={18} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>
        <header className="topbar">
          <div>
            <strong>{user.name}</strong>
            <span className="muted"> · {roleLabels[user.role] ?? user.role}</span>
          </div>
          <form action={logoutAction}>
            <button className="button secondary" type="submit">
              로그아웃
            </button>
          </form>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
