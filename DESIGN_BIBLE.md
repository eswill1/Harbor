# Harbor Design Bible
### Version 1.1 — Aligned with Constitution, Metrics Standard, and Ranking Spec

---

## 0. North Star

> "You dock, get what you came for, and leave."

Every design decision in Harbor is evaluated against one question:
**Does this help the user finish, or does it keep them stuck?**

If it compels, traps, or hijacks — it's not Harbor. If it satisfies, completes, or restores — it is.

---

## 1. Brand Identity

### 1.1 Name & Metaphor

Harbor is a port. Not a river, not an ocean, not a slot machine. A harbor has:
- **Arrival** — you come with a purpose
- **Structure** — berths, lanes, shelves — everything has a place
- **Calm** — protected water, not open sea
- **Departure** — you leave. That's the goal.

Every interaction should reinforce this metaphor: docking, shelving, tides, berths, signals, beacons.

### 1.2 Brand Voice

| Trait | In Practice |
|---|---|
| **Calm** | Short sentences. No urgency language. No exclamation marks in UI copy. |
| **Honest** | "Why this?" is always answerable. No dark patterns. |
| **Purposeful** | Every screen has one clear job. No ambient noise. |
| **Warm** | Not clinical. Not corporate. Human and grounded. |
| **Confident** | We don't apologize for having constraints. We explain them. |

### 1.3 What Harbor Is Not

- Not a dashboard (no metric anxiety)
- Not a news ticker (no infinite scroll)
- Not a status game (no follower counts as primary UI)
- Not a casino (no variable reward loops)
- Not a courtroom (no pile-ons, dunking UI)

---

## 2. Visual Language

### 2.1 Color System

Harbor's palette is drawn from the sea at dusk — deep and grounded, not vibrant and stimulating. Colors are calm by design.

#### Primary Palette

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--harbor-deep` | Harbor Deep | `#1B2A3B` | Primary dark bg, text on light |
| `--harbor-slate` | Slate | `#2E4057` | Secondary surfaces, nav bg |
| `--harbor-water` | Water | `#4A7FA5` | Primary actions, links, focus rings |
| `--harbor-seafoam` | Seafoam | `#72B8A0` | Success states, positive confirmations |
| `--harbor-sand` | Sand | `#F0E6D3` | Light mode background |
| `--harbor-mist` | Mist | `#F7F4EF` | Light mode surface |
| `--harbor-fog` | Fog | `#E8E2D9` | Borders, dividers on light |

#### Semantic Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg-base` | `#F7F4EF` | `#111820` | Page background |
| `--bg-surface` | `#FFFFFF` | `#1B2A3B` | Cards, modals, panels |
| `--bg-elevated` | `#F0E6D3` | `#2E4057` | Hover states, selected |
| `--text-primary` | `#1B2A3B` | `#EEE8DF` | Body text, headings |
| `--text-secondary` | `#5A6A7A` | `#8FA3B1` | Captions, metadata |
| `--text-muted` | `#9AABB8` | `#4A6070` | Timestamps, disabled |
| `--accent-primary` | `#4A7FA5` | `#6B9FBF` | CTAs, active states |
| `--accent-success` | `#72B8A0` | `#72B8A0` | Positive signals |
| `--accent-caution` | `#C4935A` | `#D4A870` | Friction indicators, throttled content |
| `--accent-civic` | `#7B68A8` | `#9B88C8` | Civic Lane only |
| `--border` | `#E8E2D9` | `#2A3D50` | Default dividers |
| `--border-strong` | `#C8BFB4` | `#3A5060` | Emphasis borders |

#### Rules
- **Never use red** for notification counts or engagement metrics — this is a deliberate break from addictive design patterns.
- Notification badges use `--accent-primary` (blue-grey), not red.
- High-arousal/throttled content uses `--accent-caution` (warm amber) — not alarming, just honest.
- Civic content uses `--accent-civic` (muted purple) — visually separated from the main feed.

### 2.2 Typography

Harbor uses a dual-typeface system: a humanist sans for UI and a readable serif for long-form content.

#### Typefaces

