"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { assessExplanation } from "@/app/(app)/session/actions";
import type { AssessState } from "@/lib/types";
import ProgressSteps from "./ProgressSteps";

function Submit() {
  const { pending } = useFormStatus();
  return pending ? (
    <ProgressSteps steps={["Reading your explanation…", "Comparing it with the topic…", "Looking for gaps…", "Writing your feedback…"]} />
  ) : (
    <button className="btn block" style={{ marginTop: 14 }}>Submit for assessment</button>
  );
}

export default function ExplainForm({ topicId, studySeconds }: { topicId: string; studySeconds: number }) {
  const [state, formAction] = useActionState<AssessState, FormData>(assessExplanation, {});
  const [text, setText] = useState("");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <form action={formAction}>
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="studySeconds" value={studySeconds} />
      <input type="hidden" name="explainSeconds" value={0} />
      <input type="hidden" name="mode" value="text" />
      <label htmlFor="exp">Your explanation</label>
      <textarea
        id="exp"
        name="text"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Explain it like you're teaching someone who has never learned it. No notes."
      />
      <p className="mute">{words} words</p>
      {words >= 8 && words < 40 && <p className="note">Short explanations are hard to assess. Add why it works and an example if you can.</p>}
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <p className="mute">Your explanation, the topic name and its key concepts are sent to an AI service (Google Gemini). Don&apos;t include private information.</p>
      <Submit />
    </form>
  );
}
