# Harbor Moderator Decision Rubric
### Version 0.1

**Classification:** Internal — not for public distribution
**Owner:** Policy / Trust & Safety
**References:** TAXONOMY.md, NOTICE_TEMPLATE.md, COMMUNITY_GUIDELINES.md, ANTI_DRIFT_CONSTITUTION.md §5

---

## Purpose

This rubric ensures every moderation decision is:

- **Consistent** — two moderators reviewing the same case reach the same outcome
- **Specific** — every action maps to a reason code and a guideline section
- **Proportionate** — least restrictive action that addresses the harm
- **Auditable** — decisions are explainable and reproducible

This rubric does not replace judgment. It structures it.

---

## Core Principles

**Enforcement is not ranking.** Content can be less visible because it isn't relevant to a user's intent. That is a ranking decision. Enforcement is a policy decision. Never conflate them. If you're unsure which applies, it is almost certainly ranking — enforcement requires a specific guideline violation.

**Least restrictive action.** Start at the bottom of the ladder. Move up only when the lower action is insufficient to prevent harm. Document why.

**Protect first, punish second.** In harassment and pile-on cases, the first action is to protect the target — thread controls, limiting distribution of the inciting post. Account action against the actor follows.

**No action without a code.** If the behavior cannot be matched to a reason code in the taxonomy, it is either not a violation or requires a new code via RFC. Do not action under "Other" or vague catch-alls.

**Document everything.** Fill every field. Sparse records fail appeals, fail audits, and fail the user.

---

## Universal Decision Checklist

Work through every step for every case, in order.

### Step 1 — Identify the object

- What is it? (post / reply / profile / link share / group post / messaging behavior)
- Where is it? (public / group / direct — note: DM content only via user report with explicit consent)
- Is there a specific target? (individual person / group / no target)
- Who reported it, and how? (user report / automated signal / moderator review / trusted reporter)

### Step 2 — Determine the policy section

Pick one primary section. If multiple apply, pick the one that best describes the core harm.

| Section | Slug |
|---|---|
| Harassment | `guidelines#harassment` |
| Hate and hateful conduct | `guidelines#hate` |
| Spam and inauthentic behavior | `guidelines#spam` |
| Graphic content | `guidelines#graphic-content` |
| Sexual content and nudity | `guidelines#sexual-content` |
| Illegal content | `guidelines#illegal-content` |
| Scams, fraud, and phishing | `guidelines#scams` |
| Misleading content | `guidelines#misleading-content` |
| Privacy | `guidelines#privacy` |
| Self-harm | `guidelines#self-harm` |
| Child safety | `guidelines#child-safety` |
| Manipulation | `guidelines#manipulation` |
| Minimum age | `guidelines#minimum-age` |

If nothing fits: **stop**. Do not action. Escalate to policy for review or RFC.

### Step 3 — Select reason code(s)

- Choose the **most specific** code from TAXONOMY.md
- Primary code: one
- Secondary codes: up to two
- If multiple codes apply, the highest-severity code is primary
- If no specific code fits: **stop and escalate**

### Step 4 — Assign severity

Use the taxonomy defaults as a starting point. Adjust up (never down) when:

- The behavior is part of a coordinated pattern
- There is a specific, identifiable target who is being harmed
- The actor has prior enforcement history
- The content has already spread significantly and the harm is ongoing

| Severity | Meaning |
|---|---|
| `LOW` | Borderline; limited harm; context-dependent |
| `MED` | Clear violation; contained harm |
| `HIGH` | Targeted harm; exploitation; coordinated behavior; repeat pattern |
| `CRITICAL` | Minors; credible violence; CSAM; NCII; trafficking; high-risk health misinformation |

### Step 5 — Select action

Start at the lowest ladder level that addresses the harm. Move up only with documented justification.

**Content-level ladder:**

