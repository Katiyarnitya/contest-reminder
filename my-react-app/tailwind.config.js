/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--border))",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",

        card: "oklch(var(--card))",
        "card-foreground": "oklch(var(--card-foreground))",

        popover: "oklch(var(--popover))",
        "popover-foreground": "oklch(var(--popover-foreground))",

        primary: "oklch(var(--primary))",
        "primary-foreground": "oklch(var(--primary-foreground))",

        secondary: "oklch(var(--secondary))",
        "secondary-foreground": "oklch(var(--secondary-foreground))",

        muted: "oklch(var(--muted))",
        "muted-foreground": "oklch(var(--muted-foreground))",

        accent: "oklch(var(--accent))",
        "accent-foreground": "oklch(var(--accent-foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
      },
    },
  },
  plugins: [],
}