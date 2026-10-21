import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SECURITY_QUESTIONS } from "@/lib/securityQuestions";

// Unknown emails get stable decoy questions so this endpoint cannot be used
// to discover which emails are registered; the reset itself then fails with
// the same generic "answer doesn't match" error as a wrong answer.
function decoyQuestions(email: string) {
  const digest = createHash("sha256").update(email.trim().toLowerCase()).digest();
  const first = digest[0] % SECURITY_QUESTIONS.length;
  const second = (first + 1 + (digest[1] % (SECURITY_QUESTIONS.length - 1))) % SECURITY_QUESTIONS.length;
  return { question1: SECURITY_QUESTIONS[first], question2: SECURITY_QUESTIONS[second] };
}

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { data: org } = await supabaseAdmin
    .from("organisations")
    .select("security_question_1, security_question_2, security_answer_1_hash, security_answer_2_hash")
    .ilike("email", email.trim())
    .maybeSingle();

  if (!org || !org.security_answer_1_hash || !org.security_answer_2_hash) {
    return NextResponse.json(decoyQuestions(email));
  }

  return NextResponse.json({
    question1: org.security_question_1,
    question2: org.security_question_2,
  });
}