| Level | Action | Use when |
|---|---|---|
| 1 | `label` | Harm is informational; context reduces it; violation is borderline |
| 2 | `interstitial` | Content is harmful but has legitimate value; viewer consent matters |
| 3 | `limit_distribution` | Content is harmful but removal is disproportionate; or target protection requires limiting spread |
| 4 | `remove` | Content has no legitimate value given the violation; or harm is severe/ongoing |

**Account-level ladder:**

| Level | Action | Use when |
|---|---|---|
| 5 | `feature_limit` | Pattern of behavior using a specific feature; targeted restriction is sufficient |
| 6 | `suspend` | Repeated violations; evasion; coordinated behavior; severity warrants cooling-off |
| 7 | `ban` | Severe violations; CRITICAL categories; repeated post-suspension violations; clear bad-faith actor |

**Minimum floors by severity:**

| Severity | Content minimum | Account action |
|---|---|---|
| `LOW` | `label` | Not required |
| `MED` | `limit_distribution` | Not required unless pattern |
| `HIGH` | `remove` | `feature_limit` minimum; escalate to `suspend` if pattern |
| `CRITICAL` | `remove` immediately | Refer for account review same session |

### Step 6 — Issue the notice

Every reach-limiting or account action requires a notice. Use the NOTICE_TEMPLATE.md structure.

Required before closing the case:

- [ ] `plain_summary` written using taxonomy wording as base
- [ ] `affected_excerpt` populated (or marked unsafe to show)
- [ ] `action_taken` text is specific — duration stated, surfaces listed
- [ ] Trigger explanation written (the "show your work" field)
- [ ] `can_repost` and `repost_instructions` set if applicable
- [ ] `appeal_deadline` set (30 days)
- [ ] Ranking vs. enforcement statement included
- [ ] Zero-tolerance special handling applied if required (see NOTICE_TEMPLATE.md)

---

## Section-Specific Rubrics

### A. Harassment (`guidelines#harassment`)

**Primary question:** Is this content or behavior targeting a specific person to intimidate, demean, or harm them?

**Pile-on assessment — evaluate all four:**
1. Is there an identifiable individual target?
2. Is the hostility density high (insults, slurs, threats — not just disagreement)?
3. Is there a velocity spike (many hostile replies in a short window)?
4. Is there evidence of coordination (cross-posting, "go here" calls, account patterns)?

Any two of four → investigate as pile-on. All four → `HARASSMENT_PILEON_COORDINATED`.

**Action sequence for pile-ons:**
1. First: protect target — thread controls, limit distribution of inciting content
2. Second: remove inciting content if still spreading
3. Third: account action against coordinator(s)
4. Do not mass-action all repliers without individual review

**Judgment calls:**

| Scenario | Guidance |
|---|---|
| Heated disagreement that escalated | Look for a specific target + intent to harm. Disagreement alone is not harassment. |
| Public figure receiving criticism | High threshold — public figures accept scrutiny. Threats and doxxing still apply. |
| Group criticism ("everyone in X is…") | Evaluate as `HATE_*` if it targets a protected characteristic, not `HARASSMENT_*`. |
| Satire that targets a person | Satire is not harassment unless it includes threats, doxxing, or sexualized targeting. |

---

### B. Hate and hateful conduct (`guidelines#hate`)

**Primary question:** Does this content attack or dehumanize people based on a protected characteristic?

**Protected characteristics:** race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, caste.

**Key distinctions:**

| This is hate | This is not hate |
|---|---|
| "People of [group] are subhuman" | "I disagree with [group]'s beliefs" |
| Using a slur to attack a group | Discussing slurs in an educational context |
| Calling for exclusion based on who someone is | Criticizing a policy or institution |
| Dehumanizing imagery with no other context | Documentary or counter-speech use of hateful content |

**Context matters for symbols and imagery.** A hate symbol used in a counter-speech documentary is not the same as one used to promote a movement. When in doubt, escalate.

---

