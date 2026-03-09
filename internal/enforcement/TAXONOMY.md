# Harbor Enforcement Taxonomy
### Version 0.1

**Classification:** Internal — not for public distribution
**Owner:** Policy / Trust & Safety
**References:** COMMUNITY_GUIDELINES.md, ANTI_DRIFT_CONSTITUTION.md §5, METRICS_STANDARD.md

---

## Purpose

This document defines the complete reason code taxonomy for Harbor enforcement actions. Reason codes are the machine-readable "why" behind every policy enforcement action. They enable:

- Consistent, specific notices (no vague "community standards" language)
- Clean analytics and transparency reporting
- Auditor review and moderation accuracy audits
- Appeal review — codes tell the reviewer exactly what was claimed

Reason codes are **never used for ranking decisions**. Enforcement and ranking are separate systems (Constitution §5).

---

## Storage Conventions

Reason codes are stored in `moderation_actions`:

| Field | Type | Notes |
|---|---|---|
| `primary_reason_code` | `TEXT NOT NULL` | Most specific applicable code |
| `secondary_reason_codes` | `TEXT[]` | Up to 2 additional codes |
| `policy_section` | `TEXT NOT NULL` | Slug, e.g. `guidelines#harassment` |
| `action_type` | `TEXT NOT NULL` | `label / limit_distribution / remove / feature_limit / suspend / ban` |
| `severity` | `TEXT NOT NULL` | `LOW / MED / HIGH / CRITICAL` |
| `detection_source` | `TEXT NOT NULL` | `user_report / moderator / automated / trusted_reporter` |
| `confidence` | `NUMERIC(4,3)` | 0–1, null for human-reviewed actions |
| `evidence_refs` | `JSONB` | Internal evidence object IDs — never store content plaintext |
| `target_user_id` | `UUID` | Nullable — used for harassment/doxxing cases |

---

## Naming Conventions

Format: `CATEGORY_SUBCATEGORY` or `CATEGORY_SUBCATEGORY_DETAIL` (uppercase, underscores)

**Stability rule:** Reason codes are immutable once shipped. If behavior changes or a new edge case emerges, add a new code — do not rename or redefine an existing one. Historical records must remain interpretable. Deprecated codes are retained in the taxonomy with a `[DEPRECATED]` marker and a pointer to their replacement.

**No catch-alls:** If a behavior cannot be matched to a specific code, it is either not a violation or requires a new code via the Reason Code RFC process. There is no `OTHER` or `MISC` code.

---

## Selection Rules

1. Choose the **most specific** code that accurately describes the violation
2. Select one `primary_reason_code` and up to two `secondary_reason_codes`
3. If any selected code is `CRITICAL` severity, the action must meet the CRITICAL minimum floor (removal + review + possible account action — see Moderator Rubric)
4. When multiple codes apply, use the highest-severity code as primary
5. When in doubt about which code applies, escalate — do not guess

---

## Enforcement Action Ladder

Used to select the minimum appropriate action. Always use the least restrictive action that addresses the harm.

### Content-level actions

| Level | Action | Typical use |
|---|---|---|
| 1 | `label` | Contextual note or warning; content remains visible |
| 2 | `interstitial` | Click-through required before content is shown |
| 3 | `limit_distribution` | Not eligible for Explore/discovery/adjacent; sharing may be restricted. **Always generates a notice.** |
| 4 | `remove` | Content deleted |

### Account-level actions

| Level | Action | Typical use |
|---|---|---|
| 5 | `feature_limit` | Specific capability restricted for a defined period (e.g., broadcast sharing disabled 7 days) |
| 6 | `suspend` | Temporary account suspension |
| 7 | `ban` | Permanent account removal |

### Severity floors

| Severity | Minimum action | Notes |
|---|---|---|
| `LOW` | `label` or `limit_distribution` | Use judgment; context matters |
| `MED` | `limit_distribution` or `remove` | At minimum, limit reach |
| `HIGH` | `remove` or `feature_limit` | Content off, account action likely |
| `CRITICAL` | `remove` + review for `suspend`/`ban` | Immediate removal; account reviewed same session |

---

## Reason Codes by Policy Section

---

