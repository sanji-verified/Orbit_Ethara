@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply box-border;
  }

  html {
    @apply bg-dark-bg text-dark-text;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply m-0 p-0 font-sans;
  }

  ::-webkit-scrollbar {
    @apply w-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-dark-bg;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-dark-border rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-dark-muted;
  }
}

@layer components {
  .card {
    @apply bg-dark-surface border border-dark-border rounded-xl p-5;
  }

  .input {
    @apply bg-dark-surface border border-dark-border rounded-lg px-3 py-2.5 text-sm text-dark-text 
           outline-none transition-colors focus:border-orbit-500 placeholder:text-dark-muted;
  }

  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 bg-orbit-500 hover:bg-orbit-600 
           text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all 
           active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 bg-dark-surface hover:bg-dark-border 
           text-dark-accent font-semibold rounded-lg px-4 py-2.5 text-sm transition-all 
           border border-dark-border active:scale-[0.98];
  }

  .btn-danger {
    @apply inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 
           text-red-400 font-semibold rounded-lg px-4 py-2.5 text-sm transition-all 
           border border-red-500/20 active:scale-[0.98];
  }

  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 bg-transparent hover:bg-dark-surface 
           text-dark-muted hover:text-dark-accent font-semibold rounded-lg px-3 py-2 
           text-sm transition-all;
  }

  .badge {
    @apply inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold;
  }

  .skeleton {
    @apply animate-pulse bg-dark-border rounded;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
