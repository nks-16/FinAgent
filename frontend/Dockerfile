# Build and run Vite dev server (for dev/demo). For prod, switch to static build + nginx.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm install --no-audit --no-fund || npm install
COPY . .
EXPOSE 3000
CMD ["npm","run","dev","--","--host","0.0.0.0"]
