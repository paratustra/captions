// Side-effect CSS imports (e.g. `import "./globals.css"`) are handled by the
// Next.js/webpack pipeline, not TypeScript. Declare them so `tsc` doesn't flag
// the import under bundler module resolution.
declare module "*.css";
