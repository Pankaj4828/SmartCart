# SmartCart backend runs on Python 3.12.
# The slim image gives us Python without unnecessary OS packages.
FROM python:3.12-slim

# Set the working directory inside the container.
# All application-related commands will run from /app.
WORKDIR /app

# Copy the dependency file first.
# Keeping this separate from application code allows Docker
# to reuse the dependency-installation layer when our code changes.
COPY backend/requirements.txt .

# Install the Python dependencies required by SmartCart.
# --no-cache-dir prevents pip's package download cache
# from being stored in the image.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the SmartCart backend application code.
COPY backend/app ./app

# Copy Alembic files because SmartCart uses Alembic
# for database migrations.
COPY backend/alembic ./alembic
COPY alembic.ini .

# Document the port used by the FastAPI application.
# This does not publish the port to the host by itself.
EXPOSE 8000

# Start the SmartCart FastAPI application.
#
# app.main:app means:
#   app/main.py -> FastAPI object named "app"
#
# 0.0.0.0 allows the application to accept connections
# coming from outside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]