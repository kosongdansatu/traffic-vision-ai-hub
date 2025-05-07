
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UploadCloud, AlertCircle, PlayCircle, BarChart4, Clock } from "lucide-react";
import { mockVideoData } from "@/utils/mockData";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Traffic Vision AI Dashboard
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Get Started</AlertTitle>
          <AlertDescription>
            Upload a traffic video to start detecting and counting vehicles.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVideoData.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Detected Vehicles
              </CardTitle>
              <BarChart4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,453</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Processing Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">35.2s</div>
              <p className="text-xs text-muted-foreground">
                Avg. processing time
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockVideoData.slice(0, 3).map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                <img
                  src={video.thumbnail}
                  alt={video.name}
                  className="h-full w-full object-cover"
                />
                {video.status === "processing" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center space-y-2 text-white">
                      <p>Processing...</p>
                      <Progress value={video.progress} className="w-24" />
                    </div>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{video.name}</CardTitle>
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
                <CardDescription>{video.date}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">Duration:</span> {video.duration}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {video.size}
                  </div>
                </div>
              </CardContent>
              <div className="border-t px-4 py-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/videos/${video.id}`}>View Details</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/history">View All Videos</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
