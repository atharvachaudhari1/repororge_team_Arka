<div align="center">

<img src="https://img.shields.io/badge/♿-AccessPath-149187?style=for-the-badge&labelColor=0f172a&color=149187" alt="AccessPath" height="40"/>

# AccessPath
### AI-Powered Inclusive Career & Employment Platform

**Find Jobs Without Barriers.**

An accessibility-first career platform built for visually impaired,
transgender, and underserved job seekers — powered by explainable AI.

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-8B5CF6?style=flat-square)](https://openrouter.ai)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2_AA-149187?style=flat-square)](https://www.w3.org/WAI/WCAG22/quickref/)
[![MIT License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](./LICENSE)

<br/>

[🚀 Live Demo](#-live-demo) · [✨ Features](#-features) · [⚙️ Setup](#️-installation) · [♿ Accessibility](#-accessibility) · [🛡️ Responsible AI](#️-responsible-ai) · [🗺️ Roadmap](#️-roadmap)

</div>

---

## 🧭 Navigation

<details>
<summary>Click to expand full table of contents</summary>

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Core Philosophy](#-core-philosophy)
- [Features](#-features)
  - [Accessible Job Discovery](#-1-accessible-job-discovery)
  - [Voice-Powered Search](#️-2-voice-powered-search)
  - [Accessibility Filters](#-3-accessibility-filters)
  - [Explainable AI Matching](#-4-explainable-ai-matching)
  - [Resume Analysis](#-5-resume--job-analysis)
  - [Accessible Application Flow](#-6-accessible-application-flow)
  - [Candidate-Controlled Privacy](#-7-candidate-controlled-privacy)
  - [Read-Aloud Support](#-8-read-aloud-support)
  - [Accessibility Controls](#-9-accessibility-controls)
  - [Application Tracker](#-10-application-tracker)
- [Product Phases](#-five-phase-product-evolution)
- [User Journey](#-user-journey)
- [AI Capabilities](#-ai-capabilities)
- [Accessibility](#-accessibility)
- [Responsible AI](#️-responsible-ai)
- [Architecture](#️-system-architecture)
- [Tech Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#️-installation)
- [Environment Variables](#-environment-variables)
- [Demo Guide](#-5-minute-demo-guide)
- [Impact](#-impact)
- [Roadmap](#️-roadmap)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [Team](#-team)

</details>

---

## 🌟 Overview

**AccessPath** is an AI-powered, accessibility-first career platform that goes beyond job listings. It helps visually impaired, transgender, and underserved candidates not just *find* jobs — but *understand*, *access*, and *apply* with confidence.

| Traditional Job Portals | AccessPath |
|---|---|
| Job listings + keyword search | Career discovery + explainable AI |
| Apply blindly | Understand your match score |
| Unknown workplace accessibility | Transparent accessibility info |
| One-size-fits-all experience | Personalised, adaptive, inclusive |
| Identity disclosure required | Candidate-controlled privacy |

> **We are not building another job board.**
> **We are building the access layer between people and opportunity.**

---

## ❗ The Problem

Finding a vacancy is not the same as finding a job you can actually access.

<details>
<summary>♿ Accessibility questions candidates ask — but can't get answered</summary>

- Is the application website screen-reader friendly?
- Can I navigate the form using only a keyboard?
- Will the interview be accessible?
- Are captions or alternative communication options available?
- Is remote or flexible work available?

</details>

<details>
<summary>🏳️‍⚧️ Inclusion questions that go unanswered</summary>

- Is this workplace inclusive of transgender employees?
- Can I use my preferred name?
- Do I have to disclose sensitive personal information?
- Will my identity be used against me?

</details>

<details>
<summary>📄 Career readiness gaps</summary>

- Do my skills match this role?
- What am I missing?
- How do I improve my resume?
- Am I ready for this interview?

</details>

Traditional platforms stop at the listing. AccessPath addresses the full journey:

```
Find → Understand → Evaluate Accessibility → Apply → Track → Grow
```

---

## 💡 Our Solution

AccessPath adds an **intelligence and accessibility layer** on top of the employment journey.

```
                    ┌─────────────────────────┐
                    │      ACCESSPATH         │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   Career Discovery        Accessible Search       AI Job Matching
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    Accessibility Evaluation
                                 ▼
                      Resume & Skill Analysis
                                 ▼
                       Accessible Application
                                 ▼
                       Application Tracking
                                 ▼
                          Career Growth
```

---

## 🎯 Core Philosophy

### 1. ♿ Accessibility First
Accessibility is designed into the product from day one — not bolted on.

### 2. 🔐 Candidate Control
You decide what personal and sensitive information you share, with whom, and when.

### 3. ⚖️ Fair AI
Protected identity characteristics must never influence job ranking or recommendations.

---

## ✨ Features

### 🔎 1. Accessible Job Discovery

Search and filter jobs by:

- Job title, skills, company, location
- Work mode (remote / hybrid / on-site)
- Experience level and employment type
- Accessibility requirements

---

### 🎙️ 2. Voice-Powered Search

Speak naturally. AccessPath converts your words into structured filters.

**Example input:**
> *"Find remote frontend developer jobs in Chennai with accessible interviews."*

**Result:**
```
Role       →  Frontend Developer
Location   →  Chennai
Work Mode  →  Remote
Filter     →  Accessible Interview ✓
```

**Why it matters:** Reduces navigation effort for users with visual impairments. Voice-first interaction makes job discovery faster and more independent.

---

### ♿ 3. Accessibility Filters

Filter jobs by declared accessibility support.

| Filter | Description |
|---|---|
| Screen-reader friendly | Application usable with assistive tech |
| Keyboard navigation | No mouse required |
| Accessible interview | Interview format is accessible |
| Captioning | Live captions available |
| Remote work | No commute required |
| Flexible work | Adaptable schedules |
| Alternative communication | Non-verbal options available |

**Transparency indicators:**

| Badge | Meaning |
|---|---|
| 🟢 Verified | Independently confirmed |
| 🟡 Employer Provided | Self-declared by employer |
| ⚪ Not Specified | No data available |

> AccessPath never assumes accessibility when information is absent.

---

### 🧠 4. Explainable AI Matching

Every match score comes with a plain-English explanation.

```
94% MATCH

┌──────────────────────────────────┐
│  Skills            ████████ 95% │
│  Experience        ███████  90% │
│  Career Goal       █████████100%│
│  Work Preference   █████████100%│
└──────────────────────────────────┘

✅  React matches the role
✅  JavaScript matches the role
✅  Remote work matches your preference
✅  Fresher-friendly position

⚠️  Automated testing is a potential skill gap
```

No black boxes. Candidates understand *why* a job was recommended and *what* they can do about gaps.

---

### 📄 5. Resume → Job Analysis

Upload or paste your resume. Compare it against any job listing.

```
MATCHED SKILLS          SKILL GAP              RECOMMENDATION
──────────────          ─────────              ──────────────
✅ React                ⚠️  Automated Testing   Add relevant testing
✅ JavaScript                                  experience or a
✅ Git                                         personal project.
```

---

### 📝 6. Accessible Application Flow

```
Select Job
    ↓
Review AI Match
    ↓
Review Resume Analysis
    ↓
Optional: Interview Preferences
    (Captioning / Written Communication /
     Flexible Timing / Alt. Platform)
    ↓
Apply
```

---

### 🔐 7. Candidate-Controlled Privacy

AccessPath does not require disclosure of sensitive identity information to search for jobs.

**Always optional:**
- Pronouns
- Gender identity
- Accessibility preferences
- Accommodation requests

> **You control what employers see.** Sensitive information should never be a barrier to entering the job marketplace.

---

### 🔊 8. Read-Aloud Support

Job details can be read aloud using the Web Speech API.

```
▶ Play    ⏸ Pause    ⏹ Stop
```

Useful for users with visual impairments or reading difficulties.

---

### 🎨 9. Accessibility Controls

- High contrast mode
- Font scaling (small / medium / large)
- Keyboard-only navigation
- Visible focus indicators
- Screen-reader-compatible semantic HTML
- Accessible forms, labels, and buttons

---

### 📊 10. Application Tracker

Track every application through its full lifecycle.

```
Applied  →  Under Review  →  Interview  →  Offer
```

Dashboard shows: saved jobs · recommended jobs · applications · statuses · profile

---

## 🗺️ Five-Phase Product Evolution

```
 ✅ PHASE 1 — Accessible Job Discovery
          ↓
 ✅ PHASE 2 — AI Matching & Application
          ↓
 🚧 PHASE 3 — Accessibility & Inclusive Hiring
          ↓
 🔮 PHASE 4 — Career Intelligence & Readiness
          ↓
 🔮 PHASE 5 — Inclusive Employer Ecosystem
```

<details>
<summary>✅ Phase 1 — Accessible Job Discovery (Implemented)</summary>

**Goal:** Build the accessibility-first job marketplace.

- Job search with filters
- Voice search
- Accessibility filters
- Read-aloud support
- High contrast + font scaling
- Keyboard navigation + screen-reader support
- Saved jobs
- Candidate profile & dashboard

</details>

<details>
<summary>✅ Phase 2 — AI Matching & Application (Implemented)</summary>

**Goal:** Transform the job board into an intelligent employment platform.

- AI job matching with explainable scores
- "Why this job?" natural language explanations
- Resume → Job analysis & skill gap detection
- Resume improvement suggestions
- One-click application with optional interview preferences
- Application tracker
- Employer accessibility declarations
- AI career assistant

</details>

<details>
<summary>🚧 Phase 3 — Accessibility & Inclusive Hiring (In Development)</summary>

**Goal:** Make accessibility and inclusion visible throughout the hiring process.

- Accessibility Fit — candidate preferences vs. employer support
- Advanced voice search
- Candidate-controlled identity and privacy controls
- Structured employer accessibility profiles
- Accessibility transparency layer

</details>

<details>
<summary>🔮 Phase 4 — Career Intelligence & Readiness (Planned)</summary>

**Goal:** Help candidates prepare before they apply.

- AI career discovery from degree/background
- Career roadmaps and learning recommendations
- Resume builder
- AI mock interviews and preparation coach
- Interview feedback

</details>

<details>
<summary>🔮 Phase 5 — Inclusive Employer Ecosystem (Planned)</summary>

**Goal:** Create a two-sided inclusive employment marketplace.

- Employer inclusion toolkit
- Accessibility assessment and recommendations
- Inclusive hiring analytics
- Salary and skill-demand intelligence
- Accessibility certification for employers

</details>

---

## 🔄 User Journey

```
👤 Create Profile
        ↓
🔎 Discover Jobs
        ↓
🎙️ Voice Search (optional)
        ↓
🧠 AI Job Matching
        ↓
♿ Check Accessibility Fit
        ↓
📄 Resume Analysis
        ↓
📝 Apply (with optional preferences)
        ↓
📊 Track Application
        ↓
🚀 Career Growth
```

---

## 🤖 AI Capabilities

| Capability | Purpose |
|---|---|
| 🧠 Job Matching | Identify professional fit across skills, experience, and preferences |
| 💬 Match Explanation | Explain recommendations in plain language |
| 📄 Resume Analysis | Compare resume against job requirements |
| 🎯 Skill Gap Detection | Identify what's missing |
| ✍️ Resume Suggestions | Actionable improvement advice |
| 🎙️ Voice Understanding | Convert natural speech into structured filters |
| 🧭 Career Guidance | Explore career paths from your background |
| 🎤 Interview Preparation | Practice and improve responses |

---

## ♿ Accessibility

AccessPath is built to follow **WCAG 2.2 AA** principles.

### Keyboard Navigation

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move between interactive elements |
| `Enter` / `Space` | Activate buttons and links |
| `Escape` | Close dialogs and menus |

### Screen Readers
- Semantic heading hierarchy
- Descriptive `aria-label` attributes
- Labelled form controls
- Meaningful link text
- Logical focus order

### Visual Accessibility
- High contrast mode
- Font scaling (does not break layout)
- Visible focus indicators on all interactive elements
- No colour-only information indicators

### Voice
```
Voice Input  →  Natural Language  →  Search Intent  →  Filters  →  Results
```

---

## 🛡️ Responsible AI

### Protected identity must not determine employability.

The following characteristics are **never** used to rank or filter candidates:

- Disability or accessibility needs
- Transgender identity
- Gender identity
- Pronouns

### Matching criteria

AI recommendations are based exclusively on:

- Skills match
- Experience level
- Education
- Career interests
- Job requirements
- Work preferences

### Accessibility preferences

Accessibility preferences help candidates evaluate workplace compatibility.
They must never be used to screen out or deprioritise candidates.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│                   ACCESSPATH                    │
│                 React + TypeScript              │
└──────────────────────┬──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    Candidate        Jobs         Employer
     Profile        Search         Portal
         │             │             │
         └─────────────┼─────────────┘
                       ▼
              Application Layer
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    AI Matching    Resume AI    Accessibility
         │             │          Engine
         └─────────────┼─────────────┘
                       ▼
             Data / API Layer
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
       Jobs         Profiles    Applications
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 7 |
| **Styling** | Tailwind CSS 3, Framer Motion |
| **AI / LLM** | OpenRouter (LLM-powered matching, resume analysis, career guidance) |
| **Backend / Data** | Convex / PostgreSQL |
| **Accessibility** | Web Speech API, Text-to-Speech, ARIA, Semantic HTML |
| **Standards** | WCAG 2.2 AA |

---

## 📁 Project Structure

```
accesspath/
│
├── public/
│   └── assets/
│
├── src/
│   ├── components/
│   │   ├── accessibility/     # High contrast, font scaling, read-aloud
│   │   ├── jobs/              # Job cards, job details, filters
│   │   ├── matching/          # AI match score, explanations
│   │   ├── profile/           # Candidate profile, privacy controls
│   │   ├── applications/      # Application tracker
│   │   └── common/            # Shared UI components
│   │
│   ├── pages/
│   │   ├── Home/
│   │   ├── Jobs/
│   │   ├── JobDetails/
│   │   ├── Profile/
│   │   ├── Dashboard/
│   │   └── Applications/
│   │
│   ├── services/
│   │   ├── ai/                # OpenRouter integration
│   │   ├── jobs/              # Job search and filtering
│   │   └── applications/      # Application management
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Helpers and formatters
│   ├── data/                  # Static data, mock data
│   ├── styles/                # Global styles
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Installation

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Git | any recent version |

Verify:
```bash
node --version
npm --version
git --version
```

### 1. Clone

```bash
git clone https://github.com/Vijayalakshmi2608/access-path-jobs.git
cd access-path-jobs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values — see [Environment Variables](#-environment-variables) below.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables

Create a `.env` file at the project root:

```env
# AI — OpenRouter API key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Add any other required variables here
```

> ⚠️ **Never commit `.env` or real API keys to GitHub.**

Your `.gitignore` should include:

```
.env
.env.local
node_modules/
dist/
```

An `.env.example` with placeholder values is safe to commit.

---

## 🔧 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 🎬 5-Minute Demo Guide

Use this flow for hackathon demonstrations.

### Step 1 — Voice Search *(30 seconds)*
Activate voice search and say:
> *"Find remote frontend developer jobs in Chennai with accessible interviews."*

Show filters auto-populating from speech.

### Step 2 — Accessibility Filters *(45 seconds)*
Demonstrate the accessibility filter panel:
```
✅ Remote work
✅ Accessible interview
✅ Screen-reader support
✅ Keyboard navigation
```
Show the 🟢 / 🟡 / ⚪ transparency badges on job cards.

### Step 3 — AI Match Score *(60 seconds)*
Open a job with a high match score. Show:
```
94% MATCH — 8 of 9 requirements met
```
Then open the **"Why this job?"** panel and walk through the skills breakdown and gap explanation.

### Step 4 — Resume Analysis *(60 seconds)*
Paste or upload a resume. Show the matched skills, skill gaps, and AI-generated improvement suggestions side-by-side with the job description.

### Step 5 — Accessible Application *(45 seconds)*
Walk through the application flow including the optional interview preferences panel (captioning, alternative communication, flexible timing).

### Step 6 — Application Tracker *(30 seconds)*
Show the dashboard: saved jobs, active applications, and the status pipeline.

### 🎤 Closing line

> *"Traditional job platforms help people find opportunities. AccessPath helps them understand whether they can actually access those opportunities."*

---

## 🌍 Impact

### For Job Seekers

| Before AccessPath | With AccessPath |
|---|---|
| Discover accessibility only after applying | Know before you apply |
| Opaque match scores | Transparent, explainable AI |
| Identity disclosure required | Full candidate control |
| Generic job board UX | Designed for accessibility |

### For Employers

- Communicate workplace accessibility clearly and structurally
- Reach a wider, more diverse talent pool
- Build more transparent and inclusive hiring processes

### Long-Term Vision

```
Better Information
       ↓
Better Decisions
       ↓
More Confident Applications
       ↓
More Inclusive Hiring
       ↓
Greater Employment Access
```

---

## 🔮 Future Scope

- AI-powered interview coaching with real-time feedback
- Accessibility verification program for employers
- Multilingual voice search
- Mobile application (iOS + Android)
- Employer inclusion analytics dashboard
- Skill-demand forecasting and salary intelligence
- Learning platform integrations for skill gap resolution
- Workplace accessibility certification

---

## 🗺️ Roadmap

| Phase | Status | Focus |
|---|---|---|
| **Phase 1** — Accessible Job Discovery | ✅ Implemented | Job search, voice, filters, accessibility controls |
| **Phase 2** — AI Matching & Application | ✅ Implemented | Explainable AI, resume analysis, application tracker |
| **Phase 3** — Accessibility & Inclusive Hiring | 🚧 In Development | Accessibility Fit, employer profiles, advanced privacy |
| **Phase 4** — Career Intelligence | 🔮 Planned | Career discovery, mock interviews, resume builder |
| **Phase 5** — Inclusive Employer Ecosystem | 🔮 Planned | Two-sided marketplace, employer analytics, certification |

---

## 📸 Screenshots

> Add screenshots to `docs/screenshots/` and update the paths below.

| Screen | Preview |
|---|---|
| 🏠 Landing Page | `![Home](docs/screenshots/home.png)` |
| 🔎 Job Search | `![Jobs](docs/screenshots/jobs.png)` |
| 🧠 AI Match | `![Match](docs/screenshots/ai-match.png)` |
| ♿ Accessibility Controls | `![Accessibility](docs/screenshots/accessibility.png)` |
| 📄 Resume Analysis | `![Resume](docs/screenshots/resume-analysis.png)` |
| 📊 Application Tracker | `![Tracker](docs/screenshots/applications.png)` |

---

## 🔗 Links

| Resource | Link |
|---|---|
| 💻 GitHub | [access-path-jobs](https://github.com/Vijayalakshmi2608/access-path-jobs) |
| 🎥 Demo Video | *Add YouTube link* |
| 📊 Presentation | *Add Slides link* |
| 🌐 Live Demo | *Add deployed URL* |

---

## 🤝 Contributing

Contributions are welcome. Please read the guidelines below before opening a PR.

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/access-path-jobs.git

# 3. Create a branch
git checkout -b feature/your-feature-name

# 4. Make your changes, then commit
git add .
git commit -m "feat: describe your change"

# 5. Push and open a Pull Request
git push origin feature/your-feature-name
```

**Please ensure any new UI feature considers accessibility.** New interactive components should be keyboard-navigable, screen-reader-friendly, and follow the existing WCAG 2.2 AA patterns used throughout the project.

---

## 🔒 Security

Do not commit:
- API keys or tokens
- Passwords or secrets
- Personal candidate data
- Production credentials

If you discover a security vulnerability, please report it privately rather than opening a public issue.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

## 👥 Team

| Member | Role |
|---|---|
| **Vijayalakshmi S** | Product & Development |
| *Add team members* | *Add roles* |

---

## 🏆 Hackathon

> **International Hackathon 2026**
> Theme: *Inclusive Technology / Employment Accessibility*

---

<div align="center">

<br/>

**♿ ACCESSPATH**

*"We are not building another job board.*
*We are building the access layer between people and opportunity."*

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/Vijayalakshmi2608/access-path-jobs?style=social)](https://github.com/Vijayalakshmi2608/access-path-jobs)
[![GitHub Forks](https://img.shields.io/github/forks/Vijayalakshmi2608/access-path-jobs?style=social)](https://github.com/Vijayalakshmi2608/access-path-jobs/fork)

</div>
