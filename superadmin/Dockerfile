# Console super admin IMMO PILOT — image de production (Next.js « standalone »)
# Construction : docker build -t immopilot-superadmin --build-arg API_URL=https://mon-api.exemple.com ./superadmin
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
ENV API_URL=$API_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Étape 3 : exécution (sans node_modules complet, utilisateur non administrateur) ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3001
CMD ["node", "server.js"]
