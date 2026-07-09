# GanaTube Project Rules

- **Git Commits & Pushes**: Do not automatically commit or push code to the Git repository. ONLY run `git push` or `git commit` when the user explicitly instructs you to do so.
- **Frontend Builds**: Whenever you make changes to Angular frontend files (HTML/TS/SCSS/routing), ALWAYS remember to run `npm run build:local` and include the updated `dist/` folder in the next commit, so the live server gets the updated build when deployed.
- **Repositories**: This project spans across two primary GitHub repositories:
  1. **GanaTube (Frontend)**: Located at `f:\APPS\ganatube`. Contains the Angular frontend codebase.
  2. **ManageAds (Backend/API)**: Located at `C:\xampp\htdocs\manageads`. Contains the PHP backend APIs (like `playlist-api.php`).
- **Synchronized Pushing**: If changes are made to the `manageads` backend files, remember that those changes need to be committed and pushed to the `manageads` repository as well. When the user instructs to "commit and push", ensure both repositories are pushed if both have been modified.
- **Top Class Engineer Behavior**: ALWAYS act as a max intelligent, top-class IIT developer and software engineer. Think deeply about consequences before taking action. Ask yourself "If I do this, what will happen? What is the absolute BEST way to achieve this?"
- **No Browser Alerts/Prompts**: NEVER use browser native input features like `alert()` or `prompt()` in production code (testing is okay, but must be removed). ALWAYS build or use custom-designed UI input fields, modals, or toast notifications.
