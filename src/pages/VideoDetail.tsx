import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { videoService } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Download, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Car, Truck, Bus, Bike } from "lucide-react";

// Helper functions for safe computation
const safeReduce = (values: any[], initialValue = 0) => {
  return values.reduce((sum: number, val: any) => sum + Number(val || 0), initialValue);
};

const objectValuesToNumbers = (obj: Record<string, any> | undefined | null) => {
  if (!obj) return 0;
  return safeReduce(Object.values(obj));
};

const COLORS = {
  car: "#FF6B6B",
  truck: "#4ECDC4",
  bus: "#FFA400",
  motorcycle: "#7D83FF"
};

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const videoId = parseInt(id || '0');
  
  // Fetch video details
  const { data: video, isLoading: isLoadingVideo, error: videoError } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videoService.getVideo(videoId),
    enabled: !!videoId,
  });
  
  // Fetch video results if completed
  const { data: results, isLoading: isLoadingResults } = useQuery({
    queryKey: ['videoResults', videoId],
    queryFn: () => videoService.getVideoResults(videoId),
    enabled: !!videoId && video?.status === 'completed',
  });
  
  const handleDownload = () => {
    if (video && video.status === 'completed') {
      videoService.downloadVideo(videoId);
    } else {
      toast.error("Video processing not completed yet");
    }
  };
  
  const handleDownloadResults = () => {
    if (video && video.status === 'completed') {
      videoService.downloadVideoResults(videoId)
        .then(success => {
          if (success) {
            toast.success("JSON results downloaded successfully");
          } else {
            toast.error("Failed to download JSON results");
          }
        });
    } else {
      toast.error("Video processing not completed yet");
    }
  };
  
  // Prepare data for charts
  const pieData = React.useMemo(() => {
    if (!results || !results.total_counts) return [];
    
    return Object.entries(results.total_counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [results]);
  
  const timeSeriesData = React.useMemo(() => {
    if (!results || !results.frames) return [];
    
    // Extract data every N frames to avoid too many points
    const samplingRate = Math.max(1, Math.floor(results.frames.length / 20));
    
    return results.frames
      .filter((_: any, i: number) => i % samplingRate === 0)
      .map((frame: any, index: number) => ({
        time: `${Math.floor(index * samplingRate / results.fps)}s`,
        ...frame.counts
      }));
  }, [results]);
  
  // API URL for streams and token for authentication
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');
  
  const [isVideoPlayable, setIsVideoPlayable] = useState<boolean>(true);
  
  // Check video playability when video info is loaded
  useEffect(() => {
    if (video?.result_path) {
      videoService.checkVideoPlayable(video.result_path)
        .then(playable => {
          console.log("Video playability check result:", playable);
          setIsVideoPlayable(playable);
        })
        .catch(err => {
          console.error("Error checking video playability:", err);
          setIsVideoPlayable(false);
        });
    }
  }, [video?.result_path]);
  
  if (isLoadingVideo) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading video details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (videoError || !video) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-destructive">Failed to load video details</p>
          <Button onClick={() => navigate('/history')}>
            Back to History
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{video.name}</h1>
            <p className="text-muted-foreground">
              Uploaded on {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {video.status === "completed" && video.result_path ? (
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    {isVideoPlayable ? (
                      <video 
                        className="w-full h-full" 
                        controls 
                        controlsList="nodownload"
                        src={`${apiUrl}/${video.result_path}?t=${Date.now()}&auth_token=${token || ''}`}
                        poster={video.json_result_path ? `${apiUrl}/${video.json_result_path.replace("_results.json", "_thumbnail.jpg")}?auth_token=${token || ''}` : undefined}
                        onError={(e) => {
                          console.error("Video loading error:", e);
                          const target = e.target as HTMLVideoElement;
                          
                          // Try again with a different approach
                          if (!target.querySelector('source')) {
                            // Clear the src attribute and use source element instead
                            target.removeAttribute('src');
                            
                            // Create a source element
                            const source = document.createElement('source');
                            source.src = `${apiUrl}/${video.result_path}?t=${Date.now()}&auth_token=${token || ''}`;
                            source.type = 'video/mp4';
                            target.appendChild(source);
                            
                            // Try loading again
                            target.load();
                            
                            // Set a timeout to check if video loaded after this change
                            setTimeout(() => {
                              if (target.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || 
                                  target.error) {
                                setIsVideoPlayable(false);
                              }
                            }, 3000);
                          } else {
                            setIsVideoPlayable(false);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-800 text-white p-4 text-center">
                        <div>
                          <p className="mb-2">Video playback is not available.</p>
                          <Button 
                            variant="outline" 
                            onClick={handleDownload}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download to view
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-800 text-white p-6">
                    <div className="text-center">
                      <p className="mb-2">
                        {video.status === "processing" 
                          ? "Video is still processing..." 
                          : "Processing has not started yet."}
                      </p>
                      {video.status === "processing" && (
                        <div className="w-48 mx-auto mt-2">
                          <Progress value={75} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-border flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Badge variant={
                    video.status === "completed" ? "default" : 
                    video.status === "processing" ? "secondary" : 
                    "outline"
                  }>
                    {video.status || "Pending"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {video.model_size ? `Model: ${video.model_size}` : ""}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {results?.processing_stats?.processing_time_seconds ? 
                    `Processed in ${results.processing_stats.processing_time_seconds.toFixed(1)}s` : ""}
                </div>
              </div>
            </Card>
            
            {video.status === "completed" && results && (
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Vehicle Detection</CardTitle>
                  <CardDescription>Using improved algorithm with object fingerprinting to prevent multiple counting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-medium mb-2">Detection Parameters</h3>
                      <div className="space-y-1 text-sm">
                        {results.debug_info?.detection_parameters && (
                          <>
                            <p><span className="font-semibold">Confidence threshold:</span> {results.debug_info.detection_parameters.confidence_threshold}</p>
                            <p><span className="font-semibold">IoU threshold:</span> {results.debug_info.detection_parameters.iou_threshold}</p>
                            <p><span className="font-semibold">Tracking method:</span> {results.debug_info.detection_parameters.tracking_method}</p>
                            <p><span className="font-semibold">Min size:</span> {results.debug_info.detection_parameters.min_size_percentage * 100}% of frame</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Processing Statistics</h3>
                      <div className="space-y-1 text-sm">
                        {results.processing_stats && (
                          <>
                            <p><span className="font-semibold">Frames processed:</span> {results.processing_stats.processed_frames}</p>
                            <p><span className="font-semibold">Fps:</span> {results.processing_stats.frames_per_second?.toFixed(1) || "N/A"}</p>
                            <p><span className="font-semibold">Resolution:</span> {results.resolution || "N/A"}</p>
                            <p><span className="font-semibold">Counting method:</span> {results.processing_stats.counting_method || "Line crossing"}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {results.debug_info?.stability && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-medium mb-2">Detection Stability</h3>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-gray-100 p-3 rounded">
                          <div className="text-sm text-muted-foreground">Avg Detections</div>
                          <div className="text-xl font-bold">{results.debug_info.stability.avg_detections_per_frame?.toFixed(1)}</div>
                        </div>
                        <div className="bg-gray-100 p-3 rounded">
                          <div className="text-sm text-muted-foreground">Min</div>
                          <div className="text-xl font-bold">{results.debug_info.stability.min_detections}</div>
                        </div>
                        <div className="bg-gray-100 p-3 rounded">
                          <div className="text-sm text-muted-foreground">Max</div>
                          <div className="text-xl font-bold">{results.debug_info.stability.max_detections}</div>
                        </div>
                        <div className="bg-gray-100 p-3 rounded">
                          <div className="text-sm text-muted-foreground">Variance</div>
                          <div className="text-xl font-bold">{results.debug_info.stability.detection_variance?.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {video.status === "completed" && results && (
              <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="data">Raw Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Vehicle Distribution</CardTitle>
                        <CardDescription>Types of vehicles detected</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[entry.name as keyof typeof COLORS] || "#999999"} 
                                  />
                                ))}
                              </Pie>
                              <Legend />
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No vehicles detected</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Vehicle Detection Timeline</CardTitle>
                        <CardDescription>Detected vehicles over time</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {timeSeriesData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={timeSeriesData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="car" fill={COLORS.car} />
                              <Bar dataKey="truck" fill={COLORS.truck} />
                              <Bar dataKey="bus" fill={COLORS.bus} />
                              <Bar dataKey="motorcycle" fill={COLORS.motorcycle} />
                              <Line type="monotone" dataKey="car" stroke={COLORS.car} dot={false} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No timeline data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Detection Summary</CardTitle>
                      <CardDescription>Overview of detected objects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Vehicles</p>
                          <p className="text-2xl font-bold">
                            {objectValuesToNumbers(results.total_counts) as number}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Unique Vehicles</p>
                          <p className="text-2xl font-bold">
                            {objectValuesToNumbers(results.unique_vehicles) as number}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Counted Vehicles</p>
                          <p className="text-2xl font-bold">
                            {objectValuesToNumbers(results.counted_vehicles) as number}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Vehicle Density</p>
                          <p className="text-2xl font-bold">
                            {results.processing_stats?.vehicle_density?.toFixed(2) || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="data">
                  <Card>
                    <CardHeader>
                      <CardTitle>Raw Detection Data</CardTitle>
                      <CardDescription>JSON results from the detection model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-[400px] overflow-auto rounded bg-muted">
                        <pre className="p-4 text-xs">
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDownloadResults}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download JSON Data
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Status</div>
                    <div>
                      <Badge variant={
                        video.status === "completed" ? "default" :
                        video.status === "processing" ? "secondary" :
                        "outline"
                      }>
                        {video.status === "completed" ? "Completed" :
                         video.status === "processing" ? "Processing" :
                         "Pending"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Filename</div>
                    <div className="text-sm break-all">{video.filename}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Upload Date</div>
                    <div className="text-sm">
                      {new Date(video.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  {video.duration !== undefined && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Duration</div>
                      <div className="text-sm">
                        {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  )}
                  
                  {video.size !== undefined && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">File Size</div>
                      <div className="text-sm">
                        {(video.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  )}
                  
                  {video.model_size && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">AI Model</div>
                      <div className="text-sm">
                        {video.model_size}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleDownload}
                  disabled={video.status !== "completed"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
              </CardFooter>
            </Card>
            
            {video.status === "completed" && results && results.total_counts && (
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Types</CardTitle>
                  <CardDescription>Types of vehicles detected</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(results.total_counts || {}).map(([type, count]) => 
                      Number(count) > 0 && (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center">
                            {type === 'car' && <Car className="h-5 w-5 mr-2 text-red-500" />}
                            {type === 'truck' && <Truck className="h-5 w-5 mr-2 text-purple-500" />}
                            {type === 'bus' && <Bus className="h-5 w-5 mr-2 text-blue-500" />}
                            {type === 'motorcycle' && <Bike className="h-5 w-5 mr-2 text-yellow-500" />}
                            <span className="capitalize">{type}s</span>
                          </div>
                          <div className="font-bold">{Number(count)}</div>
                        </div>
                      )
                    )}
                    
                    <div className="flex items-center justify-between border-t pt-2 mt-2">
                      <div className="font-medium">Total</div>
                      <div className="font-bold">
                        {objectValuesToNumbers(results.total_counts) as number}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {video.status === "completed" && results && results.counting_line && (
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Counting Line:</span> {results.counting_line.description}</p>
                    <p><span className="font-semibold">Position:</span> {results.counting_line.y_position_percentage * 100}% from top</p>
                    
                    {results.debug_info?.detection_parameters?.unique_counting && (
                      <p className="mt-2"><span className="font-semibold">Unique Counting:</span> {results.debug_info.detection_parameters.unique_counting}</p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="font-semibold mb-2">AI Improvements</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Object fingerprinting to prevent duplicate counting</li>
                        <li>Improved detection thresholds (confidence: {results.debug_info?.detection_parameters?.confidence_threshold || 0.4})</li>
                        <li>Size filtering to eliminate false detections</li>
                        <li>Adaptive tracking for different vehicle sizes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VideoDetail;
