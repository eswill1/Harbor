# Harbor Reason Code RFC Template
### Version 0.1

**Classification:** Internal — not for public distribution
**Owner:** Policy / Trust & Safety / Engineering
**References:** TAXONOMY.md, MODERATOR_RUBRIC.md, ANTI_DRIFT_CONSTITUTION.md §6

---

## Purpose

This template governs how Harbor adds, modifies, or deprecates enforcement reason codes. It mirrors the Ranking RFC process (Constitution §6) and exists for the same reason: to prevent silent drift in how enforcement works.

Every reason code change is a policy change. It affects what notices users receive, how appeals are decided, what transparency reports show, and what auditors review. Changes must be deliberate, documented, and reviewed.

---

## When an RFC Is Required

An RFC is required for:

- Adding a new reason code to the taxonomy
- Changing the definition, default action, or severity of an existing code
- Deprecating a code
- Adding a new policy section (slug) to the Community Guidelines

An RFC is **not** required for:

- Fixing a typo in notice wording that does not change meaning
- Updating a code's `notice_wording` snippet without changing scope or severity
- Calibration session notes and moderator guidance updates

When in doubt, file an RFC. The cost of a brief RFC is low. The cost of an undocumented code change to audit integrity is high.

---

## RFC Lifecycle

```
Draft → In Review → Approved → Shipped → [Deprecated if applicable]
```

- **Draft:** Author completes the template. Circulates for comment.
- **In Review:** Formal review by required reviewers (see §3 below). Minimum 3 business days open for comment.
- **Approved:** All required reviewers sign off. Engineering assigned if schema/logging changes needed.
- **Shipped:** Code live in production. TAXONOMY.md updated. Effective date recorded.
- **Deprecated:** Only via a new RFC. Old code marked `[DEPRECATED vX.X — replaced by NEW_CODE]` in taxonomy. Never deleted.

---

## RFC Template

Copy from the line below. Fill every section. Do not leave sections blank — write "N/A" with a reason if a section genuinely does not apply.

---

### RFC Header

```
RFC ID:          HBR-RC-[YEAR]-[###]   (assigned by policy team on filing)
Title:           Add / Update / Deprecate: [CODE_NAME] — [policy_section]
Author:          [Name, role]
Reviewers:       [Policy lead], [T&S lead], [Engineering lead], [Legal if CRITICAL]
Status:          Draft
Filed:           [Date]
Target ship:     [Date or "TBD"]
Related RFCs:    [Prior RFCs this builds on, if any]
Related issues:  [GitHub issue or work package number]
```

---

### 1. Summary

*1–3 paragraphs. What is changing, why, and what will be different after this ships?*

---

### 2. Motivation and Background

**Observed gap:**
*What behaviors cannot be cleanly categorized with current codes? Where are moderators using inconsistent codes, escalating unnecessarily, or making judgment calls that should be systematized?*

**Evidence:**
*Provide anonymized examples from the moderation queue, user reports, or audit findings. Minimum 2–3 examples for new codes. Redact any identifying information.*

**Why existing codes are insufficient:**
*List the closest existing codes and explain specifically why they do not cover this behavior. This prevents code proliferation from imprecise problem definition.*

**Risk if not addressed:**
*What goes wrong if we don't add or change this code? Inconsistent enforcement, user confusion, audit failures, evasion vectors?*

---

### 3. Proposed Changes

#### 3a. New Reason Codes

*For each new code, complete all fields. Copy this block per code.*

```
Reason Code:         CATEGORY_SUBCATEGORY[_DETAIL]
Policy Section:      guidelines#[section]
Severity:            LOW / MED / HIGH / CRITICAL
Default Action:      [action_type from ladder]
Detection Sources:   user_report / moderator / automated / trusted_reporter

Definition:
  One sentence. Specific and objective. A moderator should be able to apply
  it consistently without additional guidance.

User-facing notice wording (default):
  1–2 sentences. Plain language. No jargon. No system references.
  This is what the user reads in their notice.

Required evidence:
  What must be present to apply this code? (e.g., "post contains a home
  address," "three accounts posting identical content within 10 minutes")

Common false positives:
  What cases look like this violation but are not?
  How should a moderator distinguish them?

Edge cases and exceptions:
  Allowed contexts that must not trigger this code.

Appeal considerations:
  What additional context from the user might change the assessment?
  What would warrant an overturn vs. uphold?
```

#### 3b. Updates to Existing Codes

*Prefer adding a new code over changing an existing one. If you must update:*

