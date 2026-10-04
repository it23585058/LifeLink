# LifeLink backend

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to the existing LifeLink Atlas connection string using the `lifelink_app` application user.
3. Start the API with `npm start`.

The API listens on port `4000` by default. `GET /api/health` reports the MongoDB connection state.

## Endpoints

- `GET /api/health`
- `GET|POST /api/donors`
- `GET|POST /api/blood-requests`
- `GET|POST /api/blood-requests/:requestId/responses`

Never commit `.env` or paste its contents into logs, documentation, or issue reports.