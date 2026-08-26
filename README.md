# Policy Desk — frontend for the Insurance AI Agent..

React chat UI styled like an insurance certificate: security-paper palette,
guilloché masthead, ledger-style replies. Talks to the backend at
`POST /api/agent` with the `x-customer-id` header.

## Run

```bash
# 1. Backend first (in the agent project)
npm run dev            # API on http://localhost:4000

# 2. This frontend
npm install
npm run dev            # UI on http://localhost:5173
```

No CORS setup needed — Vite proxies `/api` and `/health` to :4000
(see vite.config.js).

## What's in the UI

- Policyholder switcher (CUS001–CUS003, matching the seed data)
- Suggested questions per customer
- Live "Desk open/closed" health indicator
- Independent-question hint (the API is stateless per message)
- Error states for offline API / validation failures
- Keyboard: Enter to send, Shift+Enter for a new line
