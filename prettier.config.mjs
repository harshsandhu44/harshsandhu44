/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 reads its theme from CSS, and this option takes a single path,
  // so class sorting uses stock Tailwind classes across all apps. If an app's
  // custom theme classes ever sort wrong, give that app its own .prettierrc
  // with tailwindStylesheet pointing at its globals.css.
};
