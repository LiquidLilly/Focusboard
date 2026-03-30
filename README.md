# FocusBoard

A personal productivity planner with AI-powered features, built for getting things out of your head and into a structure that actually works.

All data lives in your browser — no accounts, no servers, nothing synced anywhere.

---

## Features

| View | What it does |
|------|-------------|
| **Board** | Kanban-style buckets for organizing tasks by status or category |
| **Today** | Focused daily view — what actually needs to happen today |
| **Timeline** | See upcoming tasks and deadlines across time |
| **Meeting Notes** | Capture notes during meetings; AI extracts action items and implicit commitments |
| **Brain Dump** | Unload everything on your mind; AI helps sort and prioritize it |
| **Settings** | Manage your Databricks token, preferences, and data export/import |

**AI nudges** surface proactively — flagging things you might be missing, commitments slipping, or tasks that need attention.

---

## Tech Stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [dnd-kit](https://dndkit.com/) for drag-and-drop
- [Databricks Foundation Model APIs](https://docs.databricks.com/machine-learning/foundation-model-apis/) — `databricks-claude-sonnet-4-6` endpoint

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Databricks workspace with Foundation Model APIs enabled
- A Databricks [Personal Access Token](https://docs.databricks.com/dev-tools/auth/pat.html)

### Install and run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, go to **Settings**, and paste in your Databricks Personal Access Token (starts with `dapi`).

### Build for production

```bash
npm run build
# output goes to dist/
```

---

## Connecting AI

FocusBoard uses the Databricks Foundation Model API to call `claude-sonnet-4-6`. To connect it:

1. Go to your Databricks workspace
2. Click your avatar (top right) → **Settings** → **Developer** → **Access tokens**
3. Generate a new token and copy it
4. In FocusBoard, go to **Settings** and paste the token in — hit **Test Connection** to verify

Your token is stored only in your browser's `localStorage` and is only ever sent to your own Databricks workspace.

---

## Data & Privacy

- Everything is stored in `localStorage` in your browser
- Nothing is sent to any external service except your own Databricks workspace for AI features
- Use **Export Data** in Settings to back up your data as JSON
- Use **Import Data** to restore from a backup

---

## Deploying

The app is a static site — just serve the `dist/` folder anywhere.

**Azure Static Web Apps** (recommended if you have Azure access):
1. Build: `npm run build`
2. Create a Static Web App in the Azure Portal
3. Set build output directory to `dist`
4. Connect to this repo for automatic deploys on push
