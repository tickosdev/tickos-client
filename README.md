# TickOS Client Desk

> **The Ticket Operating System for Developers**

An open-source, beautiful mail client for managing your TickOS support tickets. Built with Next.js and powered entirely by the TickOS API.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tickosdev/tickos-client-desk&env=TICKOS_USER_EMAIL,TICKOS_API_KEY&envDescription=TickOS%20API%20credentials%20required&envLink=https://app.tickos.dev/settings/api-keys)

## ✨ Features

- 📧 **Email-Style Interface**: Familiar mail client design for managing tickets
- 🎨 **Beautiful UI**: Built with Shadcn UI components
- ⚡ **API-Powered**: 100% powered by TickOS REST API
- 🔒 **Secure**: API key authentication only
- 🚀 **One-Click Deploy**: Deploy to Vercel in seconds
- 📱 **Responsive**: Optimized for desktop use
- 🌙 **Dark Mode**: Full dark mode support

## 🚀 Quick Start

### Option 1: Deploy to Vercel (Recommended)

Click the button above to deploy your own instance to Vercel. You'll need:

1. **Email**: Your TickOS account email
2. **API Key**: Get it from [app.tickos.dev/settings/api-keys](https://app.tickos.dev/settings/api-keys)

### Option 2: Local Development

1. **Clone the repository**:
```bash
git clone https://github.com/tickosdev/tickos-client-desk.git
cd tickos-client-desk
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
TICKOS_USER_EMAIL=your@email.com
TICKOS_API_KEY=sk_your_api_key_here
```

4. **Run the development server**:
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🎯 Requirements

- **TickOS Account**: Sign up at [tickos.dev](https://tickos.dev)
- **API Key**: Generate from your TickOS dashboard
- **Node.js**: Version 18.0 or higher

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Jotai](https://jotai.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🏗️ Project Structure

```
tickos-client-desk/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   └── ui/          # Shadcn UI components
│   ├── lib/             # Utility functions
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
└── ...config files
```

## 🎨 Design System

- **Primary Color**: `#16a349` (TickOS Green)
- **Theme**: Light & Dark mode support
- **Icons**: React Icons (Lucide)
- **No Emojis**: Professional, clean design

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## 🌐 Architecture

This project follows a multi-domain architecture:

- `tickos.dev` - Marketing landing page
- `app.tickos.dev` - Dashboard application
- `api.tickos.dev` - REST API

All managed from a single Next.js codebase with Vercel routing.

## 🔑 API Integration

The client includes a built-in TickOS API client:

```typescript
import { createTickOSClient } from '@/lib/tickos-client'

const client = createTickOSClient('your_api_key')

// Get tickets
const tickets = await client.getTickets()

// Create ticket
const ticket = await client.createTicket({
  subject: 'Help needed',
  customer_email: 'user@example.com',
  message: 'I need help with...',
  inbox_id: 'inb_xxx'
})
```

## 📖 Documentation

Visit [docs.tickos.dev](https://docs.tickos.dev) for full documentation.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Website](https://tickos.dev)
- [Documentation](https://docs.tickos.dev)
- [API Reference](https://api.tickos.dev/docs)
- [GitHub](https://github.com/tickosdev)

---

Built with ❤️ by the TickOS team
