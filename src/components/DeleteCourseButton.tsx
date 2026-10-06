"use client";
import { deleteCourse } from "@/app/(app)/library/actions";

export default function DeleteCourseButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCourse}
      onSubmit={(e) => {
        if (!confirm("Delete this course and all its topics? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn ghost sm" style={{ marginTop: 10 }}>Delete course</button>
    </form>
  );
}
