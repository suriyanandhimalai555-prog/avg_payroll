FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PORT=5000
ENV WORKERS=1

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
