# Harbor Enforcement Notice Template
### Version 0.1

**Classification:** Internal — not for public distribution
**Owner:** Policy / Trust & Safety / Engineering
**References:** TAXONOMY.md, COMMUNITY_GUIDELINES.md, MODERATOR_RUBRIC.md

---

## Purpose

This document defines the standardized structure for every enforcement notice issued by Harbor. It serves as:

- The content spec for the in-app Notices screen (Profile → Notices)
- The schema for the `moderation_notices` table
- The template moderators follow when writing notice text
- The source of truth for what appeal flow must include

Every notice must be specific, plain-language, and actionable. "Violation of community standards" with no further detail is not acceptable.

---

## When a Notice Is Required

A notice is required for **every** action that:

- Removes content
- Limits the distribution of content
- Applies a label that affects reach
- Restricts an account feature
- Suspends or permanently removes an account

A notice is **not** required for:

- Ranking decisions (content is less relevant to a user's deck — not a policy action)
- Rate limits triggered automatically as infrastructure protections with no policy basis
- Silent automated spam filters on content that never reached any user

### Integrity exception (delayed notice)

In narrow cases where immediate notice would materially enable evasion — active bot network disruption, coordinated inauthentic behavior investigation, or large-scale spam takedowns — notice may be delayed. Requirements:

- The delay must be logged in `moderation_notices.delayed_reason`
- Notice must be sent as soon as the integrity risk is resolved
- Maximum delay: 72 hours without senior review; beyond 72 hours requires documented approval
- Delayed notices are audited quarterly

---

## Database Schema

### `moderation_notices` table

```sql
CREATE TABLE moderation_notices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id           UUID NOT NULL REFERENCES moderation_actions(id),
  user_id             UUID NOT NULL REFERENCES users(id),

  -- Notice content
  notice_type         TEXT NOT NULL,      -- see Notice Types below
  policy_section      TEXT NOT NULL,      -- e.g. guidelines#harassment
  primary_reason_code TEXT NOT NULL,      -- from TAXONOMY.md
  plain_summary       TEXT NOT NULL,      -- 1–2 sentence plain-language explanation
  affected_content_id UUID,              -- nullable (account-level actions may not reference one item)
  affected_excerpt    TEXT,              -- first 280 chars of content, where safe to show
  action_taken        TEXT NOT NULL,      -- human-readable description of what changed
  action_start        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_end          TIMESTAMPTZ,        -- null = permanent

  -- What the user can do
  can_repost          BOOLEAN DEFAULT false,
  repost_instructions TEXT,              -- if can_repost, what must change

  -- Integrity exception
  delayed_notice      BOOLEAN DEFAULT false,
  delayed_reason      TEXT,              -- required if delayed_notice = true
  delayed_until       TIMESTAMPTZ,

  -- Appeal
  appeal_deadline     TIMESTAMPTZ,       -- typically 30 days from action_start
  appeal_id           UUID REFERENCES moderation_appeals(id),

  -- Delivery
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at        TIMESTAMPTZ,       -- when shown in-app or emailed
  read_at             TIMESTAMPTZ        -- when user opened the notice
);
```

### Notice types

| `notice_type` | When used |
|---|---|
| `content_labeled` | A label was applied to content |
| `content_interstitial` | A click-through warning was applied |
| `content_distribution_limited` | Reach was restricted due to policy |
| `content_removed` | Content was deleted |
| `account_feature_limited` | A specific feature was temporarily restricted |
| `account_suspended` | Account temporarily suspended |
| `account_banned` | Account permanently removed |
| `appeal_outcome` | Follow-up notice with appeal decision |

---

## Notice Structure (All Types)

Every notice delivered to a user contains the following fields, in this order.

---

### 1. Header

Shown as the notice list item and the top of the detail view.

| Field | Content |
|---|---|
| Notice type | Human-readable label (see display names below) |
| Date and time | User's local timezone |
| Notice ID | `HBR-NTC-{id_short}` — shown to user for reference in appeals |
| Policy section | Plain-language section name (e.g., "Harassment") — **not** the raw slug |
| Status | Open / Under appeal / Resolved |

**Display names for notice types:**

| `notice_type` | Displayed as |
|---|---|
| `content_labeled` | Label applied |
| `content_interstitial` | Warning added |
| `content_distribution_limited` | Reach limited |
| `content_removed` | Content removed |
| `account_feature_limited` | Feature restricted |
| `account_suspended` | Account suspended |
| `account_banned` | Account removed |
| `appeal_outcome` | Appeal decision |

---

### 2. What happened

One to two sentences in plain language. Uses the default notice wording from TAXONOMY.md as a starting point. Moderators may add one sentence of context but must not introduce new claims not supported by the reason code.

**Format:**
> "[Default wording from taxonomy]. [Optional: one sentence of specific context.]"

**Examples:**
> "Your post included private identifying information about a person without their consent."
> "This post contributed to a coordinated pattern of hostile replies targeting a specific person. The post was shared with a call to others to join the replies."

**Rules:**
- No legalese or policy-document language
- No quoting the content back to the user if it contains illegal material, third-party private information, or intimate imagery
- No referencing internal system names, classifiers, or confidence scores

---

### 3. What was affected

| Field | Content |
|---|---|
| Content type | Post / Reply / Profile / Group post / Link share |
| Where posted | Surface name (e.g., "Public post," "Denver Running group," "your profile") |
| Created at | Timestamp of the original content |
| Excerpt | First 280 characters of text content, where safe to display. Blurred thumbnail for images/video. |

If the action is account-level (feature limit, suspension, ban) with no single content item as the trigger, this section describes the pattern of behavior rather than a specific item.

---

### 4. Action taken

Specific description of what changed. Duration is always stated explicitly.

**Content-level examples:**
- "A 'Manipulated media' label has been applied to this post."
- "This post is no longer eligible for Explore or adjacent recommendations. Sharing is limited to direct shares only. Effective immediately."
- "This post has been removed. It is no longer visible to anyone."

**Account-level examples:**
- "Broadcast sharing has been disabled on your account for 7 days. (Ends: [date])"
- "Your account has been suspended for 14 days. (Ends: [date]) You cannot post, reply, or send messages during this time."
- "Your account has been permanently removed."

**Rules:**
- Always state start time
- Always state end time or "permanent"
- If distribution is limited, list exactly which surfaces are affected

---

### 5. Why this violates the guideline

Two parts:

**The rule (quoted short):**
A one-sentence paraphrase or short quote from the relevant section of the Community Guidelines, with a link to the full section.

**The trigger:**
A specific description of the element that crossed the line. This is the "show your work" section — it must be specific enough that the user knows exactly what to change if they want to repost.

**Examples:**

> *Rule:* Harbor does not allow sharing someone's private identifying information without their consent. ([guidelines#privacy](https://joinharbor.app/guidelines#privacy))
> *In your post:* The post included a home address.

> *Rule:* Harbor does not allow manipulated media presented as authentic without disclosure. ([guidelines#misleading-content](https://joinharbor.app/guidelines#misleading-content))
> *In this content:* The clip removes context from the original and was presented without any disclosure of editing.

---

### 6. Ranking vs. enforcement statement

Required in every notice. Standardized paragraph — do not modify:

> "This is a policy enforcement action, not a ranking decision. It applies because the content or behavior violates [section name] of the Harbor Community Guidelines. Harbor keeps enforcement and ranking separate. If your content is less visible for reasons unrelated to policy, that is a ranking decision and will not generate a notice."

---

### 7. What you can do next

A short menu of available actions. Only include options that actually apply.

| Option | When to include |
|---|---|
| Edit and re-post | When `can_repost = true`; include `repost_instructions` |
| Read the full guideline | Always; link to `joinharbor.app/guidelines#{section}` |
| Appeal this decision | Always, unless appeal window has closed |
| Block / mute tools | When the user is a target of harassment (protective notices) |
| Contact support | For account bans or complex cases |

---

### 8. Appeal

Included in every notice where action is appealable (all reach-limiting and account actions).

**Appeal block:**

> **Appeal this decision**
> Submit an appeal within 30 days. Include any context we may have missed, or why you believe this does not violate the guideline.
> Most appeals are reviewed within 72 hours.
> [Appeal button → appeal flow]

**Rules:**
- Appeal window: 30 days from `action_start`, stored as `appeal_deadline`
- Appeal button must be the primary CTA in the notice — not buried
- After deadline: button is replaced with "Appeal window closed"

---

### 9. Appeal outcome notice (`notice_type = appeal_outcome`)

Issued when an appeal is decided. Replaces the appeal block in the original notice with a summary, and generates a new notice in the user's list.

| Field | Content |
|---|---|
| Outcome | Upheld / Overturned / Modified |
| What changed | Specific description (e.g., "The label has been removed," "The suspension has been shortened to 3 days," "No change") |
| Reason | Specific explanation — not a form letter |
| If upheld | What the user can do differently; reiterate appeal window is closed |
| If overturned | Apology, confirmation of what was restored |
| If modified | What changed and why the original action was partially correct |

---

## Special Handling: Zero-Tolerance Categories

The following reason codes require modified notice handling:

| Code | Notice modification |
|---|---|
| `ILLEGAL_CSAM`, `CHILD_CSAM` | No content excerpt. No description of the content. Notice states removal and account action only. Law enforcement referral is not disclosed in the notice. |
| `CHILD_GROOMING` | Do not issue standard notice pending senior review. Escalate within 1 hour. |
| `SEXUAL_NCII`, `PRIVACY_NCII` | No content excerpt. Notice states removal. Offer support resources for targets of intimate image abuse. |
| `HARASSMENT_THREAT_CREDIBLE` | Offer safety resources. If threat is against a third party, consider protective notice to target. |

---

## Worked Example

**Scenario:** A user's post directed followers to send hostile replies to another user. Action: `limit_distribution` + thread controls. Reason code: `HARASSMENT_INCITEMENT`.

---

**Notice type:** Reach limited
**Date:** 2026-03-09 10:42 AM (Mountain Time)
**Notice ID:** HBR-NTC-104922
**Guideline:** Harassment
**Status:** Open

---

**What happened**

Your post directed others to contact or target a specific person. This contributed to a rapid spike in hostile replies toward that person.

**What was affected**

Post in: Denver community feed
Created: 2026-03-09 10:12 AM
Preview: "Everyone should go let @___ know what they think about…"

**Action taken**

This post is no longer eligible for Explore or adjacent recommendations. Broadcast resharing has been disabled for this post. Effective immediately.

**Why this violates the guideline**

*Rule:* Harbor does not allow inciting others to target or harass a person. ([Harassment](https://joinharbor.app/guidelines#harassment))
*In your post:* The post explicitly instructed followers to contact a named individual.

---

*This is a policy enforcement action, not a ranking decision. It applies because the content violates the Harassment section of the Harbor Community Guidelines. Harbor keeps enforcement and ranking separate.*

---

**What you can do**
- You may edit and re-post without directing contact toward an individual
- [Read the Harassment guideline](https://joinharbor.app/guidelines#harassment)
- [Appeal this decision](#)

**Appeal this decision**
Submit within 30 days. Most appeals are reviewed within 72 hours.
