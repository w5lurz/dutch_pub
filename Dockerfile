# Backend image (REST API + Socket.io). The mobile app is built separately with EAS.

# Stage 1: build the shared package (types, game rules) the backend depends on.
FROM node:24 AS shared
WORKDIR /repo/packages/shared
COPY packages/shared ./
RUN npm ci && npm run build

# Stage 2: runtime
FROM node:24
WORKDIR /usr/src/app
# backend/package.json depends on "file:../packages/shared": only the built package is needed.
COPY --from=shared /repo/packages/shared/package.json /usr/src/packages/shared/package.json
COPY --from=shared /repo/packages/shared/dist /usr/src/packages/shared/dist
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend .
ENV NODE_ENV=production
EXPOSE 3030
CMD [ "node", "src/app.js" ]
