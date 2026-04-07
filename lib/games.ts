export type GameTier = 'quick' | 'standard' | 'premium'

export interface DemoQuestion {
  type: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface Game {
  slug: string
  title: string
  description: string
  tokenCost: number
  tier: GameTier
  category: string
  features: string[]
  demoQuestions: DemoQuestion[]
}

export const GAMES: Game[] = [
  {
    slug: 'irs-tax-detective',
    title: 'IRS Tax Detective',
    description: 'A detective-themed matching game where you decode IRS transaction codes and solve the mystery of a refund offset.',
    tokenCost: 2,
    tier: 'quick',
    category: 'Matching',
    features: [
      'Identify common IRS transaction codes',
      'Match codes to their plain-English meanings',
      'Build streaks across four progression levels',
      'Fast reps for credential prep',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'What does IRS Transaction Code 826 represent?',
        options: [
          'Tax return preparation fee',
          'Child tax credit offset',
          'Refund offset for a non-tax federal debt',
          'Estimated tax adjustment',
        ],
        correct: 2,
        explanation: 'Code 826 reflects a credit transfer to satisfy another federal debt, commonly a refund offset.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which transaction code typically indicates federal income tax withheld from wages?',
        options: ['TC 150', 'TC 430', 'TC 806', 'TC 971'],
        correct: 2,
        explanation: 'TC 806 represents W-2/1099 federal income tax withholding credited to the account.',
      },
    ],
  },
  {
    slug: 'tax-mythbusters-interactive-quiz',
    title: 'Tax Mythbusters Quiz',
    description: 'An interactive true-or-false quiz that debunks common tax myths with clear explanations.',
    tokenCost: 2,
    tier: 'quick',
    category: 'Quiz',
    features: [
      'True/false statement cards',
      'Flip-reveal explanations after each answer',
      'Covers myths about audits, refunds, and deductions',
      'Confidence-based scoring',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'True or false: Filing an amended return automatically triggers an audit.',
        options: ['True', 'False'],
        correct: 1,
        explanation: 'False. Amended returns are routine corrections and are not an automatic audit trigger.',
      },
      {
        type: 'Multiple Choice',
        question: 'True or false: You can deduct all personal expenses from your tax return.',
        options: ['True', 'False'],
        correct: 1,
        explanation: 'False. Only specific categories (e.g., mortgage interest, qualified charitable donations) are deductible.',
      },
    ],
  },
  {
    slug: 'tax-scavenger-hunt',
    title: 'Tax Scavenger Hunt',
    description: 'Click through an office scene to find hidden tax documents and learn where each one belongs.',
    tokenCost: 2,
    tier: 'quick',
    category: 'Scavenger',
    features: [
      'Click-based document discovery',
      'Hidden hotspot mechanics',
      'Learn the role of W-2, 1099, and supporting forms',
      'Progress tracking and point scoring',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which form is provided by an employer to report wages and withholding?',
        options: ['Form 1099-NEC', 'Form W-2', 'Form 1098', 'Schedule C'],
        correct: 1,
        explanation: 'Form W-2 is the wage and tax statement employers issue to employees each year.',
      },
      {
        type: 'Multiple Choice',
        question: 'Where would a freelancer look for their non-employee compensation?',
        options: ['W-2 Box 1', '1099-NEC Box 1', '1098-T Box 5', 'Schedule A Line 1'],
        correct: 1,
        explanation: '1099-NEC Box 1 reports non-employee compensation paid to independent contractors.',
      },
    ],
  },
  {
    slug: 'tax-time-machine',
    title: 'Tax Time Machine',
    description: 'An interactive timeline showing how U.S. tax law evolved from the 19th century to today.',
    tokenCost: 2,
    tier: 'quick',
    category: 'Timeline',
    features: [
      'Click year markers to reveal key tax events',
      'Learn the context behind major reforms',
      'See how rates and deductions changed over time',
      'Visual timeline animations',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'When was the 16th Amendment ratified, establishing the federal income tax?',
        options: ['1862', '1913', '1935', '1954'],
        correct: 1,
        explanation: 'The 16th Amendment was ratified in 1913, authorizing the modern federal income tax.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which act was a landmark overhaul of the U.S. tax code in the 1980s?',
        options: ['Tax Reform Act of 1969', 'Tax Reform Act of 1986', 'Revenue Act of 1978', 'Taxpayer Relief Act of 1997'],
        correct: 1,
        explanation: 'The Tax Reform Act of 1986 broadened the base and lowered rates in a sweeping reform.',
      },
    ],
  },
  {
    slug: 'match-the-tax-notice',
    title: 'Match the Tax Notice',
    description: 'Read notice descriptions and pick the correct CP-series notice code in a 10-question speed round.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Matching',
    features: [
      'Real IRS notice descriptions',
      'Multiple-choice matching format',
      'Progress bar and scoring',
      'Win condition at 3 of 10 correct',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which notice is the first bill for unpaid taxes?',
        options: ['CP14', 'CP2000', 'CP504', 'CP11'],
        correct: 0,
        explanation: 'CP14 is the first balance-due notice the IRS sends when taxes are owed.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which notice proposes changes based on third-party reporting mismatches?',
        options: ['CP05', 'CP2000', 'CP14', 'CP71C'],
        correct: 1,
        explanation: 'CP2000 proposes adjustments when amounts reported by employers or payers differ from the return.',
      },
    ],
  },
  {
    slug: 'irs-notice-jackpot',
    title: 'IRS Notice Jackpot',
    description: 'A slot-machine matching game — spin, match notice codes to their clues, and hit 7 of 10 to win the jackpot.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Matching',
    features: [
      'Slot machine spin mechanic',
      'Match real IRS notices to clues',
      'Sample letter previews on correct match',
      'Jackpot win condition at 7 of 10',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'A taxpayer receives CP504. What does this notice indicate?',
        options: [
          'First balance-due notice',
          'Final notice of intent to levy state refund',
          'Return accepted',
          'Refund offset',
        ],
        correct: 1,
        explanation: 'CP504 is a final notice warning of intent to levy a state tax refund and other property.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which notice confirms a change the IRS made to a return for a math error?',
        options: ['CP11', 'CP14', 'CP90', 'CP504'],
        correct: 0,
        explanation: 'CP11 notifies the taxpayer of math-error corrections that resulted in a balance due.',
      },
    ],
  },
  {
    slug: 'irs-notice-showdown',
    title: 'IRS Notice Showdown',
    description: 'A 10-round drag-and-drop showdown where you match notice excerpts to the correct IRS notice.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Matching',
    features: [
      'Drag-and-drop card matching',
      'Real excerpts from IRS notices',
      'Active-session resume support',
      'Win at 3 correct out of 10',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which notice is a statutory notice of deficiency (the "90-day letter")?',
        options: ['CP14', 'CP2000', 'CP3219A', 'CP504'],
        correct: 2,
        explanation: 'CP3219A is the statutory notice of deficiency giving 90 days to petition Tax Court.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which notice tells a taxpayer their return is under review?',
        options: ['CP05', 'CP11', 'CP14', 'CP21B'],
        correct: 0,
        explanation: 'CP05 informs the taxpayer that the IRS is reviewing the return and holding the refund.',
      },
    ],
  },
  {
    slug: 'tax-deadline-master',
    title: 'Tax Deadline Master',
    description: 'A 10-question challenge covering every major IRS and federal tax deadline, with streaks and scoring.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Quiz',
    features: [
      'Filing, extension, and estimated tax deadlines',
      'W-2 and 1099 issuance timing',
      'Streak and score tracking',
      '10 points per correct answer',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'What is the standard individual federal tax filing deadline?',
        options: ['March 15', 'April 15', 'May 15', 'June 15'],
        correct: 1,
        explanation: 'Individual returns are due April 15 unless that day falls on a weekend or holiday.',
      },
      {
        type: 'Multiple Choice',
        question: 'By what date must employers generally furnish W-2s to employees?',
        options: ['January 31', 'February 15', 'March 1', 'April 15'],
        correct: 0,
        explanation: 'Employers must furnish W-2s to employees by January 31 of the following year.',
      },
    ],
  },
  {
    slug: 'tax-deduction-quest',
    title: 'Tax Deduction Quest',
    description: 'Match real deductions to the correct category across 15 categories with fast recall and clear scoring.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Matching',
    features: [
      '15 deduction categories to master',
      '45 prompts per full run',
      'Streak system and levels every 5 correct',
      'Clear +10 per correct scoring',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Under IRC §162, a business expense must be:',
        options: [
          'Large and unusual',
          'Ordinary and necessary',
          'Approved by the IRS',
          'Paid in cash only',
        ],
        correct: 1,
        explanation: '§162 allows deductions for expenses that are both ordinary and necessary in carrying on a trade or business.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which of the following is generally NOT deductible as an itemized deduction?',
        options: [
          'State and local taxes (up to cap)',
          'Mortgage interest on acquisition debt',
          'Personal entertainment expenses',
          'Qualified charitable contributions',
        ],
        correct: 2,
        explanation: 'Personal entertainment is not deductible; the others are common itemized deductions.',
      },
    ],
  },
  {
    slug: 'taxpayer-journey-map',
    title: 'Taxpayer Journey Map',
    description: 'Follow a taxpayer through life events and see how each one changes their tax picture.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Adventure',
    features: [
      'Interactive event nodes along a life path',
      'Scenario-based tax decision making',
      'Explanations for each life event outcome',
      'Covers marriage, kids, home, retirement',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'After marriage, which filing statuses are available?',
        options: [
          'Single only',
          'Head of Household only',
          'Married Filing Jointly or Married Filing Separately',
          'Qualifying Widow(er) only',
        ],
        correct: 2,
        explanation: 'Marriage opens up MFJ and MFS; Single is no longer available for the full year.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which credit commonly benefits families with qualifying children?',
        options: ['Saver’s Credit', 'Child Tax Credit', 'Foreign Tax Credit', 'Residential Energy Credit'],
        correct: 1,
        explanation: 'The Child Tax Credit reduces tax liability for each qualifying child under age 17.',
      },
    ],
  },
  {
    slug: 'tax-filing-race',
    title: 'Tax Filing Race',
    description: 'A rapid-fire race against the clock — answer filing questions quickly and accurately to climb the leaderboard.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Quiz',
    features: [
      'Real-time race mechanic',
      'Speed plus accuracy scoring',
      'Leaderboard placement',
      'Covers filing status, deadlines, forms',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which form is the main individual income tax return?',
        options: ['Form 1040', 'Form 1065', 'Form 1120', 'Form 990'],
        correct: 0,
        explanation: 'Form 1040 is the primary individual income tax return filed annually with the IRS.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which form requests an automatic six-month extension for individuals?',
        options: ['Form 7004', 'Form 4868', 'Form 2350', 'Form 1040-X'],
        correct: 1,
        explanation: 'Form 4868 gives individuals an automatic six-month extension to file (but not to pay).',
      },
    ],
  },
  {
    slug: 'tax-tips-refund-boost',
    title: 'Tax Tips Refund Boost',
    description: 'A 20-question quiz with streaks and power-ups (50/50 and skip) covering practical refund-boosting tips.',
    tokenCost: 5,
    tier: 'standard',
    category: 'Quiz',
    features: [
      '20 practical questions',
      'Power-ups: 50/50 and skip',
      'Streak tracking and bonus scoring',
      'Covers credits, deductions, and retirement',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which account contribution reduces current-year taxable income?',
        options: ['Roth IRA', 'Traditional 401(k)', 'Regular savings account', 'Roth 401(k)'],
        correct: 1,
        explanation: 'Traditional 401(k) contributions are pre-tax and reduce current-year taxable income.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which credit is generally refundable for eligible low-to-moderate income workers?',
        options: ['Foreign Tax Credit', 'Earned Income Tax Credit', 'Saver’s Credit', 'Adoption Credit'],
        correct: 1,
        explanation: 'The EITC is refundable — it can produce a refund even if it exceeds the tax owed.',
      },
    ],
  },
  {
    slug: 'circular-230-quest',
    title: 'Circular 230 Quest',
    description: 'A zone-based quest through Circular 230 — the Treasury rules governing practice before the IRS.',
    tokenCost: 8,
    tier: 'premium',
    category: 'RPG',
    features: [
      '5 zones covering Subparts A through E',
      '25 questions across the full run',
      'Badges and progression',
      'Ethical rules for CPAs, EAs, and attorneys',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Under Circular 230, when a practitioner discovers a client error, they must:',
        options: [
          'Correct it silently',
          'Promptly inform the client',
          'Report to the IRS first',
          'Ignore minor errors',
        ],
        correct: 1,
        explanation: 'Circular 230 requires promptly advising the client of the error and the consequences.',
      },
      {
        type: 'Multiple Choice',
        question: 'Who may generally practice before the IRS under Circular 230?',
        options: [
          'Only CPAs',
          'CPAs, enrolled agents, and attorneys (plus limited others)',
          'Anyone with tax experience',
          'Only tax attorneys',
        ],
        correct: 1,
        explanation: 'CPAs, enrolled agents, and attorneys have full practice rights, along with limited categories.',
      },
    ],
  },
  {
    slug: 'tax-jargon-game',
    title: 'Tax Jargon Game',
    description: 'A vocabulary trainer with flashcards, quizzes, and lightning rounds for 200+ tax terms.',
    tokenCost: 8,
    tier: 'premium',
    category: 'Quiz',
    features: [
      'Quiz, flashcard, and lightning modes',
      '200+ terms across the tax code',
      'Lightning round: 10 questions in 60 seconds',
      'Badges and progress tracking',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'What does AGI stand for?',
        options: [
          'Annual Gross Income',
          'Adjusted Gross Income',
          'Average Gross Income',
          'Accrued Gross Income',
        ],
        correct: 1,
        explanation: 'AGI is Adjusted Gross Income — gross income less above-the-line adjustments.',
      },
      {
        type: 'Multiple Choice',
        question: 'A "refundable credit" means:',
        options: [
          'It carries forward to next year',
          'It can only offset tax owed',
          'It can produce a refund even with zero tax',
          'It is limited to businesses',
        ],
        correct: 2,
        explanation: 'Refundable credits can create a refund even if no tax is owed.',
      },
    ],
  },
  {
    slug: 'tax-strategy-adventures',
    title: 'Tax Strategy Adventures',
    description: 'An RPG-style progression through tax-planning strategies across novice, warrior, and legend zones.',
    tokenCost: 8,
    tier: 'premium',
    category: 'RPG',
    features: [
      '5 progression zones with XP',
      '24 strategy cards to collect',
      'Planning concepts for individuals and businesses',
      'Reference library of advanced strategies',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which strategy defers current-year taxes on investment income?',
        options: [
          'Holding in a taxable brokerage account',
          'Contributing to a Traditional IRA or 401(k)',
          'Selling appreciated assets every year',
          'Ignoring RMD rules',
        ],
        correct: 1,
        explanation: 'Traditional retirement accounts defer tax on contributions and growth until withdrawal.',
      },
      {
        type: 'Multiple Choice',
        question: 'Tax-loss harvesting works by:',
        options: [
          'Hiding income',
          'Realizing losses to offset capital gains',
          'Skipping cost-basis tracking',
          'Donating appreciated stock',
        ],
        correct: 1,
        explanation: 'Selling losing positions to offset realized gains (and up to $3,000 of ordinary income) is tax-loss harvesting.',
      },
    ],
  },
  {
    slug: 'tax-escape-room-adventure',
    title: 'Tax Escape Room Adventure',
    description: 'A puzzle-based escape room themed around tax code — solve clues to unlock each level.',
    tokenCost: 8,
    tier: 'premium',
    category: 'Puzzle',
    features: [
      'Interactive puzzle-solving gameplay',
      'Tax-themed riddles and clues',
      'Multi-level progression',
      'Blend of logic and tax knowledge',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'A 9-digit number in the format XX-XXXXXXX that identifies a business entity is a:',
        options: ['SSN', 'ITIN', 'EIN', 'PTIN'],
        correct: 2,
        explanation: 'An Employer Identification Number (EIN) uses the XX-XXXXXXX format.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which 12-month period is used to report income and deductions?',
        options: ['Calendar year only', 'Fiscal year only', 'Tax year (calendar or fiscal)', 'Rolling 12 months'],
        correct: 2,
        explanation: 'A tax year can be a calendar year or an approved fiscal year for certain entities.',
      },
    ],
  },
  {
    slug: 'irs-publication-maze',
    title: 'IRS Publication Maze',
    description: 'Navigate a maze of IRS publications, answer questions, and find the path to tax-code mastery.',
    tokenCost: 8,
    tier: 'premium',
    category: 'Puzzle',
    features: [
      'Maze-based navigation',
      'References to real IRS publications',
      'Multiple solution paths',
      'Progressive difficulty',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which publication is the general guide for individual taxpayers?',
        options: ['Publication 17', 'Publication 334', 'Publication 535', 'Publication 946'],
        correct: 0,
        explanation: 'Publication 17, "Your Federal Income Tax," is the general individual taxpayer guide.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which publication covers small-business tax rules?',
        options: ['Publication 17', 'Publication 334', 'Publication 463', 'Publication 590-A'],
        correct: 1,
        explanation: 'Publication 334 is the Tax Guide for Small Business.',
      },
    ],
  },
  {
    slug: 'audit-defense-showdown',
    title: 'Audit Defense Showdown',
    description: 'Test your knowledge of audit procedures and defense strategies in a competitive scenario quiz.',
    tokenCost: 8,
    tier: 'premium',
    category: 'Quiz',
    features: [
      'Multiple-choice audit scenarios',
      'Progressive difficulty levels',
      'Real-time scoring',
      'Explanations tied to IRM procedures',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'What is the first thing a taxpayer should do when they receive an audit letter?',
        options: [
          'Ignore it',
          'Read it carefully and note the response deadline',
          'Destroy it',
          'File an amended return immediately',
        ],
        correct: 1,
        explanation: 'Every audit letter has deadlines and requested items — read carefully before acting.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which records are most important to gather for a Schedule C audit?',
        options: [
          'Personal bank statements only',
          'Receipts, mileage logs, and business bank records',
          'Only the tax return',
          'Client emails',
        ],
        correct: 1,
        explanation: 'Schedule C audits focus on substantiating business income and expenses through contemporaneous records.',
      },
    ],
  },
  {
    slug: 'international-tax-explorer',
    title: 'International Tax Explorer',
    description: 'Navigate a world map and learn about foreign income rules, treaties, and global compliance.',
    tokenCost: 8,
    tier: 'premium',
    category: 'Adventure',
    features: [
      'Interactive world map exploration',
      'Tax treaty fundamentals',
      'Foreign earned income and FTC basics',
      'FATCA and FBAR reporting concepts',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'FATCA primarily requires reporting of:',
        options: [
          'Foreign travel expenses',
          'Specified foreign financial assets held by U.S. persons',
          'Import duties',
          'Domestic bank interest',
        ],
        correct: 1,
        explanation: 'FATCA requires U.S. persons to report specified foreign financial assets above thresholds on Form 8938.',
      },
      {
        type: 'Multiple Choice',
        question: 'The Foreign Tax Credit is designed to:',
        options: [
          'Encourage travel abroad',
          'Prevent double taxation on foreign income',
          'Subsidize exports',
          'Replace the standard deduction',
        ],
        correct: 1,
        explanation: 'The FTC allows U.S. taxpayers to offset U.S. tax with income taxes paid to foreign countries.',
      },
    ],
  },
  {
    slug: 'tax-return-simulator',
    title: 'Tax Return Simulator',
    description: 'Enter income, deductions, and credits and watch your tax liability change in real time.',
    tokenCost: 8,
    tier: 'premium',
    category: 'Simulator',
    features: [
      'Live tax calculation',
      'Model multiple scenarios',
      'See impact of credits and deductions',
      'Educational outcome breakdown',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Increasing pre-tax 401(k) contributions will generally:',
        options: [
          'Increase taxable income',
          'Decrease taxable income',
          'Have no effect',
          'Trigger an audit',
        ],
        correct: 1,
        explanation: 'Pre-tax 401(k) contributions reduce current-year taxable income.',
      },
      {
        type: 'Multiple Choice',
        question: 'Which of the following is a nonrefundable credit?',
        options: [
          'Earned Income Tax Credit',
          'Additional Child Tax Credit',
          'Lifetime Learning Credit',
          'Premium Tax Credit',
        ],
        correct: 2,
        explanation: 'The Lifetime Learning Credit is nonrefundable — it can reduce tax to zero but not below.',
      },
    ],
  },
  {
    slug: 'tax-document-hunter',
    title: 'Tax Document Hunter',
    description: 'Collect tax documents across 10 categories, earn points, and build a working document checklist.',
    tokenCost: 8,
    tier: 'premium',
    category: 'Scavenger',
    features: [
      '10 categories of tax documents',
      'Tiered point values by category',
      '5 achievement levels to unlock',
      'Works as a filing-season checklist',
    ],
    demoQuestions: [
      {
        type: 'Multiple Choice',
        question: 'Which form reports mortgage interest paid?',
        options: ['Form 1098', 'Form 1099-INT', 'Form W-2', 'Form 5498'],
        correct: 0,
        explanation: 'Form 1098 reports mortgage interest paid to a lender.',
      },
      {
        type: 'Multiple Choice',
        question: 'Form 1099-INT reports:',
        options: [
          'Dividend income',
          'Interest income from banks',
          'Retirement distributions',
          'Broker proceeds',
        ],
        correct: 1,
        explanation: 'Banks and other payers issue 1099-INT to report interest income above $10.',
      },
    ],
  },
]

export function getAllGames(): Game[] {
  return GAMES
}

export function getGame(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug)
}
