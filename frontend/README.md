# SupportDesk — MERN Ticketing Frontend

Responsive React/Vite frontend for the provided MERN ticketing backend. It has three role-aware workspaces: Customer, Support Agent, and Admin. It uses the backend as the source of truth; it does not fake ticket data or send email directly from the browser.

## Requirements
- Node.js 18+ and npm
- The backend running at `http://localhost:5000` by default

## Run locally
```bash
# from this directory
copy .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173`. Set `VITE_API_BASE_URL` to the backend API root (include `/api`).

## Role-based capabilities
- **Customer:** register and verify email OTP, password or OTP login, recover password, create tickets, search/filter own tickets, view chronological conversation/activity, reply publicly, upload attachments, reopen eligible tickets, manage profile/password, and use notifications.
- **Agent:** customer capabilities plus assigned/support queue, public replies and internal notes, assignment when permitted by backend, priority changes, resolve/reopen/close lifecycle actions, activity and attachments. The backend currently scopes agent ticket listing to assigned tickets and their own requests.
- **Admin:** all available ticket operations, user activation/deactivation, category CRUD, audit logs, and email-event monitoring.

## API integration
The API endpoint map is centralized in `src/api/endpoints.js`. Current endpoints used include `/auth/*`, `/users/me`, `/users`, `/tickets`, `/tickets/:id/messages`, `/tickets/:id/activity`, `/tickets/:id/assign|resolve|reopen|close`, `/categories`, `/dashboard/summary`, `/notifications`, `/attachments`, `/audit-logs`, and `/email/events`. Email events are admin-only. Attachments are uploaded through `/attachments` after ticket creation because the ticket creation endpoint accepts JSON metadata, not multipart form data.

## Authentication
The frontend sends the access token as a Bearer token and enables `withCredentials` so the browser sends the HTTP-only refresh-token cookie. The refresh interceptor requests `/auth/refresh-token` after a protected request returns 401. Public registration does not let users choose their role. Do not put SMTP credentials or JWT secrets in frontend environment variables.

## Important backend boundaries
- The frontend only exposes actions supported by the supplied API. The backend's current ticket schema uses `open`, `in_progress`, `pending`, `resolved`, and `closed`; a separate `reopened` status is not in the current schema, so reopening is represented by the backend's own workflow.
- The supplied ticket list API supports search, status, priority, category, assigned-agent, page, and limit. It does not expose sort/date-range/requester query options, so the frontend does not pretend those filters are server-backed.
- Inbound email polling/webhook processing and outbound mail delivery happen on the backend. The frontend displays messages returned by the conversation API and email event records exposed to admins.
- The assignment mentions phone OTP, SLA timers, satisfaction ratings, charts, and optional tags/saved filters. The supplied API contract does not expose endpoints for all of these; they are not simulated in the UI.

## Build
```bash
npm run build
```

## Ticket assignment and email notifications

- The ticket details page lets administrators assign a ticket to an active account whose role is exactly `agent`.
- Assignment calls `POST /api/tickets/:ticketId/assign` with `{ "assignedAgent": "<agent MongoDB ID>" }`.
- The agent list is loaded using `GET /api/users?role=agent&page=1&limit=100`; the current backend must return the active agent users for this list.
- Customer ticket confirmation and resolution emails must be sent by the backend. The browser does not send SMTP messages and should not contain SMTP credentials.

**Backend integration note:** In the backend service source reviewed for this frontend update, `createTicket()` records ticket activity and returns the ticket, while `resolveTicket()` calls `changeStatus()`; neither function directly enqueues the existing ticket-created or ticket-resolved email templates. The templates being present is not sufficient by itself. To guarantee these emails, wire the existing template/email queue service into the backend ticket-created and ticket-resolved events, then inspect `/api/email/events` as an admin to confirm the outbound delivery status. Do not display a success message claiming an email was sent unless the backend confirms it.
