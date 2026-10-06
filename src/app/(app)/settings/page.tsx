import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export default async function Settings() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";
  return (
    <>
      <h1>Settings</h1>
      <div className="box">
        <b>Account</b>
        <p className="mute">{email ? `Signed in as ${email}` : "Signed in"}</p>
        <form action={logout}><button className="btn ghost">Log out</button></form>
      </div>
    </>
  );
}
