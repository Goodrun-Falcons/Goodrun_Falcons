import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { email, questionIndex, answer, newPassword } = await request.json();

  if (
    !email ||
    typeof email !== "string" ||
    (questionIndex !== 1 && questionIndex !== 2) ||
    !answer ||
    typeof answer !== "string" ||
    !newPassword ||
    typeof newPassword !== "string"
  ) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const { data: org } = await supabaseAdmin
    .from("organisations")
    .select("id, security_answer_1_hash, security_answer_2_hash")
    .ilike("email", email.trim())
    .maybeSingle();

  const storedHash = questionIndex === 1 ? org?.security_answer_1_hash : org?.security_answer_2_hash;

  if (!org || !storedHash) {
    return NextResponse.json({ error: "That answer doesn't match our records." }, { status: 400 });
  }

  const isMatch = bcrypt.compareSync(answer.trim().toLowerCase(), storedHash);
  if (!isMatch) {
    return NextResponse.json({ error: "That answer doesn't match our records." }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(org.id, {
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
