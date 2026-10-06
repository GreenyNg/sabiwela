import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StudyPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const supabase = await createClient();
  const { data: topic } = await supabase.from("topics").select("name").eq("id", topicId).maybeSingle();
  return (
    <>
      <h1>{topic?.name ?? "Topic not found"}</h1>
      <p className="mute">The study timer and explain step are coming next.</p>
      <Link href="/library" className="btn ghost">Back to Library</Link>
    </>
  );
}
