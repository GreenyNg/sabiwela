"use client";
import { useCallback, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addCourse } from "@/app/(app)/library/actions";
import ProgressSteps from "./ProgressSteps";

function SubmitArea({ onDone }: { onDone: () => void }) {
  const { pending } = useFormStatus();
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending) onDone();
    was.current = pending;
  }, [pending, onDone]);
  return pending ? (
    <ProgressSteps steps={["Reading your outline…", "Finding topics and subtopics…", "Listing key concepts…", "Almost done…"]} />
  ) : (
    <button className="btn block" style={{ marginTop: 14 }}>Add course</button>
  );
}

export default function AddCourseSheet({ variant }: { variant: "tab" | "button" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = () => ref.current?.showModal();
  const close = useCallback(() => ref.current?.close(), []);
  return (
    <>
      {variant === "tab" ? (
        <button type="button" className="ctab" style={{ ["--c" as string]: "var(--ac)" }} onClick={open}>
          <div className="ti" style={{ borderStyle: "dashed" }}>+</div>
          Add
        </button>
      ) : (
        <button type="button" className="btn" onClick={open}>Add a course</button>
      )}
      <dialog ref={ref} className="sheet" aria-label="Add a course">
        <div className="grab" />
        <div className="row sp">
          <h3 style={{ margin: 0 }}>Add a course</h3>
          <button type="button" className="btn ghost sm" onClick={close}>Close</button>
        </div>
        <form action={addCourse}>
          <label htmlFor="cname">Course name</label>
          <input id="cname" name="name" required maxLength={120} placeholder="e.g. CSC 201" />
          <label htmlFor="coutline">Outline (optional)</label>
          <textarea id="coutline" name="outline" rows={7} placeholder={"Paste your course outline. Numbered, bulleted or plain text all work."} />
          <p className="mute">If you add an outline, its text is sent to an AI service (Google Gemini) to find the topics. Don&apos;t paste anything private.</p>
          <SubmitArea onDone={close} />
        </form>
      </dialog>
    </>
  );
}
