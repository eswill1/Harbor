import { FastifyInstance } from 'fastify'

// ─── Types ────────────────────────────────────────────────────────────────────

type IntentId    = 'catch_up' | 'learn' | 'connect' | 'create' | 'delight' | 'explore' | 'civic'
type SourceBucket = 'friends' | 'groups' | 'shelves' | 'discovery'
type ArousalBand  = 'low' | 'medium' | 'high'

interface StubCard {
  id:             string
  position:       number
  creator:        { name: string; handle: string }
  content:        string
  source_bucket:  SourceBucket
  is_serendipity: boolean
  arousal_band:   ArousalBand
}

// ─── Stub content by intent ───────────────────────────────────────────────────
// Double-quoted to avoid issues with curly apostrophes in content strings.

/* eslint-disable quotes */
const STUB_CONTENT: Record<IntentId, string[]> = {
  catch_up: [
    "Had the most unexpectedly lovely afternoon. Sometimes the unplanned hours are the best ones.",
    "Three months in and I still can't believe how much this city has taught me.",
    "Finally finished that book I've been carrying around for two years. Worth every page.",
    "The bakery two streets down started doing a sourdough on Thursdays. Life is better now.",
    "Quiet weekend. Fixed the bike, called my dad, made soup. Feeling more human than I have in weeks.",
    "Reminder that the people who remember your birthday without Facebook prompts are the real ones.",
    "We shipped the thing. Team is exhausted and proud in equal measure.",
    "First frost of the season this morning. The dog had opinions.",
    "Spent the afternoon helping my neighbour sort her archive. Found photographs from 1967. Incredible.",
    "Six months sober today. Didn't think I'd say that and mean it. Here we are.",
    "The show everyone told me to skip? Absolutely worth watching. Don't listen to the discourse.",
    "Sometimes a 20-minute walk at lunch is the only thing that saves the afternoon.",
    "New kitten update: she has claimed the good chair. We have accepted her terms.",
    "Job news dropping this week. Nervous and ready at the same time.",
    "The garden finally looks like something this year. Patience is a skill apparently.",
    "Genuinely moved by how kind strangers were today. Faith in humanity: briefly restored.",
    "Leaving for the trip on Friday. First proper holiday in three years.",
    "Long meeting turned into a long lunch turned into a really good afternoon.",
    "Finished the renovation. The bathroom won. I'm just glad it's over.",
    "My grandmother turned 89. She still beats everyone at cards.",
  ],
  learn: [
    "The reason your brain resists learning hard things isn't laziness — it's prediction error. A thread on how to work with it.",
    "I spent six months reading every major study on sleep and here's what actually holds up under scrutiny.",
    "Why the most useful mental model I've found isn't from psychology or philosophy but from marine navigation.",
    "The history of the index card is also the history of how knowledge gets organised. Fascinating deep dive.",
    "Fermentation is one of the oldest technologies humans have. Here's what we're still learning from it.",
    "A practical guide to reading scientific papers without a PhD. The structure isn't as opaque as it looks.",
    "What chess engines taught us about human intuition — and where intuition still beats calculation.",
    "The difference between knowing something and understanding it is larger than most people realise.",
    "How to build a personal knowledge system that actually survives contact with a busy life.",
    "Why most productivity advice is optimised for the wrong thing — and what the research actually shows.",
    "The economics of attention: a short, honest guide to why your time costs more than you think it does.",
    "I've been studying how experts in different fields learn. The patterns are surprising and consistent.",
    "What linguists know about language learning that apps haven't caught up with yet.",
    "The case for keeping a 'wrong ideas' notebook alongside your normal notes.",
    "Cognitive load theory explains why good design makes you smarter. Here's the actual science.",
    "Short guide to Bayesian thinking that doesn't require you to know any maths.",
    "How ancient Greek philosophers organised their days — and what still applies.",
    "The best technical writers do something specific that most people never notice. Breaking it down.",
    "Why your memory for stories is so much better than your memory for facts — and how to exploit that.",
    "A field guide to spotting bad data visualisation before it misleads you.",
  ],
  connect: [
    "Anyone want to join a small group working on sustainability projects this autumn?",
    "Running a free monthly call for independent writers. No agenda, just good conversation. DM for the link.",
    "Starting a book club that actually finishes books. Four people, one book, one month. Looking for three more.",
    "Parents of kids with ADHD — there's a new local group starting up. Details in the replies.",
    "Amateur radio operators in the southwest: informal meetup being planned. Reply or DM.",
    "Looking for a cofounder who cares as much about ethics as product. Building in healthtech. Let's talk.",
    "Looking for a designer who wants to do pro bono work for a food bank rebranding.",
    "Any teachers doing interesting things with project-based learning? Want to connect and swap notes.",
    "Hosting a small dinner for people working on climate solutions. Very limited seats.",
    "New to this city. Looking for hiking partners who don't mind a slower pace and good conversation.",
    "Starting a peer accountability group for people building creative practices alongside day jobs.",
    "Anyone interested in a fortnightly no-phones board game evening?",
    "Looking for collaborators on a documentary about community land trusts. Seeking filmmakers and storytellers.",
    "Any nurses or healthcare workers interested in a wellbeing peer support group?",
    "Small community of makers doing a winter craft market. Looking for two more vendors.",
    "Running a coding workshop for teenagers from low-income backgrounds. Need volunteer mentors.",
    "Trying to find other people who care about local food systems. Is anyone organising near you?",
    "Starting a reading group on political philosophy. Accessible texts, open minds, good faith required.",
    "Open invitation: if you're new to the industry and want an informal 30-minute chat, my calendar is open.",
    "Solo traveller looking for a walking partner for two weeks in Portugal next spring.",
  ],
  create: [
    "Seeking a writer who can help me shape 18 months of field notes into something readable. Revenue share.",
    "I have the visual concept. I need someone who can bring it to life in code. Let's talk.",
    "Looking for feedback on a short story draft before I send it to magazines. Swaps welcome.",
    "Anyone want to co-author something? I have a research angle, you might have the reach. Open to ideas.",
    "Prompt for today: write the first paragraph of a novel that begins with its own ending.",
    "Seeking a composer for a short film score. Atmospheric, not dramatic. Budget confirmed.",
    "I made a thing and I need honest eyes on it before I ship. DMs open.",
    "Open call: photographers to document a community project over six months. Unpaid but credited.",
    "Working on a newsletter and struggling with consistency. Looking for an accountability partner.",
    "Prompt: design something that helps people stop before they overshare. What does that look like?",
    "Who wants to do a creative exchange? You give me a brief, I give you one back. Two weeks turnaround.",
    "My podcast needs a new co-host. Topic: technology and its discontents. Curiosity required, expertise optional.",
    "Working on a children's book about patience. Need an illustrator who gets quiet visual storytelling.",
    "Open studio day next Saturday. Bring something you're stuck on. We'll workshop it together.",
    "Looking for a research partner to dig into the history of a very specific corner of social history.",
    "Feedback wanted on a product landing page. Does the value proposition land in 10 seconds?",
    "Writing a musical. Looking for someone to collaborate on lyrics. I have the melodies and the story.",
    "Does anyone want to start a small creative accountability cohort? Six people, six weeks, one goal each.",
    "Prompt: redesign something you use every day so that it makes you pause before using it.",
    "Seeking a structural editor who understands non-linear narrative.",
  ],
  delight: [
    "My cat has been sitting in the same cardboard box for eleven days and I think she prefers it to any furniture I've ever bought her.",
    "The local council named a new pedestrian crossing after a much-loved lollipop lady who worked there for 34 years. This is the correct use of public recognition.",
    "Found a note in a second-hand book that said 'this is the best book I have ever read, I hope whoever finds this agrees.' I agree.",
    "The bird that visits my garden every morning has started bringing a friend. I have started leaving two portions of seeds.",
    "Someone at the farmer's market was selling 'slightly irregular' honey and I've never felt more seen by a product description.",
    "Overheard a child explain to her father that clouds are 'sky pillows.' This is the only correct scientific description.",
    "The funniest part of getting older is realising that most of the adults you feared as a child were just tired.",
    "A stranger held the door for me today from an implausible distance. We both committed to it fully. It was a journey.",
    "My grandmother has started texting using full punctuation and I think she might be the most sophisticated communicator in the family.",
    "The dog knows what Saturday means. I don't know how she knows. She just does.",
    "An eight-year-old told me my work sounds 'sort of important but also boring' and this is the most accurate review I've ever received.",
    "Watched a seagull steal an entire pasty, look completely unashamed, and fly away like a CEO leaving a difficult meeting.",
    "The library near me has a 'things people left behind' shelf. Current items: one hat, a pressed flower, and a very small harmonica.",
    "Updated my out-of-office to say I'm 'exploring the concept of not replying.' Boss has not yet commented.",
    "The crows in the park have definitely figured out the bin system. They are smarter than at least three adults I know.",
    "Put houseplants where I thought I wanted a TV. I think the plants were the right call.",
    "A child on the bus explained to me, unprompted, the entire plot of a book she had not yet finished. I am invested.",
    "My local cafe started writing a small fact on the chalkboard each morning. Today's: otters hold hands while sleeping.",
    "Someone left a box of novels outside their house with a sign that said 'these are sad books but worth it.' Took three.",
    "The pigeons outside my window have sorted themselves into what I can only describe as a standing committee.",
  ],
  explore: [
    "Been documenting urban rewilding projects for two years. This thread is what I've found.",
    "A ceramicist in rural Wales who only sells at one market per year and has a three-year waitlist. Worth knowing about.",
    "The most interesting publication you've never heard of: a quarterly on infrastructure and its discontents.",
    "This community has been quietly building something remarkable for five years with no outside funding.",
    "A photographer shooting rural churches in decline. The work is extraordinary and barely seen.",
    "Small studio in Edinburgh making furniture from reclaimed shipyard timber. Following them closely.",
    "A writer covering the economics of fishing communities with more precision than any major outlet.",
    "The most consistently interesting account on here is a retired hydrologist who posts about rivers.",
    "This newsletter on urban planning is the only one I never skip. Meticulous and readable.",
    "A musician who performs only at dawn in specific locations. Has posted three recordings in eight years.",
    "The cartographer making hand-drawn maps of places that no longer exist. The series is quietly stunning.",
    "A community radio station that broadcasts three hours a week to an audience of maybe two hundred people.",
    "This small cooperative has been publishing long-form journalism on indigenous land rights for a decade.",
    "The only garden I've found that genuinely experiments rather than performs. Very little audience. Pure work.",
    "A marine biologist who posts short, specific observations from field work. No editorialising. Just data.",
    "Someone is systematically photographing every remaining phone box in Scotland. 847 so far.",
    "A software tool built by one person to help communities track local planning decisions. Should be everywhere.",
    "A chef who only posts once a month. Every post is a complete essay on one ingredient.",
    "The most reliable weather forecaster I've found is an amateur with a garden station and forty years of notes.",
    "A therapist writing about the emotional dimensions of financial precarity. More useful than most economics.",
  ],
  civic: [
    "New analysis of the housing bill's impact on rural communities. The numbers are not what was announced.",
    "A ward councillor explains what actually happens in local budget meetings. More useful than most reporting.",
    "The planning application that could change the character of three neighbourhoods. Public consultation closes Friday.",
    "Investigative piece on how school funding formulas produce the outcomes they claim to address.",
    "The bill passed quietly last month has a clause that most people missed. Here's what it means.",
    "Long read on the history of how the current health service structure came to be, and what was lost.",
    "An independent audit of last year's city transport spending. The discrepancies are worth knowing about.",
    "Local election results by ward with full historical comparison. The shifts are not what was reported.",
    "Why the environmental impact assessment for the proposed development does not hold up. Technical but important.",
    "Interview with a former regulator on what effective oversight of financial institutions actually requires.",
    "The housing association has published its accounts. A few people have read them. Here's what stands out.",
    "What the freedom of information request revealed about the procurement process. Long but documented.",
    "A data journalist breaks down why the crime statistics published last week are being misread.",
    "The planning committee meets Thursday. This is what's on the agenda and what it would change.",
    "Oral history project: people who worked in the industries that shaped this region's economy.",
    "How other countries handle social care funding and what the evidence says about outcomes.",
    "The leaked memo about service cuts and what the official response does not address.",
    "A coroner's inquest revealed systemic failures. The report was published. Most outlets did not cover it.",
    "Analysis of which demographics actually use the services being proposed for cuts.",
    "The proposed changes to the local development plan: a plain-language guide to what it means for residents.",
  ],
}
/* eslint-enable quotes */

