# SmartCart backend runs on Python 3.12.
# Bookworm gives us a stable Debian base with available
# security updates for the runtime packages.
FROM python:3.12-slim-bookworm

# Set the working directory inside the container.
WORKDIR /app

# Update the Debian package index and install the latest
# available security updates.
#
# This is important because vulnerabilities can exist in
# operating-system packages included by the base image.
#
# Clean the apt lists afterward so they are not stored
# unnecessarily in the final image.
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

# Copy the dependency file first.
#
# Keeping this separate from application source allows Docker
# to reuse this layer when application code changes.
COPY backend/requirements.txt .

# Upgrade pip before installing application dependencies.
#
# The Python base image may contain an older pip version.
# Keeping pip current avoids shipping a known-vulnerable
# package manager inside the application image.
RUN python -m pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Preserve the repository structure expected by the
# application and Alembic configuration.
COPY backend ./backend

# Copy Alembic configuration.
COPY alembic.ini .

# Document the FastAPI port.
EXPOSE 8000

# Start the FastAPI application.
#
# backend.app.main:app means:
#   backend/app/main.py -> FastAPI object named "app"
#
# 0.0.0.0 allows Kubernetes/Docker networking to reach
# the application from outside the container.
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]