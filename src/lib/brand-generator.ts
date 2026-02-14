/**
 * Brand Guide Generation Engine
 *
 * Transforms raw questionnaire answers into formatted, professional
 * brand guide sections using template-based generation.
 */

export interface BrandAnswers {
  [questionId: number]: string;
}

export interface BrandGuide {
  brandName: string;
  generatedAt: string;
  sections: BrandGuideSection[];
}

export interface BrandGuideSection {
  id: string;
  title: string;
  phase: number;
  content: string;
  subsections: { title: string; content: string }[];
}

/**
 * Generate a complete brand guide from questionnaire answers.
 */
export function generateBrandGuide(answers: BrandAnswers): BrandGuide {
  const brandName = answers[1] || 'Untitled Brand';

  return {
    brandName,
    generatedAt: new Date().toISOString(),
    sections: [
      generateOriginStory(answers),
      generateProcessMap(answers),
      generateCustomerPersona(answers),
      generateVoiceGuide(answers),
      generateVisualIdentity(answers),
      generatePositioning(answers),
      generateBlueprintSummary(answers),
    ],
  };
}

function generateOriginStory(answers: BrandAnswers): BrandGuideSection {
  const businessName = answers[1] || '[Business Name]';
  const whatItDoes = answers[2] || '[What it does]';
  const whyStarted = answers[3] || '[Why started]';
  const background = answers[4] || '[Background]';
  const challenge = answers[5] || '[Challenge]';

  const narrative = `## The ${businessName} Story

${businessName} exists because of a gap that couldn't be ignored. ${whyStarted}

This wasn't a random pivot or a trend chase. Before ${businessName}, the founder's path through ${background} laid the groundwork for everything the business would become. That experience didn't just provide skills — it revealed the opportunity.

Building ${businessName} wasn't easy. ${challenge} But that challenge shaped the way the business operates today — with the kind of resilience and awareness that only comes from earning it.

Today, ${businessName} ${whatItDoes.toLowerCase().startsWith('we ') ? whatItDoes.substring(3) : whatItDoes.toLowerCase()}. Every decision traces back to the same core drive that started it all.`;

  return {
    id: 'origin-story',
    title: 'Brand Origin Story',
    phase: 1,
    content: narrative,
    subsections: [
      {
        title: 'Core Motivation',
        content: whyStarted,
      },
      {
        title: "Founder's Background",
        content: background,
      },
      {
        title: 'Defining Challenge',
        content: challenge,
      },
      {
        title: 'The Alternative Path',
        content: answers[6] || '[Not provided]',
      },
    ],
  };
}

function generateProcessMap(answers: BrandAnswers): BrandGuideSection {
  const process = answers[7] || '[Process not described]';
  const mostValued = answers[8] || '[Not specified]';
  const secretSauce = answers[9] || '[Not specified]';
  const failure = answers[10] || '[Not specified]';
  const topThree = answers[11] || '[Not specified]';

  return {
    id: 'process-map',
    title: 'How We Work',
    phase: 2,
    content: `## Our Process\n\n${process}\n\n## What Customers Value Most\n\n${mostValued}`,
    subsections: [
      {
        title: 'Unique Value Proposition',
        content: `What makes us different: ${secretSauce}`,
      },
      {
        title: 'Lessons From Failure',
        content: failure,
      },
      {
        title: 'The 3 Things That Matter Most',
        content: topThree,
      },
    ],
  };
}

function generateCustomerPersona(answers: BrandAnswers): BrandGuideSection {
  const bestCustomer = answers[12] || '[Not described]';
  const whyChooseUs = answers[13] || '[Not specified]';
  const customerQuotes = answers[14] || '[No quotes provided]';
  const notCustomer = answers[15] || '[Not specified]';
  const brandAsAPerson = answers[16] || '[Not described]';

  return {
    id: 'customer-persona',
    title: 'Who We Serve',
    phase: 3,
    content: `## Our Ideal Customer\n\n${bestCustomer}\n\n## Why They Choose Us\n\n${whyChooseUs}`,
    subsections: [
      {
        title: 'In Their Own Words',
        content: customerQuotes,
      },
      {
        title: 'Who We Don\'t Serve',
        content: notCustomer,
      },
      {
        title: 'Brand Personality',
        content: `If our brand were a person: ${brandAsAPerson}`,
      },
    ],
  };
}