```
Code:                [EXISTING_CODE]
Current definition:  [quote from TAXONOMY.md]
Proposed change:     [exact new wording]
Reason:              [why the change is needed]

Backwards compatibility:
  How are actions logged under the old definition interpreted after this change?
  Do historical records remain valid?

Audit impact:
  How do analysts handle pre/post data in reports and calibration?
```

#### 3c. Deprecations

*Codes are never renamed or deleted — they are deprecated with a pointer to their replacement.*

```
Deprecated code:     [CODE_NAME]
Reason:              [why it's being retired]
Replacement code(s): [new code(s) that cover the behavior]
Migration:           [how new actions are coded going forward]
Historical records:  Deprecated code remains in taxonomy marked [DEPRECATED].
                     All historical actions logged under this code remain valid.
```

---

### 4. Enforcement Consistency Rules

*How does this code interact with existing codes?*

- When is this code primary vs. secondary?
- Are there required pairings? (e.g., `PRIVACY_NCII` always pairs with `SEXUAL_NCII` when intimate imagery is involved)
- Does this code change minimum action floors for any severity band?
- Does this code affect any existing escalation triggers in the Moderator Rubric?

---

### 5. Notice and UX Implications

*Does this change affect anything the user sees?*

- [ ] New notice wording required
- [ ] Change to existing notice wording
- [ ] New guideline section requires update to `COMMUNITY_GUIDELINES.md`
- [ ] New or changed appeal flow
- [ ] Change to in-app reporting options (new report category visible to users)
- [ ] No user-facing changes

*If any boxes are checked, describe the changes and who is responsible for writing/reviewing them.*

---

### 6. Engineering and Data Implications

**Schema changes:**
*Any additions to `moderation_actions`, `moderation_notices`, or `moderation_appeals`? New enum values? New foreign keys?*

**Logging changes:**
*New events in the event taxonomy? New fields on existing events?*

**Dashboard and reporting changes:**
*Does this code appear in a new transparency report category, or affect an existing one? Does any moderator dashboard need updating?*

**Backfill:**
*Should historical actions be re-coded? Almost always: no. If yes, explain why and how.*

**Rollout plan:**
*Feature flags? Canary? Percentage rollout? Immediate?*

---

### 7. Abuse and Evasion Analysis

*Required for all new codes. Required for updates that change scope or severity.*

**How might bad actors adapt once this rule is known?**
*Consider that the Community Guidelines are public. Assume adversarial users will read this RFC eventually.*

**Does the notice wording reveal too much?**
*Does the default notice give a bad actor enough information to evade detection on the next attempt? If so, how do we balance transparency with integrity?*

**Delayed notice exception:**
*Does this code warrant the integrity exception (delayed notice) in any cases? If yes, define the conditions precisely.*

**False reporting risk:**
*Could bad actors use this code's existence to mass-report legitimate content?*

---

### 8. Measurement and Success Criteria

*How will we know this code is working correctly after it ships?*

**Baseline metrics (measure before ship):**
- Current volume of cases in this category (even if miscoded)
- Current overturn rate for the closest existing code

**Post-ship targets:**
- Decreased use of escalation or "no code" outcomes for this behavior
- Overturn rate below team average within 60 days
- Moderator agreement rate ≥ 85% in first calibration session after ship

**Failure signals:**
*What would tell us the code definition is wrong or the guidance is insufficient?*
- Overturn rate above 20% sustained for 30 days
- Moderator disagreement rate above 20% in calibration
- Significant increase in appeals citing "wrong reason"

---

### 9. Privacy and Safety Review

**New data collection:**
*Does applying this code require collecting or logging data not already captured?*

**E2EE compatibility:**
*Can this code be enforced without reading encrypted message content? If the behavior is in DMs, enforcement must rely on metadata signals and user-submitted reports only.*

**Data retention:**
*Does this code's evidence type require any change to retention policy? (Default: evidence_refs retained per legal hold policy; raw content not stored.)*

**Minor safety:**
*Does this code involve minors in any way? If yes, escalation requirements must be explicit.*

---

### 10. Open Questions

*List unresolved items before the RFC moves to Approved. Each item should have an owner and a resolution deadline.*

| Question | Owner | Deadline |
|---|---|---|
| | | |

---

### 11. Decision

*Completed by policy lead at time of approval or rejection.*

```
Decision:        Approved / Rejected / Approved with modifications
Decided by:      [Name, role]
Date:            [Date]
Effective date:  [Date code is live in production and TAXONOMY.md is updated]

Approved changes:
  [List codes approved, with any modifications from review]

Rejected changes:
  [List rejected codes and reason]

Conditions / follow-ups:
  [Any required follow-up actions before or after ship]

TAXONOMY.md updated:    [ ] Yes, on [date]
Guidelines updated:     [ ] Yes / [ ] N/A
Engineering ticket:     [Link]
```

