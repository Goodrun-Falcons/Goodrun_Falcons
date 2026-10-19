import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    return NextResponse.json(
      { error: "No security questions are set up for this account." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    question1: org.security_question_1,
    question2: org.security_question_2,
  });
}
