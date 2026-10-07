import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExplainForm from "@/components/ExplainForm";

export default async function ExplainPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { topicId } = await params;
  const { s } = await searchParams;
  const supabase = await createClient();
  const { data: topic } = await supabase.from("topics").select("name").eq("id", topicId).maybeSingle();
  if (!topic) notFound();
  const studySeconds = Math.max(0, Math.min(86400, Number(s) || 0));
  return (
    <>
      <h1>Now, sabi am. 🎙️</h1>
      <p className="lead">Teach <b>{topic.name}</b> to someone new. No notes.</p>
      <ExplainForm topicId={topicId} studySeconds={studySeconds} />
    </>
  );
}