### C. Spam and inauthentic behavior (`guidelines#spam`)

**Primary question:** Is this coordinated, automated, or designed to pollute the information environment?

**Signals that indicate spam/inauthentic behavior:**
- Account creation date relative to activity burst
- Posting identical or near-identical content across multiple surfaces
- Engagement patterns inconsistent with organic behavior (reply-to-follower ratios, etc.)
- Link behavior (redirects, cloaking, known bad domains)
- Network patterns (multiple accounts acting in close temporal coordination)

**DM spam:** Harbor cannot read DM content. Enforcement is via:
- Rate limit triggers (automated infrastructure)
- User reports where the reporter attaches content voluntarily
- Account-level patterns (high DM volume, low follow ratio, new account)

Do not action DM behavior based on content alone without a user report that includes explicit consent to review the content.

---

### D. Graphic content (`guidelines#graphic-content`)

**Primary question:** Is this real-world violence or gore that is gratuitous — serving no informational or documentary purpose?

**Documentary exception checklist:**
- [ ] Is there a clearly identifiable news or documentary context?
- [ ] Is the source credible (established news organization, known journalist, first-hand witness)?
- [ ] Does the content inform rather than glorify?

All three → apply `GRAPHIC_DOCUMENTARY` (label + interstitial + limit distribution, not removal).
Any missing → treat as gratuitous.

**Rule:** Never recommend graphic content in discovery surfaces regardless of label status.

---

### E. Sexual content and nudity (`guidelines#sexual-content`)

**Primary question:** Is this pornographic, sexually gratifying, or exposing a 13+ audience to sexual material?

**Nudity decision tree:**

```
Is the nudity sexual in nature or context?
  Yes → SEXUAL_NUDITY_SEXUAL (remove or limit)
  No  → Is there a clear educational/medical/documentary/artistic context?
          Yes → SEXUAL_NUDITY_NONSEXUAL (label + limit distribution)
          No  → Treat as SEXUAL_NUDITY_SEXUAL
```

**Zero-tolerance cases — act immediately:**
- Any sexual content involving a minor → `CHILD_CSAM` + `ILLEGAL_CSAM`, remove + ban + report
- Non-consensual intimate imagery → `SEXUAL_NCII` + `PRIVACY_NCII`, remove + ban
- Sexual deepfakes → `SEXUAL_DEEPFAKE`, remove + ban

Do not delay on zero-tolerance cases for additional review. Remove first, then document.

---

### F. Illegal content (`guidelines#illegal-content`)

**Primary question:** Is this content illegal regardless of context?

**Procedure for CRITICAL illegal content:**
1. Remove immediately — do not wait for senior review to remove
2. Do not copy, quote, or include in the notice record
3. Preserve evidence securely per legal process requirements — do not delete
4. Escalate to senior review and legal within 1 hour
5. Do not disclose law enforcement referral in the user notice

**Judgment on borderline illegal content** (weapons, drugs, illegal services):
- Evaluate legality in the user's likely jurisdiction
- Evaluate whether the content facilitates the illegal activity vs. discusses it
- Discussion, journalism, and harm reduction content are not violations
- When in doubt, escalate

---

### G. Misleading content (`guidelines#misleading-content`)

**Primary question:** Is this deliberate deception with a plausible path to real-world harm?

**Default approach — prefer context over removal:**

| Content type | Default action |
|---|---|
| Unverified claim, no clear harm | No action or label if high-reach |
| Satire not clearly labeled | Require label; escalate if refused |
| Deceptive edit, low harm risk | `label` + sharing friction |
| Impersonation | `remove` + account action |
| Deepfake presented as authentic | `label` + `limit_distribution`; escalate to `remove` if harm risk is high |
| Health misinformation with credible physical harm risk | `remove` or strong `limit_distribution` + `CRITICAL` review |

