import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Trash2, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { videoService } from "@/services/api";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['videos'],
    queryFn: videoService.getVideos,
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: number) => videoService.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success("Video deleted successfully");
    },
    onError: (error) => {
      console.error("Delete video error:", error);
      toast.error("Failed to delete video");
    }
  });
  
  const handleDelete = (id: number) => {
    deleteVideoMutation.mutate(id);
  };
  
  const filteredVideos = React.useMemo(() => {
    if (!Array.isArray(videos)) return [];
    
    return videos.filter(video => {
      // Filter by search query
      const matchesSearch = video.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by status
      const matchesStatus = filterStatus === "all" || video.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [videos, searchQuery, filterStatus]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading videos...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-destructive">Failed to load videos</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['videos'] })}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Video History</h1>
          <p className="text-muted-foreground">
            Browse and manage all your uploaded videos
          </p>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={filterStatus} 
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" asChild>
            <Link to="/upload">Upload New</Link>
          </Button>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mt-2 text-lg font-semibold">No videos found</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? "Try changing your search or filter criteria"
                : "Upload a video to get started with vehicle detection"}
            </p>
            <Button asChild>
              <Link to="/upload">Upload Video</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="aspect-video w-full sm:w-48 bg-muted relative">
                      {video.status === "completed" && video.result_path ? (
                        <Link to={`/videos/${video.id}`}>
                          {video.json_result_path && video.json_result_path.includes("_results.json") ? (
                            <img 
                              src={`${apiUrl}/${video.json_result_path.replace("_results.json", "_thumbnail.jpg")}`}
                              alt={video.name}
                              className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                console.error("Thumbnail loading error");
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  // Find the video element
                                  const videoElement = parent.querySelector('video') as HTMLVideoElement;
                                  if (videoElement) {
                                    videoElement.style.display = 'block';
                                    
                                    // Make sure the video has the right source
                                    if (!videoElement.src || videoElement.src === '') {
                                      videoElement.src = `${apiUrl}/${video.result_path}`;
                                    }
                                    
                                    // Try to load the video
                                    videoElement.load();
                                    
                                    // Handle video error
                                    videoElement.onerror = () => {
                                      videoElement.style.display = 'none';
                                      // Create a fallback element
                                      const fallback = document.createElement('div');
                                      fallback.className = 'h-full w-full flex items-center justify-center bg-gray-800 text-white';
                                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>';
                                      parent.appendChild(fallback);
                                    };
                                  } else {
                                    // If no video element is found, create one
                                    const newVideo = document.createElement('video');
                                    newVideo.className = 'h-full w-full object-cover hover:opacity-90 transition-opacity';
                                    newVideo.src = `${apiUrl}/${video.result_path}`;
                                    newVideo.muted = true;
                                    newVideo.style.display = 'block';
                                    
                                    // Add mouse event handlers
                                    newVideo.onmouseover = () => {
                                      newVideo.play().catch(err => console.error("Autoplay failed:", err));
                                    };
                                    newVideo.onmouseout = () => {
                                      newVideo.pause();
                                      newVideo.currentTime = 0;
                                    };
                                    
                                    // Handle video error
                                    newVideo.onerror = () => {
                                      newVideo.style.display = 'none';
                                      // Create a fallback element
                                      const fallback = document.createElement('div');
                                      fallback.className = 'h-full w-full flex items-center justify-center bg-gray-800 text-white';
                                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>';
                                      parent.appendChild(fallback);
                                    };
                                    
                                    parent.appendChild(newVideo);
                                  }
                                }
                              }}
                            />
                          ) : null}
                          
                          <video
                            className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                            src={`${apiUrl}/${video.result_path}`}
                            muted
                            style={{ display: 'none' }}
                            onMouseOver={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.play().catch(err => console.error("Autoplay failed:", err));
                            }}
                            onMouseOut={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.pause();
                              target.currentTime = 0;
                            }}
                            onError={(e) => {
                              console.error("Video preview error");
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                // Create a fallback element
                                const fallback = document.createElement('div');
                                fallback.className = 'h-full w-full flex items-center justify-center bg-gray-800 text-white';
                                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>';
                                parent.appendChild(fallback);
                              }
                            }}
                          >
                            Your browser does not support video playback.
                          </video>
                        </Link>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-800 text-white">
                          <Eye className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                      
                      {video.status === "processing" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="flex flex-col items-center space-y-2 text-white px-3">
                            <p>Processing...</p>
                            <Progress value={50} className="w-24" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between p-4 flex-1">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{video.name}</h3>
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
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {new Date(video.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex items-center justify-start gap-x-2 text-sm">
                          <span>Original: {video.original_filename}</span>
                        </div>

                        {video.status === "completed" && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Model:</span> {video.model_size || "nano"}
                            </div>
                            <div>
                              <span className="font-medium">Processing:</span> {video.processing_time ? `${(video.processing_time).toFixed(1)}s` : "N/A"}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/videos/${video.id}`}>
                            <Eye className="mr-1.5 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={video.status !== "completed"}
                          onClick={() => videoService.downloadVideo(video.id)}
                        >
                          <Download className="mr-1.5 h-4 w-4" />
                          Download
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                video and all associated detection results.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(video.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
