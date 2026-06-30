import "server-only";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import type { UserRole } from "@/server/services/workflow";

const cookieName = "association_admin_session";

function getSecret() {
  return process.env.SESSION_SECRET ?? "local-development-secret-change-before-production";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function encodeSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, issuedAt: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string | undefined) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId: string; issuedAt: number };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const store = await cookies();
  const session = decodeSession(store.get(cookieName)?.value);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });

  if (!user?.isActive) return null;
  return { ...user, role: user.role as UserRole };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive) return { ok: false, message: "이메일 또는 비밀번호를 확인하세요." };

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return { ok: false, message: "이메일 또는 비밀번호를 확인하세요." };

  const store = await cookies();
  store.set(cookieName, encodeSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return { ok: true, message: "" };
}

export async function signOut() {
  const store = await cookies();
  store.delete(cookieName);
}
