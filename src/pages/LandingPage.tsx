import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowUpDown,
  FileText,
  Users,
  Cloud,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

/* ── Tiny reusable sub-components ─────────────────────────────────────── */
const GradientOrb: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
  />
);

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}> = ({ icon, title, description, delay = 0 }) => (
  <div
    className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 animate-fade-in animation-fill-both"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/30 to-purple-500/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-semibold text-white text-base mb-1">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const StepCard: React.FC<{
  step: number;
  title: string;
  description: string;
  delay?: number;
}> = ({ step, title, description, delay = 0 }) => (
  <div
    className="flex flex-col items-center text-center animate-slide-up animation-fill-both"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="relative mb-5">
      <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-brand-600/30">
        {step}
      </div>
      {step < 3 && (
        <div className="hidden md:block absolute top-7 left-14 w-full h-px bg-gradient-to-r from-brand-500/60 to-transparent" style={{ width: 'calc(100% + 2rem)' }} />
      )}
    </div>
    <h3 className="font-display font-semibold text-white text-lg mb-2">{title}</h3>
    <p className="text-slate-400 text-sm max-w-xs leading-relaxed">{description}</p>
  </div>
);

const StatPill: React.FC<{ value: string; label: string; delay?: number }> = ({
  value,
  label,
  delay = 0,
}) => (
  <div
    className="flex flex-col items-center animate-scale-in animation-fill-both"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="font-display font-bold text-3xl sm:text-4xl text-white">{value}</span>
    <span className="text-slate-400 text-sm mt-1">{label}</span>
  </div>
);

/* ── Dashboard Preview SVG Graphic ────────────────────────────────────── */
const DashboardPreview: React.FC = () => (
  <div className="relative w-full max-w-lg mx-auto animate-float">
    {/* Outer card */}
    <div className="relative bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 mx-3">
          <div className="h-5 bg-white/10 rounded-md flex items-center px-3">
            <span className="text-slate-500 text-xs">bookkeeper.app/dashboard</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-white/3">
        {['Dashboard', 'Transactions', 'Invoices', 'Clients'].map((item, i) => (
          <div
            key={item}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              i === 0
                ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30'
                : 'text-slate-500'
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Net Income', value: '£8,420', color: 'text-green-400', bg: 'from-green-500/10 to-emerald-500/5' },
            { label: 'Outstanding', value: '£2,150', color: 'text-yellow-400', bg: 'from-yellow-500/10 to-amber-500/5' },
            { label: 'Total Expenses', value: '£3,200', color: 'text-red-400', bg: 'from-red-500/10 to-rose-500/5' },
            { label: 'Paid Invoices', value: '£11,600', color: 'text-blue-400', bg: 'from-blue-500/10 to-sky-500/5' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`bg-gradient-to-br ${bg} border border-white/5 rounded-xl p-3`}>
              <p className="text-slate-500 text-[10px] mb-1">{label}</p>
              <p className={`font-display font-bold text-base ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Mini chart bars */}
        <div className="bg-white/3 border border-white/5 rounded-xl p-3">
          <p className="text-slate-500 text-[10px] mb-3 font-medium">Income vs Expenses</p>
          <div className="flex items-end gap-1.5 h-16">
            {[0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 0.75, 0.85, 0.65, 0.95, 0.8, 1].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5 items-stretch">
                <div
                  className="rounded-sm bg-green-500/60"
                  style={{ height: `${h * 100}%` }}
                />
                <div
                  className="rounded-sm bg-red-500/40"
                  style={{ height: `${h * 0.5 * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white/3 border border-white/5 rounded-xl p-3">
          <p className="text-slate-500 text-[10px] mb-2 font-medium">Recent Transactions</p>
          <div className="space-y-1.5">
            {[
              { name: 'Client Project – Acme', amount: '+£1,200', type: 'income' },
              { name: 'Adobe CC Subscription', amount: '-£54', type: 'expense' },
              { name: 'Freelance Invoice #42', amount: '+£3,400', type: 'income' },
            ].map(({ name, amount, type }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] truncate pr-2">{name}</span>
                <span className={`text-[10px] font-semibold font-mono shrink-0 ${type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Floating badges */}
    <div className="absolute -top-3 -right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30 flex items-center gap-1.5 animate-bounce-gentle">
      <Cloud className="w-3.5 h-3.5" />
      Synced
    </div>
    <div className="absolute -bottom-3 -left-4 bg-slate-800 border border-white/10 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
      <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
      Your data, your Google Drive
    </div>
  </div>
);

/* ── Main Landing Page ──────────────────────────────────────────────────── */
export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: 'Offline First',
      description: 'Works seamlessly without internet. All your data lives locally and syncs automatically when you reconnect.',
    },
    {
      icon: <Cloud className="w-5 h-5 text-blue-400" />,
      title: 'Google Drive Sync',
      description: 'Your data is stored securely in your own Google Drive folder — not on our servers. You own everything.',
    },
    {
      icon: <FileText className="w-5 h-5 text-purple-400" />,
      title: 'Professional Invoicing',
      description: 'Create, track, and export polished PDF invoices for clients. Manage statuses from draft to paid.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-green-400" />,
      title: 'Zero Backend',
      description: 'No server, no subscription, no lock-in. A pure client-side app that keeps your financial data private.',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-orange-400" />,
      title: 'Financial Dashboard',
      description: 'Visualise income vs expenses, track outstanding invoices, and understand your cash flow at a glance.',
    },
    {
      icon: <Users className="w-5 h-5 text-pink-400" />,
      title: 'Client Management',
      description: 'Maintain a client directory with contact details, billing history, and linked invoices in one place.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-x-hidden">

      {/* ── Sticky Nav ───────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-surface-950/90 backdrop-blur-md border-b border-white/8 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-md shadow-brand-600/30">
                <span className="font-display font-bold text-white text-sm">B</span>
              </div>
              <span className="font-display font-bold text-lg text-white">Bookkeeper</span>
            </div>

            {/* CTA */}
            <button
              onClick={onGetStarted}
              id="nav-get-started"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-brand-600/30 active:scale-95"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Background orbs */}
        <GradientOrb className="w-[600px] h-[600px] bg-brand-600/20 -top-48 -left-48" />
        <GradientOrb className="w-[500px] h-[500px] bg-purple-600/15 top-20 -right-48" />
        <GradientOrb className="w-[300px] h-[300px] bg-brand-400/10 bottom-0 left-1/2 -translate-x-1/2" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <div className="text-center lg:text-left">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6 animate-fade-in animation-fill-both">
                <Sparkles className="w-3.5 h-3.5" />
                Free · No Subscription · Open Source
              </div>

              {/* Headline */}
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] text-balance mb-6 animate-slide-up animation-fill-both animate-delay-100">
                Freelance finances,{' '}
                <span className="text-gradient-brand">finally under control</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 text-pretty animate-slide-up animation-fill-both animate-delay-200">
                Bookkeeper is a private, offline-first accounting app for freelancers and
                independent creators. Track income, invoice clients, and sync to your own
                Google Drive — no subscriptions, no servers.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-slide-up animation-fill-both animate-delay-300">
                <button
                  id="hero-get-started"
                  onClick={onGetStarted}
                  className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-brand text-white font-semibold text-base shadow-xl shadow-brand-600/30 hover:opacity-90 hover:shadow-2xl hover:shadow-brand-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  id="hero-local-mode"
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-white/15 text-slate-300 font-medium text-base hover:bg-white/5 hover:border-white/25 active:bg-white/10 transition-all duration-200"
                >
                  Try Local Mode
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 mt-8 justify-center lg:justify-start animate-fade-in animation-fill-both animate-delay-500">
                {[
                  { icon: <Lock className="w-3.5 h-3.5" />, label: '100% Private' },
                  { icon: <Globe className="w-3.5 h-3.5" />, label: 'Works Offline' },
                  { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'No Credit Card' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <span className="text-brand-400">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard Preview */}
            <div className="relative animate-scale-in animation-fill-both animate-delay-400">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/8 bg-white/2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 divide-x divide-white/10">
            <StatPill value="100%" label="Your data stays yours" delay={0} />
            <StatPill value="£0" label="Per month, forever" delay={150} />
            <StatPill value="PWA" label="Install on any device" delay={300} />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 text-balance">
              Built for the way you actually work
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto text-pretty">
              No bloated features you'll never use. Just the essentials, done right.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 bg-white/2 border-y border-white/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple setup</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 text-balance">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
            <StepCard
              step={1}
              title="Sign in with Google"
              description="Use your existing Google account — no new password to remember. Or skip sign-in and use local mode."
              delay={0}
            />
            <StepCard
              step={2}
              title="Add your first transaction"
              description="Log income and expenses instantly. Categorise, tag, and filter everything with a clean interface."
              delay={150}
            />
            <StepCard
              step={3}
              title="Create & send invoices"
              description="Build professional invoices, export as PDF, and track payment status from draft to paid."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ── Privacy Section ───────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <GradientOrb className="w-[500px] h-[500px] bg-purple-600/10 top-0 right-0 translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Privacy visual */}
            <div className="order-2 lg:order-1">
              <div className="relative max-w-md mx-auto lg:mx-0">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Data stored in your Drive</p>
                      <p className="text-slate-500 text-xs">bookkeeper/data.json</p>
                    </div>
                  </div>
                  <div className="h-px bg-white/5" />
                  {[
                    { label: 'Our servers see your data', value: false },
                    { label: 'Third-party analytics', value: false },
                    { label: 'Subscription required', value: false },
                    { label: 'Works completely offline', value: true },
                    { label: 'You own your data', value: true },
                    { label: 'Google Drive backup', value: true },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">{label}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          value
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {value ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Copy */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Privacy first</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-5 text-balance">
                Your finances are{' '}
                <span className="text-gradient-brand">none of our business</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 text-pretty">
                Bookkeeper has no backend server. All data is stored in IndexedDB on your
                device and optionally synced to your own Google Drive. We never see, process,
                or monetise your financial data.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  id="privacy-get-started"
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-brand text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-brand-600/25 hover:-translate-y-0.5 active:translate-y-0 duration-200"
                >
                  Start for Free
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA Banner ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden="true" />
        <div className="absolute inset-0 bg-grid-pattern opacity-60" aria-hidden="true" />
        <GradientOrb className="w-[400px] h-[400px] bg-purple-500/20 -bottom-24 -right-24" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            No credit card required
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white mb-5 leading-tight text-balance">
            Ready to take control of your freelance finances?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto text-pretty">
            Join thousands of freelancers who trust Bookkeeper to keep their finances organised,
            private, and always in sync.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="cta-get-started"
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl bg-white text-brand-700 font-bold text-base shadow-xl hover:shadow-2xl hover:bg-white/95 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Get Started — It's Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                <span className="font-display font-bold text-white text-xs">B</span>
              </div>
              <span className="font-display font-semibold text-white/80 text-sm">Bookkeeper</span>
            </div>
            <p className="text-slate-600 text-xs text-center">
              Private · Offline-First · Open Source · No Server
            </p>
            <button
              onClick={onGetStarted}
              className="text-slate-500 hover:text-white text-xs transition-colors flex items-center gap-1"
            >
              Sign In
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
