# AZ-900 Study Desk

A responsive browser-based study interface built with HTML, JavaScript, and Tailwind CSS. The question bank is loaded from `questions.json`, which was extracted from the supplied AZ-900 study guide.

## Features
- Browse all eight study sections
- Search question text, answers, and explanations
- Filter all, completed, or not-completed questions
- Reveal and hide answers/explanations
- Mark questions as completed; progress is saved in browser local storage
- Shuffle questions within the selected section
- Previous/next navigation and keyboard arrow shortcuts
- Responsive layout for desktop and mobile

## Run locally
Because the app loads JSON using `fetch`, open it through a local HTTP server rather than opening `index.html` directly as a `file://` URL.

1. Extract the project folder.
2. Open a terminal in this folder.
3. Run:

   ```bash
   python -m http.server 8000
   ```

4. Visit <http://localhost:8000> in your browser.

Tailwind CSS is loaded from its CDN, so an internet connection is needed for the Tailwind styles. The question bank itself is local.

## Files
- `index.html` — app layout and Tailwind CDN
- `styles.css` — custom theme and responsive styling
- `app.js` — question loading, navigation, filtering, and progress logic
- `questions.json` — extracted question and answer bank
