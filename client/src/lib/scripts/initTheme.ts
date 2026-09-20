import { transform } from "esbuild";

export const rawJavaScriptCode = `
const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
const toggleTheme = () => document.documentElement.classList.toggle("dark", colorSchemeMedia.matches);
const preferDark = colorSchemeMedia.addEventListener("change", () => {
  toggleTheme();
});
toggleTheme();
`;

const trimBounds = (text: string) => text.slice(1, text.length - 2);

export const minifiedJavaScriptCode = trimBounds(
  (await transform(`{${rawJavaScriptCode}}`, {
    loader: "ts",
    target: "es2018",
    minify: true,
  })).code
);
