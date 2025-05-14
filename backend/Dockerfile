FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and video codecs
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    ffmpeg \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libavutil-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create directories for uploads and results
RUN mkdir -p uploads results

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
