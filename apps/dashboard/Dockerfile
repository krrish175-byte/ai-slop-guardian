FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/dashboard/package.json ./apps/dashboard/package.json

RUN npm ci

COPY apps/dashboard ./apps/dashboard

WORKDIR /app/apps/dashboard
RUN npm run build


FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder --chown=node:node /app/apps/dashboard/dist ./dist

USER node

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
