# job-tracker-app-web-react

React SPA frontend for the Job Tracker application. Authenticates via Auth0 and communicates with the API gateway.

## Technology
- React 18
- TypeScript
- Auth0 React SDK
- React Router
- Axios

## Getting started

```bash
npm install
npm run dev
```

## Environment variables

Create a `.env.local` file:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
```

## Project structure

```
src/
  components/       # Reusable UI components
  pages/            # Route-level page components
    auth/           # Login, callback
    jobs/           # Job requisition list and detail
    contacts/       # Contact management
    journal/        # Activity journal
    resumes/        # Resume upload and version history
    settings/       # Notification preferences
  hooks/            # Custom React hooks
  services/         # API client functions
  types/            # TypeScript interfaces and types
  utils/            # Shared utility functions
public/
```