### Harassment (`guidelines#harassment`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `HARASSMENT_DIRECTED_INSULT` | `remove` | `MED` | Direct targeted abuse toward an individual |
| `HARASSMENT_SLUR_TARGETED` | `remove` + possible account action | `HIGH` | Slur directed at a named person |
| `HARASSMENT_THREAT_CREDIBLE` | `remove` + `suspend`/`ban` | `CRITICAL` | Credible threat of violence |
| `HARASSMENT_INCITEMENT` | `remove` + `feature_limit` | `HIGH` | Directing others to target a person |
| `HARASSMENT_PILEON_COORDINATED` | `limit_distribution` + thread controls | `HIGH` | Velocity + coordination + hostility; protect target first |
| `HARASSMENT_DOXXING` | `remove` + `suspend`/`ban` | `CRITICAL` | Private identifying info shared without consent |
| `HARASSMENT_SEXUALIZED` | `remove` + account action | `HIGH` | Sexualized targeting or sexualized insults at a person |
| `HARASSMENT_STALKING` | `feature_limit` + `suspend` | `HIGH` | Repeated unwanted contact; cross-account pattern |
| `HARASSMENT_EVASION` | account action | `HIGH` | New account to continue after block/enforcement |

---

### Hate and hateful conduct (`guidelines#hate`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `HATE_SLUR_GROUP` | `remove` + account action | `HIGH` | Slur targeting a protected group |
| `HATE_DEHUMANIZATION` | `remove` + account action | `HIGH` | "Vermin," "subhuman," equivalent framing |
| `HATE_EXCLUSION_CALLS` | `remove` or `limit_distribution` | `HIGH` | Calls to expel/deny rights based on protected characteristics |
| `HATE_SYMBOL` | `remove` + account action | `HIGH` | Hateful symbols/imagery — evaluate context and intent |

---

### Spam and inauthentic behavior (`guidelines#spam`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `SPAM_BOT_NETWORK` | `remove` + `ban` network | `CRITICAL` | Coordinated fake accounts |
| `SPAM_INAUTH_AMPLIFICATION` | `limit_distribution` + account action | `HIGH` | Coordinated engagement rings |
| `SPAM_BULK_MESSAGING` | `feature_limit` + `suspend` | `HIGH` | Unsolicited mass DMs |
| `SPAM_DUPLICATE_POSTING` | rate limit + `remove` | `MED` | Repeated identical posts to game distribution |
| `SPAM_LINK_FARMING` | `limit_distribution` + `remove` | `MED` | Repeated link drops / affiliate spam |
| `SPAM_ENGAGEMENT_BAIT` | `limit_distribution` | `LOW` | "Like/share if you agree" — handled primarily via ranking |
| `SPAM_IMPERSONATION` | `remove` + account action | `HIGH` | Posing as another person (non-financial) |
| `SPAM_MALICIOUS_LINK` | `remove` + `ban` | `CRITICAL` | Malware, drive-by, credential capture |

---

### Graphic content (`guidelines#graphic-content`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `GRAPHIC_GORE_GRATUITOUS` | `remove` or strong interstitial | `HIGH` | Gore without documentary value |
| `GRAPHIC_VIOLENCE_GRATUITOUS` | `remove` or strong interstitial | `HIGH` | Severe violence without documentary value |
| `GRAPHIC_ANIMAL_CRUELTY` | `remove` + account action | `HIGH` | Cruelty or torture of animals |
| `GRAPHIC_DOCUMENTARY` | `label` + `interstitial` + `limit_distribution` | `MED` | Legitimate news/documentary value — allowed, restricted |

---

### Sexual content and nudity (`guidelines#sexual-content`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `SEXUAL_PORNOGRAPHY` | `remove` + account action | `HIGH` | Pornography / sexually gratifying content |
| `SEXUAL_EXPLICIT_ACT` | `remove` + account action | `HIGH` | Explicit sexual acts |
| `SEXUAL_SOLICITATION` | `remove` + `suspend` | `HIGH` | Offers or requests for sexual acts |
| `SEXUAL_NUDITY_SEXUAL` | `remove` or `limit_distribution` | `HIGH` | Nudity intended to be sexual |
| `SEXUAL_NUDITY_NONSEXUAL` | `label` + `limit_distribution` | `MED` | Medical/documentary/artistic nudity — allowed, restricted |
| `SEXUAL_NCII` | `remove` + `ban` | `CRITICAL` | Non-consensual intimate imagery |
| `SEXUAL_DEEPFAKE` | `remove` + `ban` | `CRITICAL` | Sexual deepfakes, especially NCII |
| `SEXUAL_PREDATORY` | `remove` + `ban` | `CRITICAL` | Predatory behavior, exploitation |

