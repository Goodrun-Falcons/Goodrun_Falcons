import * as argon2 from "argon2";


// normalise answers consistently before hashing or verification.
function normaliseAnswer(answer: string): string {
  return answer
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// hash a security question answer before storing it.
export async function hashSecurityAnswer(answer: string,): Promise<string> {
  const normalised = normaliseAnswer(answer);

  if (!normalised) {
    throw new Error("Security answer must not be empty");
  }

  return argon2.hash(normalised, {
    type: argon2.argon2id,
    memoryCost: 19 * 1024,
    timeCost: 2,
    parallelism: 1,
  });
}

// check whether a submitted answer matches the stored hash.
export async function verifySecurityAnswer(
  answer: string,
  storedHash: string,
): Promise<boolean> {
  const normalised = normaliseAnswer(answer);

  if (!normalised || !storedHash) {
    return false;
  }

  return argon2.verify(storedHash, normalised);
}