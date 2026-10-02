import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Brain,
  Compass,
  Ear,
  Eye,
  Hand,
  Heart,
  HeartHandshake,
  Keyboard,
  Mic,
  ShieldCheck,
  Sparkles,
  Building2,
  Users,
  Accessibility,
  Volume2,
  Subtitles,
  CheckCircle2,
} from "lucide-react";
import { JobSearchBar } from "@/components/job-search-bar";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JOBS } from "@/lib/jobs-data";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Ableo — Where Ability Meets Opportunity" },
      {
        name: "description",
        content:
          "Ableo: The disability-first job platform. Built for People with Disabilities (PwD) — screen-reader accessible, voice-controlled, captioned, and designed for every ability. Find jobs that truly accommodate you.",
      },
      { property: "og:title", content: "Ableo — Where Ability Meets Opportunity" },
      {
        property: "og:description",
        content: "The job platform built from the ground up for People with Disabilities. Know your accommodations before you apply.",
      },
    ],
  }),
  component: Landing,
}));

const QUICK = [
  "Screen reader friendly",
  "Remote accessible",
  "Wheelchair accessible",
  "Software Developer",
  "Captioned meetings",
  "Flexible hours",
];

const DISABILITY_PILLARS = [
  {
    icon: Eye,
    title: "Visual Disabilities",
    body: "Full screen-reader compatibility, keyboard navigation, high contrast modes, and magnification. Every element is semantically labelled.",
    features: ["Screen reader", "Keyboard only", "High contrast", "Large text"],
  },
  {
    icon: Ear,
    title: "Deaf & Hard of Hearing",
    body: "Live captions on all audio, sign language interview options, visual alerts, and captioned meeting filters on every job listing.",
    features: ["Live captions", "Visual alerts", "Captioned meetings", "Text-based communication"],
  },
  {
    icon: Hand,
    title: "Motor & Physical",
    body: "Voice-controlled navigation, switch device support, extended click targets, and filters for wheelchair-accessible workplaces.",
    features: ["Voice control", "Large targets", "Switch access", "Wheelchair filter"],
  },
  {
    icon: Brain,
    title: "Cognitive & Neurodivergent",
    body: "Dyslexia-friendly fonts, reduced-motion mode, simplified layouts, focus mode, and structured content for cognitive accessibility.",
    features: ["Dyslexia font", "Focus mode", "Reduced motion", "Simple layout"],
  },
  {
    icon: Heart,
    title: "Chronic Health & Mental Health",
    body: "Filter for flexible schedules, remote work, mental health support, and employers with health accommodation policies.",
    features: ["Flexible hours", "Remote work", "Health leave", "Wellness support"],
  },
  {
    icon: ShieldCheck,
    title: "Privacy & Consent",
    body: "Your disability information is never shared without explicit consent. No 'disability scores'. You control what employers see.",
    features: ["Consent-first", "No scoring", "Private by default", "You choose"],
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Tell us your access needs",
    desc: "Select your disability type and specific accommodation needs. Upload a resume to auto-extract your skills — our AI never infers disability from your CV.",
  },
  {
    step: "2",
    title: "See your Accessibility Fit",
    desc: "Every job listing shows a transparent Accessibility Fit score based on the employer's stated accommodations vs. your needs. No guesswork.",
  },
  {
    step: "3",
    title: "Apply with confidence",
    desc: "AI-drafted accommodation request letters, accessible application forms, and interview prep with captioned coaching — all built for you.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const featured = JOBS.slice(0, 3);

  const search = (value: string) => navigate({ to: "/jobs", search: { q: value } });

  return (
    <>
      {/* Hero Section — Disability-First */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-cyan-950/20 to-background py-14 lg:py-24">
        <div className="absolute top-1/4 left-1/4 -mt-20 -ml-20 size-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 -mt-20 -mr-20 size-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 shadow-sm shadow-cyan-500/15 mb-4">
              <Accessibility aria-hidden="true" className="size-4 text-cyan-400" />
              <span>Built for People with Disabilities • Team Arka!</span>
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl font-display tracking-tight text-foreground">
              Your Disability Doesn't Define Your Career.{" "}
              <span className="gradient-text font-black">Your Ability Does.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Ableo is the first job platform designed entirely around the needs of People with Disabilities (PwD). 
              Know your accommodations before applying, understand workplace accessibility, and apply — barrier-free.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground/90">
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 border border-border/40">♿ Screen-reader verified</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 border border-border/40">🎙️ Voice navigation</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 border border-border/40">💬 Live captions</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 border border-border/40">🔒 100% Private</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-xl shadow-cyan-500/25 border-0 text-sm">
                <Link to="/jobs" search={{ q: "" }}>
                  <Accessibility className="size-4 mr-1.5" />
                  Find Accessible Jobs
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/60 hover:bg-secondary text-foreground text-sm">
                <Link to="/profile">
                  <HeartHandshake className="size-4 mr-1.5 text-cyan-400" />
                  Configure My Access Needs
                </Link>
              </Button>
            </div>
            <dl className="mt-10 flex flex-wrap gap-8 text-sm">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Accessible roles</dt>
                <dd className="text-2xl font-black text-cyan-400 mt-0.5">{JOBS.length}</dd>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Inclusive employers</dt>
                <dd className="text-2xl font-black text-purple-400 mt-0.5">
                  {new Set(JOBS.map((j) => j.company)).size}
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Remote-friendly</dt>
                <dd className="text-2xl font-black text-emerald-400 mt-0.5">
                  {JOBS.filter((j) => j.workMode === "Remote").length}
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Screen-reader ready</dt>
                <dd className="text-2xl font-black text-amber-400 mt-0.5">
                  {JOBS.filter((j) => j.access.includes("screen_reader")).length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="glass-card self-start p-6 border-cyan-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-500 to-purple-500" />
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <span className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                <Mic className="size-4" />
              </span>
              Search by typing, voice, or screen reader
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Search by job title, accessibility accommodation (e.g. "Screen reader", "Captions", "Wheelchair"), or company.
            </p>
            <div className="mt-5">
              <JobSearchBar value={q} onChange={setQ} onSubmit={search} id="hero-search" />
            </div>
            <h3 className="mt-6 text-xs uppercase tracking-wider font-bold text-muted-foreground">Quick accessibility filters</h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {QUICK.map((item) => (
                <li key={item}>
                  <Button variant="secondary" size="sm" className="text-xs border border-border/40 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors" onClick={() => search(item)}>
                    {item}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Disability-Centric Accessibility Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="disability-heading">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-3 border-brand/40 bg-brand/5 text-brand">
            <Accessibility className="size-3 mr-1" />
            Disability-First Design
          </Badge>
          <h2 id="disability-heading" className="text-3xl font-bold">
            Every Disability. Every Barrier. Addressed.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Ableo isn't a job board with accessibility bolted on. It's built from scratch for blind users, 
            Deaf users, wheelchair users, neurodivergent people, and anyone with a disability — 
            because inclusive design means designing <em>with</em> disabled people, not for them.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DISABILITY_PILLARS.map((p) => (
            <li key={p.title} className="glass-card p-6 border-border/50 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1 transition-all duration-300">
              <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <p.icon aria-hidden="true" className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary/80 border border-border/50 px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    <CheckCircle2 className="size-3 text-cyan-400" />
                    {f}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* How It Works — PwD Journey */}
      <section className="border-y border-border/40 bg-secondary/20 py-16" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">How It Works</span>
            <h2 id="how-heading" className="text-3xl font-extrabold text-foreground mt-3 font-display">
              Designed for Every Ability
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
              Whether you're blind, Deaf, use a wheelchair, are neurodivergent, or manage chronic health needs — 
              Ableo adapts seamlessly at every step.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.step} className="glass-card p-6 border-border/50 relative overflow-hidden group hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-lg shadow-lg shadow-cyan-500/20">
                  {step.step}
                </span>
                <h3 className="mt-4 font-bold text-base text-foreground group-hover:text-cyan-400 transition-colors">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Multi-Modal Access Features */}
      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="multimodal-heading">
        <h2 id="multimodal-heading" className="text-2xl font-bold">
          Multi-Modal Accessible Interaction
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Interact with Ableo using whichever method works best for your disability. 
          Every feature is accessible through multiple input and output modes.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Volume2,
              title: "Read Aloud",
              body: "Text-to-speech reads job descriptions, match results, and any page content aloud for blind and low-vision users.",
            },
            {
              icon: Mic,
              title: "Voice Navigation",
              body: "Full voice-controlled navigation, job search, and form filling for users with motor disabilities.",
            },
            {
              icon: Subtitles,
              title: "Live Captions",
              body: "Real-time captions for all audio content, interview coaching, and voice input — essential for Deaf users.",
            },
            {
              icon: Keyboard,
              title: "Keyboard & Switch",
              body: "100% keyboard-navigable. Compatible with switch devices, sip-and-puff, and other assistive input.",
            },
          ].map((p) => (
            <div key={p.title} className="glass-card p-5 border-border/50 hover:border-cyan-500/30 transition-all duration-300">
              <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <p.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-3 font-bold text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Impact */}
      <section className="mx-auto max-w-6xl px-4 pb-14" aria-labelledby="impact-heading">
        <h2 id="impact-heading" className="text-2xl font-bold text-foreground">
          Platform Impact
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live statistics across our verified disability-accommodated repository.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-5 border-border/50 hover:border-cyan-500/40 transition-all">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Accessibility aria-hidden="true" className="size-4 text-cyan-400" />
              Accommodated Roles
            </dt>
            <dd className="mt-2 text-3xl font-black text-cyan-400">
              {JOBS.filter((j) => j.access.length > 0).length}
            </dd>
          </div>
          <div className="glass-card p-5 border-border/50 hover:border-purple-500/40 transition-all">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users aria-hidden="true" className="size-4 text-purple-400" />
              Inclusive Employers
            </dt>
            <dd className="mt-2 text-3xl font-black text-purple-400">
              {new Set(JOBS.map((j) => j.company)).size}
            </dd>
          </div>
          <div className="glass-card p-5 border-border/50 hover:border-emerald-500/40 transition-all">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Eye aria-hidden="true" className="size-4 text-emerald-400" />
              Screen-Reader Ready
            </dt>
            <dd className="mt-2 text-3xl font-black text-emerald-400">
              {JOBS.filter((j) => j.access.includes("screen_reader")).length}
            </dd>
          </div>
          <div className="glass-card p-5 border-border/50 hover:border-amber-500/40 transition-all">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 text-amber-400" />
              Verified Access
            </dt>
            <dd className="mt-2 text-3xl font-black text-amber-400">
              {JOBS.filter((j) => j.accessSource === "Verified by AccessPath").length}
            </dd>
          </div>
        </dl>
      </section>

      {/* Featured Jobs */}
      <section className="mx-auto max-w-6xl px-4 pb-14" aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="featured-heading" className="text-2xl font-bold">
              Featured Accessible Opportunities
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every listing includes verified disability accommodation details
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/jobs" search={{ q: "" }}>
              Browse all {JOBS.length} accessible jobs
            </Link>
          </Button>
        </div>
        <ul className="mt-6 grid gap-4">
          {featured.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
