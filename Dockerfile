# TourFlow SPA — production image.
#
#   docker build -t tourflow-front .
#   docker run -p 3000:80 -e API_UPSTREAM=http://host.docker.internal:8080 tourflow-front
#
# Stage 1 builds the real-backend bundle with webpack (no MSW demo code).
# Stage 2 serves it with nginx, which also proxies /api to the TourFlow gateway,
# so the browser talks to a single origin (no CORS, refresh cookie just works).
# Both base images are multi-arch: the same file builds on Apple Silicon and Intel.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: skip the husky git-hook setup (there is no .git in the image).
RUN npm ci --no-audit --no-fund --ignore-scripts
COPY . .
ENV NODE_ENV=production
RUN npm run typecheck && npm run build

FROM nginx:1.27-alpine
# The official nginx image runs envsubst on /etc/nginx/templates/*.template at
# start-up, so the gateway address is set at run time, not baked into the image.
ENV API_UPSTREAM=http://gateway:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
