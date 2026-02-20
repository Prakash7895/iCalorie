FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Since Railway is building from the root of your repository, we need to copy from apps/api
COPY apps/api/requirements.txt .

# Install dependencies (plus some basic build tools if needed for cryptography/psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the API application code
COPY apps/api/ .

# Expose the port that the app runs on
EXPOSE 8000

# Command to run the application using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
