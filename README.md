# TaskCore API

TaskCore is a small, full-stack task management project built around a practical REST API and a responsive developer console. It is designed for quickly creating tasks, monitoring progress, and inspecting the requests that power the interface.

## What It Includes

- Task creation and editing with title, description, status, priority, due date, and tags
- Status and priority filters, text search, and configurable sorting
- Task completion toggles and one-click deletion
- Live API request history with response status and timing
- Health monitoring and task statistics
- OpenAPI information available from the API
- Responsive layout for desktop and mobile screens

## Tech Stack

- React and TypeScript for the interface
- Express for the REST API
- Vite for development and frontend bundling
- Tailwind CSS for styling
- Lucide React for interface icons

## API Overview

The API runs from the same server as the frontend. The default base path is `/api`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check server health |
| `GET` | `/api/stats` | Return task counts and metrics |
| `GET` | `/api/tasks` | List, search, filter, and sort tasks |
| `GET` | `/api/tasks/:id` | Return one task |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Replace a task |
| `PATCH` | `/api/tasks/:id` | Update selected task fields |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `POST` | `/api/tasks/seed` | Restore the sample dataset |
| `GET` | `/api/openapi.json` | Return the API specification |

Tasks support these values:

- Status: `todo`, `in_progress`, `completed`
- Priority: `low`, `medium`, `high`

### Example Request

```bash
curl -X POST http://localhost:3000/api/tasks \
   -H "Content-Type: application/json" \
   -d '{
      "title": "Review deployment checklist",
      "description": "Check the production configuration before release.",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-09-01",
      "tags": ["release", "review"]
   }'
```

## Run Locally

### Prerequisites

- Node.js 18 or newer
- npm

### Start Development

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

Open http://localhost:3000 in your browser.

The development command starts the Express API and Vite frontend together. Task data is kept in memory, so restarting the server restores the initial sample tasks.

## Production Build

Create the frontend bundle and server build with:

```bash
npm run build
```

Start the production server with:

```bash
npm start
```

Run the TypeScript check independently with:

```bash
npm run lint
```

## Project Structure

```text
task-management-api/
|-- src/
|   |-- components/     Reusable interface components
|   |-- api.ts          Frontend API client and request logging
|   |-- App.tsx         Main application view
|   |-- index.css       Global styles
|   `-- types.ts        Shared TypeScript types
|-- server.ts           Express routes and development server
|-- index.html          Frontend entry document
|-- package.json        Scripts and dependencies
`-- vite.config.ts      Vite configuration
```

## Notes

This project uses an in-memory data store for simplicity. A database, authentication, pagination, and persistent deployment storage can be added when the API moves beyond local development.
