# Use Python base image
FROM python:3.12-slim

# Set workdir
WORKDIR /app

# Copy backend
COPY backend/ ./backend
WORKDIR /app/backend

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend and build
COPY frontend/ ../frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Move build to backend/static (Flask serves it)
RUN mv build ../backend/build

# Set workdir back to backend
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Run app
CMD ["gunicorn", "app:app", "-b", "0.0.0.0:5000"]
