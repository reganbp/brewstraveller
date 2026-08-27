import { ref } from 'vue';

const getInitialTheme = (): boolean => {
  const saved = localStorage.getItem('theme');
  if (saved) {
    return saved === 'dark';
  }
  // Fallback to system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true; // Default to dark mode
};

const isDark = ref(getInitialTheme());

// Applies class modifier and stores value
export function applyTheme(dark: boolean) {
  if (typeof document !== 'undefined') {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }
}

// Immediate application on script load to prevent layout/color flash
applyTheme(isDark.value);

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value;
    applyTheme(isDark.value);
  }

  return {
    isDark,
    toggleTheme
  };
}
