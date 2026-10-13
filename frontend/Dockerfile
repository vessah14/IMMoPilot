# Site IMMO PILOT (site public, espace bailleur, page locataire) — image de production (Next.js « standalone »)
# Construction : docker build -t immopilot-frontend --build-arg API_URL=https://mon-api.exemple.com ./frontend
# API_URL est lue à la construction : elle est inscrite dans le proxy /api (next.config.ts).

# ---- Étape 1 : dépendances ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Étape 2 : construction ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG API_URL=http://api:8080
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_MODE_DEMO=false
ARG NEXT_PUBLIC_EMAIL_CONTACT=
ENV API_URL=$API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_MODE_DEMO=$NEXT_PUBLIC_MODE_DEMO \
    NEXT_PUBLIC_EMAIL_CONTACT=$NEXT_PUBLIC_EMAIL_CONTACT \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Étape 3 : exécution (sans node_modules complet, utilisateur non administrateur) ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
