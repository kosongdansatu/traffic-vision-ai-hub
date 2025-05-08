import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { videoService } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Download, ArrowLeft } from "lucide-react";
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
                      >
                        <source src={`${apiUrl}/${video.result_path}?t=${Date.now()}&auth_token=${token || ''}`} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-white mb-4">Video playback is not available. Please try downloading the video instead.</p>
                        <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                          <Download className="mr-2 h-4 w-4" /> Download Video
                        </Button>
                      </div>
                    )}
                  </div>
                ) : video.status === "processing" ? (
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <p className="text-white animate-pulse">Processing video...</p>
                  </div>
                ) : video.status === "failed" ? (
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <p className="text-white text-red-500">Processing failed</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <p className="text-white">Video ready for processing</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-card">
                <div className="flex flex-col space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      disabled={video.status !== "completed"}
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Processed Video
                    </Button>
                    {video.file_path && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`${apiUrl}/${video.file_path}?auth_token=${token || ''}`, '_blank')}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Original
                      </Button>
                    )}
                    
                    {video.status === "completed" && video.result_path && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`${apiUrl}/${video.result_path}?auth_token=${token || ''}`, '_blank')}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Open Video Directly
                      </Button>
                    )}
                  </div>
                  
                  {video.status === "completed" && results && results.processing_stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Model:</span> {video.model_size || "nano"}
                      </div>
                      <div>
                        <span className="font-medium">Processing Time:</span> {results.processing_stats.processing_time_seconds ? `${results.processing_stats.processing_time_seconds.toFixed(1)}s` : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">FPS:</span> {results.processing_stats.frames_per_second ? results.processing_stats.frames_per_second.toFixed(1) : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Frames:</span> {results.processing_stats.processed_frames || 0}/{results.processing_stats.total_frames || 0}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {video.status === "completed" && !isLoadingResults && results ? (
              <Card>
                <CardHeader>
                  <CardTitle>Detection Results</CardTitle>
                  <CardDescription>
                    Traffic data extracted from video analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                      <div className="grid gap-4">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.entries(results.total_counts || {}).map(([type, count]) => (
                            <Card key={type}>
                              <CardHeader className="py-2">
                                <CardTitle className="text-sm capitalize">{type}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">{String(count)}</div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="timeline">
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="car" fill="#FF6B6B" name="Cars" />
                            <Bar dataKey="truck" fill="#4ECDC4" name="Trucks" />
                            <Bar dataKey="bus" fill="#FFA400" name="Buses" />
                            <Bar dataKey="motorcycle" fill="#7D83FF" name="Motorcycles" />
                            <Line
                              type="monotone"
                              dataKey="car"
                              stroke="#FF6B6B"
                              dot={false}
                              activeDot={false}
                              opacity={0.5}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : video.status === "processing" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Video</CardTitle>
                  <CardDescription>
                    Your video is currently being processed with AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p>Analyzing video for vehicle detection...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : video.status === "failed" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Failed</CardTitle>
                  <CardDescription>
                    There was an issue processing this video
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center space-y-4">
                      <p className="text-destructive font-medium">The video analysis could not be completed</p>
                      <Button>Try Processing Again</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Status:</dt>
                    <dd>{video.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Upload date:</dt>
                    <dd>{new Date(video.created_at).toLocaleDateString()}</dd>
                  </div>
                  {video.updated_at && (
                    <div className="flex justify-between">
                      <dt className="font-medium">Last updated:</dt>
                      <dd>{new Date(video.updated_at).toLocaleDateString()}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="font-medium">Original filename:</dt>
                    <dd>{video.original_filename}</dd>
                  </div>
                  {video.description && (
                    <div className="pt-2">
                      <dt className="font-medium mb-1">Description:</dt>
                      <dd className="text-muted-foreground">{video.description}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {video.status === "completed" && results && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4 text-sm">
                    {results.processing_stats && (
                      <>
                        <div className="flex justify-between">
                          <dt className="font-medium">Processed frames:</dt>
                          <dd>{results.processing_stats.processed_frames}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Vehicle density:</dt>
                          <dd>{results.processing_stats.vehicle_density.toFixed(2)} vehicles/frame</dd>
                        </div>
                        {results.processing_stats.processing_time_seconds && (
                          <div className="flex justify-between">
                            <dt className="font-medium">Processing time:</dt>
                            <dd>{results.processing_stats.processing_time_seconds.toFixed(2)}s</dd>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between">
                      <dt className="font-medium">Total frames:</dt>
                      <dd>{results.total_frames}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">FPS:</dt>
                      <dd>{results.fps}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Resolution:</dt>
                      <dd>{results.resolution}</dd>
                    </div>
                    {results.model_used && (
                      <div className="flex justify-between">
                        <dt className="font-medium">AI Model used:</dt>
                        <dd className="capitalize">{results.model_used}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={handleDownloadResults}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Results JSON
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VideoDetail;
