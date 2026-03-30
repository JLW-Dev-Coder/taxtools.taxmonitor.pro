export interface Game {
  slug: string
  title: string
  description: string
  instructions: string
  tokenCost: number
}

export const GAMES: Game[] = [
  {
    slug: 'circular-230-quest',
    title: 'Circular 230 Quest',
    description: 'A guided challenge through Circular 230 concepts with zones, quizzes, and progression.',
    instructions: 'Navigate 5 zones (Subpart A through E) with quizzes at each zone. Earn badges as you clear core concepts. 25 questions total across 5 zones.',
    tokenCost: 1,
  },
  {
    slug: 'irs-notice-jackpot',
    title: 'IRS Notice Jackpot',
    description: 'Spin, match IRS notice numbers to clues, and hit 7 out of 10 to land the jackpot.',
    instructions: 'Match clue descriptions to correct IRS notice codes. You get instant feedback. Correct matches reveal sample letter previews. Win condition: 7 out of 10 correct.',
    tokenCost: 1,
  },
  {
    slug: 'irs-notice-showdown',
    title: 'IRS Notice Showdown',
    description: 'Match notice excerpts to the correct IRS notice in a fast, replayable 10-round showdown.',
    instructions: 'A 10-round matching game where you drag notice excerpts to match the correct notice code. Need 3+ correct to win. Resume supported for active sessions.',
    tokenCost: 1,
  },
  {
    slug: 'irs-tax-detective',
    title: 'IRS Detective',
    description: 'Decode the mystery of refund offsets by matching IRS transaction codes to their meanings.',
    instructions: 'Match IRS transaction codes (like 820 and 826) to their meanings. Demonstrates pattern recognition for credit transfers and overpayment codes.',
    tokenCost: 1,
  },
  {
    slug: 'match-the-tax-notice',
    title: 'Match the Tax Notice',
    description: 'Match real IRS notice codes to their descriptions in a 10-question speed round. Win at 3 out of 10.',
    instructions: 'Read notice descriptions and pick the correct CP-series notice code. Fast recall format with 10 questions per play. Win threshold: 3 correct out of 10.',
    tokenCost: 1,
  },
  {
    slug: 'tax-deadline-master',
    title: 'Tax Deadline Master',
    description: 'A 10-question challenge to help you remember major IRS and federal tax deadlines with scoring and streaks.',
    instructions: 'Answer 10 deadline questions covering filing dates, estimated tax schedule, W-2/1099 timing, and more. Each question worth 10 points. Build streaks for momentum.',
    tokenCost: 1,
  },
  {
    slug: 'tax-deduction-quest',
    title: 'Tax Deduction Quest',
    description: 'Match real deductions to the correct category across 15 deduction categories. Fast recall, clear scoring, repeatable reps.',
    instructions: 'Match deduction items to one of 15 categories (Home & Mortgage, Education, etc). 45 prompts total, base scoring +10 per correct. Streak system with leveling every 5 correct.',
    tokenCost: 1,
  },
  {
    slug: 'tax-document-hunter',
    title: 'Tax Document Hunter',
    description: 'Collect tax documents, earn points, and build a trophy-case list you can actually use.',
    instructions: 'Hunt and categorize tax documents into 10 categories with different point values. Income documents = 10 points, Deduction = 15, Investment = 20, Business = 22. 5 levels to unlock.',
    tokenCost: 1,
  },
  {
    slug: 'tax-jargon-game',
    title: 'Tax Jargon Game',
    description: 'A fast vocabulary trainer for tax terms with quizzes, flashcards, lightning rounds, and progress.',
    instructions: 'Three modes: Quiz (multiple choice), Flashcards (rapid recall), and Lightning (speed rounds). 200+ terms covered. 5 badges available. Progress is tracked.',
    tokenCost: 1,
  },
  {
    slug: 'tax-strategy-adventures',
    title: 'Tax Strategy Adventures',
    description: 'A guided challenge through tax strategy concepts with zones, cards, and progression.',
    instructions: 'A zone-based strategy adventure with 5 zones (Novice, Builder, Warrior, Legend, Library). Collect and review 24 strategy cards. XP-based progression system.',
    tokenCost: 1,
  },
  {
    slug: 'tax-tips-refund-boost',
    title: 'Tax Tips Refund Boost',
    description: 'A 20-question quiz with streak tracking and power-ups (50/50 + skip). Built for quick, practical tax learning.',
    instructions: '20-question quiz covering tax basics, credits, deductions, income reporting, and retirement limits. Features power-ups (50/50 eliminator and skip). Streak tracking and scoring.',
    tokenCost: 1,
  },
]
