import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        arabic: ['"Noto Kufi Arabic"', '"Cairo"', 'system-ui', 'sans-serif'],
        display: ['"Noto Kufi Arabic"', '"Cairo"', 'system-ui', 'sans-serif'],
        sans: ['"Cairo"', '"Noto Kufi Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        orange: {
          50: "hsl(14 100% 97%)",
          100: "hsl(14 100% 92%)",
          200: "hsl(14 100% 82%)",
          300: "hsl(14 100% 72%)",
          400: "hsl(14 100% 62%)",
          500: "hsl(14 100% 57%)",
          600: "hsl(14 100% 48%)",
          700: "hsl(14 100% 40%)",
          800: "hsl(14 100% 32%)",
          900: "hsl(14 100% 22%)",
        },
        cyan: {
          50: "hsl(197 100% 96%)",
          100: "hsl(197 100% 90%)",
          200: "hsl(197 100% 78%)",
          300: "hsl(197 100% 66%)",
          400: "hsl(197 100% 60%)",
          500: "hsl(197 100% 57%)",
          600: "hsl(197 100% 48%)",
          700: "hsl(197 100% 38%)",
          800: "hsl(197 100% 28%)",
          900: "hsl(197 100% 18%)",
        },
        blue: {
          50: "hsl(240 100% 97%)",
          100: "hsl(240 100% 92%)",
          200: "hsl(240 100% 82%)",
          300: "hsl(240 100% 72%)",
          400: "hsl(240 100% 64%)",
          500: "hsl(240 100% 57%)",
          600: "hsl(240 100% 48%)",
          700: "hsl(240 100% 40%)",
          800: "hsl(240 100% 30%)",
          900: "hsl(240 100% 20%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
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
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(14 100% 57% / 0.2)" },
          "50%": { boxShadow: "0 0 40px hsl(14 100% 57% / 0.35)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-gold": "pulse-gold 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, hsl(14 100% 57%), hsl(24 100% 50%))",
        "gradient-secondary": "linear-gradient(135deg, hsl(210 100% 52%), hsl(220 100% 48%))",
        "gradient-gold": "linear-gradient(135deg, hsl(14 100% 57%), hsl(24 100% 50%))",
        "gradient-gold-hover": "linear-gradient(135deg, hsl(14 100% 52%), hsl(24 100% 45%))",
        "gradient-dark": "linear-gradient(180deg, hsl(220 20% 10%) 0%, hsl(220 25% 7%) 100%)",
        "gradient-card": "linear-gradient(145deg, hsl(0 0% 100%) 0%, hsl(220 14% 96%) 100%)",
        "gradient-hero": "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(220 20% 95%) 100%)",
      },
      boxShadow: {
        "gold": "0 4px 20px -5px hsl(14 100% 57% / 0.25)",
        "gold-lg": "0 8px 40px -10px hsl(14 100% 57% / 0.35)",
        "card": "0 2px 12px -3px hsl(220 20% 50% / 0.08)",
        "card-hover": "0 8px 30px -5px hsl(220 20% 50% / 0.15)",
        "glow-gold": "0 0 20px hsl(14 100% 57% / 0.2)",
        "glow-gold-strong": "0 0 40px hsl(14 100% 57% / 0.35)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
