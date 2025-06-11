#!/bin/bash

# Script to test Docker build for Traffic Vision AI Backend

echo "🐳 Testing Docker build for Traffic Vision AI Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t traffic-vision-backend:test .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    
    # Show image size
    echo "📊 Image size:"
    docker images traffic-vision-backend:test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    # Test run the container
    echo "🚀 Testing container startup..."
    docker run --rm -d --name traffic-vision-test -p 8001:8000 traffic-vision-backend:test
    
    # Wait a bit for startup
    sleep 10
    
    # Test health check
    echo "🏥 Testing health check..."
    if curl -f http://localhost:8001/docs > /dev/null 2>&1; then
        echo "✅ Container is healthy and responding!"
    else
        echo "⚠️  Container might not be fully ready yet"
    fi
    
    # Show container logs
    echo "📋 Container logs:"
    docker logs traffic-vision-test
    
    # Stop test container
    echo "🛑 Stopping test container..."
    docker stop traffic-vision-test
    
    echo "🎉 Docker build test completed successfully!"
    echo ""
    echo "To run the container:"
    echo "docker run -d --name traffic-vision-backend -p 8000:8000 -v \$(pwd)/uploads:/app/uploads -v \$(pwd)/results:/app/results traffic-vision-backend:test"
    
else
    echo "❌ Docker build failed!"
    exit 1
fi
