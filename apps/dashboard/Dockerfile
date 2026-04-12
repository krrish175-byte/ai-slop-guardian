FROM node:20-slim

WORKDIR /app

COPY package.json .
COPY turbo.json .
COPY apps/dashboard/package.json ./apps/dashboard/

RUN npm install

COPY apps/dashboard ./apps/dashboard/

WORKDIR /app/apps/dashboard
RUN npm run build

# We'll use a simple static server or just serve with vite preview for now
RUN npm install -g serve
EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
