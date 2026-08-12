# Stage 1: Build React Vite Application
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments to embed AWS credentials into container bundle
ARG VITE_AWS_BUCKET_NAME
ARG VITE_AWS_REGION
ARG VITE_AWS_ACCESS_KEY_ID
ARG VITE_AWS_SECRET_ACCESS_KEY
ARG VITE_AWS_ENDPOINT

ENV VITE_AWS_BUCKET_NAME=$VITE_AWS_BUCKET_NAME
ENV VITE_AWS_REGION=$VITE_AWS_REGION
ENV VITE_AWS_ACCESS_KEY_ID=$VITE_AWS_ACCESS_KEY_ID
ENV VITE_AWS_SECRET_ACCESS_KEY=$VITE_AWS_SECRET_ACCESS_KEY
ENV VITE_AWS_ENDPOINT=$VITE_AWS_ENDPOINT

# Copy package manifests & install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:stable-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP Port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
