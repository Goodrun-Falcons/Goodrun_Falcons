"use client";

import { SECURITY_QUESTIONS } from "@/lib/securityQuestions";

export const CUSTOM_QUESTION = "__custom__";

const fieldClass =
  "w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]";

/** The question text that will actually be stored: the typed one when "write my own" is picked. */
export function resolveQuestion(selected: string, custom: string) {
  return selected === CUSTOM_QUESTION ? custom.trim() : selected;
}

type Props = {
  id: string;
  label: string;
  selected: string;
  onSelectedChange: (value: string) => void;
  customQuestion: string;
  onCustomQuestionChange: (value: string) => void;
  answer: string;
  onAnswerChange: (value: string) => void;
  /** The other field's resolved question, so it can't be picked twice. */
  otherQuestion: string;
};

export function SecurityQuestionField({
  id,
  label,
  selected,
  onSelectedChange,
  customQuestion,
  onCustomQuestionChange,
  answer,
  onAnswerChange,
  otherQuestion,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`${id}-select`} className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
        {label}
      </label>
      <select
        id={`${id}-select`}
        required
        value={selected}
        onChange={(e) => onSelectedChange(e.target.value)}
        className={fieldClass}
      >
        <option value="" disabled>
          Select a question
        </option>
        <option value={CUSTOM_QUESTION}>Write my own question…</option>
        {SECURITY_QUESTIONS.map((q) => (
          <option key={q} value={q} disabled={q === otherQuestion}>
            {q}
          </option>
        ))}
      </select>
      {selected === CUSTOM_QUESTION && (
        <input
          id={`${id}-custom`}
          type="text"
          required
          maxLength={200}
          value={customQuestion}
          onChange={(e) => onCustomQuestionChange(e.target.value)}
          placeholder="Type your own question"
          className={fieldClass}
        />
      )}
      <input
        id={`${id}-answer`}
        type="text"
        required
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Your answer"
        className={fieldClass}
      />
    </div>
  );
}