const SOURCE_BUCKETS: SourceBucket[] = ['friends', 'groups', 'shelves', 'discovery']

const STUB_CREATORS = [
  { name: 'Maya Osei',           handle: 'mayaosei' },
  { name: 'Thomas Brunn',        handle: 'tbrunn' },
  { name: 'Priya Menon',         handle: 'priyam' },
  { name: 'James Okeke',         handle: 'jokeke' },
  { name: 'Saoirse Flynn',       handle: 'saoirsef' },
  { name: 'Daniel Reyes',        handle: 'danielreyes' },
  { name: 'Aiko Tanaka',         handle: 'aiko_t' },
  { name: 'Lena Kovac',          handle: 'lenakovac' },
  { name: 'Kwame Asante',        handle: 'kwameasante' },
  { name: 'Fatima Al-Rashid',    handle: 'fatimaar' },
  { name: 'Emre Yildiz',         handle: 'emrey' },
  { name: 'Chloe Beaumont',      handle: 'chloe_b' },
  { name: 'Marcus Webb',         handle: 'mwebb' },
  { name: 'Yuki Nakamura',       handle: 'yukinakamura' },
  { name: 'Ingrid Halvorsen',    handle: 'ingridh' },
  { name: 'Dele Adeyemi',        handle: 'dele_a' },
  { name: 'Sofia Herrera',       handle: 'sofia_h' },
  { name: 'Ravi Sharma',         handle: 'ravi_s' },
  { name: 'Anna Kowalski',       handle: 'annak' },
  { name: 'Tobias Richter',      handle: 'tobiasrichter' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildStubDeck(intent: IntentId): StubCard[] {
  const contentPool = shuffle(STUB_CONTENT[intent])
  const creatorPool = shuffle(STUB_CREATORS)
  const bucketPool  = shuffle([
    ...SOURCE_BUCKETS,
    ...SOURCE_BUCKETS,
    ...SOURCE_BUCKETS,
    'discovery',
  ] as SourceBucket[])

  return Array.from({ length: 20 }, (_, i) => ({
    id:             crypto.randomUUID(),
    position:       i + 1,
    creator:        creatorPool[i % creatorPool.length],
    content:        contentPool[i % contentPool.length],
    source_bucket:  bucketPool[i % bucketPool.length],
    is_serendipity: bucketPool[i % bucketPool.length] === 'discovery',
    arousal_band:   'low' as ArousalBand,
  }))
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default async function deckRoutes(app: FastifyInstance) {
  // POST /api/decks — create a session and return a stub deck
  app.post('/api/decks', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { intent } = request.body as { intent: IntentId }

    const validIntents: IntentId[] = [
      'catch_up', 'learn', 'connect', 'create', 'delight', 'explore', 'civic',
    ]
    if (!validIntents.includes(intent)) {
      return reply.status(400).send({ error: 'Invalid intent' })
    }

    const { userId } = request.user

    const { rows } = await app.db.query<{ id: string }>(
      'INSERT INTO sessions (user_id, intent) VALUES ($1, $2) RETURNING id',
      [userId, intent],
    )

    const session_id = rows[0].id
    const cards      = buildStubDeck(intent)

    return reply.send({ session_id, intent, cards })
  })

  // POST /api/sessions/:id/complete — record satisfaction and close session
  app.post('/api/sessions/:id/complete', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id }           = request.params as { id: string }
    const { satisfaction } = request.body as { satisfaction: 1 | 2 | 3 }
    const { userId }       = request.user

    if (![1, 2, 3].includes(satisfaction)) {
      return reply.status(400).send({ error: 'satisfaction must be 1, 2, or 3' })
    }

    const { rowCount } = await app.db.query(
      `UPDATE sessions
          SET ended_at = NOW(), satisfaction = $1, deck_count = 1
        WHERE id = $2 AND user_id = $3`,
      [satisfaction, id, userId],
    )

    if (rowCount === 0) {
      return reply.status(404).send({ error: 'Session not found' })
    }

    return reply.send({ ok: true })
  })
}