**"We label, we don't silence" — with limits:** This is the default, not an absolute promise. When deception creates meaningful risk of physical harm, removal is appropriate and required.

---

### H. Manipulation (`guidelines#manipulation`)

**Primary question:** Is this a coordinated campaign to distort what people see or experience on Harbor?

**Distinguishing manipulation from organic disagreement:**

| Manipulation | Not manipulation |
|---|---|
| Multiple accounts acting in close temporal coordination with identical messaging | Many users independently sharing the same view |
| Mass-reporting a specific target without individual genuine belief of violation | Individual users reporting content they genuinely find harmful |
| Attempting to trigger arousal detection against a specific account | Content that organically generates strong reactions |

**Approach:** Investigate networks, not individual posts. A single post that looks like manipulation may be organic. A network of 20 accounts posting near-identically in a 10-minute window is not.

---

## Prior History Guidelines

Prior enforcement history affects action selection but does not override the ladder. Use history to:

- Move one level up the account-action ladder for repeat violations of the same section
- Treat evasion attempts (new accounts after ban) as `CRITICAL` regardless of the underlying violation's original severity
- Flag accounts with 3+ enforcement actions in 30 days for senior review

Do not use prior history to:
- Action borderline content that would otherwise not be a violation
- Justify skipping notice requirements
- Increase severity beyond `CRITICAL` (there is no severity above CRITICAL)

---

## Escalation Triggers

Escalate to senior review (do not close the case) when:

- The behavior involves a minor in any capacity
- The case involves credible threats of violence against a named person
- The violation involves law enforcement referral (CSAM, trafficking, facilitation of serious violence)
- The action would be the user's third suspension in 90 days (permanent ban consideration)
- The reporter is a public official, journalist, or known advocacy organization (not special treatment — just flagged)
- The content is going viral while under review (harm is time-sensitive)
- Metrics conflict: the content seems harmful but no reason code cleanly applies

---

## Appeals Rubric

### When to overturn

Overturn the original action when:

- The reason code was applied to the wrong content (wrong target, misread context)
- An automated system produced a confirmed false positive
- The user provides context that was not available at the time that changes the violation assessment
- The action was disproportionate to the severity (use modify, not full overturn, in this case)

### When to uphold

Uphold when:

- The evidence clearly supports the reason code
- The user's appeal argues about the rule itself rather than whether their content violated it
- New context provided does not change the violation assessment

### When to modify

Modify (partial overturn) when:

- The violation is confirmed but the action was too severe
- A suspension duration was excessive relative to history and severity
- A distribution limit was overly broad (e.g., should have been one post, not account-wide)

### Appeal outcome requirements

Every appeal decision must include:

- Outcome: Upheld / Overturned / Modified
- Specific reason (not a form letter)
- If upheld: what the user can do differently
- If overturned: what was restored and an acknowledgment that we got it wrong
- If modified: what changed and why the original action was partially correct

Log outcome in `moderation_appeals.status` and issue an `appeal_outcome` notice per NOTICE_TEMPLATE.md.

---

## Consistency and Audit

### Calibration

Moderation teams conduct calibration sessions on a sample of cases monthly. Each session:
- Presents 10–15 cases with outcomes hidden
- Each moderator independently selects policy section, reason code, severity, and action
- Results are compared and disagreements discussed
- Systematic disagreement on a code or section triggers a policy clarification or RFC

### Audit flags

The following trigger automatic audit review:

- Appeal overturn rate for any section exceeds 15% in a 30-day window
- A moderator's overturn rate exceeds the team average by more than 10 percentage points
- Zero-tolerance case not escalated within the required window
- Integrity exception (delayed notice) outstanding beyond 72 hours without documented approval
- Any `ban` action without a documented senior review

### Separation of concerns

The same person must not:
- Both investigate and decide on a `suspend` or `ban` action against the same account
- Both moderate content and decide on the appeal of that moderation action

Appeals are always reviewed by someone other than the original moderator.
