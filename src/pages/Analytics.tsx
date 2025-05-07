import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
const aggregateVehicleData = (videos: any[], resultsMap: Record<number, any>) => {
  // Initialize vehicle counts
  const vehicleCounts = {
    car: 0,
    truck: 0,
    bus: 0,
    motorcycle: 0
  };
  
  // Count vehicles from video results
  videos.forEach(video => {
    if (video.status === 'completed' && resultsMap[video.id]) {
      const results = resultsMap[video.id];
      if (results.total_counts) {
        vehicleCounts.car += results.total_counts.car || 0;
        vehicleCounts.truck += results.total_counts.truck || 0;
        vehicleCounts.bus += results.total_counts.bus || 0;
        vehicleCounts.motorcycle += results.total_counts.motorcycle || 0;
      }
    }
  });
  
  return vehicleCounts;
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
  
  // Use effect to fetch results for each completed video
  React.useEffect(() => {
    const fetchResults = async () => {
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
    };
    
    if (completedVideos.length > 0) {
      fetchResults();
    }
  }, [completedVideos]);
  
  // Calculate aggregated stats
  const vehicleCounts = React.useMemo(() => {
    return aggregateVehicleData(completedVideos, resultsMap);
  }, [completedVideos, resultsMap]);
  
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
  
  // Weekly data (mock data for demonstration - in real app, would aggregate from results)
  const weeklyData = React.useMemo(() => {
    return [
      { day: "Mon", car: Math.floor(vehicleCounts.car * 0.15), truck: Math.floor(vehicleCounts.truck * 0.15), bus: Math.floor(vehicleCounts.bus * 0.15), motorcycle: Math.floor(vehicleCounts.motorcycle * 0.15) },
      { day: "Tue", car: Math.floor(vehicleCounts.car * 0.17), truck: Math.floor(vehicleCounts.truck * 0.17), bus: Math.floor(vehicleCounts.bus * 0.17), motorcycle: Math.floor(vehicleCounts.motorcycle * 0.17) },
      { day: "Wed", car: Math.floor(vehicleCounts.car * 0.16), truck: Math.floor(vehicleCounts.truck * 0.16), bus: Math.floor(vehicleCounts.bus * 0.16), motorcycle: Math.floor(vehicleCounts.motorcycle * 0.16) },
      { day: "Thu", car: Math.floor(vehicleCounts.car * 0.18), truck: Math.floor(vehicleCounts.truck * 0.18), bus: Math.floor(vehicleCounts.bus * 0.18), motorcycle: Math.floor(vehicleCounts.motorcycle * 0.18) },
      { day: "Fri", car: Math.floor(vehicleCounts.car * 0.2), truck: Math.floor(vehicleCounts.truck * 0.2), bus: Math.floor(vehicleCounts.bus * 0.2), motorcycle: Math.floor(vehicleCounts.motorcycle * 0.2) },
      { day: "Sat", car: Math.floor(vehicleCounts.car * 0.05), truck: Math.floor(vehicleCounts.truck * 0.05), bus: Math.floor(vehicleCounts.bus * 0.05), motorcycle: Math.floor(vehicleCounts.motorcycle * 0.05) },
      { day: "Sun", car: Math.floor(vehicleCounts.car * 0.09), truck: Math.floor(vehicleCounts.truck * 0.09), bus: Math.floor(vehicleCounts.bus * 0.09), motorcycle: Math.floor(vehicleCounts.motorcycle * 0.09) }
    ];
  }, [vehicleCounts]);
  
  // Hourly distribution (mock data for demonstration - in real app, would aggregate from results)
  const hourlyDistribution = React.useMemo(() => {
    const baseValue = totalVehicles / 50;
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hourString = i.toString().padStart(2, '0');
      // Create a distribution with peaks at morning and evening rush hours
      let multiplier = 1;
      if (i >= 7 && i <= 9) multiplier = 3; // Morning rush
      else if (i >= 16 && i <= 18) multiplier = 3.5; // Evening rush
      else if (i >= 11 && i <= 14) multiplier = 2; // Lunch time
      else if (i >= 22 || i <= 5) multiplier = 0.3; // Night time
      
      return {
        hour: hourString,
        count: Math.floor(baseValue * multiplier)
      };
    });
    return hours;
  }, [totalVehicles]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive traffic analysis and insights
          </p>
        </div>

        {isLoadingVideos ? (
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalVehicles}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {completedVideos.length} processed videos
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

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicle Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of detected vehicles by type
                      </CardDescription>
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
                        <BarChart data={weeklyData}>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Traffic Distribution</CardTitle>
                    <CardDescription>
                      Total vehicle count by hour of day
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Vehicles" />
                      </BarChart>
                    </ResponsiveContainer>
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
                      <ComposedChart data={weeklyData}>
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
              
              <TabsContent value="distribution" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicle Type Distribution</CardTitle>
                      <CardDescription>
                        Proportion of vehicle types detected
                      </CardDescription>
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
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Video Comparison</CardTitle>
                      <CardDescription>
                        Vehicle counts across processed videos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(resultsMap).map(([id, result]) => {
                            const video = completedVideos.find(v => v.id === parseInt(id));
                            return {
                              name: video ? video.name.substring(0, 15) + (video.name.length > 15 ? "..." : "") : `Video ${id}`,
                              car: result.total_counts?.car || 0,
                              truck: result.total_counts?.truck || 0,
                              bus: result.total_counts?.bus || 0,
                              motorcycle: result.total_counts?.motorcycle || 0
                            };
                          })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
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
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