| Role | Family | Rationale |
|---|---|---|
| **UI / Interface** | [Inter](https://rsms.me/inter/) | Best-in-class legibility, open source, system-like |
| **Reading / Long-form** | [Lora](https://fonts.google.com/specimen/Lora) | Warm, readable serif for Learn mode + long reads |
| **Code / Data** | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | For technical communities and shelf metadata |
| **Fallback stack** | `system-ui, -apple-system, sans-serif` | Graceful degradation |

#### Type Scale

```
--text-xs:    11px / 1.4  — timestamps, badges
--text-sm:    13px / 1.5  — captions, metadata, secondary UI
--text-base:  15px / 1.6  — body text, card content
--text-md:    17px / 1.5  — emphasized body, subheadings
--text-lg:    20px / 1.4  — card titles, section headers
--text-xl:    24px / 1.3  — screen titles, modal headers
--text-2xl:   30px / 1.2  — onboarding headlines
--text-3xl:   38px / 1.1  — splash / hero text only
```

#### Weight Usage
- `400` — body text, descriptions
- `500` — UI labels, navigation
- `600` — card titles, section headers
- `700` — screen titles, CTAs

#### Rules
- Line length: **60–75 characters** for reading content. Never full-width paragraphs.
- Long-form (Learn mode): switch to Lora at `--text-base` or larger.
- Never use font size below 11px.
- All interactive text meets WCAG AA contrast.

### 2.3 Spacing & Grid

Harbor uses an **8pt base grid** with a 4pt half-step for fine adjustments.

```
--space-1:   4px
--space-2:   8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
```

**Layout grid (mobile):** 4 columns, 16px gutters, 16px margins
**Layout grid (tablet):** 8 columns, 24px gutters, 24px margins
**Layout grid (desktop):** 12 columns, 24px gutters, max-width 1200px, centered

### 2.4 Border Radius

```
--radius-sm:  6px   — chips, tags, small inputs
--radius-md:  12px  — cards, buttons
--radius-lg:  18px  — modals, bottom sheets
--radius-xl:  24px  — intent selector, feature panels
--radius-full: 999px — pills, avatars, badges
```

### 2.5 Elevation & Shadow

Harbor avoids heavy drop shadows. Elevation is communicated through layered backgrounds, not dramatic shadows.

```
--shadow-none: none
--shadow-sm:   0 1px 3px rgba(0,0,0,0.08)      — subtle card lift
--shadow-md:   0 4px 12px rgba(0,0,0,0.10)     — floating panels
--shadow-lg:   0 8px 24px rgba(0,0,0,0.14)     — modals, overlays
--shadow-inner: inset 0 1px 3px rgba(0,0,0,0.06) — pressed states
```

### 2.6 Iconography

- **Primary set:** [Phosphor Icons](https://phosphoricons.com/) — consistent weight, nautical icons available, open source
- **Style:** Regular weight for UI, Bold for primary actions, Duotone for empty states only
- **Size scale:** 16px (inline), 20px (navigation), 24px (feature icons), 32px (empty states), 48px (onboarding)
- **Color:** Icons inherit `--text-secondary` by default; active states use `--accent-primary`
- **No filled icons for inactive states.** Filled = active/selected only.

### 2.7 Motion & Animation

Harbor's motion language is **deliberate and calm**. Nothing bounces. Nothing pulses. Nothing demands attention.

#### Principles
1. **Motion communicates state, not personality.** Animations exist to orient, not entertain.
2. **Exits are as important as entrances.** Content leaving gracefully signals completion.
3. **Never loop.** Looping animations are prohibited outside loading states.
4. **Respect reduced motion.** All animations check `prefers-reduced-motion`.

#### Timing Tokens

```
--duration-instant:  80ms   — hover states, pressed states
--duration-fast:    150ms   — micro-interactions, badges
--duration-normal:  250ms   — page transitions, modals
--duration-slow:    400ms   — deck transitions, shelf reveals
--duration-xslow:   600ms   — onboarding, intent selection
```

#### Easing Tokens

```
--ease-out:      cubic-bezier(0.0, 0.0, 0.2, 1)   — elements entering
--ease-in:       cubic-bezier(0.4, 0.0, 1, 1)     — elements leaving
--ease-in-out:   cubic-bezier(0.4, 0.0, 0.2, 1)   — state changes
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1) — delight moments only
```

#### Key Transitions

| Interaction | Animation |
|---|---|
| Deck card → next card | Horizontal slide-out (ease-in, 150ms) |
| Intent mode selection | Scale + fade-in of deck (400ms, ease-out) |
| Session complete | Gentle fade + "anchor drop" icon animates down |
| Shelf save | Card thumbnail scales to shelf icon (250ms) |
| Throttled content reveal | Amber border fades in (250ms) + copy appears |
| Civic Lane entry | Purple wash transition (400ms) |
| Check-in prompt | Slides up from bottom (250ms, ease-out) |

---

## 3. Core Components

### 3.1 Intent Selector

The first thing a user sees when opening Harbor. This is Harbor's most important UI moment.

**Design specs:**
- Full-screen modal or bottom sheet on mobile
- 5 intent cards arranged in a 2+3 or scrollable list
- Each card: large icon (32px), intent name, one-line description
- Selected state: filled background with `--accent-primary`, scale 1.02
- Last-used intent is pre-selected but not auto-applied — user must confirm
- Tap to select → brief pause (200ms) → deck loads with gentle fade

**Intent Cards (7 total; Civic and Explore conditionally shown):**
```
[Anchor icon]     Catch Up       "Friends, updates, what you missed"
[Book icon]       Learn          "Guides, explainers, long reads"
[Users icon]      Connect        "Communities, events, conversations"
[PencilLine icon] Create         "Collabs, prompts, get feedback"
[Sparkle icon]    Delight        "Humor, art, something good"
[Compass icon]    Explore        "Find new creators and communities"
[Landmark icon]   Civic          "News and civic discussion"  ← only shown if opted in
```

**Rules:**
- Never skip the intent selector. Always ask.
- Never remember intent and auto-load a feed — friction here is intentional.
- Civic card only appears if the user has opted in. Never surfaced by default.
- Explore is a full intent mode, not just a tab — it generates a finite deck like all other intents.
- The selector must feel like a breath, not a barrier.

### 3.2 Deck Card

The primary content unit. Harbor's equivalent of a post/tweet/reel, but designed for completion.

**Anatomy:**
```
┌─────────────────────────────────┐
│ [Avatar] Creator Name    ··· [menu]  │
│ @handle · Shelf tag · Time      │
│ [source bucket pill]            │  ← e.g. "From your groups" / "Adjacent discovery"
├─────────────────────────────────┤
│                                 │
│   Content area                  │
│   (text / image / video)        │
│                                 │
├─────────────────────────────────┤
│ [Save ▾]  [Reply]  [Share ▾]  [···]│
│                                 │
│  [Why this?]         [x of 20]  │
└─────────────────────────────────┘
```

**Key decisions:**
- **No like count** displayed by default. Replace with "Saved 84 times" or "12 thoughtful replies."
- **No repost/share count** as primary metric. Amplification is not celebrated.
- **Deck counter** (e.g., "7 of 20") is always visible — a progress indicator, not a dopamine tracker.
- **Source bucket pill** is always visible in the card header — one of: "From your friends," "From your groups," "From your shelves," "Adjacent discovery." This is a first-class transparency element, not metadata buried in "Why this?"
- **"Why this?"** is a persistent, tappable element — never hidden in a menu. Opens the full signal panel.
- **Save** has a dropdown: choose which shelf. This is the primary positive action.
- **Share** has a dropdown: "Share to a friend," "Share to a group," "Copy link" — broadcast is always third.
- Throttled/high-arousal content gets an amber left border and a soft label: "This is getting strong reactions — read before sharing."
- Civic content cards always show a content-type label (Opinion / Reporting / First-hand / Satire) beneath the author line.

### 3.3 Deck Progress & Completion

**Progress bar:** A thin (3px) line at the top of the deck view. Fills left-to-right as you move through cards. Color: `--accent-primary`. Calm, not urgent.

**Deck completion screen:**
```
┌─────────────────────────────────┐
│                                 │
│         [Anchor icon]           │
│                                 │
│     You're caught up.           │
│   That was your 20-card deck.   │
│                                 │
│  Did you get what you came for? │
│  [Yes, I'm done]  [Sort of]  [No]│
│                                 │
│  ─────────────────              │
│  [Load another deck]            │
│  [Switch intent]                │
│  [Go to Shelves]                │
│                                 │
└─────────────────────────────────┘
```

**Rules:**
- "Yes, I'm done" is always the largest, most prominent button.
- "Load another deck" is available but secondary — not a default auto-load.
- Never auto-advance to another deck. Require intentional action.
- The completion screen is not a "you failed" screen. It's a "you finished" screen. Tone matters.

### 3.4 Shelves (The Library)

The user's personal library. Replaces the home feed as the long-term organizational metaphor.

**Layout:**
```
Library
├── [+ New Shelf]
│
├── Photography
│   ├── Lighting (23 saved)
│   ├── Portraits (11 saved)
│   └── Editing (8 saved)
│
├── Home Lab
│   ├── Proxmox (14 saved)
│   └── Networking (6 saved)
│
└── Parenting
    └── Meals (9 saved)
```

**Shelf view:**
- Masonry or list layout (user preference)
- Items show save date, source, shelf tag
- "Related to this shelf" suggestion strip at the bottom (max 5 items, clearly labeled)
- Shelf-level controls: rename, reorder, archive, export

**Rules:**
- Shelf names are user-defined. Harbor never auto-names a shelf.
- Shelf suggestions are clearly labeled: "Harbor thinks these belong here."
- Archives don't delete. Export is always available (JSON + readable format).

### 3.5 Serendipity Cards

Discovery cards within a deck. Visually distinct from primary feed items.

**Visual treatment:**
- Subtle left accent: 3px `--accent-primary` border
- Source bucket pill shows "Adjacent discovery" (not just "Might interest you" — be specific)
- Label beneath pill: "Adjacent to [Shelf Name]"
- No serendipity card can appear in positions 1, 2, or 3 of a deck
- Max 2–3 serendipity cards per 20-card deck (10–15%), per the user's serendipity budget
- Serendipity cards in Delight and Explore must pass a stricter arousal threshold (≤0.33 band) than other intents
- If the user marks one negatively or skips fast, remaining serendipity cards are held back

### 3.6 Throttled Content Indicator

Applied to items that triggered arousal-detection heuristics.

**Visual treatment:**
- Amber left border (`--accent-caution`, 3px)
- Soft amber background wash (5% opacity)
- Label above content: "This content is trending for strong reactions. Take a breath before sharing."
- Not hidden, not alarming, not preachy — just honest
- Read-before-share is enforced on these items (share button activates after 3s or after scroll past fold)

### 3.7 Civic Lane

A visually and structurally separate environment for political/civic content.

**Entry experience:**
- Explicit opt-in required during onboarding and re-confirmable in settings
- Purple color shift (`--accent-civic`) applied to top nav and borders when inside Civic Lane
- Small persistent pill: "Civic Lane" — so users always know where they are
- Exit is always visible and prominent

**Content requirements in Civic Lane:**
- Every item labeled: Opinion / Reporting / First-hand / Satire — visible on the card face, not just in a panel
- "Source context" card available on tap (not tooltip — full expandable panel)
- Share friction doubled — cooldown extended to 10 seconds, plus explicit confirmation step
- Broadcast reshare requires an additional step beyond friend/group share
- Diversity constraint: the algorithm enforces ideological balance within a deck. This is labeled on the deck: "Showing a range of perspectives on [topic]. Adjust." User is never left to wonder why they're seeing something they don't agree with.
- Dogpile dampening: if a thread shows rapid hostile reply velocity, distribution is automatically reduced. Users in the thread see a context prompt, not a silent cutoff.
- No trending political content injected into non-Civic intents, ever.

### 3.8 Check-In Sheet

The post-session feedback prompt. This is Harbor's primary data collection tool for the satisfaction engine.

**Design:**
```
┌─────────────────────────────────┐
│  Quick check-in                  │
│                                 │
│  Did you get what you           │
│  came for?                      │
│                                 │
│  [Yes, I'm done ✓]              │
│  [Sort of]                      │
│  [Not really]                   │
│                                 │
│  (optional)                     │
│  How do you feel?               │
│  [Better] [Same] [Worse]        │
│                                 │
│           [Skip →]              │
└─────────────────────────────────┘
```

**Rules:**
- Skip is always visible and prominent. Never guilt-trip.
- Max 2 questions. Never more.
- Does not block navigation — user can swipe away.
- Shown at deck completion, not on a timer.
- Mood question is optional and softly worded — never clinical.
- Shown to 20–40% of sessions (rotating cohorts) to prevent prompt fatigue — not every session, every time.
- A separate **Regret Prompt** variant ("Do you wish you hadn't opened Harbor?") is shown to a small research cohort only — never to the general population as a default. It is a safety/health metric, not a regular UX pattern.

### 3.9 "Why This?" Panel

The transparency layer for every piece of personalization.

**Trigger:** Tap "Why this?" on any card.

**Panel content:**
```
Why you're seeing this

[Item title preview]

- Because you saved 8 posts on trail running
- Because @username (someone you trust) engaged with this
- Because you added "outdoor fitness" to your shelves
- This creator was rated helpful by 3 people in your network

[Edit these signals ›]
[See less like this]
[Remove this signal]
```

**Rules:**
- Plain language always. No "machine learning" jargon.
- Every signal shown is editable from this panel.
- Always show the source bucket as the first reason: "From your [Friends / Groups / Shelves / Adjacent discovery]."
- If the item is a serendipity pick, say so plainly: "This is a discovery pick — adjacent to your [Shelf] interest, within your 15% discovery budget."
- If distribution was limited by a safety or spam label, show a notice here (not silently hidden).
- "Edit these signals" links to a dedicated personalization settings screen.
- Never show a reason you can't explain. If the model can't articulate it, don't surface the content.

### 3.10 Baseline View Switcher

The Constitution mandates that a non-ranked view is always available within every intent. This is a first-class UI element, not a buried setting.

**Placement:** Top of the deck view, accessible via a toggle adjacent to the intent pill.

**Design:**
```
[📖 Learn ▾]  ·  [Harbor Ranked | Following only]
```

- Appears as a segmented control or a small toggle next to the intent label
- "Harbor Ranked" is the default; "Following only" switches to chronological from followed accounts/groups
- State persists per intent until the user changes it
- No explanatory text needed — the label is self-evident
- Switching view does not reset the deck counter; it generates a new deck for the same intent

**Rules:**
- This control must survive every product iteration. It cannot be removed or hidden.
- It is a constitutional requirement, not a feature.

### 3.11 Enforcement Notice

When distribution of a piece of content is limited due to policy, spam controls, or safety labels, the affected user must see a clear, specific notice — not silence.

**Design (shown on affected content):**
```
┌─────────────────────────────────┐
│  ⚠ Reach limited                │
│  This post's distribution has   │
│  been reduced. [See why ›]      │
│  [Appeal this decision ›]       │
└─────────────────────────────────┘
```

**Rules:**
- Notice is shown to the content author, not to all viewers.
- "See why" opens a specific explanation (policy section, label type) — never a vague "community guidelines" brush-off.
- Appeal path is always present unless the violation is for content that would enable abuse if the path were disclosed (spam/bot evasion edge case — must be documented and reviewed).
- Visual treatment: uses `--accent-caution` (amber), not red. Not alarming. Just honest.
- This component is part of the Profile → Notices screen for the author, and appears inline when the author views their own post.

---

## 4. Screen Architecture

### 4.1 Navigation

Harbor uses a **bottom tab bar** on mobile with 4 tabs:

```
[Home/Intent]  [Shelves]  [Explore]  [Profile]
```

- **Home/Intent** launches the Intent Selector. Explore is a tab here but also a full intent mode (generates a finite deck). They are the same thing — the tab is a shortcut into the Explore intent.
- No notification bell in primary nav (notifications are in Profile or a dedicated pull-down)
- No "direct message" icon in primary nav for MVP (deprioritizes status/DM anxiety)
- Active tab uses filled icon + `--accent-primary` color
- Badge counts use `--accent-primary` (never red)
- Civic Lane has no dedicated tab — it is only accessible as an intent mode (if opted in) or from Profile → Civic Lane Settings

### 4.2 Screen Map

```
App Entry
└── Intent Selector (mandatory)
    ├── Deck View (20 cards)
    │   ├── Card Detail (expand)
    │   ├── Creator Profile
    │   ├── Community Thread
    │   ├── Civic Lane (if opted in)
    │   └── Deck Complete → Check-In
    │
    ├── Shelves (Library)
    │   ├── Shelf View
    │   │   ├── Saved Item Detail
    │   │   └── Shelf Settings
    │   └── New Shelf
    │
    ├── Explore
    │   ├── Topic Browse (curated, capped)
    │   ├── Creator Discovery
    │   └── Community Browser
    │
    └── Profile
        ├── Your Signals (personalization dashboard)
        ├── Sessions (history)
        ├── Notices (enforcement notices + appeal status)
        ├── Civic Lane Settings
        ├── Notification Preferences
        └── Account Settings
            ├── Data Export
            ├── Signal Reset
            └── Delete Account
```

### 4.3 Onboarding Flow

```
1. Welcome screen (Harbor mission in 2 sentences)
2. "What are you interested in?" → shelf seed selection (minimum 3 to proceed)
3. "Who do you know here?" → contact/social graph import (optional, skippable)
   + "Join a community" — suggest 2–5 starter communities (local/hobby/professional)
4. "How do you want to discover things?" → serendipity budget slider (default: medium)
5. "Do you want civic content?" → explicit opt-in (default: off)
6. First Intent Selector → first deck
```

**Rules:**
- Onboarding is max 5 steps.
- Every step is skippable except shelf seeding (at least 3 required to start).
- Never ask for notification permissions on step 1. Wait until the user has had a successful session.
- Cold-start decks default to Learn/Shelves until the friend graph is populated. Do not substitute trending content to fill emptiness — better to show an honest empty state and prompt community joining.

---

## 5. Content System

### 5.1 Content Types

| Type | Intent Mode | Display Format |
|---|---|---|
| Short post (≤280 chars) | Catch Up, Connect | Compact card |
| Long post / thread | Learn, Connect | Expandable card with read progress |
| Article link | Learn, Catch Up | Link card with excerpt + estimated read time |
| Image post | Delight, Connect | Media card (no autoplay) |
| Video | Delight, Learn | Static thumbnail, tap to play, no autoloop |
| Community thread | Connect | Thread card with reply count |
| Event | Connect | Event card with RSVP |
| Creator newsletter | Learn | Article card with subscribe CTA |

### 5.2 Creator Signals

What Harbor uses to surface creator content:

**Positive signals (used):**
- Saves to shelves
- "Helpful" / "Well said" / "Made me think" reactions
- Reply quality (length, constructiveness — heuristic)
- Relationship strength (mutual engagement over time)
- Shelf endorsement by trusted network

**Negative signals (used):**
- "Skip" (fast scroll past)
- Explicit "less of this"
- Check-in: "no, I didn't get what I came for" after a deck heavy with this creator
- Community mod actions

**Signals intentionally ignored (banned by Ranking Charter):**
- Total follower count
- Raw like count
- Repost/share velocity
- Time spent on item (engagement bait trap)
- Rage comments (treated as negative signal, never positive)
- Watch time / session length
- Refresh frequency

---

## 6. Accessibility

### 6.1 Baseline Requirements

- WCAG 2.1 AA minimum across all screens and color modes
- All interactive elements minimum 44×44px touch target
- Focus rings: 2px solid `--accent-primary`, 2px offset — never hidden
- All images require alt text (enforced at upload)
- Video requires captions (auto-generated + editable)

### 6.2 Motion

- All animations respect `prefers-reduced-motion: reduce`
- With reduced motion: cross-fades replace slides; no spring animations
- Loading states: simple opacity pulse, not spinning indicators

### 6.3 Text & Reading

- User-adjustable text size (system font scale respected)
- Reading mode available on all long-form content: removes UI chrome, increases line-height to 1.8, switches to Lora
- High contrast mode: tested against `prefers-contrast: more`

---

## 7. Anti-Patterns (What We Will Never Build)

These are not aspirational prohibitions — they are structural constraints enforced in design reviews.

| Anti-Pattern | Why It's Banned | What We Do Instead |
|---|---|---|
| Infinite scroll | Removes natural stopping points | Finite 20-card decks with explicit continuation |
| Red notification badges | Triggers urgency/anxiety | Blue-grey badges; notifications batched |
| Follower count prominence | Status game fueling | Follower count is in profile settings, not a billboard |
| Auto-play video | Forces passive consumption | Tap to play; no autoloop |
| Engagement count as primary metric | Rewards viral outrage | Save/shelf count; "helpful" reactions |
| Streak/daily active pressure | Compulsion loop | No streaks. No "you haven't visited in X days." |
| "People are talking about this" urgency | FOMO injection | Content appears in the right intent mode when relevant |
| Full-screen interstitial ads | Interrupts purpose | Sponsored content labeled, in-deck, skippable |
| Notification permission pop-up on first launch | Trust violation | Ask after first successful session |
| Rage-comment amplification | Makes anger profitable | Rage comments are a negative signal, never surfaced |
| Trending outrage bucket | Hijacks any intent with whatever's inflammatory today | No global trending feed. Explore has curated topic browsing only. |
| Covert moderation / shadow banning | Users assume manipulation when they can't tell what's happening | Enforcement notices are required for all reach-impacting actions, with appeal paths |
| Silent political injection | Compounds distrust and political manipulation | Civic content is opt-in and stays in its lane; never silently inserted elsewhere |

---

## 8. Notification & Messaging UI Guidelines

### Core Principle

Harbor must provide awareness ("a message arrived") without creating compulsion (scoreboards, urgency pressure, variable-reward pings). Every notification decision should pass the same test as every other screen: does this help the user finish, or does it keep them stuck?

### In-App Indicators

- **Messages tab:** a single dot appears when any unread messages exist. No numbers anywhere by default.
- The dot clears when the user visits Messages or explicitly marks all read.
- This applies to all notification surfaces — no numeric badge counts on the app icon or any tab.

### Push Notifications — Default Behavior

- **Content-free by default:** show sender name only (e.g., "New message from Alex"). No message preview unless the user explicitly enables it.
- **Rate-limited per conversation:** at most 1 push per conversation per N minutes while messages continue to arrive, to prevent rapid-fire pings.
- **Batched on burst:** if multiple messages arrive in a short window, send one summary notification ("You have new messages") rather than one per message.
- **Quiet hours:** user-configurable do-not-disturb hours; defaults follow device/timezone settings.

### User Notification Modes (Settings)

| Mode | Behavior |
|---|---|
| **Polite Push** (default) | Immediate push, rate-limited and batched per the defaults above |
| **Digest Mode** | No immediate push; notifications delivered in scheduled batches (e.g., hourly or morning/evening) |
| **Manual Check** | No push notifications at all; only the in-app dot |

### Priority Contacts (Optional, Strictly Limited)

- Users may designate a small number of priority contacts whose messages can bypass Digest Mode and arrive as immediate (rate-limited) pushes.
- Priority contacts are still content-free and rate-limited.
- No "VIP urgency" visual treatment beyond the delivery timing difference.

### Explicitly Disallowed

- Numeric badge counts on the app icon.
- Numeric badge counts on the Messages tab or any other tab.
- Streaks, "last active X minutes ago" pressure cues, or any mechanic designed to increase checking frequency.
- Push notification content (preview text, sender pattern) used as a personalization or ranking signal.
- Any notification pattern that mimics variable-reward loops (e.g., unpredictable timing designed to increase opens).

---

## 9. Design Tokens Reference

All design tokens are defined in a single source-of-truth file (`tokens.json` / CSS custom properties / Figma variables). Tokens follow the pattern:

```
--[category]-[variant]-[state]
```

Example:
```css
--color-accent-primary
--color-accent-primary-hover
--color-accent-primary-disabled
--space-card-padding
--radius-card
--shadow-card
--duration-transition-normal
```

Platform implementations:
- **Web:** CSS custom properties in `:root` and `[data-theme="dark"]`
- **iOS:** Swift `Color` extensions + `UIColor` semantic names
- **Android:** Material You tokens mapped to Harbor tokens
- **Design tool:** Figma Variables (synced with Style Dictionary)

---

## 10. Design Principles Summary

1. **Finish is the goal.** Every screen should make it easy to be done.
2. **One job per screen.** No screen serves two masters.
3. **Transparency is a feature.** Every personalization signal is visible and editable. Enforcement is never silent.
4. **Friction is intentional.** Friction on sharing, loading more, and civic content is a feature, not a bug.
5. **Calm is the aesthetic.** No pulsing, no urgency, no red, no countdown timers.
6. **White space is structural.** Density is never used to maximize content exposure.
7. **The metaphor holds.** When unsure, ask: does this feel like a harbor or a casino?
8. **The baseline is always there.** Every ranked surface has a chronological fallback. It cannot be removed.
9. **Serve all four needs honestly.** Belonging, Usefulness, Identity, and Delight — not one weaponized at the expense of the others.
10. **Drift has a design smell.** If a proposed UI makes staying easier than leaving, it's wrong. Review it.
