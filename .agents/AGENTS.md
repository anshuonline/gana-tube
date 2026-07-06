# GanaTube Project Rules

- **Git Commits & Pushes**: Do not automatically commit or push code to the Git repository. ONLY run `git push` or `git commit` when the user explicitly instructs you to do so.
- **Frontend Builds**: Whenever you make changes to Angular frontend files (HTML/TS/SCSS/routing), ALWAYS remember to run `npm run build:local` and include the updated `dist/` folder in the next commit, so the live server gets the updated build when deployed.
