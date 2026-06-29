---
name: ai-output-auditor
description: Audit AI-generated text for factual reliability before it ships. Verifies each claim against provided source material and against any sources the text itself cites, flags unsupported / contradicted / misattributed claims, checks that citations actually back what they're attached to, and returns a Ship / Fix-first / Don't-ship verdict with a ranked fix list. Use whenever someone wants to fact-check, verify, audit, proofread for accuracy, or quality-check an AI-written answer, article, summary, report, or research brief — especially before publishing — or asks things like "is this accurate?", "is this hallucinating?", "are the citations real?", or "is this safe to publish?". Reach for this skill even when the user doesn't say the word "audit", as long as they want to know whether AI-produced text can be trusted.
---

# AI Output Auditor

Audit a piece of AI-generated text for factual reliability and citation integrity, then deliver a clear publish decision. The job is not to rewrite the text — it is to tell the user, claim by claim, what is trustworthy, what is not, and what to fix.

## Inputs

The user provides:
1. **The text to audit** — an AI-written answer, article, summary, report, etc.
2. **Source material** (optional but strongly preferred) — pasted text, attached files, or both, that the text is supposed to be based on.

The text may also contain its own **inline citations** (URLs or named sources).

## How to gather sources (do this automatically — never make the user pick a "mode")

Use every source available, in this order, and combine them:

1. **Provided sources first.** Treat pasted text / attached files as the primary ground truth.
2. **Cited links second.** If the text cites URLs *and* a web-fetch tool is available in this environment, fetch each cited page and use it as a source too. If web access is unavailable, do not fail — note it and treat those citations as "unverifiable (no access)".
3. **Nothing available?** If a claim has no provided source and no reachable citation, do **not** guess from background knowledge. Mark it `Unverifiable` and move on. Background knowledge can inform a *flag* ("this contradicts widely known facts") but never counts as verification.

State at the top of the report which sources you actually had.

## Workflow

1. **Extract claims.** Break the text into discrete, checkable factual claims — statistics, dates, names, quotes, causal statements, definitive assertions. Skip pure opinion, framing, and obvious filler. Aim for the meaningful claims, not every sentence.
2. **Classify materiality.** Tag each claim `High` / `Medium` / `Low` risk. High = anything where being wrong causes real harm: statistics, quotes, named-person attributions, legal/medical/financial/safety specifics, anything load-bearing for the conclusion.
3. **Verify each claim** against the available sources and assign a status (taxonomy below).
4. **Check each citation** separately (labels below) — a claim can be true while its citation is misattributed.
5. **Decide the verdict** using the rules below.
6. **Write the report** using the exact template below.

## Claim status taxonomy

- **Supported** — a source clearly states this.
- **Partially supported** — a source backs part of it, but it's overstated, missing a qualifier, or stretched.
- **Unsupported** — no available source states it (and a source reasonably should).
- **Contradicted** — a source says the opposite, or a number/date/name doesn't match.
- **Unverifiable** — no source available to check against (not provided, not cited, or citation unreachable).

## Citation check labels

For each citation the text makes:
- **Backs the claim** — the cited source actually says what it's attached to.
- **Weak** — the source is related but doesn't really establish the claim.
- **Misattributed** — the source does not support the claim it's cited for (a serious problem even if the claim is independently true).
- **Broken / unreachable** — the link is dead or couldn't be accessed.
- **No citation** — a claim that needs a source has none.

## Verdict rules

Pick the worst applicable verdict:

- **Don't ship** if there is *any*: Contradicted claim, Misattributed citation on a High-risk claim, or High-risk claim that is Unsupported.
- **Fix first** if there is any: Unsupported or Partially supported High/Medium claim, Unverifiable High-risk claim, Weak/Broken citation on a High/Medium claim — but nothing in the "Don't ship" set.
- **Ship** only if every High and Medium claim is Supported and its citations back it. (Low-risk Unverifiable items may remain; note them.)

Never output "Ship" as a guarantee of truth — frame it as "no reliability problems found against the available sources."

## Report structure

ALWAYS use this exact template:

```
# AI Output Audit

**Verdict:** <Ship / Fix first / Don't ship> — <one-line reason>
**Sources used:** <what you actually checked against, e.g. "1 provided document; 2 of 3 cited links fetched; 1 link unreachable">

## Claim-by-claim
| # | Claim (short) | Risk | Status | Evidence / gap |
|---|---------------|------|--------|----------------|
| 1 | ...           | High | Supported | "<short source quote or pointer>" |
| 2 | ...           | High | Contradicted | source says X, text says Y |

## Citation check
| Cited source | Used to support | Result |
|--------------|-----------------|--------|
| ...          | claim #2        | Misattributed — source is about Z, not the claim |

## Fix list (ranked by risk)
1. **[Cut or correct]** claim #2 — <what's wrong and the smallest fix>.
2. ...

## Notes
<anything the user should know: missing sources, assumptions, what couldn't be checked>
```

## Principles

- **Be specific, not vague.** "Claim 3 is unsupported because none of the provided sources mention the 40% figure" beats "some claims may need checking."
- **Quote sparingly and exactly.** When citing evidence, use a short exact snippet or a precise pointer, not a paraphrase that could drift.
- **Separate truth from sourcing.** A claim can be correct in reality yet Unsupported/Misattributed here — say so plainly; the user is deciding whether the *text as written* is defensible.
- **Don't rewrite unless asked.** The deliverable is the audit + fix list. Offer to apply fixes only after presenting it.
- **When sources are thin, say so loudly** in the Verdict and Notes rather than quietly downgrading rigor.
