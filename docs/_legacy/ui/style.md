:root {
  --color-background: #141414;
  --color-foreground: #fafafa;
  --color-card: #141414;
  --color-card-foreground: #fafafa;
  --color-popover: #141414;
  --color-popover-foreground: #fafafa;
  --color-primary: #b46e9b;
  --color-primary-foreground: #fafafa;
  --color-secondary: #1c1c1c;
  --color-secondary-foreground: #fafafa;
  --color-muted: #1c1c1c;
  --color-muted-foreground: #6b6b6b;
  --color-accent: #b46e9b;
  --color-accent-foreground: #fafafa;
  --color-destructive: #fdf89f;
  --color-destructive-foreground: #fafafa;
  --color-border: #1c1c1c;
  --color-input: #1c1c1c;
  --color-ring: #b46e9b;
  --color-action: rgba(180, 110, 155, 0.15);
  --color-action-foreground: #b46e9b;
  --color-action-hover: rgba(180, 110, 155, 0.25);
  --radius: 0.5rem;
  --color-chart-1: #b46e9b;
  --color-chart-2: #b46e9b;
  --color-chart-3: #facc15;
  --color-chart-4: #22c55e;
  --color-chart-5: #a855f7;

  --font-sans: var(--font-geist-sans, 'Geist', system-ui, sans-serif);
  --font-mono: var(--font-geist-mono, 'Geist Mono', monospace);
}

.light {
  --color-background: #ffffff;
  --color-foreground: #1a1a1a;
  --color-card: #ffffff;
  --color-card-foreground: #1a1a1a;
  --color-popover: #ffffff;
  --color-popover-foreground: #1a1a1a;
  --color-primary: #b46e9b;
  --color-primary-foreground: #fafafa;
  --color-secondary: #f4f4f5;
  --color-secondary-foreground: #1a1a1a;
  --color-muted: #f4f4f5;
  --color-muted-foreground: #737373;
  --color-accent: #b46e9b;
  --color-accent-foreground: #fafafa;
  --color-destructive: #e4f378;
  --color-destructive-foreground: #fafafa;
  --color-border: #f4f4f5;
  --color-input: #f4f4f5;
  --color-ring: #b46e9b;
  --color-action: rgba(180, 110, 155, 0.15);
  --color-action-foreground: #b46e9b;
  --color-action-hover: rgba(180, 110, 155, 0.25);
  --color-chart-1: #b46e9b;
  --color-chart-2: #6eb4b2;
  --color-chart-3: #fdf89f;
  --color-chart-4: #6bd7ac;
  --color-chart-5: #a26cd5;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-feature-settings:
    'rlig' 1,
    'calt' 1;
  scroll-behavior: smooth;
}

* {
  border-color: var(--color-border);
}

.rounded-sm {
  border-radius: 0.125rem;
}

.rounded {
  border-radius: 0.25rem;
}

.rounded-md {
  border-radius: 0.375rem;
}

.rounded-lg {
  border-radius: 0.5rem;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background-color: var(--color-muted);
}

::-webkit-scrollbar-thumb {
  background-color: var(--color-muted-foreground);
  opacity: 0.2;
  border-radius: 0.125rem;
}

::-webkit-scrollbar-thumb:hover {
  opacity: 0.3;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

html[data-resize-glow] .clouds-r-handle,
.clouds-r-handle:hover {
  background: linear-gradient(
    to right,
    rgba(180, 110, 155, 0.3),
    rgba(180, 110, 155, 0.15),
    rgba(180, 110, 155, 0.3)
  );
  box-shadow: 0 0 15px rgba(180, 110, 155, 0.15);
}
