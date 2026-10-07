"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseOutline } from "@/lib/outline";
import { getHouseLLM } from "@/lib/ai/registry";
import { outlineSchema } from "@/lib/ai/schemas";
import { PARSE_OUTLINE_SYSTEM, parseOutlinePrompt } from "@/lib/ai/prompts/parseOutline";

const id = z.string().uuid();
const name = z.string().trim().min(1).max(120);
const fail = (msg: string): never => redirect(`/library?error=${encodeURIComponent(msg)}`);

type Item = { name: string; parent: number | null; concepts: string[] };

function fromSimpleParser(text: string): Item[] {
  const stack: { depth: number; index: number }[] = [];
  return parseOutline(text).map((it, i) => {
    while (stack.length && stack[stack.length - 1].depth >= it.depth) stack.pop();
    const parent = stack.length ? stack[stack.length - 1].index : null;
    stack.push({ depth: it.depth, index: i });
    return { name: it.name, parent, concepts: [] };
  });
}

export async function addCourse(formData: FormData) {
  const parsed = z
    .object({ name, outline: z.string().max(20000) })
    .safeParse({ name: formData.get("name"), outline: formData.get("outline") ?? "" });
  if (!parsed.success) return fail("Please enter a course name.");

  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .insert({ name: parsed.data.name })
    .select("id")
    .single();
  if (error || !course) return fail("Could not save the course. Please try again.");

  const outlineText = parsed.data.outline.trim();
  let items: Item[] = [];
  let note = "";

  if (outlineText) {
    try {
      const result = await getHouseLLM().generateJson({
        system: PARSE_OUTLINE_SYSTEM,
        prompt: parseOutlinePrompt(outlineText),
        schema: outlineSchema,
      });
      const firstIndex = new Map<string, number>();
      result.topics.forEach((t, i) => {
        const key = t.name.trim();
        if (!firstIndex.has(key)) firstIndex.set(key, i);
      });
      items = result.topics.map((t, i) => {
        const p = t.parent ? firstIndex.get(t.parent.trim()) : undefined;
        return {
          name: t.name.trim(),
          parent: p !== undefined && p < i ? p : null,
          concepts: (t.expected_concepts ?? []).map((c) => c.trim()).filter(Boolean),
        };
      });
    } catch (e) {
      console.error("Outline AI parse failed:", e instanceof Error ? e.message : e);
      items = fromSimpleParser(outlineText);
      note = "The AI was not available, so a simple parser read your outline. Check the topics below.";
    }
  }

  if (items.length) {
    const ids = items.map(() => crypto.randomUUID());
    const rows = items.map((it, i) => ({
      id: ids[i],
      course_id: course.id,
      parent_topic_id: it.parent !== null ? ids[it.parent] : null,
      name: it.name,
      sort_order: i,
      expected_concepts: it.concepts,
    }));
    const { error: topicError } = await supabase.from("topics").insert(rows);
    if (topicError) return fail("The course was saved, but its topics could not be.");
  }

  revalidatePath("/library");
  redirect(`/library?c=${course.id}${note ? `&note=${encodeURIComponent(note)}` : ""}`);
}

export async function addTopic(formData: FormData) {
  const c = id.safeParse(formData.get("courseId"));
  const n = name.safeParse(formData.get("name"));
  if (!c.success || !n.success) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("course_id", c.data);
  await supabase.from("topics").insert({ course_id: c.data, name: n.data, sort_order: count ?? 0 });
  revalidatePath("/library");
}

export async function renameTopic(formData: FormData) {
  const t = id.safeParse(formData.get("id"));
  const n = name.safeParse(formData.get("name"));
  if (!t.success || !n.success) return;
  const supabase = await createClient();
  await supabase.from("topics").update({ name: n.data }).eq("id", t.data);
  revalidatePath("/library");
}

export async function deleteTopic(formData: FormData) {
  const t = id.safeParse(formData.get("id"));
  if (!t.success) return;
  const supabase = await createClient();
  await supabase.from("topics").delete().eq("id", t.data);
  revalidatePath("/library");
}

export async function deleteCourse(formData: FormData) {
  const c = id.safeParse(formData.get("id"));
  if (!c.success) return;
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", c.data);
  revalidatePath("/library");
  redirect("/library");
}
