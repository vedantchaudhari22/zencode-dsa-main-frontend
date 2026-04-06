// Homepage is the public-facing landing page.
// It is mostly presentation, but it also sets expectations about the learning experience.
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import Navbar from "../components/Navbar";
import bgImage from "../assets/homepage_ai_bg_clean.png";

export default function Homepage() {
  const heroRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-reveal",
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1 }
      );
      gsap.fromTo(
        ".hero-card",
        { scale: 0.96, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: "power2.out", delay: 0.2 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500/20 font-sans overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.85] mix-blend-screen"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/90" />
        <div className="absolute inset-0 grid-overlay opacity-10" />
      </div>

      <Navbar />

      <div className="relative z-10 w-full pt-28 pb-24">
        <div ref={heroRef} className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="space-y-7">
              <div className="hero-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/80 text-xs uppercase tracking-[0.3em] text-slate-500">
                Professional SDE Prep
              </div>
              <h1 className="hero-reveal text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
                Master Algorithms
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  {" "}Systematically
                </span>
              </h1>
              <p className="hero-reveal text-lg md:text-xl text-slate-500 max-w-xl">
                ZenCode provides a structured roadmap to technical interview success. Track progress, master patterns, and build problem-solving intuition.
              </p>
              <div className="hero-reveal flex flex-col sm:flex-row gap-4">
                <Link
                  to="/problemset"
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg rounded-full hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-xl shadow-indigo-500/20"
                >
                  Start Solving
                </Link>
                <Link
                  to="/problemset"
                  className="px-8 py-4 rounded-full border border-slate-200 hover:bg-white/80 transition-all text-lg font-medium text-slate-600 hover:text-slate-900"
                >
                  Explore Problems
                </Link>
              </div>
              <div className="hero-reveal flex flex-wrap gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                  120+ curated DSA problems
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  Daily practice streaks
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Mock interviews every week
                </div>
              </div>
            </div>

            <div className="hero-card relative">
              <div className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Today</p>
                    <h3 className="text-2xl font-semibold text-slate-900">Binary Search Sprint</h3>
                  </div>
                  <div className="mono text-sm text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full bg-indigo-50">
                    64% complete
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    "Find Minimum in Rotated Array",
                    "Search Insert Position",
                    "Koko Eating Bananas",
                    "Median of Two Sorted Arrays",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <div className="text-xs text-slate-400">Problem {index + 1}</div>
                        <div className="text-base font-medium text-slate-800">{item}</div>
                      </div>
                      <span className={`text-xs mono ${index < 2 ? "text-emerald-500" : "text-slate-400"}`}>
                        {index < 2 ? "Solved" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-3 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div className="h-full w-[64%] bg-gradient-to-r from-indigo-500 to-purple-600" />
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-500 shadow-sm">
                Next unlock: Graphs Week
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Active Learners", value: "18,400+" },
              { label: "Solutions Reviewed", value: "2.1M+" },
              { label: "Hiring Partners", value: "120+" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
                className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="text-3xl font-semibold text-slate-900">{stat.value}</div>
                <div className="text-slate-400 text-sm uppercase tracking-[0.2em]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-6 mt-28 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Structured Problem Practice</h2>
            <p className="text-slate-500 text-lg">
              Practice problems by topic and difficulty with a clear structure that keeps your preparation consistent.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Progress tracker",
                "Daily practice goals",
                "Pattern-based grouping",
                "Review checkpoints",
              ].map((item) => (
                <div key={item} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-sm font-semibold text-slate-800">{item}</div>
                  <div className="text-xs text-slate-400 mt-1">Built to keep you consistent.</div>
                </div>
              ))}
            </div>
            <Link
              to="/problemset"
              className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 font-semibold"
            >
              Go to Problem Set &gt;
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-panel p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-slate-900">Week 3: Trees</h3>
            <p className="text-slate-400 text-sm mt-2">Focus: DFS, BFS, traversals</p>
            <div className="mt-6 space-y-3">
              {["Binary Tree Paths", "Validate BST", "Zigzag Level Order"].map((item, index) => (
                <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700">{item}</span>
                  <span className={`text-xs mono ${index < 1 ? "text-emerald-500" : "text-slate-400"}`}>
                    {index < 1 ? "Solved" : "Queued"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-[34%] bg-gradient-to-r from-indigo-500 to-purple-600" />
            </div>
          </motion.div>
        </div>

        <div className="container mx-auto px-6 mt-28 relative">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-200/30 blur-[150px] rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] left-1/4 w-[500px] h-[500px] bg-purple-200/30 blur-[150px] rounded-full pointer-events-none z-0" />

          <div className="text-center mb-16 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900"
            >
              ZenCode <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">AI Pro Tools</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-slate-500 text-lg max-w-2xl mx-auto mt-4"
            >
              Elevate your preparation with state-of-the-art AI features designed to simulate real interviews and optimize your profile.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                title: "AI Mock Interviewer",
                desc: "Practice with our intelligent AI interviewer. Receive real-time, constructive feedback on behavioral and technical questions.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.829 1.508-2.336a5.5 5.5 0 0 0 2.684-4.832c0-3.033-2.467-5.5-5.5-5.5s-5.5 2.467-5.5 5.5c0 2.05.992 3.864 2.684 4.832.85.507 1.508 1.353 1.508 2.336V18" />
                  </svg>
                ),
                link: "/mock-interviewer"
              },
              {
                title: "Smart Resume Maker",
                desc: "Auto-generate ATS-friendly resumes that perfectly highlight your coding skills, core competencies, and ZenCode stats.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                ),
                link: "/resume-maker"
              },
              {
                title: "Adaptive Aptitude",
                desc: "Sharpen your logical reasoning and quantitative math with AI-generated questions tailored to your skill level for preliminary rounds.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-pink-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
                  </svg>
                ),
                link: "/aptitude-quiz"
              },
            ].map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } }}
                transition={{ duration: 0.5, delay: idx * 0.15, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="group relative glass-panel p-8 rounded-3xl overflow-hidden cursor-pointer"
              >
                {/* Glowing AI Border Effect */}
                <div className="absolute inset-0 rounded-3xl border border-slate-100 group-hover:border-indigo-300 transition-colors duration-500 shadow-sm group-hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-transparent rounded-2xl" />
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800 group-hover:text-indigo-600 transition-colors">{card.title}</h3>
                  <p className="text-slate-500 leading-relaxed max-w-sm mb-8 flex-1">{card.desc}</p>

                  <Link to={card.link} className="inline-flex items-center text-sm font-bold text-indigo-500 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">
                    Experience It <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-6 mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-semibold">Frequently Asked</h2>
              <p className="text-neutral-400 text-lg">
                Answers to common questions about structure, progress, and interview readiness.
              </p>
              <div className="glass-panel p-5 rounded-2xl border border-white/10 text-sm text-neutral-400">
                Build a personal roadmap with milestones and checkpoints, just like a real engineering team would.
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: "How is the learning path organized?",
                  a: "Problems are grouped by patterns and difficulty. Each section builds on the previous one.",
                },
                {
                  q: "Can I track my progress?",
                  a: "Yes. Every solved question updates your progress bar and weekly goals.",
                },
                {
                  q: "Do you have company-specific practice?",
                  a: "We provide curated tracks for top companies with mock interview schedules.",
                },
              ].map((item) => (
                <details key={item.q} className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <summary className="cursor-pointer text-lg font-semibold text-slate-800">{item.q}</summary>
                  <p className="mt-3 text-slate-500 text-sm">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 mt-28">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100/80 via-white to-slate-100/80 p-10 md:p-16 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Ready to level up?</h2>
                <p className="text-slate-500 mt-3 max-w-xl">
                  Build your streak with consistent problem-solving and see your progress climb.
                </p>
              </div>
              <Link
                to="/signup"
                className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg rounded-full hover:from-indigo-600 hover:to-purple-700 transition-colors"
              >
                Join ZenCode
              </Link>
            </div>
          </div>
        </div>

        <footer className="container mx-auto px-6 mt-20 pb-12 text-sm text-neutral-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <div className="text-slate-400">ZenCode (c) 2026. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-600 cursor-pointer">Terms</span>
              <span className="hover:text-slate-600 cursor-pointer">Privacy</span>
              <span className="hover:text-slate-600 cursor-pointer">Support</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
