const STORAGE_KEY = "alune-theme";
const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");

type Theme = "light" | "dark";

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function updateControls(theme: Theme): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
    .forEach((button) => {
      const nextThemeLabel = theme === "dark" ? "浅色" : "深色";
      const nextLabel = `切换到${nextThemeLabel}主题`;
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.setAttribute("aria-label", nextLabel);
      button.setAttribute("title", nextLabel);
      const label = button.querySelector("[data-theme-toggle-label]");
      if (label) label.textContent = nextLabel;
    });
}

function setTheme(theme: Theme, persist = false): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  }
  updateControls(theme);
}

const initialTheme = root.dataset.theme === "dark" ? "dark" : "light";
setTheme(initialTheme);

document
  .querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const current = root.dataset.theme === "dark" ? "dark" : "light";
      setTheme(current === "dark" ? "light" : "dark", true);
    });
  });

const followSystem = (event: MediaQueryListEvent | MediaQueryList): void => {
  if (!readStoredTheme()) setTheme(event.matches ? "dark" : "light");
};
if (typeof media.addEventListener === "function") {
  media.addEventListener("change", followSystem);
} else {
  const legacyMedia = media as unknown as {
    addListener: (listener: (event: MediaQueryListEvent) => void) => void;
  };
  legacyMedia.addListener(followSystem);
}

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  if (event.newValue === "dark" || event.newValue === "light") {
    setTheme(event.newValue);
  } else if (event.newValue === null) {
    setTheme(media.matches ? "dark" : "light");
  }
});
