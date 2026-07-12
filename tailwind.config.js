/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "oklch(var(--border) / <alpha-value>)",
                input: "oklch(var(--input) / <alpha-value>)",
                ring: "oklch(var(--ring) / <alpha-value>)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "slide-up": {
                    from: { transform: "translateY(24px)", opacity: "0" },
                    to:   { transform: "translateY(0)",    opacity: "1" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to:   { opacity: "1" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%":      { transform: "translateY(-8px)" },
                },
                "bounce-in": {
                    "0%":   { transform: "scale(0.5)", opacity: "0" },
                    "60%":  { transform: "scale(1.1)" },
                    "80%":  { transform: "scale(0.95)" },
                    "100%": { transform: "scale(1)",   opacity: "1" },
                },
                "shimmer": {
                    "0%":   { backgroundPosition: "-200% center" },
                    "100%": { backgroundPosition:  "200% center" },
                },
                "streak-fire": {
                    "0%, 100%": { transform: "scaleY(1)    rotate(-3deg)" },
                    "33%":      { transform: "scaleY(1.1)  rotate(3deg)"  },
                    "66%":      { transform: "scaleY(0.95) rotate(-2deg)" },
                },
                "xp-float": {
                    "0%":   { transform: "translateY(0)     scale(1)",   opacity: "1" },
                    "30%":  { transform: "translateY(-20px) scale(1.2)", opacity: "1" },
                    "100%": { transform: "translateY(-64px) scale(0.8)", opacity: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up":   "accordion-up 0.2s ease-out",
                "slide-up":       "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
                "fade-in":        "fade-in 0.4s ease both",
                "float":          "float 4s ease-in-out infinite",
                "bounce-in":      "bounce-in 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both",
                "shimmer":        "shimmer 2.5s linear infinite",
                "streak-fire":    "streak-fire 0.8s ease-in-out infinite",
                "xp-float":       "xp-float 1.5s ease-out forwards",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
