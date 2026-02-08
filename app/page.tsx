"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Wand2, PaintBucket, ShieldCheck, LayoutGrid, Palette, Brain, Zap } from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import ShimmerButton from "@/components/magicui/shimmer-button";
import { BentoGrid, BentoGridItem } from "@/components/magicui/bento-grid";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen opacity-30 animate-pulse-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full mix-blend-screen opacity-30 animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-32 pb-20">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-8"
        >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Gemini 3 Powered</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                Sentient <span className="text-primary neon-text">Studio</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The first AI Brand Manager that <span className="text-white font-semibold">learns your DNA</span>.
                <br />
                Stop using templates. Start generating <span className="italic">legacy</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/dashboard">
                    <ShimmerButton className="shadow-2xl">
                        <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                            Launch Console
                        </span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </ShimmerButton>
                </Link>
                <Link href="/canvas">
                     <button className="px-8 py-3 rounded-full glass hover:bg-white/10 transition-all text-sm font-medium flex items-center gap-2">
                        <span>🎨</span> Open Canvas
                     </button>
                </Link>
            </div>
        </motion.div>

        {/* HERO VISUAL MOCKUP */}
        <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
            className="mt-16 w-full max-w-5xl relative group"
        >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden aspect-video shadow-2xl">
                <BorderBeam size={400} duration={12} delay={9} />
                
                {/* Mock UI Interface */}
                <div className="absolute inset-0 flex flex-col p-4 md:p-6 gap-4 md:gap-6 opacity-80">
                    {/* Header */}
                    <div className="h-12 w-full glass rounded-xl flex items-center px-4 justify-between border-white/5">
                         <div className="flex gap-2">
                             <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
                             <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                             <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
                         </div>
                         <div className="h-2 w-32 rounded-full bg-white/10" />
                    </div>
                    
                    <div className="flex-1 flex gap-4 md:gap-6 overflow-hidden">
                         {/* Sidebar */}
                         <div className="w-16 md:w-20 h-full glass rounded-xl flex flex-col items-center py-6 gap-6 border-white/5 hidden sm:flex">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/50" />
                            <div className="h-8 w-8 rounded-lg bg-white/5" />
                            <div className="h-8 w-8 rounded-lg bg-white/5" />
                            <div className="h-8 w-8 rounded-lg bg-white/5" />
                            <div className="mt-auto h-8 w-8 rounded-full bg-white/10" />
                         </div>

                         {/* Main Content */}
                         <div className="flex-1 rounded-xl grid grid-cols-12 gap-4 md:gap-6">
                            {/* Stats Cards */}
                            <div className="col-span-12 md:col-span-8 h-full flex flex-col gap-4 md:gap-6">
                                <div className="h-48 glass rounded-xl border-white/5 relative overflow-hidden group/card p-4">
                                     <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                                     <div className="h-4 w-24 bg-white/10 rounded mb-4" />
                                     <div className="flex items-end gap-2 h-24 mt-auto">
                                         {[40, 70, 50, 90, 60, 80, 40, 70].map((h, i) => (
                                             <div key={i} className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                         ))}
                                     </div>
                                </div>
                                <div className="flex-1 glass rounded-xl border-white/5 grid grid-cols-2 gap-4 p-4">
                                     <div className="rounded-lg bg-white/5" />
                                     <div className="rounded-lg bg-white/5" />
                                     <div className="rounded-lg bg-white/5" />
                                     <div className="rounded-lg bg-white/5" />
                                </div>
                            </div>

                            {/* Assistant Panel */}
                            <div className="col-span-12 md:col-span-4 glass rounded-xl border-white/5 p-4 flex flex-col gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/50 mb-2" />
                                <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                                <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                                <div className="h-2 w-full bg-white/10 rounded-full mt-4" />
                                <div className="mt-auto h-10 w-full rounded-lg bg-white/5 border border-white/10" />
                            </div>
                         </div>
                    </div>
                </div>

            </div>
        </motion.div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section className="relative z-10 py-32 px-4 max-w-7xl mx-auto">
        <div className="mb-16 text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">Why Sentient Studio?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
                We don't just generate images. We extract your visual soul and enforce it across every pixel.
            </p>
        </div>

        <BentoGrid>
            <BentoGridItem
                title="Contextual Brand DNA"
                description="Upload your moodboard. We extract hex codes, fonts, and 'vibe' automatically."
                icon={<Palette className="h-4 w-4 text-cyan-400" />}
                className="md:col-span-2"
                header={
                    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-black/50 to-neutral-900 border border-white/5 p-4 flex items-center justify-center gap-4 overflow-hidden relative group/header">
                         <div className="absolute inset-0 bg-grid-white/[0.05]" />
                         <div className="z-10 flex gap-[-10px]">
                            {['#00FFFF', '#FF00FF', '#FFFFFF'].map((color, i) => (
                                <div 
                                    key={i} 
                                    className="w-12 h-12 rounded-full border-2 border-black shadow-xl" 
                                    style={{ backgroundColor: color, transform: `translateX(-${i * 10}px)` }} 
                                />
                            ))}
                         </div>
                         <div className="z-10 px-4 py-2 glass rounded-lg border border-white/10">
                            <span className="font-mono text-xs text-white/70">Extraction Complete</span>
                         </div>
                    </div>
                }
            />
            <BentoGridItem
                title="Compliance Guardrails"
                description="Our Compliance Agent reviews every pixel. Nothing off-brand leaves the studio."
                icon={<ShieldCheck className="h-4 w-4 text-green-400" />}
                className="md:col-span-1"
                header={
                    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-black/50 to-neutral-900 border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                         <ShimmerButton className="h-8 px-4" shimmerColor="#22c55e" shimmerSize="1px">
                             <div className="flex items-center gap-2 text-green-400">
                                 <ShieldCheck className="w-4 h-4" />
                                 <span className="text-xs font-bold tracking-widest">SECURE</span>
                             </div>
                         </ShimmerButton>
                    </div>
                }
            />
            <BentoGridItem
                title="Generative Magic"
                description="Text-to-Masterpiece. Powered by Gemini 3 Pro Vision."
                icon={<Brain className="h-4 w-4 text-magenta-400" />}
                className="md:col-span-1"
                header={
                    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-black/50 to-neutral-900 border border-white/5 p-4 flex items-center justify-center relative overflow-hidden group/header">
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-magenta-500/10 opacity-50 group-hover/header:opacity-100 transition-opacity" />
                         <Zap className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>
                }
            />
             <BentoGridItem
                title="Infinite Canvas"
                description="A workspace that thinks with you. Drag, drop, dream."
                icon={<LayoutGrid className="h-4 w-4 text-white" />}
                className="md:col-span-2"
                header={
                   <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-neutral-900 border border-white/5 p-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/[0.05]" />
                        {/* Mock draggable items */}
                        <div className="absolute top-4 left-4 w-20 h-16 rounded glass border-white/10 rotate-[-6deg]" />
                        <div className="absolute bottom-4 right-12 w-24 h-24 rounded glass border-white/10 rotate-[3deg] bg-primary/10" />
                        <div className="absolute top-8 right-8 w-16 h-16 rounded-full glass border-white/10 bg-accent/10" />
                   </div>
                }
            />
        </BentoGrid>
      </section>
      
      {/* FOOTER */}
      <footer className="py-12 text-center text-muted-foreground text-sm border-t border-white/5">
        <p>© 2026 Sentient Studio. All systems nominal.</p>
      </footer>
    </div>
  );
}
