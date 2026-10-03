# SmartCart backend runs on Python 3.12.
# The slim image provides Python with a smaller OS footprint.
FROM python:3.12-slim

# All backend-related paths will be relative to /app.
WORKDIR /app

# Copy the dependency file first.
# This allows Docker to reuse the dependency layer when
# application source code changes but requirements do not.
COPY backend/requirements.txt .

# Install the Python dependencies required by SmartCart.
# --no-cache-dir prevents pip's download cache from being
# stored inside the Docker image.
RUN pip install --no-cache-dir -r requirements.txt

# Preserve the repository structure inside the container.
#
# Repository:
#   backend/app
#   backend/alembic
#
# Container:
#   /app/backend/app
#   /app/backend/alembic
#
# This is important because alembic.ini and env.py already
# expect the backend package to exist under /app/backend.
COPY backend/app ./backend/app
COPY backend/alembic ./backend/alembic

# Copy the existing Alembic configuration file.
# It contains:
#   script_location = %(here)s/backend/alembic
COPY alembic.ini .

# Document the port used by FastAPI.
# EXPOSE does not publish the port by itself.
EXPOSE 8000

# Start the FastAPI application.
#
# backend.app.main:app means:
#   backend/app/main.py -> FastAPI object named "app"
#
# 0.0.0.0 allows Kubernetes/Docker networking to reach
# the FastAPI server from outside the container.
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]