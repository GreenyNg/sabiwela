import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedbackPanel from "@/components/FeedbackPanel";
import { STATE_META, stateForScore, whenText } from "@/lib/domain/states";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ topicId: string; assessmentId: string }>;
}) {
  const { topicId, assessmentId } = await params;
  const supabase = await createClient();

  const { data: a } = await supabase
    .from("ai_assessments")
    .select("id,score,strengths,missing_concepts,misconceptions,feedback,revisit,followups,next_review_at,created_at")
    .eq("id", assessmentId)
    .maybeSingle();
  if (!a) notFound();

  const { data: topic } = await supabase.from("topics").select("name").eq("id", topicId).maybeSingle();
  const { data: prevRows } = await supabase
    .from("ai_assessments")
    .select("score,explanations!inner(topic_id)")
    .eq("explanations.topic_id", topicId)
    .lt("created_at", a.created_at)
    .order("created_at", { ascending: false })
    .limit(1);
  const prevScore: number | null = prevRows?.[0]?.score ?? null;
  const { data: ev } = await supabase.from("point_events").select("kp").eq("assessment_id", a.id).maybeSingle();

  const meta = STATE_META[stateForScore(a.score)];
  const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

  return (
    <>
      <div className="row" style={{ gap: 18, margin: "6px 0 14px", flexWrap: "nowrap" }}>
        <div className="ring" style={{ ["--p" as string]: a.score, ["--c" as string]: meta.color }}>
          <b>{a.score}</b>
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{meta.label}</h1>
          <div className="mute">{topic?.name}</div>
          <div className="mute">AI signal, not a grade</div>
        </div>
      </div>

      <p className="lead">{a.feedback}</p>

      {prevScore !== null && a.score > prevScore && (
        <div className="pn" style={{ ["--c" as string]: "var(--s3)" }}>
          <h3>Improvement</h3>
          <b>{prevScore}% → {a.score}%</b> since last time
        </div>
      )}
      <FeedbackPanel title="You got right" items={list(a.strengths)} color="var(--s3)" />
      <FeedbackPanel title="Missing" items={list(a.missing_concepts)} color="var(--s1)" />
      <FeedbackPanel title="Not quite right" items={list(a.misconceptions)} color="var(--s2)" />
      <div className="pn" style={{ ["--c" as string]: "var(--s4)" }}>
        <h3>Revisit</h3>
        {a.revisit}
      </div>
      <FeedbackPanel title="Try explaining" items={list(a.followups)} color="var(--s5)" />

      <div className="row sp box"><span>Next review</span><b>{whenText(a.next_review_at) || "—"}</b></div>
      <div className="row sp box"><span>Knowledge points</span><b>+{ev?.kp ?? 0}</b></div>
      <Link href="/library" className="btn block" style={{ textAlign: "center", textDecoration: "none" }}>Done</Link>
    </>
  );
}
