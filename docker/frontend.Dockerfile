# ------------------------------------------------------------
# Stage 1: Build the React application
# ------------------------------------------------------------

# Node is required to install dependencies and build the
# React + TypeScript + Vite application.
FROM node:24-alpine AS builder

# Keep the frontend application inside /app/frontend.
WORKDIR /app/frontend

# Copy dependency files first.
# Docker can reuse the npm install layer when application
# source code changes but package files remain unchanged.
COPY frontend/package.json frontend/package-lock.json ./

# Install exactly the versions recorded in package-lock.json.
# npm ci is designed for reproducible builds.
RUN npm ci

# Copy the frontend source code.
COPY frontend/ ./

# Create the production Vite build.
# This generates the frontend/dist directory.
RUN npm run build


# ------------------------------------------------------------
# Stage 2: Serve the production build with Nginx
# ------------------------------------------------------------

# The final image only needs Nginx to serve the static files.
# Node and the frontend source code are not needed at runtime.
FROM nginx:alpine

# Remove Nginx's default website.
RUN rm -rf /usr/share/nginx/html/*

# Copy the production build from the builder stage.
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Use our configuration so React Router routes work correctly.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Document the port Nginx listens on.
EXPOSE 80

# Start Nginx in the foreground.
CMD ["nginx", "-g", "daemon off;"]