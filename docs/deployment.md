# Deployment Guide

## Target

This project is intended to run as a long-lived Node.js web service with PostgreSQL and persistent file storage.

Recommended production target for a durable production service:

- Render Web Service
- Render PostgreSQL
- Render persistent disk mounted at `/var/data`

Vercel is not the preferred target for the current MVP because generated recommendation PDFs are stored on the server filesystem.

## Free Render Deployment

The committed `render.yaml` is configured for Render Free:

- Web service plan: `free`
- PostgreSQL plan: `free`
- Upload path: `/tmp/uploads`

Free deployment is suitable for demos and review only. It is not a durable production setup.

Important Free limitations:

- The web service sleeps after a period of inactivity and needs time to wake up on the next request.
- The web service filesystem is ephemeral. Generated PDFs stored under `/tmp/uploads` can be lost after restart, redeploy, or spin-down.
- Free Render PostgreSQL databases expire after the free retention period. Back up or upgrade before expiration.
- Persistent disks are not available for Free web services.

For real operation, change the web service and database plans to paid plans and restore a persistent disk mount.

## GitHub

Repository:

```text
https://github.com/pthpro0-hash/MedicalAsso
```

## Render Blueprint

The repository includes `render.yaml`.

It defines:

- Web service: `medical-asso`
- PostgreSQL database: `medical-asso-db`
- Runtime upload path: `/tmp/uploads` on Free, or `/var/data/uploads` with a paid persistent disk
- Build command: `npm ci && npm run build`
- Start command: `npm run db:deploy && npm run db:bootstrap && npx next start -p $PORT`

## Required Secret

Set this environment variable in Render before first deploy:

```text
ADMIN_PASSWORD=<initial SUPER_ADMIN password>
```

Optional overrides:

```text
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=최고관리자
```

`SESSION_SECRET` is generated automatically by the Blueprint.
`DATABASE_URL` is injected automatically from the Render PostgreSQL database.

## First Deploy Steps

1. Connect Render to GitHub.
2. Create a new Blueprint from `pthpro0-hash/MedicalAsso`.
3. Confirm the resources in `render.yaml`.
4. Enter `ADMIN_PASSWORD`.
5. Deploy.

On startup, the service applies Prisma migrations and creates the first `SUPER_ADMIN` user only if no users exist.

## Post-Deploy Checks

Open the production URL and verify:

```text
/login
/admin/dashboard
```

Login with:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
```

## Notes

- Do not run `npm run db:seed` in production. It deletes and recreates sample data.
- `npm run db:bootstrap` is safe for production startup because it skips when users already exist.
- Generated PDFs are stored under `/var/data/uploads`, backed by the Render persistent disk.
