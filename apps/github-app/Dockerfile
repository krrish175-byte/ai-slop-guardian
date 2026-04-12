FROM node:20-slim

WORKDIR /app

COPY package.json .
COPY turbo.json .
COPY apps/github-app/package.json ./apps/github-app/

RUN npm install -g turbo && npm install

COPY apps/github-app ./apps/github-app/

WORKDIR /app/apps/github-app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
