"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const back = (path: string, key: "error" | "message", msg: string) =>
  redirect(`${path}?${key}=${encodeURIComponent(msg)}`);

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(formData.get("email")),
    password: text(formData.get("password")),
  });
  if (error) back("/login", "error", error.message);
  redirect("/home");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: text(formData.get("email")),
    password: text(formData.get("password")),
    options: { data: { display_name: text(formData.get("name")) } },
  });
  if (error) back("/signup", "error", error.message);
  if (!data.session) back("/login", "message", "Check your email to confirm your account, then log in.");
  redirect("/home");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
