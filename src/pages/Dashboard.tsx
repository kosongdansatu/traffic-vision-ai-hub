import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UploadCloud, AlertCircle, PlayCircle, BarChart4, Clock, Car, Truck, Bike, Bus, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { videoService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [vehicleTypes, setVehicleTypes] = useState({ car: 0, motorcycle: 0, bus: 0, truck: 0 });
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
      const vehicleCounts = { car: 0, motorcycle: 0, bus: 0, truck: 0 };
      const completedVideos = videos.filter(video => video.status === 'completed');
      
      for (const video of completedVideos) {
        try {
          const results = await videoService.getVideoResults(video.id);
          if (results && results.total_counts) {
            // Sum all vehicle types
            const countValues = Object.values(results.total_counts) as number[];
            total += countValues.reduce((sum: number, count: number) => sum + Number(count), 0);
            
            // Add to vehicle type counts
            if (results.total_counts.car) vehicleCounts.car += Number(results.total_counts.car) || 0;
            if (results.total_counts.motorcycle) vehicleCounts.motorcycle += Number(results.total_counts.motorcycle) || 0;
            if (results.total_counts.bus) vehicleCounts.bus += Number(results.total_counts.bus) || 0;
            if (results.total_counts.truck) vehicleCounts.truck += Number(results.total_counts.truck) || 0;
          }
        } catch (err) {
          console.error(`Error fetching results for video ${video.id}:`, err);
        }
      }
      
      setTotalVehicles(total);
      setVehicleTypes(vehicleCounts);
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    Total Vehicles
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Processing Status
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Progress value={(videos.filter(v => v.status === 'completed').length / Math.max(1, videos.length)) * 100} />
                    <span className="text-sm text-muted-foreground">
                      {Math.round((videos.filter(v => v.status === 'completed').length / Math.max(1, videos.length)) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Completion rate of video processing
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Types Detection Summary */}
            {totalVehicles > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Vehicle Types Detected</CardTitle>
                  <CardDescription>Summary of detected vehicle types across all videos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-red-100 rounded-full">
                        <Car className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Cars</p>
                        <p className="text-2xl font-bold">{vehicleTypes.car}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Bike className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Motorcycles</p>
                        <p className="text-2xl font-bold">{vehicleTypes.motorcycle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Bus className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Buses</p>
                        <p className="text-2xl font-bold">{vehicleTypes.bus}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Truck className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Trucks</p>
                        <p className="text-2xl font-bold">{vehicleTypes.truck}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                                      fallback.className = 'flex items-center justify-center h-full bg-slate-200';
                                      fallback.textContent = 'Preview not available';
                                      parent.appendChild(fallback);
                                    };
                                  } else {
                                    // No video element, create one
                                    videoElement = document.createElement('video');
                                    videoElement.className = 'h-full w-full object-cover';
                                    videoElement.src = `${apiUrl}/${video.result_path}`;
                                    videoElement.controls = true;
                                    parent.appendChild(videoElement);
                                    
                                    // Handle error
                                    videoElement.onerror = () => {
                                      console.error("Video element creation error");
                                      videoElement.style.display = 'none';
                                      // Create a fallback element
                                      const fallback = document.createElement('div');
                                      fallback.className = 'flex items-center justify-center h-full bg-slate-200';
                                      fallback.textContent = 'Preview not available';
                                      parent.appendChild(fallback);
                                    };
                                    
                                    // Try to load the video
                                    videoElement.load();
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-slate-200">
                              Processing completed - View details
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-slate-200 p-4">
                          {video.status === "processing" ? (
                            <>
                              <span className="text-sm font-medium mb-2">Processing...</span>
                              <Progress className="w-2/3" value={75} />
                            </>
                          ) : (
                            <span className="text-sm font-medium">{video.status || "Pending"}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={
                          video.status === "completed" ? "default" :
                          video.status === "processing" ? "outline" :
                          "secondary"
                        }>
                          {video.status === "completed" ? "Completed" :
                            video.status === "processing" ? "Processing" :
                            "Pending"}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg truncate">{video.name}</CardTitle>
                      <CardDescription className="truncate">
                        Uploaded {new Date(video.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : '00:00'}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/videos/${video.id}`}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
