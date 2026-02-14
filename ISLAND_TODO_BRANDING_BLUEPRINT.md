# The Island Todo Branding Blueprint

## Full Web App Plan

> A system that lets anyone create a brand from their real business experiences and
> generates personalized brand guides — not generic templates.

---

## Table of Contents

1. [Vision & Core Concept](#1-vision--core-concept)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [The Branding Questionnaire System](#3-the-branding-questionnaire-system)
4. [Brand Workspace Management](#4-brand-workspace-management)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Google Sheets Data Layer](#6-google-sheets-data-layer)
7. [Cloudflare Pages Deployment](#7-cloudflare-pages-deployment)
8. [Application Structure](#8-application-structure)
9. [Page-by-Page Breakdown](#9-page-by-page-breakdown)
10. [Brand Guide Generation Engine](#10-brand-guide-generation-engine)
11. [Content & Copy](#11-content--copy)
12. [Development Phases](#12-development-phases)

---

## 1. Vision & Core Concept

### The Problem

Most branding tools give users a cookie-cutter template. They ask surface-level
questions and produce generic outputs that don't reflect the founder's actual
journey, business processes, or hard-won insights.

### The Solution

**The Island Todo Branding Blueprint** is a guided branding system that treats
each user's business experience as the raw material for their brand. Through a
deep questionnaire process, it extracts:

- What worked (proven processes and wins)
- What the founder stands for (values derived from experience)
- Who they actually serve (audience defined by real interactions)
- How they communicate (voice derived from how they already talk about their work)

The output is a **personalized Brand Guide** — a living document unique to that
business, stored in its own managed workspace.

### Core Principles

1. **Experience-First Branding** — Your brand comes from what you've built, not
   what a template tells you
2. **Guided Self-Discovery** — The questionnaire leads users through structured
   reflection
3. **Actionable Output** — Every section of the brand guide is usable immediately
4. **Workspace Isolation** — Each brand lives in its own folder with its own
   content, assets, and management access
5. **Accessible Platform** — Free to deploy, free to host, built on Cloudflare
   Pages

---

## 2. Architecture & Tech Stack

### Stack Decision

| Layer              | Technology                         | Rationale                                    |
| ------------------ | ---------------------------------- | -------------------------------------------- |
| **Frontend**       | Astro 4.x + Vanilla JS            | Static-first, fast, Cloudflare Pages native  |
| **Styling**        | Tailwind CSS                       | Utility-first, rapid prototyping             |
| **Server Logic**   | Cloudflare Pages Functions         | Free tier, runs at the edge                  |
| **Data Storage**   | Google Sheets API v4               | Free, familiar, shareable with clients       |
| **Auth**           | Cloudflare Access (free tier)      | Simple, no custom auth to maintain           |
| **File Storage**   | Cloudflare R2 (free tier)          | Brand assets (logos, images) per workspace   |
| **Deployment**     | Cloudflare Pages                   | Free, global CDN, automatic builds from Git  |
| **Build Tool**     | Vite (via Astro)                   | Fast builds, modern tooling                  |

### System Diagram

```
                    +---------------------------+
                    |    Cloudflare Pages CDN    |
                    |  (Global Edge Delivery)    |
                    +-------------+-------------+
                                  |
                    +-------------+-------------+
                    |      Astro Static Site     |
                    |   (HTML/CSS/JS Frontend)   |
                    +---+-------------------+---+
                        |                   |
           +------------+---+       +-------+----------+
           | Pages Functions |       | Client-Side JS   |
           | (Edge Workers)  |       | (Questionnaire   |
           +-------+--------+       |  Engine, UI)      |
                   |                +------------------+
          +--------+--------+
          |                 |
   +------+------+   +-----+--------+
   | Google       |   | Cloudflare   |
   | Sheets API   |   | R2 Storage   |
   | (User Data)  |   | (Brand       |
   |              |   |  Assets)     |
   +--------------+   +--------------+
```

### Why Not Hugo Anymore?

The existing repo uses Hugo with cState for a status page. This project requires:

- Dynamic form handling (questionnaire with branching logic)
- API integration (Google Sheets, R2)
- Per-user workspaces with state management
- Generated content from user inputs

Hugo is a static site generator without these capabilities. Astro provides static
output with islands of interactivity — matching the "Island Todo" name and the
technical requirements.

---

## 3. The Branding Questionnaire System

This is the heart of the application. The questionnaire is divided into **7 phases**,
each building on the previous. Users can save progress and return.

### Phase 1: The Foundation — Your Story

> *"Your brand starts with you. Not a logo. Not a color. You."*

**Questions:**

1. **What is your business called?**
   - *Example: "Island Provisions Co."*

2. **In one sentence, what does your business do?**
   - *Example: "We source and deliver premium Caribbean ingredients to restaurants
     across the East Coast."*

3. **Why did you start this business? What moment or experience pushed you to
   begin?**
   - *Example: "I grew up watching my grandmother trade spices at the local market.
     When I moved to New York and couldn't find real scotch bonnet peppers, I knew
     there was a gap."*

4. **What were you doing before this business? How did that experience shape what
   you do now?**
   - *Example: "I was a logistics coordinator for a shipping company. That taught
     me supply chain management, which is now the backbone of my delivery
     network."*

5. **What is the single biggest challenge you overcame to get where you are today?**
   - *Example: "Getting restaurants to trust a new supplier. I had to do free
     samples for 6 months before landing my first paying client."*

6. **What would you be doing if this business didn't exist?**
   - *Example: "Probably still in logistics, but I'd always be thinking about this
     idea."*

**What this phase generates:**
- Brand Origin Story (formatted narrative)
- Founder's Background Summary
- Core Motivation Statement

---

### Phase 2: Your Process — What Actually Works

> *"The processes that made you successful ARE your brand."*

**Questions:**

7. **Describe the process you follow to deliver your product or service, step by
   step.**
   - *Example: "1) Source from verified Caribbean farms → 2) Quality check at our
     Miami warehouse → 3) Cold-chain pack → 4) Next-day delivery to restaurant
     kitchens."*

8. **What part of your process do clients/customers value the most? How do you
   know?**
   - *Example: "The quality check. Chefs tell me they trust us because nothing
     arrives damaged or below standard."*

9. **What is your 'secret sauce' — the thing you do differently from competitors?**
   - *Example: "We visit every single farm we source from. No middlemen. Chefs
     get the name of the farmer who grew their produce."*

10. **What is one process you tried that completely failed? What did you learn
    from it?**
    - *Example: "We tried offering a subscription box for home cooks. The logistics
      costs killed our margins. Learned to stay focused on B2B."*

11. **If you had to teach someone your business in one day, what are the 3 most
    important things they'd need to know?**
    - *Example: "1) Relationships with farmers are everything. 2) Cold chain
      cannot break, ever. 3) Chef's trust takes months to build but seconds to
      lose."*

**What this phase generates:**
- Process Map (visual flowchart of their delivery process)
- Unique Value Proposition (derived from Q9)
- Brand Differentiators List
- Lessons Learned Summary

---

### Phase 3: Your People — Who You Actually Serve

> *"Your audience isn't 'everyone.' It's the people who already love what you do."*

**Questions:**

12. **Describe your best customer or client. Who are they? What do they do?**
    - *Example: "Executive chefs at mid-to-high-end Caribbean fusion restaurants
      in the NYC metro area. They care deeply about ingredient authenticity."*

13. **Why do your best customers choose you over alternatives?**
    - *Example: "Traceability. They can put 'farm-to-table' on their menu and
      actually mean it because we give them the sourcing story."*

14. **What do your customers say about you in their own words? (Reviews, DMs,
    conversations)**
    - *Example: "Chef Marcus told me: 'You're the only supplier I don't have to
      double-check.' That stuck with me."*

15. **Who is NOT your customer? Who have you learned to say no to?**
    - *Example: "Big chain restaurants looking for the cheapest bulk option. We
      tried once — they squeezed our margins and didn't value quality."*

16. **If your brand were a person at a party, how would people describe them?**
    - *Example: "Reliable, knowledgeable about food, not flashy but everyone
      respects them. The person chefs go to for advice."*

**What this phase generates:**
- Ideal Customer Profile (detailed persona)
- Customer Voice Bank (real quotes and language patterns)
- Anti-Persona (who you don't serve)
- Brand Personality Profile

---

### Phase 4: Your Voice — How You Already Communicate

> *"Your brand voice isn't something you invent. It's how you already talk to the
> people who matter."*

**Questions:**

17. **How do you greet a new potential client? Write it like you'd actually say
    it.**
    - *Example: "Hey, I'm James from Island Provisions. We work with Caribbean
      restaurants to get them the real stuff — direct from the farms. Want me to
      send over some samples?"*

18. **How do you handle a complaint or problem? Write a real example or how you'd
    respond.**
    - *Example: "I hear you, and that shouldn't have happened. I'm sending a
      replacement batch today at no charge, and I'm personally checking what
      went wrong in our warehouse."*

19. **Write a social media post about your business as if you were posting right
    now.**
    - *Example: "Just got back from visiting our pepper farm in Trinidad. These
      scotch bonnets are hitting different this season. DM me if you want to taste
      the difference real sourcing makes. 🌶"*

20. **What topics could you talk about for an hour without preparing?**
    - *Example: "Caribbean food culture, supply chain logistics for perishables,
      building B2B relationships, the difference between authentic and mass-produced
      spices."*

21. **What phrases or sayings do you use all the time in your business?**
    - *Example: "We always say 'from soil to stove' and 'trust the source.' Those
      come up in every pitch."*

**What this phase generates:**
- Brand Voice Guide (tone, formality level, vocabulary)
- Communication Templates (greeting, complaint handling, social post)
- Content Pillars (topics the brand owns)
- Signature Phrases & Tagline Candidates

---

### Phase 5: Your Look — Visual Identity from Your World

> *"Your visual brand should reflect the world you operate in, not a trend you
> saw online."*

**Questions:**

22. **Describe the physical environment where your business happens. What does it
    look, smell, feel like?**
    - *Example: "Our warehouse smells like fresh thyme and cardamom. The walls are
      plain concrete but the product crates are stacked with colorful labels from
      each farm."*

23. **What 3 colors come to mind when you think about your business and why?**
    - *Example: "Deep green (the farms), warm orange (scotch bonnet peppers), dark
      brown (the wood crates we ship in)."*

24. **Look at your phone's photo gallery. Find 3 photos that represent your
    business. Describe them.**
    - *Example: "1) A close-up of peppers still on the vine. 2) Me shaking hands
      with a farmer in Jamaica. 3) A chef plating a dish with our ingredients."*

25. **What visual styles do you dislike for your business? What would feel wrong?**
    - *Example: "Anything too polished or corporate. Stock photos of people in
      suits. Bright neon colors. We're about earth and authenticity."*

26. **If your brand had a physical space (a shop, an office, a studio), what would
    it look and feel like?**
    - *Example: "Open-air market feel. Wood and natural materials. Product
      displayed simply — the food speaks for itself. A tasting counter where
      chefs can try everything."*

**What this phase generates:**
- Color Palette (primary, secondary, accent — with hex codes)
- Visual Mood Board Prompts (descriptions for sourcing images)
- Typography Recommendations (based on brand personality)
- Visual Do's and Don'ts List
- Space/Environment Design Language

---

### Phase 6: Your Position — Where You Stand in the Market

> *"Positioning isn't about being the best. It's about being the only one who
> does what you do, the way you do it."*

**Questions:**

27. **Name 3 competitors or alternatives your customers could choose instead of
    you. What do they do well?**
    - *Example: "1) Caribbean Foods Inc — bigger catalog, lower prices. 2) Local
      wholesalers — convenience, same-day delivery. 3) Direct farm imports — even
      cheaper, but inconsistent quality."*

28. **What do those alternatives get wrong or fail to deliver?**
    - *Example: "Caribbean Foods Inc uses middlemen so quality varies. Wholesalers
      carry Caribbean products as an afterthought. Direct imports require chefs to
      manage customs and logistics."*

29. **Complete this sentence: 'Only we ____________.'**
    - *Example: "Only we visit every farm, verify every batch, and deliver with the
      farmer's name attached."*

30. **What would you want a customer to say when recommending you to someone else?**
    - *Example: "If you want real Caribbean ingredients and you don't want to worry
      about quality, call Island Provisions."*

31. **Where do you see your business in 3 years? What will be different?**
    - *Example: "Expanding to the West Coast and launching a line of branded
      sauces made from our farmers' recipes. Still B2B first, but with a consumer
      product line."*

**What this phase generates:**
- Competitive Positioning Map
- "Only We" Statement (core differentiator)
- Brand Promise Statement
- Referral Script (what customers should say)
- 3-Year Brand Vision

---

### Phase 7: Your Blueprint — Putting It All Together

> *"This is where everything connects. Your story, process, people, voice, look,
> and position become one brand."*

**Questions:**

32. **Review everything above. What surprised you? What pattern do you see?**
    - *Example: "I didn't realize how much my brand is built on personal
      relationships. Every answer comes back to trust and direct connection."*

33. **If you had to describe your brand in exactly 10 words, what would they be?**
    - *Example: "Farm-verified Caribbean ingredients delivered fresh to trusted
      restaurant kitchens."*

34. **What is the one thing you never want your brand to become?**
    - *Example: "A faceless wholesale operation where quality is sacrificed for
      volume."*

35. **What is the one promise your brand makes to every single customer?**
    - *Example: "You will always know exactly where your ingredients came from."*

**What this phase generates:**
- Brand Summary Statement
- Brand Manifesto (narrative document)
- Brand Guard Rails (what the brand never does)
- The Brand Blueprint Document (complete guide)

---

## 4. Brand Workspace Management

Each brand created through the system gets its own isolated workspace.

### Workspace Structure

```
/brands/
  /{brand-slug}/
    /brand-guide/
      brand-blueprint.json          # Complete brand data (generated)
      brand-guide.html              # Rendered brand guide (viewable/printable)
      brand-guide.pdf               # PDF export of brand guide
    /assets/
      logo.svg                      # Generated or uploaded logo
      color-palette.svg             # Visual color palette
      typography-sample.html        # Font pairing preview
      mood-board/                   # Uploaded reference images
    /content/
      origin-story.md               # Generated brand origin story
      voice-guide.md                # How the brand communicates
      positioning-statement.md      # Market positioning
      customer-persona.md           # Ideal customer profile
      process-map.md                # How the business operates
    /templates/
      social-post-template.md       # Social media templates
      email-template.md             # Email communication templates
      pitch-template.md             # Pitch/sales templates
    /settings/
      workspace-config.json         # Workspace settings
      team-members.json             # Brand team access list
```

### Workspace Features

| Feature                    | Description                                         |
| -------------------------- | --------------------------------------------------- |
| **Brand Dashboard**        | Overview of brand completion, assets, and activity   |
| **Guide Editor**           | Edit and refine generated brand guide sections       |
| **Asset Manager**          | Upload, organize, and manage brand assets            |
| **Content Generator**      | Re-run questionnaire sections to refine outputs      |
| **Team Access**            | Invite brand owners and managers to the workspace    |
| **Export**                  | Download brand guide as PDF, HTML, or JSON           |
| **Version History**        | Track changes to brand guide over time               |

### Workspace Data Model (Google Sheets)

Each brand workspace corresponds to rows in the Google Sheets data layer:

```
Sheet: "Brands"
Columns: brand_id | brand_name | slug | owner_email | created_at | status | phase_completed

Sheet: "Questionnaire_Responses"
Columns: brand_id | phase | question_id | question_text | response | updated_at

Sheet: "Team_Members"
Columns: brand_id | email | role | invited_at | accepted_at

Sheet: "Assets"
Columns: brand_id | asset_type | file_name | r2_url | uploaded_at

Sheet: "Activity_Log"
Columns: brand_id | user_email | action | details | timestamp
```

---

## 5. User Roles & Permissions

### Role Definitions

| Role               | Permissions                                              |
| ------------------ | -------------------------------------------------------- |
| **System Admin**   | Full access. Manage all brands, users, and settings.     |
| **Brand Owner**    | Full access to their brand workspace. Can invite managers.|
| **Brand Manager**  | Edit brand content, upload assets, view brand guide.     |
| **Viewer**         | Read-only access to the brand guide and assets.          |

### Access Flow

1. User visits the app and starts the questionnaire (no account required to begin)
2. At Phase 2, user must provide an email to save progress
3. Email verification via a magic link (Cloudflare Workers handles this)
4. Completing the questionnaire creates the brand workspace
5. Brand Owner can invite Brand Managers via email
6. Shared brand guide links can be set to public or private

---

## 6. Google Sheets Data Layer

### Why Google Sheets?

- **Free** — No database costs
- **Familiar** — Brand owners can view their data in a spreadsheet they understand
- **Shareable** — Easy to grant access to team members
- **API Access** — Google Sheets API v4 is well-documented and reliable
- **Backup** — Data lives in Google Drive with automatic version history

### Sheets Architecture

**Master Spreadsheet: `Island_Todo_Branding_System`**

| Sheet Name                 | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `Brands`                   | Brand registry — all brands in the system    |
| `Questionnaire_Responses`  | All questionnaire answers by brand           |
| `Generated_Content`        | AI/template-generated brand guide sections   |
| `Team_Members`             | User access and roles per brand              |
| `Assets`                   | Brand asset metadata and R2 URLs             |
| `Activity_Log`             | Audit trail of all actions                   |
| `System_Config`            | Global settings and feature flags            |

### API Integration (via Cloudflare Pages Functions)

```
/functions/api/
  sheets/
    brands.js           # CRUD for brands
    responses.js        # Save/load questionnaire responses
    content.js          # Save/load generated content
    team.js             # Team member management
    assets.js           # Asset metadata tracking
```

### Google Service Account Setup

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create a service account with Sheets editor access
4. Share the master spreadsheet with the service account email
5. Store the service account JSON key as a Cloudflare environment variable

---

## 7. Cloudflare Pages Deployment

### Free Tier Capabilities

| Resource               | Free Tier Limit           | Our Usage                |
| ---------------------- | ------------------------- | ------------------------ |
| **Builds**             | 500/month                 | ~30/month (with CI/CD)   |
| **Bandwidth**          | Unlimited                 | Static assets + API      |
| **Pages Functions**    | 100,000 requests/day      | API calls to Sheets/R2   |
| **R2 Storage**         | 10 GB free                | Brand assets             |
| **R2 Operations**      | 1M reads, 10K writes/mo   | Asset uploads/downloads  |
| **Custom Domains**     | Unlimited                 | 1 primary domain         |
| **Preview Deploys**    | Unlimited                 | Per-branch previews      |

### Deployment Pipeline

```
Git Push (main branch)
    │
    ▼
Cloudflare Pages Build
    │
    ├── Astro builds static HTML/CSS/JS
    ├── Pages Functions deployed to edge
    └── Assets pushed to CDN
    │
    ▼
Live at: https://island-todo-branding.pages.dev
         (or custom domain)
```

### Environment Variables (Cloudflare Dashboard)

```
GOOGLE_SERVICE_ACCOUNT_KEY    # JSON key for Sheets API access
GOOGLE_SPREADSHEET_ID         # ID of the master spreadsheet
CLOUDFLARE_R2_BUCKET          # R2 bucket name for brand assets
SESSION_SECRET                # Secret for session/cookie signing
MAGIC_LINK_SECRET             # Secret for email verification links
```

### `wrangler.toml` Configuration

```toml
name = "island-todo-branding"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[[r2_buckets]]
binding = "BRAND_ASSETS"
bucket_name = "island-todo-brand-assets"
```

---

## 8. Application Structure

### Directory Layout

```
/island-todo-branding/
│
├── astro.config.mjs                # Astro configuration
├── tailwind.config.mjs             # Tailwind CSS configuration
├── wrangler.toml                   # Cloudflare Workers/R2 config
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
│
├── public/                         # Static assets (copied as-is)
│   ├── favicon.ico
│   ├── fonts/
│   └── images/
│       ├── island-logo.svg
│       └── hero-bg.jpg
│
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro        # HTML shell, meta tags, nav/footer
│   │   ├── DashboardLayout.astro   # Authenticated workspace layout
│   │   └── QuestionnaireLayout.astro  # Questionnaire flow layout
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── Button.astro
│   │   │   └── ProgressBar.astro
│   │   │
│   │   ├── questionnaire/
│   │   │   ├── QuestionCard.astro
│   │   │   ├── PhaseIntro.astro
│   │   │   ├── TextInput.astro
│   │   │   ├── LongTextInput.astro
│   │   │   ├── MultiStepForm.astro
│   │   │   └── PhaseReview.astro
│   │   │
│   │   ├── dashboard/
│   │   │   ├── BrandOverview.astro
│   │   │   ├── GuidePreview.astro
│   │   │   ├── AssetGrid.astro
│   │   │   ├── TeamList.astro
│   │   │   └── ActivityFeed.astro
│   │   │
│   │   └── brand-guide/
│   │       ├── OriginStory.astro
│   │       ├── ProcessMap.astro
│   │       ├── CustomerPersona.astro
│   │       ├── VoiceGuide.astro
│   │       ├── VisualIdentity.astro
│   │       ├── Positioning.astro
│   │       └── FullBlueprint.astro
│   │
│   ├── pages/
│   │   ├── index.astro             # Landing page
│   │   ├── start.astro             # Begin questionnaire
│   │   ├── questionnaire/
│   │   │   ├── [phase].astro       # Dynamic questionnaire phases 1-7
│   │   │   └── review.astro        # Review all answers before generating
│   │   ├── dashboard/
│   │   │   ├── index.astro         # Brand list / workspace selector
│   │   │   └── [brand-slug]/
│   │   │       ├── index.astro     # Brand dashboard
│   │   │       ├── guide.astro     # View/edit brand guide
│   │   │       ├── assets.astro    # Manage brand assets
│   │   │       ├── team.astro      # Manage team access
│   │   │       └── export.astro    # Export brand guide
│   │   └── guide/
│   │       └── [brand-slug].astro  # Public/shared brand guide view
│   │
│   ├── lib/
│   │   ├── questionnaire-data.ts   # All 35 questions, phases, examples
│   │   ├── brand-generator.ts      # Logic to generate brand guide from answers
│   │   ├── sheets-client.ts        # Google Sheets API wrapper
│   │   ├── r2-client.ts            # Cloudflare R2 operations
│   │   ├── auth.ts                 # Magic link auth logic
│   │   └── utils.ts                # Shared utilities
│   │
│   └── styles/
│       └── global.css              # Tailwind base + custom styles
│
├── functions/                      # Cloudflare Pages Functions (API)
│   └── api/
│       ├── brands/
│       │   ├── index.js            # GET all, POST create
│       │   └── [id].js             # GET one, PUT update, DELETE
│       ├── questionnaire/
│       │   ├── save.js             # Save questionnaire progress
│       │   └── load.js             # Load saved progress
│       ├── generate/
│       │   └── brand-guide.js      # Generate brand guide from responses
│       ├── assets/
│       │   ├── upload.js           # Upload to R2
│       │   └── list.js             # List brand assets
│       ├── team/
│       │   ├── invite.js           # Send team invite
│       │   └── manage.js           # Update/remove members
│       └── auth/
│           ├── magic-link.js       # Send magic link email
│           └── verify.js           # Verify magic link token
│
└── scripts/
    ├── setup-sheets.js             # Initialize Google Sheets structure
    └── seed-data.js                # Seed example brand data
```

---

## 9. Page-by-Page Breakdown

### 9.1 Landing Page (`/`)

**Purpose:** Explain the system, build trust, start the journey.

**Sections:**

1. **Hero Section**
   - Headline: *"Build Your Brand From What You've Already Built"*
   - Subheadline: *"Answer 35 questions about your real business experience.
     Get a complete, personalized Brand Blueprint — not a generic template."*
   - CTA Button: *"Start Your Brand Blueprint"*

2. **How It Works**
   - Step 1: *"Tell Your Story"* — Answer guided questions about your business
     journey
   - Step 2: *"We Build Your Blueprint"* — Your answers generate a personalized
     brand guide
   - Step 3: *"Own Your Brand"* — Get a complete workspace with your guide,
     assets, and team access

3. **The 7 Phases**
   - Visual cards for each phase with icons:
     - Your Story | Your Process | Your People | Your Voice | Your Look |
       Your Position | Your Blueprint

4. **What You Get**
   - Brand Origin Story
   - Customer Persona
   - Voice & Tone Guide
   - Visual Identity Direction
   - Competitive Positioning
   - Complete Brand Blueprint PDF
   - Your Own Brand Workspace

5. **Testimonials / Examples** (placeholder for future content)

6. **Footer**
   - Links: About, Privacy, Terms, Contact
   - *"Powered by The Island Todo"*

---

### 9.2 Questionnaire Flow (`/questionnaire/[phase]`)

**Purpose:** Walk the user through all 7 phases, one question at a time.

**UI Pattern:**
- Top: Progress bar showing current phase (1 of 7) and question within phase
- Left sidebar (desktop): Phase list with completion indicators
- Center: Question card with example toggle
- Bottom: Navigation (Back / Save & Continue)

**Behavior:**
- Each question is displayed one at a time (not all at once)
- "Show Example" toggle reveals the example answer below the input
- Answers auto-save to localStorage and sync to Google Sheets when online
- Phase transitions show the phase intro text (the quoted text from Section 3)
- At the end of each phase, show a summary of what will be generated

**Technical:**
- Client-side form state managed in vanilla JS (no framework needed)
- Debounced auto-save (500ms after typing stops)
- API calls to `/api/questionnaire/save` on each save
- LocalStorage as offline fallback

---

### 9.3 Review Page (`/questionnaire/review`)

**Purpose:** Let the user review all answers before generating the brand guide.

**Sections:**
- Collapsible accordion for each phase
- Each question shows the answer with an "Edit" button
- "Generate My Brand Blueprint" button at the bottom
- Estimated generation output preview (what sections will be created)

---

### 9.4 Brand Dashboard (`/dashboard/[brand-slug]`)

**Purpose:** The brand workspace — manage everything about the brand.

**Sections:**

1. **Brand Health Score** — Percentage completion of the brand guide
2. **Quick Actions** — View Guide, Edit Answers, Upload Assets, Invite Team
3. **Recent Activity** — Timeline of recent changes
4. **Generated Sections** — Cards for each brand guide section with status
5. **Team Members** — List with roles and access management
6. **Export Options** — PDF, HTML, JSON download buttons

---

### 9.5 Brand Guide View (`/guide/[brand-slug]`)

**Purpose:** The polished, shareable brand guide document.

**Sections (in order):**

1. **Cover** — Brand name, tagline, date generated
2. **Brand Origin Story** — Narrative from Phase 1
3. **Brand Values** — Derived from story and process answers
4. **Ideal Customer** — Persona from Phase 3
5. **Brand Voice** — Tone guide, templates, content pillars from Phase 4
6. **Visual Identity** — Colors, typography, visual direction from Phase 5
7. **Market Position** — Positioning, differentiators from Phase 6
8. **Brand Promise** — The core promise from Phase 7
9. **Brand Blueprint Summary** — 10-word description, manifesto, guard rails

---

## 10. Brand Guide Generation Engine

The generation engine transforms raw questionnaire answers into formatted,
professional brand guide sections.

### Generation Logic (Template-Based)

Each phase's answers feed into generation templates:

```
Phase 1 Answers  →  Brand Origin Story Template  →  Formatted Narrative
Phase 2 Answers  →  Process Map Template          →  Visual Process + UVP
Phase 3 Answers  →  Persona Builder Template      →  Customer Profile Card
Phase 4 Answers  →  Voice Analyzer Template       →  Voice Guide Document
Phase 5 Answers  →  Visual Identity Template      →  Color/Type/Mood Specs
Phase 6 Answers  →  Positioning Template          →  Positioning Statement
Phase 7 Answers  →  Blueprint Compiler            →  Complete Brand Guide
```

### Example: Origin Story Generation

**Inputs (from Phase 1):**
- Business name: "Island Provisions Co."
- What it does: "Source and deliver premium Caribbean ingredients"
- Why started: "Grandmother traded spices... couldn't find scotch bonnet peppers"
- Previous experience: "Logistics coordinator for a shipping company"
- Biggest challenge: "Getting restaurants to trust a new supplier"

**Generated Output:**

> **The Island Provisions Story**
>
> Island Provisions Co. was born from a simple truth: the ingredients that
> define Caribbean cuisine deserve a better path from farm to kitchen.
>
> Founder James grew up watching his grandmother trade spices at the local
> market — a world where quality was personal and every transaction carried
> trust. When he moved to New York and discovered that real scotch bonnet
> peppers were nearly impossible to find, the gap became impossible to ignore.
>
> Armed with years of supply chain experience as a logistics coordinator,
> James built a direct sourcing network that connects verified Caribbean farms
> to restaurant kitchens across the East Coast. The biggest hurdle wasn't
> logistics — it was trust. Six months of free samples and relentless
> consistency turned skeptical chefs into loyal partners.
>
> Today, Island Provisions stands for one thing: when a chef puts "farm to
> table" on their menu, it means something real.

### Color Palette Generation (from Phase 5)

**Input:** "Deep green (the farms), warm orange (scotch bonnet peppers), dark
brown (the wood crates)"

**Generated Palette:**

| Role      | Color          | Hex       | Usage                          |
| --------- | -------------- | --------- | ------------------------------ |
| Primary   | Farm Green     | `#2D5016` | Headers, primary buttons       |
| Secondary | Pepper Orange  | `#D4722A` | Accents, highlights, CTAs      |
| Neutral   | Crate Brown    | `#4A3728` | Body text, backgrounds         |
| Light     | Natural White  | `#F5F0EB` | Page backgrounds               |
| Dark      | Deep Earth     | `#1A1A1A` | Text, footer                   |

---

## 11. Content & Copy

### App-Wide Messaging

**Tagline:** *"Build Your Brand From What You've Already Built"*

**Mission Statement:** *"The Island Todo Branding Blueprint helps entrepreneurs
create authentic brands from their real business experiences — not generic
templates."*

**Value Propositions:**
1. *"Your story is your strategy"* — Brand built from real experience
2. *"Guided, not guessed"* — 35 structured questions lead to clarity
3. *"Your workspace, your brand"* — Every brand gets its own managed space
4. *"Share with confidence"* — Professional brand guides ready to share

### Error Messages & Empty States

| State                      | Message                                              |
| -------------------------- | ---------------------------------------------------- |
| Empty questionnaire        | *"Your brand journey starts with the first answer."* |
| Saving progress            | *"Saving your progress..."*                          |
| Save complete              | *"Your answers are safe."*                           |
| Offline                    | *"You're offline. Your work is saved locally."*      |
| No team members            | *"Your brand, your team. Invite collaborators."*     |
| Empty asset library        | *"Upload your brand's visual assets here."*          |
| Guide not generated yet    | *"Complete the questionnaire to unlock your guide."*  |

---

## 12. Development Phases

### Phase A: Foundation (Core Setup)

- [ ] Initialize Astro project with Cloudflare adapter
- [ ] Set up Tailwind CSS
- [ ] Configure wrangler.toml for Cloudflare Pages
- [ ] Create base layouts (BaseLayout, QuestionnaireLayout, DashboardLayout)
- [ ] Build common components (Header, Footer, ProgressBar, Button)
- [ ] Deploy initial skeleton to Cloudflare Pages

### Phase B: Questionnaire Engine

- [ ] Build questionnaire data structure (all 35 questions, 7 phases)
- [ ] Create QuestionCard, PhaseIntro, and form input components
- [ ] Implement multi-step form navigation with progress tracking
- [ ] Add localStorage auto-save for offline support
- [ ] Build review page with answer editing
- [ ] Implement API routes for saving/loading questionnaire data

### Phase C: Google Sheets Integration

- [ ] Set up Google Cloud project and service account
- [ ] Create master spreadsheet with all required sheets
- [ ] Build Sheets API client (sheets-client.ts)
- [ ] Implement Cloudflare Pages Functions for CRUD operations
- [ ] Connect questionnaire save/load to Sheets API
- [ ] Add brand creation flow (questionnaire completion → brand record)

### Phase D: Brand Guide Generation

- [ ] Build generation templates for each phase's output
- [ ] Create brand-generator.ts with all transformation logic
- [ ] Build brand guide view page with all sections
- [ ] Implement PDF export (client-side, using a library like jsPDF)
- [ ] Add HTML export for standalone brand guide pages

### Phase E: Brand Workspace

- [ ] Build dashboard layout and brand overview page
- [ ] Create asset upload/management with R2 integration
- [ ] Build team member invite and management system
- [ ] Implement magic link authentication
- [ ] Add activity logging and audit trail
- [ ] Build brand settings page

### Phase F: Polish & Launch

- [ ] Landing page design and content
- [ ] Responsive design pass (mobile-first)
- [ ] Performance optimization (Core Web Vitals)
- [ ] SEO meta tags and Open Graph images
- [ ] Error handling and loading states
- [ ] User testing and feedback
- [ ] Custom domain setup on Cloudflare
- [ ] Launch

---

## Appendix: Key Decisions & Rationale

### Why Astro over Next.js / SvelteKit?

Astro outputs zero JavaScript by default and only hydrates interactive
"islands" — matching our need for a mostly-static site with interactive
questionnaire forms. It has first-class Cloudflare Pages support and the
smallest possible bundle size for a free-tier deployment.

### Why Google Sheets over D1 / KV?

Google Sheets provides a UI that brand owners already know. They can open
their spreadsheet and see their data without learning a new tool. It also
provides free version history, sharing, and export — features we'd have to
build ourselves with D1 or KV.

### Why Magic Links over Passwords?

No password storage means no security liability. Magic links are simpler for
users who may not be technical, and they work well with the email-based team
invite system.

### Why Cloudflare R2 over External Storage?

R2 is free for our usage level, co-located with our Pages deployment for fast
access, and requires no additional service accounts or billing setup beyond
what we already have with Cloudflare.

---

*The Island Todo Branding Blueprint — Version 1.0*
*Generated: 2026-02-14*
