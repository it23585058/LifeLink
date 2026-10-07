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

### Member 3 — Hospitals, Blood Inventory & Transfer Coordination

#### Endpoints
- `GET /api/hospitals` (query params: `type`, `city`, `bloodGroup`, `q`, `lat`, `lng`, `sort`)
- `GET /api/hospitals/summary`
- `GET /api/hospitals/:id`
- `GET /api/blood-inventory` (query params: `hospital`)
- `POST /api/blood-inventory` (role protected)
- `PUT /api/blood-inventory/:id` (role protected)
- `DELETE /api/blood-inventory/:id` (role protected)
- `POST /api/reservations`
- `GET /api/reservations` (query params: `reservedBy`, `hospital`, `status`)
- `PUT /api/reservations/:id`
- `DELETE /api/reservations/:id`
- `POST /api/transfers` (role protected)
- `GET /api/transfers` (query params: `hospital`, `status`)
- `GET /api/transfers/:id`
- `PUT /api/transfers/:id/status`
- `PUT /api/transfers/:id`
- `DELETE /api/transfers/:id` (role protected)

#### Headers (Demo Authentication Stand-in)
Protected routes expect demonstration role headers:
- `x-demo-role`: `donor` | `patient` | `volunteer` | `hospital_staff`
- `x-demo-user`: String user ID (defaults to `demo-user`)

#### Seed Data
Run the idempotent seed script to populate Colombo-area hospitals, inventories, and initial transfer state:
```bash
npm run seed:hospitals -- --dry-run   # Preview operations
npm run seed:hospitals               # Apply changes
```

Never commit `.env` or paste its contents into logs, documentation, or issue reports.