import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddCourseSheet from "@/components/AddCourseSheet";
import TopicCard from "@/components/TopicCard";
import DeleteCourseButton from "@/components/DeleteCourseButton";
import { addTopic } from "./actions";
import { whenText } from "@/lib/domain/states";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; error?: string }>;
}) {
  const { c, error } = await searchParams;
  const supabase = await createClient();

  const { data: coursesData } = await supabase.from("courses").select("id,name").order("created_at");
  const courses = coursesData ?? [];
  const index = Math.max(0, courses.findIndex((x) => x.id === c));
  const selected = courses[index];

  const topics = selected
    ? (
        await supabase
          .from("topics")
          .select("id,name,parent_topic_id,understanding_level,next_review_at")
          .eq("course_id", selected.id)
          .order("sort_order")
          .order("created_at")
      ).data ?? []
    : [];

  const explained = topics.filter((t) => t.understanding_level !== null).length;
  const color = `var(--s${(index % 5) + 1})`;
  const initials = selected ? selected.name.trim().slice(0, 3).toUpperCase() : "";

  if (!selected) {
    return (
      <>
        <h1>Library</h1>
        {error && <p className="err" role="alert">{error}</p>}
        <div className="box" style={{ textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>No courses yet</h2>
          <p className="mute">Add a course and paste its outline. Sabiwela turns it into topics.</p>
          <AddCourseSheet variant="button" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ctabs">
        {courses.map((course, i) => (
          <Link
            key={course.id}
            href={`/library?c=${course.id}`}
            className={`ctab${course.id === selected.id ? " on" : ""}`}
            style={{ ["--c" as string]: `var(--s${(i % 5) + 1})` }}
            aria-current={course.id === selected.id ? "page" : undefined}
          >
            <div className="ti">{course.name.trim().slice(0, 3).toUpperCase()}</div>
            {course.name.length > 11 ? `${course.name.slice(0, 10)}…` : course.name}
          </Link>
        ))}
        <AddCourseSheet variant="tab" />
      </div>

      {error && <p className="err" role="alert">{error}</p>}

      <div className="chd" style={{ ["--c" as string]: color }}>
        <div>
          <small>{topics.length} topics</small>
          <h1 style={{ margin: "6px 0 4px" }}>{selected.name}</h1>
          <div className="mute">{explained} of {topics.length} explained</div>
          <DeleteCourseButton id={selected.id} />
        </div>
        <div className="mono" aria-hidden="true">{initials}</div>
      </div>

      <div className="pth">
        {topics.map((t, i) => (
          <div key={t.id}>
            {i > 0 && <div className="cn" />}
            <TopicCard
              id={t.id}
              name={t.name}
              level={t.understanding_level}
              nextText={whenText(t.next_review_at)}
              indent={!!t.parent_topic_id}
            />
          </div>
        ))}
        <form action={addTopic} className="row" style={{ marginTop: 18, flexWrap: "nowrap" }}>
          <input type="hidden" name="courseId" value={selected.id} />
          <input name="name" placeholder="Add a topic" required maxLength={120} aria-label="New topic name" />
          <button className="btn sm">Add</button>
        </form>
      </div>
    </>
  );
}
