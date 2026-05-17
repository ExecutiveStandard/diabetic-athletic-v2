// Phase 1 stub. Pretends to submit, resolves after ~600ms so the
// spinner state in the OptInGate has time to feel real.
//
// Phase 2 will replace this function's body with a real POST to
// /api/subscribe (a Cloudflare Worker function that calls Bento's
// API server-side). The function signature stays the same — the
// OptInGate component does not need to change.
export async function submitOptIn({ firstName, email, calcSlug }) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { ok: true }
}
