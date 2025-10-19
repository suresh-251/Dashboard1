#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Export the port Render provides
export PORT=${PORT:-5000}

# Optionally activate virtualenv if you have one
# source /path/to/venv/bin/activate

# Navigate to backend folder
cd backend

# Install dependencies (optional if already installed in build step)
pip install -r requirements.txt

# Run the Flask app
python app.py