---

### Illegal content (`guidelines#illegal-content`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `ILLEGAL_CSAM` | Immediate `remove` + `ban` + report | `CRITICAL` | Mandatory reporting where required by law |
| `ILLEGAL_TRAFFICKING` | `remove` + `ban` + report | `CRITICAL` | Human trafficking facilitation |
| `ILLEGAL_VIOLENCE_FACILITATION` | `remove` + `ban` + report | `CRITICAL` | Direct facilitation of serious violence |
| `ILLEGAL_INCITEMENT_CREDIBLE` | `remove` + account action | `CRITICAL` | Credible incitement to violence |
| `ILLEGAL_GOODS_SERVICES` | `remove` + account action | `HIGH` | Sale of illegal goods/services where prohibited |

---

### Scams, fraud, and phishing (`guidelines#scams`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `SCAM_PHISHING` | `remove` + `ban` | `CRITICAL` | Credential harvesting / fake login |
| `SCAM_INVESTMENT_FRAUD` | `remove` + account action | `HIGH` | Get-rich schemes, pump-and-dump |
| `SCAM_IMPERSONATION_FRAUD` | `remove` + `ban` | `CRITICAL` | Impersonation for financial gain |
| `SCAM_MALWARE` | `remove` + `ban` | `CRITICAL` | Malware distribution |

---

### Misleading content (`guidelines#misleading-content`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `MISLEADING_IMPERSONATION` | `remove` + account action | `HIGH` | Posing as real person/org to deceive (non-financial) |
| `MISLEADING_DEEPFAKE` | `label`/`limit_distribution` or `remove` | `HIGH` | Manipulated media presented as authentic — escalate if harm risk is high |
| `MISLEADING_DECEPTIVE_EDIT` | `label` + sharing friction | `MED` | Cropped/edited to mislead without clear intent to harm |
| `MISLEADING_HEALTH_HARM` | `remove` or strong `limit_distribution` | `CRITICAL` | Health misinformation with credible risk of physical harm |
| `MISLEADING_SAFETY_HARM` | `remove` or strong `limit_distribution` | `CRITICAL` | Safety instructions presented as safe when dangerous |
| `MISLEADING_UNLABELED_SATIRE` | `label` required | `LOW` | Satire not identifiable as satire — label first, escalate if refused |

---

### Privacy (`guidelines#privacy`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `PRIVACY_DOXXING` | `remove` + account action | `HIGH` | Private identifying info — also log `HARASSMENT_DOXXING` if targeted |
| `PRIVACY_NCII` | `remove` + `ban` | `CRITICAL` | Non-consensual intimate imagery — also log `SEXUAL_NCII` |
| `PRIVACY_PRIVATE_MSG_LEAK` | `remove` + account action | `HIGH` | Sharing private messages without consent |
| `PRIVACY_LOCATION_TRACKING` | `remove` + account action | `HIGH` | Location/movement info enabling stalking |
| `PRIVACY_NONCONSENSUAL_RECORDING` | `remove` + account action | `HIGH` | Hidden camera or intimate violation |

---

### Self-harm (`guidelines#self-harm`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `SELFHARM_ENCOURAGEMENT` | `remove` + account action | `CRITICAL` | Encouraging self-harm or suicide directed at a person |
| `SELFHARM_INSTRUCTIONS` | `remove` + account action | `CRITICAL` | Method instructions |
| `SELFHARM_GLORIFICATION` | `label`/`limit_distribution` or `remove` | `HIGH` | Context-dependent — escalate if targeted |

---

### Child safety (`guidelines#child-safety`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `CHILD_CSAM` | Immediate `remove` + `ban` + report | `CRITICAL` | Duplicate of `ILLEGAL_CSAM` — log both |
| `CHILD_GROOMING` | `feature_limit` + `suspend`/`ban` + urgent review | `CRITICAL` | Escalate fast; do not delay |
| `CHILD_SEXUALIZATION` | `remove` + `ban` | `CRITICAL` | Sexual content involving minors |
| `CHILD_EXTORTION` | `remove` + `ban` + report | `CRITICAL` | Sextortion patterns |
| `CHILD_LURING` | `feature_limit` + urgent review | `HIGH` | Attempting to move minors off-platform |

