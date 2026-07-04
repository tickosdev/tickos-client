# TickOS Client Desk

> The Ticket Operating System for Developers — Agent Inbox Client

An open-source support ticket inbox for agents. Built with Next.js 15, powered entirely by the TickOS REST API.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tickosdev/tickos-client-desk&env=TICKOS_API_KEY&envDescription=Your%20TickOS%20API%20Key&envLink=https://app.tickos.dev/app/api-keys)

## Features

- **Mail-style inbox** — Familiar three-panel layout for managing tickets
- **Split inbox views** — Configurable filtered views (All, Inbox, Waiting, custom)
- **Bulk actions** — Select multiple tickets for batch operations
- **Compose email** — Create new tickets directly from the client
- **Snooze** — Snooze tickets with quick picks or custom dates
- **Reply and notes** — Reply to customers or leave internal notes
- **Status and priority** — Inline dropdowns for quick ticket management
- **Dark mode** — Full dark/light theme support
- **API-first** — 100% driven by TickOS REST API, zero database
- **One-click deploy** — Deploy to Vercel or Railway in seconds

## Quick Start

### Option 1: Deploy to Vercel (Recommended)

Click the deploy button above. You will need your TickOS API Key.

### Option 2: Local Development

```bash
git clone https://github.com/tickosdev/tickos-client-desk.git
cd tickos-client-desk
npm install
cp .env.example .env.local
```

Edit `.env.local` with your API key:

```env
TICKOS_API_KEY=sk_your_api_key_here
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Option 3: Setup via UI

If you don't set `TICKOS_API_KEY` in your environment, the app will redirect to `/setup` where you can paste your API key through the browser. The key is stored in an HTTP-only cookie.

## Requirements

- **TickOS Account** — Sign up at [tickos.dev](https://tickos.dev)
- **API Key** — Generate from Settings > API Keys in your TickOS dashboard
- **Node.js** — Version 18.0 or higher

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Shadcn UI + Radix UI |
| State | Jotai |
| Icons | Lucide React |
| Fonts | Geist Sans + Geist Mono |

## Project Structure

```
src/
├── app/              # Pages and API routes
│   ├── api/          # Proxy to TickOS API
│   └── setup/        # API key configuration page
├── components/
│   ├── mail/         # Inbox components (ticket list, display, compose, etc.)
│   └── ui/           # Shadcn UI primitives
├── hooks/            # Custom hooks (split inbox, etc.)
└── lib/              # API client, store, utilities
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript checking |

## How It Works

The client communicates with the TickOS API through a local proxy (`/api/[...path]`). The proxy injects the API key server-side so credentials never reach the browser.

```
Browser → /api/tickets → Proxy → api.tickos.dev/api/v1/tickets
```

All ticket operations (CRUD, status changes, replies, bulk actions) go through this proxy.

## API Coverage

The client covers these TickOS API v1 endpoints:

- **Accounts** — List workspaces
- **Inboxes** — List inboxes
- **Tickets** — List, get, create, update status/priority, assign, archive, snooze, delete
- **Messages** — List messages, create replies and internal notes
- **Tags** — List, add/remove from tickets
- **Bulk** — Mark read/unread, archive/unarchive, delete
- **Users** — List agents for assignment
- **Compose** — Create new outbound tickets
- **Stats** — Ticket statistics

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by the TickOS team.
