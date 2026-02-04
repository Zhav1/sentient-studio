import Link from "next/link";

export default function HomePage() {
    return (
        <main className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm text-muted-foreground">
                            Powered by Gemini AI
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
                        <span className="bg-gradient-to-r from-primary via-neon-blue to-accent bg-clip-text text-transparent">
                            Sentient
                        </span>{" "}
                        Studio
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
                        Transform your brand vision into reality. Drag, drop, and let AI
                        generate{" "}
                        <span className="text-foreground font-medium">on-brand</span>{" "}
                        marketing assets.
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in">
                        {[
                            "Living Brand Constitution",
                            "AI Compliance Auditor",
                            "Real-time Generation",
                        ].map((feature) => (
                            <div
                                key={feature}
                                className="px-4 py-2 rounded-lg glass-card text-sm"
                            >
                                {feature}
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                        <Link
                            href="/canvas"
                            className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold 
                         hover:opacity-90 transition-all neon-glow hover:scale-105"
                        >
                            Open Canvas
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 rounded-xl glass font-semibold 
                         hover:bg-white/10 transition-all hover:scale-105"
                        >
                            View Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-6 border-t border-border">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        How It Works
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="glass-card rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">🎨</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">1. Build Your Moodboard</h3>
                            <p className="text-muted-foreground">
                                Drag images, colors, and notes onto the canvas. The AI watches and learns your aesthetic.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="glass-card rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">🧠</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">2. AI Creates Constitution</h3>
                            <p className="text-muted-foreground">
                                Gemini extracts your brand DNA: color palettes, visual style, tone of voice, and boundaries.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="glass-card rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-neon-blue/20 flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">✨</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">3. Generate On-Brand</h3>
                            <p className="text-muted-foreground">
                                Type a simple prompt. Watch AI generate and audit assets in real-time until they pass.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border text-center text-muted-foreground">
                <p>Built with Next.js, Gemini AI, and ❤️ for the Hackathon</p>
            </footer>
        </main>
    );
}
