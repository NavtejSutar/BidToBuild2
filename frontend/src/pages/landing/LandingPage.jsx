import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowUpRight,
  Play,
  X,
  Sparkles,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeModal, setActiveModal] = useState(null); // 'features' | 'workflow' | 'about' | 'video'
  const [tourStep, setTourStep] = useState(0);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'TECHNICIAN') return '/technician';
    return '/complaints';
  };

  const handleAction = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(getDashboardPath());
    }
  };

  const tourSteps = [
    {
      title: '1. Report with Instant Safety Guard',
      desc: 'Students or staff submit an issue with photos. Critical keywords (sparking, fire, water leak) trigger emergency status immediately.',
      badge: 'Reported',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      title: '2. Groq AI Autonomous Triage',
      desc: 'Groq LLM asynchronously analyzes fault details, verifies category, scores urgency, and writes technical summaries.',
      badge: 'AI Triaged',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    },
    {
      title: '3. Skill & Workload Technician Dispatch',
      desc: 'System ranks technicians based on category domain skill and real-time open task counters for fair assignment.',
      badge: 'Assigned',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      title: '4. Resolution with Proof & Audit Log',
      desc: 'Technicians document fixes with mandatory notes and completion photos. Priority aging and recurrence tracking update automatically.',
      badge: 'Resolved',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    }
  ];

  return (
    <div className="min-h-screen bg-[#abb5ad] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Main Framed Canvas */}
      <div className="w-full max-w-6xl bg-white text-neutral-900 border border-neutral-900 shadow-2xl rounded-sm overflow-hidden flex flex-col">
        
        {/* Top Header Bar */}
        <header className="border-b border-neutral-900 px-6 sm:px-10 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-mono text-sm tracking-tight font-semibold">
            <span className="text-neutral-500 font-normal">//</span>
            <span className="text-neutral-900 tracking-wide uppercase">CampusOps</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider text-neutral-800 uppercase">
            <button
              onClick={() => setActiveModal('features')}
              className="hover:text-neutral-500 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => setActiveModal('workflow')}
              className="hover:text-neutral-500 transition-colors cursor-pointer"
            >
              Workflow
            </button>
            <button
              onClick={() => setActiveModal('about')}
              className="hover:text-neutral-500 transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Action / Auth Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-500 uppercase">
                  {user.role}
                </span>
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold tracking-wide uppercase rounded-full transition-all duration-150 cursor-pointer shadow-sm"
                >
                  Dashboard
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 px-5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold tracking-wide uppercase rounded-full transition-all duration-150 cursor-pointer shadow-sm"
              >
                Log In
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Hero Section Grid (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-900 relative">
            <div className="space-y-6 sm:space-y-8">
              {/* Sparkle Icon & Large Bold Headline */}
              <div>
                <div className="text-neutral-900 text-2xl sm:text-3xl font-light mb-3 select-none">
                  ✦
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-950 leading-[1.08]">
                  Smart campus <br />
                  maintenance <br />
                  for everyone
                </h1>
              </div>

              {/* Concise Description */}
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed">
                Explore autonomous campus facility management with AI-powered fault triage, dynamic SLA scoring, and real-time technician dispatch.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handleAction}
                  className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors cursor-pointer shadow-sm"
                >
                  {user ? 'Enter Dashboard' : 'Report Fault'}
                </button>

                <button
                  onClick={() => setActiveModal('video')}
                  className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-white">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </span>
                  Watch Overview
                </button>
              </div>
            </div>

            {/* Footnote */}
            <div className="pt-8 mt-6 text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
              <span className="text-rose-500 font-bold text-sm leading-none">*</span>
              <span>Free instant AI triage and safety alerts for all students & staff</span>
            </div>
          </div>

          {/* Right Column: Bauhaus / Modernist Geometric Vector Graphic */}
          <div className="lg:col-span-5 relative bg-[#fcfcfc] overflow-hidden min-h-[320px] lg:min-h-full flex items-center justify-center p-4">
            <svg
              viewBox="0 0 440 480"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full max-h-[460px] object-contain select-none"
            >
              <defs>
                {/* Stipple pattern for textured red triangle */}
                <pattern id="stipple-red" width="4" height="4" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.8" fill="#e04838" opacity="0.65" />
                </pattern>
                {/* Stipple pattern for textured black arrow */}
                <pattern id="stipple-black" width="3" height="3" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="0.75" fill="#111111" opacity="0.75" />
                </pattern>
              </defs>

              {/* Background organic coral curve */}
              <path
                d="M -20 240 Q 60 280 40 400 Q 30 460 -20 500 Z"
                fill="#ea4335"
              />

              {/* Light blue soft cloud / star shape on right */}
              <path
                d="M 380 90 C 420 100 440 140 420 180 C 400 220 370 230 350 200 C 330 170 340 120 380 90 Z"
                fill="#e2edf1"
              />

              {/* Connected black nodes (Campus complaint graph) */}
              <g stroke="#111111" strokeWidth="1.5">
                <line x1="290" y1="100" x2="340" y2="160" />
                <line x1="340" y1="160" x2="390" y2="220" />
                <line x1="290" y1="100" x2="240" y2="160" />
                <line x1="240" y1="160" x2="290" y2="220" />
                <line x1="290" y1="220" x2="340" y2="160" />
                <line x1="340" y1="160" x2="320" y2="70" />
                <line x1="320" y1="70" x2="380" y2="110" />
              </g>

              {/* Black nodes (rounded squares) */}
              <rect x="305" y="58" width="28" height="28" rx="6" fill="#111111" />
              <rect x="235" y="135" width="28" height="28" rx="6" fill="#111111" />
              <rect x="365" y="145" width="28" height="28" rx="6" fill="#111111" />
              <rect x="280" y="205" width="28" height="28" rx="6" fill="#111111" />

              {/* Stippled / Textured Red Triangle */}
              <polygon
                points="330,150 280,240 380,240"
                fill="#ea4335"
                opacity="0.15"
              />
              <polygon
                points="330,150 280,240 380,240"
                fill="url(#stipple-red)"
              />
              <polygon
                points="330,150 280,240 380,240"
                stroke="#e04838"
                strokeWidth="1"
                fill="none"
              />

              {/* Teal Switch / Capsule Toggle */}
              <g transform="rotate(-20 280 280)">
                <rect
                  x="160"
                  y="240"
                  width="190"
                  height="85"
                  rx="42.5"
                  fill="#5a98a8"
                />
                {/* White knob inside toggle */}
                <circle cx="305" cy="282.5" r="32" fill="#ffffff" />
              </g>

              {/* Large Textured Stippled Black Arrow */}
              <g transform="translate(240, 310)">
                <polygon
                  points="70,0 130,85 85,80 100,140 50,140 65,80 15,85"
                  fill="#111111"
                  opacity="0.2"
                />
                <polygon
                  points="70,0 130,85 85,80 100,140 50,140 65,80 15,85"
                  fill="url(#stipple-black)"
                />
                <polygon
                  points="70,0 130,85 85,80 100,140 50,140 65,80 15,85"
                  stroke="#111111"
                  strokeWidth="1.5"
                  fill="none"
                />
              </g>

              {/* Starburst / Flower Decorative Stamps on bottom right */}
              <g transform="translate(390, 380)">
                <circle cx="0" cy="0" r="18" fill="none" stroke="#9cbcc4" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="0" cy="0" r="6" fill="#9cbcc4" />
              </g>
              <g transform="translate(340, 425)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#b5cfd6" strokeWidth="1" strokeDasharray="2 3" />
                <circle cx="0" cy="0" r="4.5" fill="#b5cfd6" />
              </g>
            </svg>
          </div>
        </div>

        {/* Bottom Strip: 4 Modular Stat Blocks Divided by 1px Black Lines */}
        <div className="border-t border-neutral-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-900 text-neutral-900 bg-white">
          
          {/* Stat 1: Avatars + 3.4k+ resolved */}
          <div className="lg:col-span-4 p-4 sm:p-5 flex items-center gap-4">
            <div className="flex -space-x-2.5 overflow-hidden flex-shrink-0">
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
                alt="Student"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces"
                alt="Staff"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces"
                alt="Tech"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces"
                alt="Admin"
              />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold tracking-tight text-neutral-950 leading-none">
                3.4k+
              </div>
              <div className="text-[11px] text-neutral-500 mt-1 leading-tight">
                campus complaints resolved
              </div>
            </div>
          </div>

          {/* Stat 2: 120 campus facilities */}
          <div className="lg:col-span-2 p-4 sm:p-5">
            <div className="text-base sm:text-lg font-bold tracking-tight text-neutral-950 leading-none">
              120
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 leading-tight">
              facilities & labs active
            </div>
          </div>

          {/* Stat 3: 99.4% SLA */}
          <div className="lg:col-span-2 p-4 sm:p-5">
            <div className="text-base sm:text-lg font-bold tracking-tight text-neutral-950 leading-none">
              99.4%
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 leading-tight">
              SLA resolution rate
            </div>
          </div>

          {/* Stat 4 (under right graphic): Campus Department Badges */}
          <div className="lg:col-span-4 p-4 sm:p-5 flex items-center justify-between sm:justify-around text-neutral-800 text-xs font-semibold tracking-wider font-mono uppercase">
            <span>Engineering</span>
            <span>Sciences</span>
            <span>Hostels</span>
            <span>Library</span>
          </div>

        </div>

      </div>

      {/* Interactive Modal: Features */}
      {activeModal === 'features' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-900 rounded-sm max-w-lg w-full p-6 text-neutral-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-neutral-900">
                <Sparkles className="w-4 h-4 text-sky-600" />
                CampusOps Core Features
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-neutral-600">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
                <div className="font-bold text-neutral-900 mb-0.5">1. Synchronous Keyword Safety Guard</div>
                Instant detection of critical hazards (sparking, exposed wire, fire, gas leak) locks urgency to CRITICAL immediately.
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
                <div className="font-bold text-neutral-900 mb-0.5">2. Groq LLM Autonomous Triage</div>
                Deep reasoning verifies category classification and suggests immediate remediation steps without overriding student intent.
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
                <div className="font-bold text-neutral-900 mb-0.5">3. Dynamic Mathematical Priority Scoring</div>
                Formula-driven scoring: Urgency Base (up to 80) + Aging (+1/6h, max 20) + 30-day Recurrence (+5/repeat, max 15).
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
                <div className="font-bold text-neutral-900 mb-0.5">4. Intelligent Technician Dispatch</div>
                Ranked assignment by domain skill match and real-time open task counters prevents technician overload.
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { setActiveModal(null); handleAction(); }}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-neutral-800"
              >
                Open Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal: Workflow */}
      {activeModal === 'workflow' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-900 rounded-sm max-w-lg w-full p-6 text-neutral-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-neutral-900">
                <Layers className="w-4 h-4 text-emerald-600" />
                Campus Maintenance Lifecycle
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {tourSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-sm text-xs">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-neutral-900 mb-0.5 flex items-center gap-2">
                      {step.title}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border ${step.badgeColor}`}>
                        {step.badge}
                      </span>
                    </div>
                    <div className="text-neutral-600 text-[11px] leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { setActiveModal(null); handleAction(); }}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-neutral-800"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal: About */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-900 rounded-sm max-w-md w-full p-6 text-neutral-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-900">
                // About CampusOps
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-neutral-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>CampusOps</strong> is an enterprise-grade maintenance and predictive complaint management system created for modern university campuses and institutions.
              </p>
              <p>
                Built with a high-performance Spring Boot 3 backend and a responsive React frontend, it replaces manual spreadsheets and neglected tickets with automated mathematical priority scoring, recursive fault clustering, and transparent audit histories.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal: Overview Tour */}
      {activeModal === 'video' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm">
          <div className="bg-white border border-neutral-900 rounded-sm max-w-xl w-full p-6 text-neutral-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-neutral-900">
                <Activity className="w-4 h-4 text-sky-600" />
                System Walkthrough Tour
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Step Preview */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-neutral-900">Step {tourStep + 1} of {tourSteps.length}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${tourSteps[tourStep].badgeColor}`}>
                  {tourSteps[tourStep].badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-950">{tourSteps[tourStep].title}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">{tourSteps[tourStep].desc}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {tourSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTourStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${tourStep === i ? 'bg-neutral-900' : 'bg-neutral-300'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {tourStep > 0 && (
                  <button
                    onClick={() => setTourStep(tourStep - 1)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-full cursor-pointer"
                  >
                    Previous
                  </button>
                )}
                {tourStep < tourSteps.length - 1 ? (
                  <button
                    onClick={() => setTourStep(tourStep + 1)}
                    className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={() => { setActiveModal(null); handleAction(); }}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-wider rounded-full cursor-pointer flex items-center gap-1"
                  >
                    Enter Platform
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
