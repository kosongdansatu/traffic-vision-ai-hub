
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockVideoData, mockDetectionData } from "@/utils/mockData";
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

const Analytics = () => {
  // Calculate aggregated stats across all processed videos
  const processedVideos = mockVideoData.filter(v => v.status === "processed");
  
  const totalDetections = processedVideos.reduce((acc, video) => {
    Object.entries(video.detectionResults).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + value;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.entries(totalDetections).map(([name, value]) => ({
    name,
    value
  }));
  
  const COLORS = {
    car: "#FF6B6B",
    truck: "#4ECDC4",
    bus: "#FFA400",
    motorcycle: "#7D83FF"
  };

  // Weekly data (mock data for demonstration)
  const weeklyData = [
    { day: "Mon", car: 120, truck: 45, bus: 20, motorcycle: 65 },
    { day: "Tue", car: 145, truck: 52, bus: 18, motorcycle: 70 },
    { day: "Wed", car: 135, truck: 48, bus: 22, motorcycle: 58 },
    { day: "Thu", car: 160, truck: 60, bus: 25, motorcycle: 75 },
    { day: "Fri", car: 180, truck: 65, bus: 30, motorcycle: 85 },
    { day: "Sat", car: 140, truck: 50, bus: 15, motorcycle: 70 },
    { day: "Sun", car: 110, truck: 40, bus: 10, motorcycle: 55 }
  ];

  // Hourly distribution (mock data for demonstration)
  const hourlyDistribution = [
    { hour: "00", count: 45 },
    { hour: "01", count: 25 },
    { hour: "02", count: 15 },
    { hour: "03", count: 10 },
    { hour: "04", count: 20 },
    { hour: "05", count: 35 },
    { hour: "06", count: 70 },
    { hour: "07", count: 120 },
    { hour: "08", count: 180 },
    { hour: "09", count: 150 },
    { hour: "10", count: 130 },
    { hour: "11", count: 145 },
    { hour: "12", count: 160 },
    { hour: "13", count: 155 },
    { hour: "14", count: 140 },
    { hour: "15", count: 150 },
    { hour: "16", count: 175 },
    { hour: "17", count: 190 },
    { hour: "18", count: 170 },
    { hour: "19", count: 130 },
    { hour: "20", count: 100 },
    { hour: "21", count: 80 },
    { hour: "22", count: 65 },
    { hour: "23", count: 50 }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive traffic analysis and insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Select defaultValue="all">
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
            
            <Select defaultValue="all">
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
                {Object.values(totalDetections).reduce((a, b) => a + b, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {processedVideos.length} processed videos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-traffic-car">
                {totalDetections.car || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((totalDetections.car || 0) / Object.values(totalDetections).reduce((a, b) => a + b, 0) * 100)}% of total vehicles
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trucks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-traffic-truck">
                {totalDetections.truck || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((totalDetections.truck || 0) / Object.values(totalDetections).reduce((a, b) => a + b, 0) * 100)}% of total vehicles
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Buses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-traffic-bus">
                {totalDetections.bus || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((totalDetections.bus || 0) / Object.values(totalDetections).reduce((a, b) => a + b, 0) * 100)}% of total vehicles
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
                  <ComposedChart data={mockDetectionData.timeSeries}>
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
                  <CardTitle>Vehicle Count by Video</CardTitle>
                  <CardDescription>
                    Comparison of vehicle counts across videos
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={processedVideos.map(video => ({
                        name: video.name.length > 15 ? video.name.substring(0, 15) + "..." : video.name,
                        car: video.detectionResults.car,
                        truck: video.detectionResults.truck,
                        bus: video.detectionResults.bus,
                        motorcycle: video.detectionResults.motorcycle
                      }))}
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
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
