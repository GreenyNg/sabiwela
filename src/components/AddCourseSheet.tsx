"use client";
import { useRef } from "react";
import { addCourse } from "@/app/(app)/library/actions";

export default function AddCourseSheet({ variant }: { variant: "tab" | "button" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = () => ref.current?.showModal();
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
          <button type="button" className="btn ghost sm" onClick={() => ref.current?.close()}>Close</button>
        </div>
        <form action={addCourse} onSubmit={() => ref.current?.close()}>
          <label htmlFor="cname">Course name</label>
          <input id="cname" name="name" required maxLength={120} placeholder="e.g. CSC 201" />
          <label htmlFor="coutline">Outline (optional)</label>
          <textarea id="coutline" name="outline" rows={7} placeholder={"1. Introduction to Algorithms\n  1.1 What is an algorithm?\n2. Data Structures"} />
          <button className="btn block" style={{ marginTop: 14 }}>Add course</button>
        </form>
      </dialog>
    </>
  );
}
