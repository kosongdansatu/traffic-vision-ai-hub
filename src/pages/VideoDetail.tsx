
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Play, Edit, Trash2 } from "lucide-react";
import { mockVideoData, mockDetectionData } from "@/utils/mockData";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
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

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState(mockVideoData.find(v => v.id === id));
  const [detectionData, setDetectionData] = useState(mockDetectionData);
  
  useEffect(() => {
    // In a real app, this would fetch the video and detection data from an API
    // For now, we'll use our mock data
    const foundVideo = mockVideoData.find(v => v.id === id);
    setVideo(foundVideo);
    
    // We'd fetch the detection data here
    setDetectionData(mockDetectionData);
  }, [id]);
  
  if (!video) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <p>Video not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleDownload = () => {
    toast.success("Downloading video results...");
  };
  
  const handleDelete = () => {
    toast.success("Video deleted successfully");
    // In a real app, this would redirect to the dashboard after deletion
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{video.name}</h1>
            <p className="text-muted-foreground">
              Uploaded on {video.date}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Results
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
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
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={video.thumbnail}
                    alt={video.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="icon" variant="secondary" className="rounded-full">
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">{video.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">File Size</p>
                      <p className="text-sm text-muted-foreground">{video.size}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <div>
                        <Badge
                          variant={
                            video.status === "processed"
                              ? "default"
                              : video.status === "processing"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {video.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Processing Time</p>
                      <p className="text-sm text-muted-foreground">35.2s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detection Summary</CardTitle>
                  <CardDescription>
                    Total vehicles detected in this video
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {video.status === "processed" ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col rounded-lg border p-3">
                          <span className="text-sm font-medium">Cars</span>
                          <span className="text-2xl font-bold text-traffic-car">
                            {video.detectionResults.car}
                          </span>
                        </div>
                        <div className="flex flex-col rounded-lg border p-3">
                          <span className="text-sm font-medium">Trucks</span>
                          <span className="text-2xl font-bold text-traffic-truck">
                            {video.detectionResults.truck}
                          </span>
                        </div>
                        <div className="flex flex-col rounded-lg border p-3">
                          <span className="text-sm font-medium">Buses</span>
                          <span className="text-2xl font-bold text-traffic-bus">
                            {video.detectionResults.bus}
                          </span>
                        </div>
                        <div className="flex flex-col rounded-lg border p-3">
                          <span className="text-sm font-medium">Motorcycles</span>
                          <span className="text-2xl font-bold text-traffic-motorcycle">
                            {video.detectionResults.motorcycle}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Vehicles</p>
                        <p className="text-2xl font-bold">
                          {Object.values(video.detectionResults).reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-center">
                      <div>
                        <p className="text-muted-foreground">
                          This video is still being processed.
                        </p>
                        <p className="text-muted-foreground">
                          Detection results will be available once processing is complete.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Detection Over Time</CardTitle>
                <CardDescription>
                  Number of vehicles detected per vehicle type over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {video.status === "processed" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={detectionData.timeSeries}>
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
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      Analytics will be available once processing is complete
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Distribution</CardTitle>
                  <CardDescription>
                    Percentage breakdown by vehicle type
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {video.status === "processed" ? (
                    <div className="space-y-4">
                      {Object.entries(video.detectionResults).map(([key, value]) => {
                        const total = Object.values(video.detectionResults).reduce(
                          (a, b) => a + b,
                          0
                        );
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm capitalize">{key}</span>
                              <span className="text-sm font-medium">
                                {value} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className={`h-2 rounded-full bg-traffic-${key}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Data not available yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detection Confidence</CardTitle>
                  <CardDescription>
                    Average confidence score by vehicle type
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {video.status === "processed" ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Cars</span>
                          <span className="text-sm font-medium">92%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-traffic-car"
                            style={{ width: "92%" }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Trucks</span>
                          <span className="text-sm font-medium">88%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-traffic-truck"
                            style={{ width: "88%" }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Buses</span>
                          <span className="text-sm font-medium">94%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-traffic-bus"
                            style={{ width: "94%" }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Motorcycles</span>
                          <span className="text-sm font-medium">85%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-traffic-motorcycle"
                            style={{ width: "85%" }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Data not available yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Download processed video and detection data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div>
                      <h3 className="font-medium">Processed Video</h3>
                      <p className="text-sm text-muted-foreground">
                        Video with bounding boxes and detection labels
                      </p>
                    </div>
                    <Button variant="outline" disabled={video.status !== "processed"}>
                      <Download className="mr-2 h-4 w-4" />
                      Download MP4
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div>
                      <h3 className="font-medium">Detection Data (JSON)</h3>
                      <p className="text-sm text-muted-foreground">
                        Raw detection data in JSON format
                      </p>
                    </div>
                    <Button variant="outline" disabled={video.status !== "processed"}>
                      <Download className="mr-2 h-4 w-4" />
                      Download JSON
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div>
                      <h3 className="font-medium">Analytics Report (CSV)</h3>
                      <p className="text-sm text-muted-foreground">
                        Detection counts by frame and vehicle type
                      </p>
                    </div>
                    <Button variant="outline" disabled={video.status !== "processed"}>
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  All data downloads are in standard formats compatible with spreadsheet and data analysis tools.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default VideoDetail;