---

### Manipulation (`guidelines#manipulation`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `MANIPULATION_INAUTH_COORDINATED` | `limit_distribution` + account action | `HIGH` | Coordinated narrative campaigns |
| `MANIPULATION_REPORT_BRIGADING` | Restrict reporting + account action | `HIGH` | Organized false reporting |
| `MANIPULATION_AROUSAL_GAMING` | Account action + dampening | `HIGH` | Gaming arousal heuristics to throttle others |
| `MANIPULATION_SUPPRESSION` | Investigate + account action | `HIGH` | Coordinated attempts to silence content |
| `MANIPULATION_ASTROTURFING` | `label`/`limit_distribution` + account action | `HIGH` | Hidden coordination posing as organic |
| `MANIPULATION_HARASSMENT_CIVIC` | `remove` + account action | `HIGH` | Coordinated harassment disguised as accountability |

---

### Minimum age (`guidelines#minimum-age`)

| Reason Code | Default Action | Severity | Notes |
|---|---|---|---|
| `AGE_UNDER_13_CONFIRMED` | `ban` (account removal) | `HIGH` | Clear evidence or confirmed admission |
| `AGE_UNDER_13_SUSPECTED` | Age verification hold | `MED` | Do not over-enforce without evidence |

---

## Notice Wording Snippets

These are default first-line notice sentences paired to each primary code. Moderators may add context but should not deviate from the policy section reference.

| Reason Code | Default notice wording |
|---|---|
| `HARASSMENT_DOXXING` | "Your post included private identifying information about a person without their consent." |
| `HARASSMENT_THREAT_CREDIBLE` | "Your post included a credible threat of violence toward a person." |
| `HARASSMENT_INCITEMENT` | "Your post directed others to contact or target a specific person." |
| `HARASSMENT_PILEON_COORDINATED` | "This post contributed to a coordinated pattern of hostile replies targeting a person." |
| `HATE_DEHUMANIZATION` | "Your post used language that dehumanizes people based on a protected characteristic." |
| `SPAM_BOT_NETWORK` | "This account was part of a coordinated network of inauthentic accounts." |
| `SPAM_MALICIOUS_LINK` | "Your post included a link that delivers malware or captures credentials." |
| `SEXUAL_NCII` | "Your post included intimate imagery shared without the subject's consent." |
| `ILLEGAL_CSAM` | *No notice wording — do not describe the content. Report and remove.* |
| `MISLEADING_DEEPFAKE` | "This media appears manipulated and was presented as authentic without disclosure." |
| `MISLEADING_HEALTH_HARM` | "This post contains health information that is likely to mislead and could cause physical harm." |
| `SELFHARM_ENCOURAGEMENT` | "Your post encouraged self-harm directed at another person." |
| `CHILD_GROOMING` | *Escalate immediately. Do not issue a standard notice pending review.* |
| `MANIPULATION_REPORT_BRIGADING` | "This account coordinated mass-reporting of content or accounts to abuse enforcement systems." |
| `MANIPULATION_AROUSAL_GAMING` | "This account attempted to manipulate Harbor's safety systems to suppress another user's content." |
| `SCAM_PHISHING` | "Your post included a link or content designed to capture credentials or account information." |

---

## Transparency Reporting Mapping

For each quarterly transparency report, aggregate counts are reported by policy section (not by individual reason code, to avoid revealing evasion-sensitive specifics).

| Reported category | Codes included |
|---|---|
| Harassment | All `HARASSMENT_*` |
| Hate | All `HATE_*` |
| Spam & inauthentic | All `SPAM_*` |
| Graphic content | All `GRAPHIC_*` |
| Sexual content | All `SEXUAL_*` |
| Illegal content | All `ILLEGAL_*` |
| Scams & fraud | All `SCAM_*` |
| Misleading content | All `MISLEADING_*` |
| Privacy | All `PRIVACY_*` |
| Self-harm | All `SELFHARM_*` |
| Child safety | All `CHILD_*` |
| Manipulation | All `MANIPULATION_*` |
| Age enforcement | All `AGE_*` |

Appeal overturn rates are reported per category. Individual reason codes are not disclosed publicly.
