import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudyTimer from "@/components/StudyTimer";
import { generateConcepts } from "@/app/(app)/library/actions";

export default async function StudyPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("name,expected_concepts,courses(name)")
    .eq("id", topicId)
    .maybeSingle();
  if (!topic) notFound();
  const courseRel = Array.isArray(topic.courses) ? topic.courses[0] : topic.courses;
  const concepts: string[] = Array.isArray(topic.expected_concepts) ? topic.expected_concepts : [];
  return (
    <>
      <div className="mute">{courseRel?.name}</div>
      <h1>{topic.name}</h1>
      <StudyTimer topicId={topicId} />
      {concepts.length > 0 ? (
        <details className="box">
          <summary>Peek at the key concepts (optional)</summary>
          <ul>{concepts.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </details>
      ) : (
        <form action={generateConcepts} className="box">
          <input type="hidden" name="id" value={topicId} />
          <p className="mute">No key concepts yet. They help the AI judge your explanation more accurately.</p>
          <button className="btn ghost sm">Generate key concepts</button>
        </form>
      )}
    </>
  );
}