---

## Worked Example

A complete example of a filed RFC for a single new code.

---

```
RFC ID:          HBR-RC-2026-001
Title:           Add: MISLEADING_DEEPFAKE — guidelines#misleading-content
Author:          Policy Team
Reviewers:       Policy lead, T&S lead, Engineering lead
Status:          Approved
Filed:           2026-03-09
Target ship:     2026-03-16
Related RFCs:    None
Related issues:  #31
```

**1. Summary**

The current taxonomy has no specific code for manipulated media (deepfakes, deceptive video edits) presented as authentic. Moderators are applying `MISLEADING_IMPERSONATION` inconsistently, and some cases are being escalated with no code at all. This RFC adds `MISLEADING_DEEPFAKE` to handle manipulated media that is plausibly misleading, regardless of whether a specific person is being impersonated.

**2. Motivation and Background**

*Observed gap:* Three cases in the past 30 days involved clearly AI-manipulated video presented as authentic news footage. No existing code cleanly covers this. Two were logged under `MISLEADING_IMPERSONATION` (incorrect — no impersonation of a person) and one was escalated with no code.

*Evidence:* [Case IDs redacted] — two political videos with AI-altered speech, one fabricated news clip.

*Why existing codes are insufficient:* `MISLEADING_IMPERSONATION` requires a specific person being impersonated. These videos manipulate events, not identities. `MISLEADING_DECEPTIVE_EDIT` is close but implies lower harm — deepfakes with no disclosure carry higher potential for harm and warrant a distinct code with a higher default action.

*Risk if not addressed:* Inconsistent enforcement, high appeal overturn rate, inability to report accurately in transparency data.

**3a. New Reason Code**

```
Reason Code:         MISLEADING_DEEPFAKE
Policy Section:      guidelines#misleading-content
Severity:            HIGH
Default Action:      label + limit_distribution; escalate to remove if harm risk is high
Detection Sources:   user_report / moderator / automated (deepfake classifier, TBD)

Definition:
  Manipulated media — including AI-generated or AI-altered video, audio, or
  images — presented as authentic without disclosure, where the manipulation
  is plausible and not obviously satirical.

User-facing notice wording (default):
  "This media appears manipulated and was presented as authentic without
  disclosure. Harbor requires clear labeling for AI-generated or
  significantly altered content."

Required evidence:
  Moderator or classifier confidence that media is manipulated + no
  disclosure present + not obviously satirical in context.

Common false positives:
  Clearly labeled satire or parody. Disclosed AI-generated content.
  Creative edits where the original is shown alongside. Reenactments
  labeled as such.

Edge cases and exceptions:
  Documentary use of altered footage with clear disclosure.
  Historical colorization or restoration labeled as such.

Appeal considerations:
  User provides evidence that disclosure was present but not captured
  in the review. User demonstrates content is clearly satirical in
  its original context.
```

**7. Abuse and Evasion Analysis**

Bad actors may add minimal disclosures to evade this code (e.g., tiny text footnotes). Moderators should assess whether a disclosure is actually visible and legible, not just technically present. Notice wording does not reveal classifier specifics. Delayed notice: not warranted for standard cases; may apply if part of a coordinated deepfake campaign under investigation.

**8. Measurement**

Baseline: 3 cases/month currently escalated with no code or miscoded. Target: all deepfake cases coded within 30 days; overturn rate below 15% within 60 days.

**11. Decision**

```
Decision:        Approved
Decided by:      Policy lead
Date:            2026-03-09
Effective date:  2026-03-16

Approved changes:
  MISLEADING_DEEPFAKE added as specified

TAXONOMY.md updated:    [ ] Pending ship date
Guidelines updated:     [ ] N/A (existing misleading-content section covers this)
Engineering ticket:     #32
```

---

## Quick Reference: RFC Checklist

Before filing for review, confirm:

- [ ] RFC ID assigned by policy team
- [ ] All 11 sections completed (no blank sections)
- [ ] Minimum 2–3 anonymized evidence examples included
- [ ] "Why existing codes are insufficient" answered specifically — not "this is new behavior"
- [ ] Notice wording reviewed for evasion risk (§7)
- [ ] E2EE compatibility confirmed if behavior could occur in DMs (§9)
- [ ] TAXONOMY.md update planned for ship date
- [ ] Community Guidelines update scoped if new section required
- [ ] Engineering ticket filed if schema or logging changes needed
- [ ] Required reviewers assigned and notified
