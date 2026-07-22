import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Lock,
  WifiOff,
  CheckCircle2,
  Camera,
  Cloud,
  ShieldCheck,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-x-hidden dark">
      {/* 1. STICKY HEADER */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#080B14]/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-[0_2px_10px_rgba(99,102,241,0.35)]">
              <span className="font-display font-bold text-white text-base leading-none">B</span>
            </div>
            <span className="font-display font-bold text-[15px] leading-none text-white">
              Bookkeeper
            </span>
          </div>
          <button
            onClick={onGetStarted}
            className="btn btn-primary h-10 px-4 text-sm"
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Open app</span>
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 bg-[#080B14]">
        {/* Ambient orbs */}
        <div aria-hidden="true" className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none transform -translate-y-1/2 -translate-x-1/2" />
        <div aria-hidden="true" className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6 animate-fade-in">
                <Sparkles className="w-3.5 h-3.5" />
                Free · private · built for independents
              </div>
              
              <h1 className="font-display font-bold text-[42px] lg:text-[60px] leading-[1.02] tracking-[-0.055em] mb-6 animate-slide-up animate-delay-100">
                Freelance finances,{' '}
                <span className="text-brand-gradient">finally under control.</span>
              </h1>
              
              <p className="text-slate-400 text-lg lg:text-xl max-w-lg mb-8 text-balance animate-slide-up animate-delay-200">
                Track income, scan receipts, invoice clients, and know what to do next — without handing your business over to another subscription.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up animate-delay-300 w-full sm:w-auto">
                <button
                  onClick={onGetStarted}
                  className="btn btn-primary h-14 px-8 text-base w-full sm:w-auto"
                >
                  Get started free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
                <a
                  href="#features"
                  className="btn btn-ghost h-14 px-8 text-base text-slate-300 hover:text-white w-full sm:w-auto border-white/10 hover:bg-white/5"
                >
                  See how it works
                </a>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 mt-10 text-sm text-slate-500 animate-fade-in animate-delay-400">
                <div className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-slate-400" /> 100% private</div>
                <div className="flex items-center gap-1.5"><WifiOff className="w-4 h-4 text-slate-400" /> Works offline</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-slate-400" /> No card required</div>
              </div>
            </div>
            
            {/* RIGHT content - Phone UI preview */}
            <div className="relative animate-float animate-delay-500 lg:pl-10">
              <div className="relative mx-auto w-full max-w-[320px] aspect-[1/2.1] rounded-[36px] lg:rounded-[40px] bg-slate-900 border-[3px] border-slate-800 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden p-4 flex flex-col gap-4">
                
                {/* Status bar area mock */}
                <div className="h-6 w-full flex justify-between px-2 items-center text-[10px] text-slate-500 font-medium">
                  <span>9:41</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-3 h-3 rounded-full border border-slate-500" />
                    <div className="w-4 h-3 rounded-sm border border-slate-500" />
                  </div>
                </div>

                <div className="mt-2 px-1">
                  <p className="text-slate-400 text-xs">Good evening, Jordan</p>
                  <p className="font-display font-bold text-lg text-white">Your finances</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-400 text-[10px]">Net income</p>
                    <p className="font-display font-bold text-green-400 text-base">£8,420</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-400 text-[10px]">Outstanding</p>
                    <p className="font-display font-bold text-amber-400 text-base">£2,150</p>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center gap-2 mt-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Scan a receipt</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">OCR auto-fills your expense</p>
                  </div>
                  <div className="w-full mt-2 py-2 border border-dashed border-indigo-500/40 rounded-lg text-indigo-400 text-[10px] font-semibold">
                    Tap to scan or upload
                  </div>
                </div>

                <div className="mt-auto bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold mb-1 leading-tight">2 invoices need a friendly nudge.</p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
                      Recover £1,950
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROOF STRIP */}
      <section className="border-y border-white/10 bg-[#0A0D18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            <div className="text-center md:border-r border-white/10 flex flex-col">
              <span className="font-display font-bold text-3xl text-white">100%</span>
              <span className="text-slate-400 text-sm mt-1">Your data stays yours</span>
            </div>
            <div className="text-center md:border-r border-white/10 flex flex-col">
              <span className="font-display font-bold text-3xl text-white">£0</span>
              <span className="text-slate-400 text-sm mt-1">Per month, forever</span>
            </div>
            <div className="text-center flex flex-col">
              <span className="font-display font-bold text-3xl text-white">PWA</span>
              <span className="text-slate-400 text-sm mt-1">Works on every device</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE SECTION */}
      <section id="features" className="py-24 bg-[#080B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.1em] mb-4">BUILT FOR THE WAY YOU WORK</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white">Less admin. More clarity.</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Camera className="w-6 h-6 text-indigo-400" />,
                title: 'Scan expenses in seconds',
                desc: 'Turn a receipt into an editable expense with camera-first OCR.'
              },
              {
                icon: <Sparkles className="w-6 h-6 text-violet-400" />,
                title: 'See the next best move',
                desc: 'Contextual AI flags overdue invoices and unnecessary spend.'
              },
              {
                icon: <Cloud className="w-6 h-6 text-blue-400" />,
                title: 'Sync on your terms',
                desc: 'Keep a private local copy, with Google Drive as your backup.'
              }
            ].map((f, i) => (
              <div key={i} className="bg-slate-900/50 border border-white/10 rounded-[32px] p-8 hover:bg-slate-900 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRIVACY PANEL */}
      <section className="py-12 bg-[#080B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] overflow-hidden bg-slate-900 border border-white/10 grid lg:grid-cols-2">
            <div className="p-10 lg:p-16 relative">
              <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.1em] mb-4">PRIVATE BY DESIGN</p>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-6">Your books belong to you.</h2>
                <p className="text-slate-300 text-lg mb-8 max-w-md">
                  We don't want your data. Bookkeeper runs entirely in your browser, storing your financial history locally. No sneaky subscriptions. No selling your information.
                </p>
                <button
                  onClick={onGetStarted}
                  className="btn btn-primary h-12 px-6"
                >
                  Start keeping better books
                </button>
              </div>
            </div>
            
            <div className="bg-[#0A0D18] p-10 lg:p-16 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="w-full max-w-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-lg">Encrypted local vault</h3>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Secure
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    'On-device data',
                    'Google Drive backup',
                    'No third-party data sale'
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-slate-300 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-[#080B14] py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 Bookkeeper. Your data, your business.
          </p>
          <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
            <span>Free</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>Offline-first</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>Open source</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
