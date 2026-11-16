FROM node:24 AS builder
WORKDIR /repo
# Shared package (types, game rules, API client) used by the frontend via file:../packages/shared
COPY /packages/shared ./packages/shared
RUN cd packages/shared && npm ci
COPY /frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY /frontend ./frontend
ENV REACT_APP_BASE_URL=https://dutch-card-oxthkdwy2a-oa.a.run.app
# prebuild also compiles packages/shared
RUN cd frontend && npm run build

#Stage 2
FROM node:24
WORKDIR /usr/src/app
COPY --from=builder /repo/frontend/build build
# Prebuilt shared package; backend depends on it via file:../packages/shared
COPY --from=builder /repo/packages/shared/package.json /usr/src/packages/shared/package.json
COPY --from=builder /repo/packages/shared/dist /usr/src/packages/shared/dist
COPY /backend/package*.json ./
RUN npm install
COPY /backend .
EXPOSE 3030
# --ignore-scripts skips prestart (shared is already built above)
CMD [ "npm", "start", "--ignore-scripts" ]
