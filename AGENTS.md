# Repository Guidelines

## Project Structure & Module Organization

This repository is currently documentation-first. The committed files are [README.md](C:/Users/Glow/Desktop/School-CApp-Codex/README.md), which defines the Phase 1 architecture, and `google-services.json`, which holds Android Firebase configuration. No Expo app scaffold, `package.json`, or test suite is committed yet.

Contributors should align new code with the structure already defined in the README:

- `app/` for Expo Router route groups such as `(auth)`, `(parent)`, `(teacher)`, and `(admin)`
- `src/` for shared modules such as `components/`, `services/`, `store/`, `hooks/`, `types/`, and `theme/`
- `assets/` for images, icons, and branding files

## Build, Test, and Development Commands

There are no runnable build or test commands in the current repository state. Do not add undocumented tooling assumptions to PRs.

When the Expo app is scaffolded, standardize commands in `package.json` and document them here, for example:

- `npm install` to install dependencies
- `npx expo start` to run the app locally
- `npm run lint` to check formatting and static issues
- `npm test` to run the test suite

## Coding Style & Naming Conventions

Use TypeScript with strict typing, following the architecture in the README. Prefer 2-space indentation, small reusable components, and business logic outside UI layers.

- Components: `PascalCase` filenames, for example `StudentCard.tsx`
- Hooks: `camelCase` with `use` prefix, for example `useTenant.ts`
- Utilities and services: descriptive `camelCase` exports
- Route groups and folders: lowercase names matching Expo Router conventions

## Testing Guidelines

No test framework is committed yet. When tests are introduced, keep them close to the code they verify or under `__tests__/`, and name files `*.test.ts` or `*.test.tsx`. Prioritize coverage for tenant isolation, role-based access checks, and Firebase interaction boundaries.

## Commit & Pull Request Guidelines

Current history uses short, imperative subjects such as `initial commit` and `updated readme`. Keep commit messages concise and action-oriented.

Pull requests should include:

- a short summary of the change
- linked issue or task reference when available
- screenshots for UI changes
- notes about config or Firebase impact

## Security & Configuration Tips

Treat Firebase configuration and tenant data handling as sensitive. Never commit secrets beyond intended public client config, and ensure all new data access paths preserve school-level isolation and role checks.
