import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { videoService } from "@/services/api";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line
} from "recharts";

// Helper function to aggregate vehicle data from videos
const aggregateVehicleData = (videos: any[], resultsMap: Record<number, any>, selectedVideoId: number | null) => {
  // Initialize vehicle counts
  const vehicleCounts = {
    car: 0,
    truck: 0,
    bus: 0,
    motorcycle: 0
  };
  
  // Count vehicles from video results
  videos.forEach(video => {
    // Skip if not the selected video (when a specific video is selected)
    if (selectedVideoId && video.id !== selectedVideoId) return;
    
    if (video.status === 'completed' && resultsMap[video.id]) {
      const results = resultsMap[video.id];
      if (results.total_counts) {
        vehicleCounts.car += Number(results.total_counts.car) || 0;
        vehicleCounts.truck += Number(results.total_counts.truck) || 0;
        vehicleCounts.bus += Number(results.total_counts.bus) || 0;
        vehicleCounts.motorcycle += Number(results.total_counts.motorcycle) || 0;
      }
    }
  });
  
  return vehicleCounts;
};

// Helper function to extract real hourly data from frame timestamps
const extractHourlyData = (resultsMap: Record<number, any>, selectedVideoId: number | null) => {
  // Initialize hourly data structure
  const hourlyData: Record<string, { car: number, truck: number, bus: number, motorcycle: number, total: number }> = {};
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    hourlyData[hour] = { car: 0, truck: 0, bus: 0, motorcycle: 0, total: 0 };
  }
  
  // Extract hourly data from each video's frames
  Object.entries(resultsMap).forEach(([videoId, results]) => {
    // Skip if not the selected video (when a specific video is selected)
    if (selectedVideoId && Number(videoId) !== selectedVideoId) return;
    
    if (results && results.frames) {
      // Process each frame
      results.frames.forEach((frame: any) => {
        if (frame.timestamp) {
          // Extract hour from timestamp
          const timestamp = new Date(frame.timestamp);
          const hour = timestamp.getHours().toString().padStart(2, '0');
          
          // Add vehicle counts for this hour
          if (frame.counts) {
            hourlyData[hour].car += Number(frame.counts.car) || 0;
            hourlyData[hour].truck += Number(frame.counts.truck) || 0;
            hourlyData[hour].bus += Number(frame.counts.bus) || 0;
            hourlyData[hour].motorcycle += Number(frame.counts.motorcycle) || 0;
            
            // Calculate total for this hour
            const hourTotal = (
              Number(frame.counts.car || 0) + 
              Number(frame.counts.truck || 0) + 
              Number(frame.counts.bus || 0) + 
              Number(frame.counts.motorcycle || 0)
            );
            hourlyData[hour].total += hourTotal;
          }
        }
      });
    }
  });
  
  // Convert to array format for chart
  return Object.entries(hourlyData).map(([hour, counts]) => ({
    hour,
    ...counts
  }));
};

const COLORS = {
  car: "#FF6B6B",
  truck: "#4ECDC4",
  bus: "#FFA400",
  motorcycle: "#7D83FF"
};

