# Personal Notes App (Remix Frontend)

A minimal, modern personal notes app. Features:

- Create, edit, view, and delete notes
- Minimalistic modern light theme
- Color palette: `primary` #1976d2, `secondary` #424242, `accent` #fbc02d
- Layout: header (app title), sidebar note list, detail/edit pane
- Fast and accessible

## Usage

By default, the frontend expects to find the notes database backend at:

```
http://localhost:4000/notes
```

To point at a custom backend (e.g., in the cloud), set the environment variable `NOTES_API_BASE` before starting the app, e.g.:

```
NOTES_API_BASE=https://your-database-api.url.com npm run dev
```

## Development

Run the dev server with:

```shellscript
npm run dev
```

## Build & Deployment

To build for production:

```sh
npm run build
npm start
```

## Styling & Customization

This app uses [Tailwind CSS](https://tailwindcss.com/) with the color palette:

- Primary: #1976d2 (blue) – text, active nav, header
- Secondary: #424242 (grey) – sidebar, default text
- Accent: #fbc02d (yellow) – buttons, highlights

Fonts: “Inter” (Google Fonts)

UI is minimal and responsive.

