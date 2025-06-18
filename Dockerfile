# --- Stage 1: Frontend Build ---
FROM node:alpine AS frontend

COPY frontend/ /app/frontend/
WORKDIR /app/frontend/

RUN npm install
RUN npm run build


# --- Stage 2: Backend Build ---
FROM golang:alpine AS backend

COPY backend/ /app/backend/
WORKDIR /app/backend/

RUN go mod download
RUN go build


# --- Final Stage: Run App ---
FROM alpine:latest

COPY --from=backend /app/backend/daytick /var/www/daytick
COPY --from=frontend /app/frontend/dist/ /var/www/public/

WORKDIR /var/www/
ENTRYPOINT ["/var/www/daytick"]
EXPOSE 3000
