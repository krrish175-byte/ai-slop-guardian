FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/github-app/package.json ./apps/github-app/

RUN npm ci

COPY apps/github-app ./apps/github-app/

WORKDIR /app/apps/github-app
RUN npm run build


FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/github-app/package.json ./apps/github-app/

RUN npm ci --omit=dev

COPY --chown=node:node --from=builder /app/apps/github-app/dist ./apps/github-app/dist

USER node

WORKDIR /app/apps/github-app

EXPOSE 3000

CMD ["node", "dist/server.js"]
