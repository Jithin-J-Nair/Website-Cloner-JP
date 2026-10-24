import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "var(--kn-void)",
          elevated: "var(--kn-void-elevated)",
          subtle: "var(--kn-void-subtle)",
        },
        ice: {
          DEFAULT: "var(--kn-ice)",
          elevated: "var(--kn-ice-elevated)",
          card: "var(--kn-ice-card)",
        },
        cobalt: {
          DEFAULT: "var(--kn-cobalt)",
          deep: "var(--kn-cobalt-deep)",
          iris: "var(--kn-iris)",
        },
        spectral: {
          cyan: "var(--kn-cyan)",
          ember: "var(--kn-ember)",
          emerald: "var(--kn-emerald)",
        },
        ink: {
          DEFAULT: "var(--kn-ink)",
          muted: "var(--kn-ink-muted)",
        },
        chalk: {
          DEFAULT: "var(--kn-chalk)",
          muted: "var(--kn-chalk-muted)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      spacing: {
        "kn-1": "var(--space-1)",
        "kn-2": "var(--space-2)",
        "kn-3": "var(--space-3)",
        "kn-4": "var(--space-4)",
        "kn-5": "var(--space-5)",
        "kn-6": "var(--space-6)",
        "kn-8": "var(--space-8)",
        "kn-10": "var(--space-10)",
        "kn-12": "var(--space-12)",
        "kn-16": "var(--space-16)",
        "kn-20": "var(--space-20)",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      transitionTimingFunction: {
        expo: "var(--ease-expo)",
        cinema: "var(--ease-cinema)",
        tactile: "var(--ease-tactile)",
        "spring-ui": "var(--ease-spring-ui)",
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
        cinema: "var(--duration-cinema)",
      },
      zIndex: {
        canvas: "0",
        grid: "5",
        content: "10",
        sticky: "25",
        hud: "60",
        popover: "70",
        modal: "80",
        curtain: "90",
        cursor: "100",
      },
    },
  },
};

export default config;
