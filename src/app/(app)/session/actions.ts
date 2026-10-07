"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHouseLLM } from "@/lib/ai/registry";
import { AIError } from "@/lib/ai/types";
import { assessmentSchema } from "@/lib/ai/schemas";
import { ASSESS_SYSTEM, ASSESS_VERSION, assessPrompt } from "@/lib/ai/prompts/assessExplanation";
import { nextReviewDate } from "@/lib/domain/scheduling";
import { awardPoints } from "@/lib/domain/points";
import { updateStreak, dayString, type StreakState } from "@/lib/domain/streak";
import { stateForScore } from "@/lib/domain/states";
import type { AssessState } from "@/lib/types";

const input = z.object({
  topicId: z.string().uuid(),
  text: z.string().trim().max(8000, "That is too long. Please shorten it.").refine((t) => t.split(/\s+/).filter(Boolean).length >= 8, "Please write at least a sentence or two (8 words or more)."),
  studySeconds: z.coerce.number().int().min(0).max(86400).catch(0),
  explainSeconds: z.coerce.number().int().min(0).max(7200).catch(0),
  mode: z.enum(["voice", "text"]).catch("text"),
});

export async function assessExplanation(_prev: AssessState, formData: FormData): Promise<AssessState> {
  const parsed = input.safeParse({
    topicId: formData.get("topicId"),
    text: formData.get("text"),
    studySeconds: formData.get("studySeconds"),
    explainSeconds: formData.get("explainSeconds"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your explanation." };
  const { topicId, text, studySeconds, explainSeconds, mode } = parsed.data;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("id,name,expected_concepts,understanding_level,review_count,first_studied_at,courses(name)")
    .eq("id", topicId)
    .maybeSingle();
  if (!topic) return { error: "That topic could not be found." };
  const courseRel = Array.isArray(topic.courses) ? topic.courses[0] : topic.courses;
  const courseName: string = courseRel?.name ?? "";

  const { data: prevRows } = await supabase
    .from("ai_assessments")
    .select("score,missing_concepts,explanations!inner(topic_id)")
    .eq("explanations.topic_id", topicId)
    .order("created_at", { ascending: false })
    .limit(2);
  const previous = ((prevRows ?? []) as { score: number; missing_concepts: string[] }[]).map((p) => ({
    score: p.score,
    missing: p.missing_concepts ?? [],
  }));

  // 1) Ask the AI. If this fails the learner's text is kept in the form.
  const llm = getHouseLLM();
  let result;
  try {
    result = await llm.generateJson({
      system: ASSESS_SYSTEM,
      prompt: assessPrompt({
        course: courseName,
        topic: topic.name,
        concepts: Array.isArray(topic.expected_concepts) ? topic.expected_concepts : [],
        transcript: text,
        previous,
      }),
      schema: assessmentSchema,
    });
  } catch (e) {
    console.error("Assessment failed:", e instanceof Error ? e.message : e);
    if (e instanceof AIError && e.code === "rate_limited")
      return { error: "The AI is busy right now (free quota). Wait a minute and submit again. Your text is kept." };
    if (e instanceof AIError && e.code === "not_configured") return { error: "AI is not configured on the server." };
    return { error: "The AI could not assess this just now. Your text is kept. Please try again." };
  }

  // 2) Deterministic app logic: score, review date, points, streak.
  const now = new Date();
  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  const reviewCount: number = topic.review_count ?? 0;
  const isReview = reviewCount > 0;
  const next = nextReviewDate(score, now);
  const today = dayString(now);
  const admin = createAdminClient();

  const { data: events } = await admin
    .from("point_events")
    .select("kp,created_at")
    .eq("user_id", userId)
    .gte("created_at", new Date(now.getTime() - 36 * 3600 * 1000).toISOString());
  const earnedToday = (events ?? [])
    .filter((ev) => dayString(new Date(ev.created_at)) === today)
    .reduce((sum, ev) => sum + ev.kp, 0);
  const kp = awardPoints({ score, isReview, previousScore: topic.understanding_level, earnedToday });

  // 3) Save everything.
  const { data: session } = await supabase
    .from("study_sessions")
    .insert({
      topic_id: topicId,
      started_at: new Date(now.getTime() - studySeconds * 1000).toISOString(),
      ended_at: now.toISOString(),
      duration_seconds: studySeconds,
    })
    .select("id")
    .single();

  const { data: explanation, error: expError } = await supabase
    .from("explanations")
    .insert({
      topic_id: topicId,
      study_session_id: session?.id ?? null,
      kind: isReview ? "review" : "initial",
      input_mode: mode,
      transcript: text,
      duration_seconds: explainSeconds,
    })
    .select("id")
    .single();
  if (expError || !explanation) return { error: "Could not save your explanation. Please try again." };

  const { data: assessment, error: asError } = await admin
    .from("ai_assessments")
    .insert({
      user_id: userId,
      explanation_id: explanation.id,
      score,
      strengths: result.strengths ?? [],
      missing_concepts: result.missing ?? [],
      misconceptions: result.misconceptions ?? [],
      feedback: result.feedback,
      revisit: result.revisit,
      followups: result.followups ?? [],
      next_review_at: next.toISOString(),
      provider: llm.id,
      model: process.env.GEMINI_MODEL ?? null,
      prompt_version: ASSESS_VERSION,
      raw_json: result,
    })
    .select("id")
    .single();
  if (asError || !assessment) {
    console.error("Saving assessment failed:", asError?.message);
    return { error: "Could not save the assessment. Please try again." };
  }

  await supabase
    .from("topics")
    .update({
      understanding_level: score,
      status: stateForScore(score),
      first_studied_at: topic.first_studied_at ?? now.toISOString(),
      last_studied_at: now.toISOString(),
      next_review_at: next.toISOString(),
      review_count: reviewCount + 1,
    })
    .eq("id", topicId);

  await admin.from("point_events").insert({
    user_id: userId,
    assessment_id: assessment.id,
    kp,
    reason: isReview ? "review" : "first_explanation",
  });

  const { data: stats } = await admin.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  const streak = updateStreak(
    {
      streak_current: stats?.streak_current ?? 0,
      streak_best: stats?.streak_best ?? 0,
      freezes_left: stats?.freezes_left ?? 2,
      freeze_month: stats?.freeze_month ?? null,
      last_active_date: stats?.last_active_date ?? null,
    } satisfies StreakState,
    today
  );
  await admin.from("user_stats").upsert({
    user_id: userId,
    kp_total: (stats?.kp_total ?? 0) + kp,
    ...streak,
  });

  revalidatePath("/library");
  revalidatePath("/home");
  redirect(`/session/${topicId}/feedback/${assessment.id}`);
}
