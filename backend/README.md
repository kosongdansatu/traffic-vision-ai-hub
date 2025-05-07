
# Traffic Vision AI Backend

This is the backend component for the Traffic Vision AI application, which uses YOLOv8 for vehicle detection and counting in traffic videos.

## Features

- FastAPI backend for video processing
- YOLOv8 integration for vehicle detection
- User authentication with JWT
- PostgreSQL database for storing video metadata
- RESTful APIs for video management

## Setup & Installation

### Prerequisites

- Docker and Docker Compose
- Python 3.10 or later (if running without Docker)

### Running with Docker Compose

The easiest way to run the entire application (frontend, backend, and database) is with Docker Compose:

```bash
docker-compose up -d
```

This will start all services and make the application available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development Setup

1. Set up a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/traffic_vision"
export SECRET_KEY="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/token` - Login and get access token

### Video Management
- `POST /api/videos/upload` - Upload a new video for processing
- `GET /api/videos` - Get all videos for the current user
- `GET /api/videos/{video_id}` - Get details for a specific video
- `PUT /api/videos/{video_id}` - Update video metadata
- `DELETE /api/videos/{video_id}` - Delete a video
- `GET /api/videos/{video_id}/download` - Download processed video
- `GET /api/videos/{video_id}/results` - Get JSON results of video analysis

## Vehicle Detection

The system uses YOLOv8 to detect and count vehicles in the following categories:
- Cars
- Motorcycles
- Buses
- Trucks

Each processed video will have:
1. An annotated video with bounding boxes around detected vehicles
2. A JSON file with detailed detection results, including:
   - Total counts for each vehicle type
   - Per-frame detection data
   - Processing statistics

## Development

### Adding New Features

To add new features or modify existing ones:

1. Create a new branch for your feature
2. Implement your changes
3. Run tests
4. Submit a pull request

### Project Structure

- `app/main.py` - Main FastAPI application
- `app/ai.py` - YOLOv8 integration for vehicle detection
- `app/models.py` - SQLAlchemy database models
- `app/schemas.py` - Pydantic models for data validation
- `app/crud.py` - Database operations
- `app/auth.py` - Authentication utilities
- `app/database.py` - Database connection management

## Deployment

### Cloud Deployment (AWS)

1. Set up an EC2 instance with Docker installed
2. Clone the repository to the instance
3. Configure environment variables for production
4. Run with Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Using Railway

1. Connect your GitHub repository to Railway
2. Configure environment variables
3. Deploy the application with the provided Dockerfile

## Troubleshooting

### Common Issues

1. **Video processing is slow**: 
   - Increase the frame skipping in `process_video` function
   - Use a smaller YOLOv8 model variant

2. **Out of memory errors**:
   - Reduce batch size in YOLOv8 model configuration
   - Process videos at a lower resolution

3. **Database connection issues**:
   - Verify PostgreSQL is running
   - Check database connection string
