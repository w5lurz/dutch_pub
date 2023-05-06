FROM node:16.14.2 AS builder
WORKDIR /app
COPY /frontend/package*.json ./
RUN npm install 
COPY /frontend .
ENV REACT_APP_BASE_URL=https://dutch-card-oxthkdwy2a-oa.a.run.app
RUN npm run build

#Stage 2
FROM node:16.14.2
WORKDIR /usr/src/app
COPY --from=builder /app/build build
COPY /backend/package*.json ./
RUN npm install
COPY /backend .
EXPOSE 3030
CMD [ "npm", "start" ]