function generateVoiceGuide(answers: BrandAnswers): BrandGuideSection {
  const greeting = answers[17] || '[Not provided]';
  const complaintResponse = answers[18] || '[Not provided]';
  const socialPost = answers[19] || '[Not provided]';
  const expertTopics = answers[20] || '[Not provided]';
  const phrases = answers[21] || '[Not provided]';

  return {
    id: 'voice-guide',
    title: 'Brand Voice & Tone',
    phase: 4,
    content: `## How We Sound\n\nOur voice is drawn from how we naturally communicate — in sales conversations, customer support, and social media. It's not manufactured; it's authentic to who we are.`,
    subsections: [
      {
        title: 'Greeting Template',
        content: `How we introduce ourselves:\n\n> ${greeting}`,
      },
      {
        title: 'Problem Resolution Template',
        content: `How we handle issues:\n\n> ${complaintResponse}`,
      },
      {
        title: 'Social Media Voice',
        content: `Example post:\n\n> ${socialPost}`,
      },
      {
        title: 'Content Pillars',
        content: `Topics we own:\n\n${expertTopics}`,
      },
      {
        title: 'Signature Phrases',
        content: phrases,
      },
    ],
  };
}

function generateVisualIdentity(answers: BrandAnswers): BrandGuideSection {
  const environment = answers[22] || '[Not described]';
  const colors = answers[23] || '[Not specified]';
  const photos = answers[24] || '[Not described]';
  const dislikes = answers[25] || '[Not specified]';
  const idealSpace = answers[26] || '[Not described]';

  return {
    id: 'visual-identity',
    title: 'Visual Identity',
    phase: 5,
    content: `## Visual Direction\n\nOur visual identity is rooted in the real, physical world of our business — not trends or templates.\n\n### Our Environment\n\n${environment}`,
    subsections: [
      {
        title: 'Color Direction',
        content: colors,
      },
      {
        title: 'Visual References',
        content: photos,
      },
      {
        title: 'Visual Don\'ts',
        content: dislikes,
      },
      {
        title: 'Brand Space Vision',
        content: idealSpace,
      },
    ],
  };
}

function generatePositioning(answers: BrandAnswers): BrandGuideSection {
  const competitors = answers[27] || '[Not specified]';
  const competitorWeakness = answers[28] || '[Not specified]';
  const onlyWe = answers[29] || '[Not specified]';
  const referral = answers[30] || '[Not specified]';
  const threeYearVision = answers[31] || '[Not specified]';

  return {
    id: 'positioning',
    title: 'Market Position',
    phase: 6,
    content: `## Where We Stand\n\n### The Landscape\n\n${competitors}\n\n### What They Miss\n\n${competitorWeakness}\n\n### Our Position\n\nOnly we ${onlyWe.toLowerCase().startsWith('only we') ? onlyWe.substring(8) : onlyWe.toLowerCase()}.`,
    subsections: [
      {
        title: 'The "Only We" Statement',
        content: `Only we ${onlyWe}`,
      },
      {
        title: 'Referral Script',
        content: `When someone asks about us, we want them to say:\n\n> ${referral}`,
      },
      {
        title: '3-Year Vision',
        content: threeYearVision,
      },
    ],
  };
}

function generateBlueprintSummary(answers: BrandAnswers): BrandGuideSection {
  const patterns = answers[32] || '[Not reflected on]';
  const tenWords = answers[33] || '[Not provided]';
  const neverBecome = answers[34] || '[Not specified]';
  const promise = answers[35] || '[Not specified]';

  return {
    id: 'blueprint-summary',
    title: 'The Brand Blueprint',
    phase: 7,
    content: `## The Complete Picture\n\n### In 10 Words\n\n**${tenWords}**\n\n### Our Promise\n\n${promise}\n\n### What We Noticed\n\n${patterns}`,
    subsections: [
      {
        title: 'Brand Guard Rails',
        content: `We will never become: ${neverBecome}`,
      },
      {
        title: 'Brand Promise',
        content: promise,
      },
    ],
  };
}
