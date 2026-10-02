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
      <section className="border-b border-border bg-brand-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium">
              <Accessibility aria-hidden="true" className="size-4 text-brand" />
              Built for People with Disabilities, from the ground up
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              Your Disability Doesn't Define Your Career.{" "}
              <span className="text-brand">Your Ability Does.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Ableo is the first job platform designed entirely around the needs of People with Disabilities (PwD). 
              Know your accommodations, understand the workplace, and apply — barrier-free.
            </p>
            <p className="mt-2 max-w-xl text-base text-muted-foreground">
              Screen-reader accessible • Voice-controlled • Captioned • Keyboard-navigable • 
              Dyslexia-friendly • Privacy-first
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/jobs" search={{ q: "" }}>
                  <Accessibility className="size-4 mr-1" />
                  Find Accessible Jobs
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/profile">
                  <HeartHandshake className="size-4 mr-1" />
                  Set Up My Access Needs
                </Link>
              </Button>
            </div>
            <dl className="mt-8 flex flex-wrap gap-8 text-sm">
              <div>
                <dt className="text-muted-foreground">Accessible roles</dt>
                <dd className="text-2xl font-semibold">{JOBS.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Inclusive employers</dt>
                <dd className="text-2xl font-semibold">
                  {new Set(JOBS.map((j) => j.company)).size}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Remote-friendly</dt>
                <dd className="text-2xl font-semibold">
                  {JOBS.filter((j) => j.workMode === "Remote").length}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Screen-reader compatible</dt>
                <dd className="text-2xl font-semibold">
                  {JOBS.filter((j) => j.access.includes("screen_reader")).length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="surface-card self-start bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mic className="size-5 text-brand" />
              Search by typing, voice, or screen reader
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search by job title, accessibility feature, accommodation need, or company name.
            </p>
            <div className="mt-4">
              <JobSearchBar value={q} onChange={setQ} onSubmit={search} id="hero-search" />
            </div>
            <h3 className="mt-6 text-sm font-medium">Quick accessibility filters</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {QUICK.map((item) => (
                <li key={item}>
                  <Button variant="secondary" size="sm" onClick={() => search(item)}>
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
            <li key={p.title} className="surface-card p-5 transition-shadow hover:shadow-md">
              <p.icon aria-hidden="true" className="size-7 text-brand" />
              <h3 className="mt-3 text-lg font-bold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
                  >
                    <CheckCircle2 className="size-3" />
                    {f}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* How It Works — PwD Journey */}
      <section className="border-y border-border bg-secondary/30 py-14" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="how-heading" className="text-2xl font-bold text-center">
            How Ableo Works for You
          </h2>
          <p className="mt-2 text-center text-muted-foreground max-w-2xl mx-auto">
            Whether you're blind, Deaf, use a wheelchair, are neurodivergent, or have any other disability — 
            Ableo adapts to your needs at every step.
          </p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.step} className="surface-card p-5">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground font-bold text-lg">
                  {step.step}
                </span>
                <h3 className="mt-3 font-bold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
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
            <div key={p.title} className="surface-card p-5">
              <p.icon aria-hidden="true" className="size-6 text-brand" />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Impact */}
      <section className="mx-auto max-w-6xl px-4 pb-14" aria-labelledby="impact-heading">
        <h2 id="impact-heading" className="text-2xl font-bold">
          Platform Impact
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Demo dataset — metrics use the current demo listings.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-card p-5">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Accessibility aria-hidden="true" className="size-4 text-brand" />
              Jobs with disability accommodations
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
              {JOBS.filter((j) => j.access.length > 0).length}
            </dd>
          </div>
          <div className="surface-card p-5">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users aria-hidden="true" className="size-4 text-brand" />
              Disability-inclusive employers
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
              {new Set(JOBS.map((j) => j.company)).size}
            </dd>
          </div>
          <div className="surface-card p-5">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye aria-hidden="true" className="size-4 text-brand" />
              Screen-reader accessible listings
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
              {JOBS.filter((j) => j.access.includes("screen_reader")).length}
            </dd>
          </div>
          <div className="surface-card p-5">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 text-brand" />
              Verified accommodations
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
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