const Analytics = () => {
  const [timeFilter, setTimeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  
  // Fetch all videos
  const { data: videos = [], isLoading: isLoadingVideos } = useQuery({
    queryKey: ['videos'],
    queryFn: videoService.getVideos
  });
  
  // Get completed videos
  const completedVideos = React.useMemo(() => {
    if (!Array.isArray(videos)) return [];
    return videos.filter(v => v.status === 'completed');
  }, [videos]);
  
  // Fetch results for each completed video
  const [resultsMap, setResultsMap] = useState<Record<number, any>>({});
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  // Use effect to fetch results for each completed video
  React.useEffect(() => {
    const fetchResults = async () => {
      setIsLoadingResults(true);
      const results: Record<number, any> = {};
      
      for (const video of completedVideos) {
        try {
          const result = await videoService.getVideoResults(video.id);
          results[video.id] = result;
        } catch (error) {
          console.error(`Failed to fetch results for video ${video.id}:`, error);
        }
      }
      
      setResultsMap(results);
      setIsLoadingResults(false);
    };
    
    if (completedVideos.length > 0) {
      fetchResults();
    }
  }, [completedVideos]);
  
  // Calculate aggregated stats
  const vehicleCounts = React.useMemo(() => {
    return aggregateVehicleData(completedVideos, resultsMap, selectedVideoId);
  }, [completedVideos, resultsMap, selectedVideoId]);
  
  const totalVehicles = React.useMemo(() => {
    return Object.values(vehicleCounts).reduce((a, b) => a + b, 0);
  }, [vehicleCounts]);
  
  // For pie chart
  const pieData = React.useMemo(() => {
    return Object.entries(vehicleCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [vehicleCounts]);
  
  // Generate time-based data from actual results
  const timeBasedData = React.useMemo(() => {
    if (Object.keys(resultsMap).length === 0) return [];
    
    // Create day-based aggregation
    const dayData: Record<string, { car: number, truck: number, bus: number, motorcycle: number }> = {
      'Mon': { car: 0, truck: 0, bus: 0, motorcycle: 0 },
      'Tue': { car: 0, truck: 0, bus: 0, motorcycle: 0 },
      'Wed': { car: 0, truck: 0, bus: 0, motorcycle: 0 },
      'Thu': { car: 0, truck: 0, bus: 0, motorcycle: 0 },
      'Fri': { car: 0, truck: 0, bus: 0, motorcycle: 0 },
      'Sat': { car: 0, truck: 0, bus: 0, motorcycle: 0 },
      'Sun': { car: 0, truck: 0, bus: 0, motorcycle: 0 }
    };
    
    // Distribute the counts across days based on creation date
    completedVideos.forEach(video => {
      // Skip if not the selected video (when a specific video is selected)
      if (selectedVideoId && video.id !== selectedVideoId) return;
      
      const result = resultsMap[video.id];
      if (result && result.total_counts) {
        const date = new Date(video.created_at);
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        
        dayData[day].car += Number(result.total_counts.car) || 0;
        dayData[day].truck += Number(result.total_counts.truck) || 0;
        dayData[day].bus += Number(result.total_counts.bus) || 0;
        dayData[day].motorcycle += Number(result.total_counts.motorcycle) || 0;
      }
    });
    
    // Convert to array format for chart
    return Object.entries(dayData).map(([day, counts]) => ({
      day,
      ...counts
    }));
  }, [completedVideos, resultsMap, selectedVideoId]);
  
  // Extract real hourly data if available, otherwise use the estimation
  const hourlyDistribution = React.useMemo(() => {
    // Try to get real hourly data from frames first
    const realHourlyData = extractHourlyData(resultsMap, selectedVideoId);
    
    // Check if we have meaningful real data
    const hasRealData = realHourlyData.some(hour => hour.total > 0);
    
    if (hasRealData) {
      return realHourlyData;
    }
    
    // Fallback to estimate if no real data available
    const hourCounts = Array(24).fill(0).map((_, i) => ({
      hour: i.toString().padStart(2, '0'),
      car: 0,
      truck: 0, 
      bus: 0,
      motorcycle: 0,
      total: 0
    }));
    
    // Aggregate counts by distributing total vehicles across hours
    // based on typical traffic patterns (since actual time info isn't in the data)
    if (totalVehicles > 0) {
      // Typical traffic distribution percentages by hour
      const hourlyDistribution = [
        1, 0.5, 0.3, 0.2, 0.3, 1, 3, 7, 9, 6, 5, 5, 
        5.5, 5, 5, 6, 8, 10, 7, 5, 4, 3, 2, 1.5
      ];
      
      // Calculate total percentage (should be close to 100%)
      const totalPercentage = hourlyDistribution.reduce((a, b) => a + b, 0);
      
      // Distribute total vehicles by hour based on percentages
      hourCounts.forEach((hour, index) => {
        hour.total = Math.round(totalVehicles * (hourlyDistribution[index] / totalPercentage));
        
        // Distribute by vehicle type proportionally
        const totalByType = Object.values(vehicleCounts).reduce((a, b) => a + b, 0);
        if (totalByType > 0) {
          hour.car = Math.round(hour.total * (vehicleCounts.car / totalByType));
          hour.truck = Math.round(hour.total * (vehicleCounts.truck / totalByType));
          hour.bus = Math.round(hour.total * (vehicleCounts.bus / totalByType));
          hour.motorcycle = Math.round(hour.total * (vehicleCounts.motorcycle / totalByType));
        }
      });
    }
    
    return hourCounts;
  }, [totalVehicles, resultsMap, vehicleCounts, selectedVideoId]);

  const isLoading = isLoadingVideos || isLoadingResults;

  // Get currently selected video name
  const selectedVideoName = React.useMemo(() => {
    if (!selectedVideoId) return "All Videos";
    const video = completedVideos.find(v => v.id === selectedVideoId);
    return video ? video.name : "Unknown Video";
  }, [selectedVideoId, completedVideos]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive traffic analysis and insights
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading data...</span>
            </div>
          </div>
        ) : completedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mt-2 text-lg font-semibold">No processed videos yet</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Upload and process traffic videos to see analytics and insights
            </p>
            <Button asChild>
              <Link to="/upload">Upload Video</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedVideoId ? selectedVideoId.toString() : "all"} 
                  onValueChange={(value) => setSelectedVideoId(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select Video" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Videos</SelectItem>
                    {completedVideos.map(video => (
                      <SelectItem key={video.id} value={video.id.toString()}>
                        {video.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="downtown">Downtown</SelectItem>
                    <SelectItem value="highway">Highway</SelectItem>
                    <SelectItem value="intersection">Intersection</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedVideoId && (
              <div className="bg-muted p-3 rounded-md mb-4">
                <h2 className="text-lg font-semibold mb-1">Analytics for: {selectedVideoName}</h2>
                <p className="text-sm text-muted-foreground">
                  Showing data specifically for this video. <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedVideoId(null)}>View all videos</Button>
                </p>
              </div>
            )}
            
            <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalVehicles}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedVideoId 
                      ? `In selected video: ${selectedVideoName}`
                      : `Across ${completedVideos.length} processed videos`
                    }
                  </p>
                </CardContent>
              </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Motorcycles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-traffic-motorcycle">
                    {vehicleCounts.motorcycle || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalVehicles ? Math.round((vehicleCounts.motorcycle / totalVehicles) * 100) : 0}% of total vehicles
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cars</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-traffic-car">
                    {vehicleCounts.car || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalVehicles ? Math.round((vehicleCounts.car / totalVehicles) * 100) : 0}% of total vehicles
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Trucks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-traffic-truck">
                    {vehicleCounts.truck || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalVehicles ? Math.round((vehicleCounts.truck / totalVehicles) * 100) : 0}% of total vehicles
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Buses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-traffic-bus">
                    {vehicleCounts.bus || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalVehicles ? Math.round((vehicleCounts.bus / totalVehicles) * 100) : 0}% of total vehicles
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="hourly">Hourly Analysis</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicle Distribution</CardTitle>
                      <CardDescription>Vehicle types detected</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
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
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#999"} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, "Count"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Traffic Patterns</CardTitle>
                      <CardDescription>
                        Vehicle counts by day of week
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timeBasedData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="car" fill="#FF6B6B" name="Cars" />
                          <Bar dataKey="truck" fill="#4ECDC4" name="Trucks" />
                          <Bar dataKey="bus" fill="#FFA400" name="Buses" />
                          <Bar dataKey="motorcycle" fill="#7D83FF" name="Motorcycles" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="hourly" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Traffic Distribution</CardTitle>
                    <CardDescription>
                      {selectedVideoId ? 
                        "Vehicle counts by hour for the selected video" : 
                        "Aggregated vehicle counts by hour of day across all videos"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="car" fill="#FF6B6B" name="Cars" stackId="a" />
                        <Bar dataKey="truck" fill="#4ECDC4" name="Trucks" stackId="a" />
                        <Bar dataKey="bus" fill="#FFA400" name="Buses" stackId="a" />
                        <Bar dataKey="motorcycle" fill="#7D83FF" name="Motorcycles" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                  <CardContent className="pt-0 border-t">
                    <p className="text-sm text-muted-foreground">
                      {selectedVideoId ? 
                        "Data shows actual detection counts per hour for this video." : 
                        "When no timestamp data is available, hourly distribution is estimated based on typical traffic patterns."
                      }
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Keep existing tabs content structure but update with actual data */}
              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Trends</CardTitle>
                    <CardDescription>
                      Vehicle count trends over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={timeBasedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
