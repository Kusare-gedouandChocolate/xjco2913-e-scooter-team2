# Repository Guidelines

## Project Structure & Module Organization
This repository contains the Vite + React + TypeScript frontend for the e-scooter system. Application code lives in `src/`. Use `src/pages/` for route-level screens, `src/components/` for reusable UI, `src/api/` for HTTP clients and endpoint wrappers, and `src/utils/` for shared helpers such as auth and formatting. Global styles are in `src/index.css` and `src/App.css`. Static HTML entry points stay at the root (`index.html`); build and TypeScript config files also stay at the root.

## Build, Test, and Development Commands
- `npm install` — install project dependencies.
- `npm run dev` — start the Vite development server.
- `npm run build` — run TypeScript project checks and produce a production bundle in `dist/`.
- `npm run preview` — serve the built app locally for a production-like check.
- `npm run lint` — run ESLint on all `ts` and `tsx` files.

## Coding Style & Naming Conventions
Use TypeScript with React function components. Follow the existing style: semicolons enabled, single quotes, and consistent indentation within each file; prefer 2 spaces in new edits unless the file clearly uses another pattern. Name components and pages in `PascalCase` (`AuthPage.tsx`), utilities and API modules in `camelCase` (`format.ts`, `client.ts`), and keep route and API helpers narrowly scoped. Use the ESLint flat config in `eslint.config.js`; fix lint issues before opening a PR.

## Testing Guidelines
There is currently no dedicated test runner configured in `package.json`. Until one is added, treat `npm run lint` and `npm run build` as the minimum validation steps for every change. If you add tests later, colocate them with the feature or place them under `src/` using names like `ComponentName.test.tsx`.

## Commit & Pull Request Guidelines
Git history is not available in this environment, so no reliable commit convention can be inferred here. Use short, imperative commit messages such as `Add booking status filter` or `Fix admin pricing update`. For pull requests, include a brief summary, linked issue or task ID, validation steps performed, and screenshots for UI changes.

## Configuration & API Notes
Review `src/api/client.ts` before changing request behavior or base URLs. Do not hardcode secrets in source files. Keep environment-specific values in local configuration and document any new setup steps alongside the related code change.
