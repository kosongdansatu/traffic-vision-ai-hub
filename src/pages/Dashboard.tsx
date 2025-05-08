import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UploadCloud, AlertCircle, PlayCircle, BarChart4, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { videoService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [totalVehicles, setTotalVehicles] = useState(0);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['videos'],
    queryFn: videoService.getVideos,
  });

  // Fetch total vehicles from completed videos
  useEffect(() => {
    if (!Array.isArray(videos)) return;
    
    const fetchTotalVehicles = async () => {
      let total = 0;
      const completedVideos = videos.filter(video => video.status === 'completed');
      
      for (const video of completedVideos) {
        try {
          const results = await videoService.getVideoResults(video.id);
          if (results && results.total_counts) {
            // Sum all vehicle types
            total += Object.values(results.total_counts).reduce((sum: number, count: number) => sum + count, 0);
          }
        } catch (err) {
          console.error(`Error fetching results for video ${video.id}:`, err);
        }
      }
      
      setTotalVehicles(total);
    };
    
    fetchTotalVehicles();
  }, [videos]);

  // For display in the dashboard, we'll show the 3 most recent videos
  const recentVideos = React.useMemo(() => {
    if (!Array.isArray(videos)) return [];
    return [...videos].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }).slice(0, 3);
  }, [videos]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Traffic Vision AI Dashboard
            {user ? `, ${user.email}` : ''}
          </p>
        </div>

        {videos.length === 0 && !isLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Get Started</AlertTitle>
            <AlertDescription>
              Upload a traffic video to start detecting and counting vehicles.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading your data...</span>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load dashboard data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{videos.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {videos.length > 0 ? `${Math.min(videos.length, 3)} videos shown below` : 'No videos uploaded yet'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Processed Videos
                  </CardTitle>
                  <BarChart4 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {videos.filter(v => v.status === 'completed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {videos.filter(v => v.status === 'processing').length > 0 && 
                      `${videos.filter(v => v.status === 'processing').length} videos currently processing`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Estimated Vehicles
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVehicles}</div>
                  <p className="text-xs text-muted-foreground">
                    Detected across all videos
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Videos</h2>
              <Button variant="outline" asChild>
                <Link to="/upload">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload New
                </Link>
              </Button>
            </div>

            {recentVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-input p-8 text-center">
                <h3 className="mt-2 text-lg font-semibold">No videos uploaded yet</h3>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">
                  Upload a traffic video to start analyzing and detecting vehicles
                </p>
                <Button asChild>
                  <Link to="/upload">Upload Video</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="aspect-video relative bg-muted">
                      {/* Menampilkan thumbnail atau preview video */}
                      {video.status === "completed" && video.result_path ? (
                        <Link to={`/videos/${video.id}`} className="block h-full w-full">
                          {video.json_result_path && video.json_result_path.includes("_results.json") ? (
                            <img 
                              src={`${apiUrl}/${video.json_result_path.replace("_results.json", "_thumbnail.jpg")}`}
                              alt={video.name}
                              className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                console.error("Thumbnail loading error in dashboard");
                                // Fallback to video if thumbnail error
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  // Try to find or create video element
                                  let videoElement = parent.querySelector('video') as HTMLVideoElement;
                                  if (videoElement) {
                                    videoElement.style.display = 'block';
                                    
                                    // Make sure it has the right source
                                    if (!videoElement.src || videoElement.src === '') {
                                      videoElement.src = `${apiUrl}/${video.result_path}`;
                                    }
                                    
                                    // Try to load the video
                                    videoElement.load();
                                    
                                    // Handle video error
                                    videoElement.onerror = () => {
                                      console.error("Video error after thumbnail error");
                                      videoElement.style.display = 'none';
                                      // Create a fallback element
                                      const fallback = document.createElement('div');
                                      fallback.className = 'h-full w-full flex items-center justify-center bg-gray-800 text-white';
                                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>';
                                      parent.appendChild(fallback);
                                    };
                                  } else {
                                    // Create a video element if it doesn't exist
                                    videoElement = document.createElement('video');
                                    videoElement.className = 'h-full w-full object-cover hover:opacity-90 transition-opacity';
                                    videoElement.src = `${apiUrl}/${video.result_path}`;
                                    videoElement.muted = true;
                                    videoElement.style.display = 'block';
                                    
                                    // Add mouse event handlers
                                    videoElement.onmouseover = () => {
                                      videoElement.play().catch(err => console.error("Autoplay failed:", err));
                                    };
                                    videoElement.onmouseout = () => {
                                      videoElement.pause();
                                      videoElement.currentTime = 0;
                                    };
                                    
                                    // Handle video error
                                    videoElement.onerror = () => {
                                      console.error("Video load error in newly created element");
                                      videoElement.style.display = 'none';
                                      // Create a fallback element with PlayCircle icon
                                      const fallback = document.createElement('div');
                                      fallback.className = 'h-full w-full flex items-center justify-center bg-gray-800 text-white';
                                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>';
                                      parent.appendChild(fallback);
                                    };
                                    
                                    parent.appendChild(videoElement);
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-800 text-white">
                              <PlayCircle className="h-12 w-12 opacity-50" />
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-800 text-white">
                          <PlayCircle className="h-12 w-12 opacity-50" />
                        </div>
                      )}
                      {video.status === "processing" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="flex flex-col items-center space-y-2 text-white">
                            <p>Processing...</p>
                            <Progress value={50} className="w-24" />
                          </div>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{video.name}</CardTitle>
                        <Badge
                          variant={
                            video.status === "completed"
                              ? "default"
                              : video.status === "processing"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {video.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(video.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/videos/${video.id}`}>View Details</Link>
                        </Button>
                        
                        {/* Model dan Processing Time */}
                        {video.status === "completed" && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">{video.model_size || "nano"}</span>
                            {video.processing_time && (
                              <span className="ml-2">{`(${video.processing_time.toFixed(1)}s)`}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link to="/history">View All Videos</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
