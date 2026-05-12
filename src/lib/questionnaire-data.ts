export interface Question {
  id: number;
  phase: number;
  text: string;
  example: string;
  inputType: 'short' | 'long' | 'list';
  placeholder: string;
}

export interface Phase {
  number: number;
  title: string;
  slug: string;
  tagline: string;
  intro: string;
  generates: string[];
  questions: Question[];
}

export const phases: Phase[] = [
  {
    number: 1,
    title: 'Your Story',
    slug: 'your-story',
    tagline: 'Your brand starts with you. Not a logo. Not a color. You.',
    intro:
      'Every brand has an origin. Yours starts with the experiences, decisions, and moments that brought you here. This phase captures the foundation everything else is built on.',
    generates: [
      'Brand Origin Story (formatted narrative)',
      "Founder's Background Summary",
      'Core Motivation Statement',
    ],
    questions: [
      {
        id: 1,
        phase: 1,
        text: 'What is your business called?',
        example: 'Island Provisions Co.',
        inputType: 'short',
        placeholder: 'Enter your business name',
      },
      {
        id: 2,
        phase: 1,
        text: 'In one sentence, what does your business do?',
        example:
          'We source and deliver premium Caribbean ingredients to restaurants across the East Coast.',
        inputType: 'short',
        placeholder: 'Describe what your business does in one sentence',
      },
      {
        id: 3,
        phase: 1,
        text: 'Why did you start this business? What moment or experience pushed you to begin?',
        example:
          "I grew up watching my grandmother trade spices at the local market. When I moved to New York and couldn't find real scotch bonnet peppers, I knew there was a gap.",
        inputType: 'long',
        placeholder: 'Tell the story of why you started...',
      },
      {
        id: 4,
        phase: 1,
        text: 'What were you doing before this business? How did that experience shape what you do now?',
        example:
          'I was a logistics coordinator for a shipping company. That taught me supply chain management, which is now the backbone of my delivery network.',
        inputType: 'long',
        placeholder: 'Describe your background and how it connects to what you do now...',
      },
      {
        id: 5,
        phase: 1,
        text: 'What is the single biggest challenge you overcame to get where you are today?',
        example:
          'Getting restaurants to trust a new supplier. I had to do free samples for 6 months before landing my first paying client.',
        inputType: 'long',
        placeholder: 'Describe the biggest obstacle you faced...',
      },
      {
        id: 6,
        phase: 1,
        text: "What would you be doing if this business didn't exist?",
        example:
          "Probably still in logistics, but I'd always be thinking about this idea.",
        inputType: 'long',
        placeholder: 'What would your alternative path look like?',
      },
    ],
  },
  {
    number: 2,
    title: 'Your Process',
    slug: 'your-process',
    tagline: 'The processes that made you successful ARE your brand.',
    intro:
      "What you do and how you do it isn't just operations — it's the proof that your brand is real. This phase maps the systems, methods, and hard-won lessons that define your business.",
    generates: [
      'Process Map (visual flowchart)',
      'Unique Value Proposition',
      'Brand Differentiators List',
      'Lessons Learned Summary',
    ],
    questions: [
      {
        id: 7,
        phase: 2,
        text: 'Describe the process you follow to deliver your product or service, step by step.',
        example:
          '1) Source from verified Caribbean farms → 2) Quality check at our Miami warehouse → 3) Cold-chain pack → 4) Next-day delivery to restaurant kitchens.',
        inputType: 'long',
        placeholder: 'Walk through your process from start to finish...',
      },
      {
        id: 8,
        phase: 2,
        text: 'What part of your process do clients/customers value the most? How do you know?',
        example:
          "The quality check. Chefs tell me they trust us because nothing arrives damaged or below standard.",
        inputType: 'long',
        placeholder: 'What do customers appreciate most about how you work?',
      },
      {
        id: 9,
        phase: 2,
        text: "What is your 'secret sauce' — the thing you do differently from competitors?",
        example:
          "We visit every single farm we source from. No middlemen. Chefs get the name of the farmer who grew their produce.",
        inputType: 'long',
        placeholder: 'What makes your approach unique?',
      },
      {
        id: 10,
        phase: 2,
        text: 'What is one process you tried that completely failed? What did you learn from it?',
        example:
          'We tried offering a subscription box for home cooks. The logistics costs killed our margins. Learned to stay focused on B2B.',
        inputType: 'long',
        placeholder: 'Describe a failure and the lesson it taught you...',
      },
      {
        id: 11,
        phase: 2,
        text: 'If you had to teach someone your business in one day, what are the 3 most important things they\'d need to know?',
        example:
          "1) Relationships with farmers are everything. 2) Cold chain cannot break, ever. 3) Chef's trust takes months to build but seconds to lose.",
        inputType: 'long',
        placeholder: 'List the top 3 things someone must understand about your business...',
      },
    ],
  },
  {
    number: 3,
    title: 'Your People',
    slug: 'your-people',
    tagline:
      "Your audience isn't 'everyone.' It's the people who already love what you do.",
    intro:
      "The best brands don't try to speak to everyone. They speak directly to the people who already get it. This phase defines exactly who your brand serves — and who it doesn't.",
    generates: [
      'Ideal Customer Profile (detailed persona)',
      'Customer Voice Bank (real quotes and language)',
      'Anti-Persona (who you don\'t serve)',
      'Brand Personality Profile',
    ],
    questions: [
      {
        id: 12,
        phase: 3,
        text: 'Describe your best customer or client. Who are they? What do they do?',
        example:
          'Executive chefs at mid-to-high-end Caribbean fusion restaurants in the NYC metro area. They care deeply about ingredient authenticity.',
        inputType: 'long',
        placeholder: 'Paint a picture of your ideal customer...',
      },
      {
        id: 13,
        phase: 3,
        text: 'Why do your best customers choose you over alternatives?',
        example:
          "Traceability. They can put 'farm-to-table' on their menu and actually mean it because we give them the sourcing story.",
        inputType: 'long',
        placeholder: 'What makes customers pick you?',
      },
      {
        id: 14,
        phase: 3,
        text: 'What do your customers say about you in their own words? (Reviews, DMs, conversations)',
        example:
          "Chef Marcus told me: 'You're the only supplier I don't have to double-check.' That stuck with me.",
        inputType: 'long',
        placeholder: 'Share real quotes or paraphrased feedback...',
      },
      {
        id: 15,
        phase: 3,
        text: 'Who is NOT your customer? Who have you learned to say no to?',
        example:
          "Big chain restaurants looking for the cheapest bulk option. We tried once — they squeezed our margins and didn't value quality.",
        inputType: 'long',
        placeholder: 'Describe who you deliberately don\'t serve...',
      },
      {
        id: 16,
        phase: 3,
        text: 'If your brand were a person at a party, how would people describe them?',
        example:
          "Reliable, knowledgeable about food, not flashy but everyone respects them. The person chefs go to for advice.",
        inputType: 'long',
        placeholder: 'Describe your brand as a person...',
      },
    ],
  },
  {
    number: 4,
    title: 'Your Voice',
    slug: 'your-voice',
    tagline:
      "Your brand voice isn't something you invent. It's how you already talk to the people who matter.",
    intro:
      "You already have a brand voice — you use it every day in emails, DMs, pitches, and conversations. This phase captures that natural voice and turns it into a guide your whole team can follow.",
    generates: [
      'Brand Voice Guide (tone, formality, vocabulary)',
      'Communication Templates',
      'Content Pillars',
      'Signature Phrases & Tagline Candidates',
    ],
    questions: [
      {
        id: 17,
        phase: 4,
        text: "How do you greet a new potential client? Write it like you'd actually say it.",
        example:
          "Hey, I'm James from Island Provisions. We work with Caribbean restaurants to get them the real stuff — direct from the farms. Want me to send over some samples?",
        inputType: 'long',
        placeholder: 'Write your actual greeting...',
      },
      {
        id: 18,
        phase: 4,
        text: "How do you handle a complaint or problem? Write a real example or how you'd respond.",
        example:
          "I hear you, and that shouldn't have happened. I'm sending a replacement batch today at no charge, and I'm personally checking what went wrong in our warehouse.",
        inputType: 'long',
        placeholder: 'Write how you actually respond to problems...',
      },
      {
        id: 19,
        phase: 4,
        text: 'Write a social media post about your business as if you were posting right now.',
        example:
          'Just got back from visiting our pepper farm in Trinidad. These scotch bonnets are hitting different this season. DM me if you want to taste the difference real sourcing makes.',
        inputType: 'long',
        placeholder: 'Write a real social media post...',
      },
      {
        id: 20,
        phase: 4,
        text: 'What topics could you talk about for an hour without preparing?',
        example:
          'Caribbean food culture, supply chain logistics for perishables, building B2B relationships, the difference between authentic and mass-produced spices.',
        inputType: 'long',
        placeholder: 'List the topics you know inside and out...',
      },
      {
        id: 21,
        phase: 4,
        text: 'What phrases or sayings do you use all the time in your business?',
        example:
          "We always say 'from soil to stove' and 'trust the source.' Those come up in every pitch.",
        inputType: 'long',
        placeholder: 'List your go-to phrases and sayings...',
      },
    ],
  },
  {
    number: 5,
    title: 'Your Look',
    slug: 'your-look',
    tagline:
      'Your visual brand should reflect the world you operate in, not a trend you saw online.',
    intro:
      "Visual identity isn't about picking colors from a palette generator. It's about translating the real, physical world of your business into design language. This phase grounds your visuals in reality.",
    generates: [
      'Color Palette (with hex codes)',
      'Visual Mood Board Prompts',
      'Typography Recommendations',
      "Visual Do's and Don'ts",
      'Space/Environment Design Language',
    ],
    questions: [
      {
        id: 22,
        phase: 5,
        text: 'Describe the physical environment where your business happens. What does it look, smell, feel like?',
        example:
          'Our warehouse smells like fresh thyme and cardamom. The walls are plain concrete but the product crates are stacked with colorful labels from each farm.',
        inputType: 'long',
        placeholder: 'Describe the sensory experience of your business environment...',
      },
      {
        id: 23,
        phase: 5,
        text: 'What 3 colors come to mind when you think about your business and why?',
        example:
          'Deep green (the farms), warm orange (scotch bonnet peppers), dark brown (the wood crates we ship in).',
        inputType: 'long',
        placeholder: 'Name 3 colors and explain why each one...',
      },
      {
        id: 24,
        phase: 5,
        text: "Look at your phone's photo gallery. Find 3 photos that represent your business. Describe them.",
        example:
          '1) A close-up of peppers still on the vine. 2) Me shaking hands with a farmer in Jamaica. 3) A chef plating a dish with our ingredients.',
        inputType: 'long',
        placeholder: 'Describe 3 photos that capture your business...',
      },
      {
        id: 25,
        phase: 5,
        text: 'What visual styles do you dislike for your business? What would feel wrong?',
        example:
          "Anything too polished or corporate. Stock photos of people in suits. Bright neon colors. We're about earth and authenticity.",
        inputType: 'long',
        placeholder: 'Describe what visual approaches would NOT fit your brand...',
      },
      {
        id: 26,
        phase: 5,
        text: 'If your brand had a physical space (a shop, an office, a studio), what would it look and feel like?',
        example:
          'Open-air market feel. Wood and natural materials. Product displayed simply — the food speaks for itself. A tasting counter where chefs can try everything.',
        inputType: 'long',
        placeholder: 'Describe your ideal brand space...',
      },
    ],
  },
  {
    number: 6,
    title: 'Your Position',
    slug: 'your-position',
    tagline:
      "Positioning isn't about being the best. It's about being the only one who does what you do, the way you do it.",
    intro:
      "You don't need to beat everyone. You need to own a space that's yours. This phase maps where you stand in the market and defines the gap only you can fill.",
    generates: [
      'Competitive Positioning Map',
      '"Only We" Statement',
      'Brand Promise Statement',
      'Referral Script',
      '3-Year Brand Vision',
    ],
    questions: [
      {
        id: 27,
        phase: 6,
        text: 'Name 3 competitors or alternatives your customers could choose instead of you. What do they do well?',
        example:
          '1) Caribbean Foods Inc — bigger catalog, lower prices. 2) Local wholesalers — convenience, same-day delivery. 3) Direct farm imports — even cheaper, but inconsistent quality.',
        inputType: 'long',
        placeholder: 'List 3 alternatives and their strengths...',
      },
      {
        id: 28,
        phase: 6,
        text: 'What do those alternatives get wrong or fail to deliver?',
        example:
          'Caribbean Foods Inc uses middlemen so quality varies. Wholesalers carry Caribbean products as an afterthought. Direct imports require chefs to manage customs and logistics.',
        inputType: 'long',
        placeholder: 'Describe what competitors miss...',
      },
      {
        id: 29,
        phase: 6,
        text: "Complete this sentence: 'Only we ____________.'",
        example:
          "Only we visit every farm, verify every batch, and deliver with the farmer's name attached.",
        inputType: 'long',
        placeholder: 'Only we...',
      },
      {
        id: 30,
        phase: 6,
        text: 'What would you want a customer to say when recommending you to someone else?',
        example:
          "If you want real Caribbean ingredients and you don't want to worry about quality, call Island Provisions.",
        inputType: 'long',
        placeholder: 'Write the perfect recommendation...',
      },
      {
        id: 31,
        phase: 6,
        text: 'Where do you see your business in 3 years? What will be different?',
        example:
          "Expanding to the West Coast and launching a line of branded sauces made from our farmers' recipes. Still B2B first, but with a consumer product line.",
        inputType: 'long',
        placeholder: 'Describe your 3-year vision...',
      },
    ],
  },
  {
    number: 7,
    title: 'Your Blueprint',
    slug: 'your-blueprint',
    tagline:
      'This is where everything connects. Your story, process, people, voice, look, and position become one brand.',
    intro:
      "You've done the deep work. Now it's time to step back and see the full picture. This final phase pulls everything together into your complete Brand Blueprint.",
    generates: [
      'Brand Summary Statement',
      'Brand Manifesto',
      'Brand Guard Rails',
      'The Complete Brand Blueprint Document',
    ],
    questions: [
      {
        id: 32,
        phase: 7,
        text: 'Review everything above. What surprised you? What pattern do you see?',
        example:
          "I didn't realize how much my brand is built on personal relationships. Every answer comes back to trust and direct connection.",
        inputType: 'long',
        placeholder: 'Reflect on what you notice across all your answers...',
      },
      {
        id: 33,
        phase: 7,
        text: 'If you had to describe your brand in exactly 10 words, what would they be?',
        example:
          'Farm-verified Caribbean ingredients delivered fresh to trusted restaurant kitchens.',
        inputType: 'short',
        placeholder: 'Your brand in exactly 10 words...',
      },
      {
        id: 34,
        phase: 7,
        text: 'What is the one thing you never want your brand to become?',
        example:
          'A faceless wholesale operation where quality is sacrificed for volume.',
        inputType: 'long',
        placeholder: 'Describe what your brand must never be...',
      },
      {
        id: 35,
        phase: 7,
        text: 'What is the one promise your brand makes to every single customer?',
        example:
          'You will always know exactly where your ingredients came from.',
        inputType: 'long',
        placeholder: 'Write your brand promise...',
      },
    ],
  },
];

export function getPhase(phaseNumber: number): Phase | undefined {
  return phases.find((p) => p.number === phaseNumber);
}

export function getQuestion(questionId: number): Question | undefined {
  for (const phase of phases) {
    const q = phase.questions.find((q) => q.id === questionId);
    if (q) return q;
  }
  return undefined;
}

export function getTotalQuestions(): number {
  return phases.reduce((total, phase) => total + phase.questions.length, 0);
}

export function getQuestionCountUpToPhase(phaseNumber: number): number {
  return phases
    .filter((p) => p.number < phaseNumber)
    .reduce((total, phase) => total + phase.questions.length, 0);
}
