# Bound-2 Backend API

This is the backend API server for the Bound-2 application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a .env file with the following variables:
```
PORT=3001
NODE_ENV=development
```

3. Start the development server:
```bash
npm run dev
```

## Available Endpoints

### Events

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get a single event by ID
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Base URL

When running locally, the API is available at: `http://localhost:3001`

## Scripts

- `npm run dev` - Start the development server with hot-reload
- `npm start` - Start the production server
