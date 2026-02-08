import type { Config } from "tailwindcss";

export default {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                ring: "hsl(var(--ring))",
                neon: {
                    cyan: "#00FFCC",
                    pink: "#FF00FF",
                    blue: "#00BFFF",
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "monospace"],
            },
            animation: {
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "fade-in": "fade-in 0.3s ease-out",
                "slide-up": "slide-up 0.4s ease-out",
                "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
                "shimmer": "shimmer 2s linear infinite",
                "marquee": "marquee var(--duration) linear infinite",
                "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
            },
            keyframes: {
                "pulse-glow": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "border-beam": {
                    "100%": { "offset-distance": "100%" },
                },
                "shimmer": {
                    "from": { "backgroundPosition": "0 0" },
                    "to": { "backgroundPosition": "-200% 0" },
                },
                "marquee": {
                    "from": { transform: "translateX(0)" },
                    "to": { transform: "translateX(calc(-100% - var(--gap)))" },
                },
                "marquee-vertical": {
                    "from": { transform: "translateY(0)" },
                    "to": { transform: "translateY(calc(-100% - var(--gap)))" },
                },
            },
            backdropBlur: {
                xs: "2px",
            },
        },
    },
    plugins: [],
} satisfies Config;
