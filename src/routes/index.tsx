import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
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
      {/* Hero Section — Editorial Ink Landscape */}
      <section className="relative overflow-hidden border-b border-border bg-background py-14 lg:py-20">
        {/* Decorative Ink Landscape in Background */}
        <div className="absolute inset-0 pointer-events-none opacity-45 dark:opacity-20 select-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 320 C 300 320, 450 350, 750 330 C 950 310, 1100 335, 1200 330" stroke="#191716" strokeWidth="1.2" strokeDasharray="3 3" />
            <path d="M0 345 C 350 335, 550 375, 850 350 C 1050 335, 1150 360, 1200 350" stroke="#191716" strokeWidth="0.8" />
            <path d="M100 300 Q 220 250 340 300 T 580 300" stroke="#191716" strokeWidth="1" opacity="0.6" />
            <path d="M750 290 Q 880 240 1010 290 T 1200 290" stroke="#191716" strokeWidth="1" opacity="0.6" />
            {/* Pine silhouettes */}
            <path d="M30 320 L45 230 L60 320 Z M25 320 L45 250 L65 320 Z" fill="#191716" opacity="0.85" />
            <path d="M70 330 L82 250 L94 330 Z" fill="#191716" opacity="0.75" />
            <path d="M1100 330 L1115 240 L1130 330 Z" fill="#191716" opacity="0.8" />
            <path d="M1140 335 L1152 260 L1164 335 Z" fill="#191716" opacity="0.7" />
            {/* Hot air balloon in terracotta */}
            <g transform="translate(920, 80)">
              <ellipse cx="28" cy="35" rx="22" ry="30" fill="#CF4E3D" stroke="#191716" strokeWidth="1.5" />
              <path d="M18 52 L38 52 L34 64 L22 64 Z" fill="#E5B34C" stroke="#191716" strokeWidth="1.2" />
              <rect x="25" y="67" width="6" height="5" fill="#191716" />
              <path d="M25 64 L25 67 M31 64 L31 67" stroke="#191716" strokeWidth="1" />
            </g>
          </svg>
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#191716]/60 bg-white/70 dark:bg-stone-900/70 px-3.5 py-1 text-xs font-serif italic text-stone-700 dark:text-stone-300 mb-4 backdrop-blur-sm">
              <Accessibility aria-hidden="true" className="size-3.5 text-stone-700 dark:text-stone-300" />
              <span>Built for People with Disabilities • Team Arka</span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight text-foreground">
              A career roadmap <br className="hidden sm:inline" />
              for <span className="italic">everyone</span>.
            </h1>
            
            <p className="mt-4 max-w-xl text-base sm:text-lg text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
              Your career is a journey. Take it with confidence. Ableo matches your skills to employers with verified disability accommodations — transparently and with zero guesswork.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-sans text-stone-600 dark:text-stone-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-stone-700 bg-card px-3 py-1">♿ Screen-reader verified</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-stone-700 bg-card px-3 py-1">🎙️ Voice navigation</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-stone-700 bg-card px-3 py-1">💬 Live captions</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-stone-700 bg-card px-3 py-1">🔒 100% Private</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/jobs"
                search={{ q: "" }}
                className="inline-flex items-center gap-2 rounded-full border border-[#191716] bg-[#7BD3C2] px-6 py-3 text-sm font-semibold text-[#141817] shadow-[2px_2px_0px_#141817] hover:bg-[#6ec2b1] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Find Accessible Jobs
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-stone-800 dark:border-stone-400 bg-card px-5 py-3 text-sm font-medium text-foreground shadow-[1px_1px_0px_rgba(0,0,0,0.15)] hover:bg-secondary hover:-translate-y-0.5 transition-all"
              >
                <HeartHandshake className="size-4 text-stone-700 dark:text-stone-300" />
                Configure My Access Needs
              </Link>
              <Link
                to="/employer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-800 dark:border-stone-400 bg-card px-5 py-3 text-sm font-medium text-foreground shadow-[1px_1px_0px_rgba(0,0,0,0.15)] hover:bg-secondary hover:-translate-y-0.5 transition-all"
              >
                <Building2 className="size-4 text-stone-700 dark:text-stone-300" />
                Post a job
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <dt className="text-xs uppercase tracking-wider text-stone-500 font-serif">Accessible roles</dt>
                <dd className="font-serif text-2xl font-normal text-foreground mt-0.5">{JOBS.length}</dd>
              </div>
              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <dt className="text-xs uppercase tracking-wider text-stone-500 font-serif">Employers</dt>
                <dd className="font-serif text-2xl font-normal text-foreground mt-0.5">
                  {new Set(JOBS.map((j) => j.company)).size}
                </dd>
              </div>
              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <dt className="text-xs uppercase tracking-wider text-stone-500 font-serif">Remote-friendly</dt>
                <dd className="font-serif text-2xl font-normal text-foreground mt-0.5">
                  {JOBS.filter((j) => j.workMode === "Remote").length}
                </dd>
              </div>
              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <dt className="text-xs uppercase tracking-wider text-stone-500 font-serif">Vision ready</dt>
                <dd className="font-serif text-2xl font-normal text-foreground mt-0.5">
                  {JOBS.filter((j) => j.access.includes("screen_reader")).length}
                </dd>
              </div>
            </dl>
          </div>

          {/* Search Box Card */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] self-start">
            <h2 className="font-serif text-xl font-normal flex items-center gap-2 text-foreground">
              <span className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-stone-700 dark:text-stone-300">
                <Mic className="size-4" />
              </span>
              Search by typing, voice, or screen reader
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
              Search by job title, specific accommodation (e.g. "Screen reader", "Captions", "Wheelchair"), or city.
            </p>
            <div className="mt-5">
              <JobSearchBar value={q} onChange={setQ} onSubmit={search} id="hero-search" />
            </div>
            <h3 className="mt-6 text-xs uppercase tracking-wider font-serif text-stone-500">Quick accessibility filters</h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {QUICK.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="rounded-full border border-stone-300 dark:border-stone-700 bg-secondary/50 px-3 py-1 text-xs text-foreground hover:bg-secondary hover:border-stone-800 transition-colors"
                    onClick={() => search(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Disability-Centric Accessibility Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="disability-heading">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full border border-stone-300 dark:border-stone-700 bg-card px-3.5 py-1 text-xs font-serif italic text-stone-600 dark:text-stone-400 mb-3">
            Disability-First Architecture
          </span>
          <h2 id="disability-heading" className="font-serif text-3xl sm:text-4xl font-normal text-foreground">
            Every Disability. Every Barrier. Addressed.
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 font-sans leading-relaxed text-sm sm:text-base">
            Ableo is built from scratch for blind users, Deaf users, wheelchair users, neurodivergent professionals, 
            and anyone with chronic health needs — designing with disabled people, not for them.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DISABILITY_PILLARS.map((p) => (
            <li key={p.title} className="rounded-2xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#191716]/40 transition-all">
              <span className="flex size-11 items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 bg-secondary text-stone-800 dark:text-stone-200">
                <p.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 font-serif text-xl font-normal text-foreground">{p.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans leading-relaxed">{p.body}</p>
              <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-border/50">
                {p.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-stone-800 bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-stone-700 dark:text-stone-300"
                  >
                    <CheckCircle2 className="size-3 text-[#3D8B6E]" />
                    {f}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* How It Works — PwD Journey */}
      <section className="border-y border-border bg-secondary/30 py-16" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-serif uppercase tracking-widest text-stone-500">How It Works</span>
            <h2 id="how-heading" className="font-serif text-3xl sm:text-4xl font-normal text-foreground mt-2">
              Designed for Every Ability
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
              Whether you're blind, Deaf, use mobility equipment, or are neurodivergent — 
              Ableo adapts seamlessly at each stage of your search.
            </p>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.step} className="rounded-2xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <span className="flex size-9 items-center justify-center rounded-full border border-[#191716] bg-[#7BD3C2] text-[#141817] font-serif font-bold text-sm shadow-[1px_1px_0px_#141817]">
                  {step.step}
                </span>
                <h3 className="mt-4 font-serif text-xl font-normal text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Multi-Modal Access Features */}
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="multimodal-heading">
        <h2 id="multimodal-heading" className="font-serif text-3xl font-normal text-foreground">
          Multi-Modal Accessible Interaction
        </h2>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-stone-600 dark:text-stone-400 font-sans">
          Interact with Ableo using whichever sensory mode suits you best. 
          Every feature is fully operable through multiple inputs and outputs.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Volume2,
              title: "Read Aloud",
              body: "Text-to-speech reads job descriptions, match results, and page contents aloud.",
            },
            {
              icon: Mic,
              title: "Voice Navigation",
              body: "Voice-controlled navigation, keyword search, and form inputs for motor accessibility.",
            },
            {
              icon: Subtitles,
              title: "Live Captions",
              body: "Real-time speech captions for interview practice and voice inputs — essential for Deaf users.",
            },
            {
              icon: Keyboard,
              title: "Keyboard & Switch",
              body: "100% keyboard-navigable. Built for switch devices and sip-and-puff inputs.",
            },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span className="flex size-10 items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 bg-secondary text-stone-800 dark:text-stone-200">
                <p.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-3 font-serif text-lg font-normal text-foreground">{p.title}</h3>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h2 id="featured-heading" className="font-serif text-3xl font-normal text-foreground">
              Featured Accessible Roles
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 font-sans">
              Every listing includes verified disability accommodation transparency
            </p>
          </div>
          <Link
            to="/jobs"
            search={{ q: "" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
          >
            Browse all {JOBS.length} accessible jobs →
          </Link>
        </div>
        <ul className="grid gap-4">
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
