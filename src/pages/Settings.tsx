
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const Settings = () => {
  const handleSaveAccount = () => {
    toast.success("Account settings saved successfully");
  };

  const handleSaveDetection = () => {
    toast.success("Detection settings saved successfully");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification settings saved successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Demo User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="demo@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input id="organization" defaultValue="Traffic Department" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAccount}>Save Account Settings</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection Settings</CardTitle>
              <CardDescription>Configure AI model and detection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="model">YOLOv8 Model Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nano">YOLOv8n (Nano - Fastest)</SelectItem>
                      <SelectItem value="small">YOLOv8s (Small - Fast)</SelectItem>
                      <SelectItem value="medium">YOLOv8m (Medium - Balanced)</SelectItem>
                      <SelectItem value="large">YOLOv8l (Large - Accurate)</SelectItem>
                      <SelectItem value="xlarge">YOLOv8x (XLarge - Most Accurate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence">Detection Confidence Threshold</Label>
                  <Select defaultValue="0.5">
                    <SelectTrigger id="confidence">
                      <SelectValue placeholder="Select confidence threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.3">0.3 (More detections, less accurate)</SelectItem>
                      <SelectItem value="0.4">0.4</SelectItem>
                      <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
                      <SelectItem value="0.6">0.6</SelectItem>
                      <SelectItem value="0.7">0.7 (Fewer detections, more accurate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>Vehicle Classes to Detect</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="car" defaultChecked />
                    <Label htmlFor="car">Cars</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="truck" defaultChecked />
                    <Label htmlFor="truck">Trucks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="bus" defaultChecked />
                    <Label htmlFor="bus">Buses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="motorcycle" defaultChecked />
                    <Label htmlFor="motorcycle">Motorcycles</Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="processing">Processing Options</Label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="bbox" defaultChecked />
                    <Label htmlFor="bbox">Draw bounding boxes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="labels" defaultChecked />
                    <Label htmlFor="labels">Show vehicle labels</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="stats" defaultChecked />
                    <Label htmlFor="stats">Show statistics overlay</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="tracking" defaultChecked />
                    <Label htmlFor="tracking">Enable vehicle tracking</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveDetection}>Save Detection Settings</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage email and system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Email Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="email-processing" defaultChecked />
                    <Label htmlFor="email-processing">Processing complete notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="email-reports" defaultChecked />
                    <Label htmlFor="email-reports">Weekly traffic reports</Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>System Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="sys-upload" defaultChecked />
                    <Label htmlFor="sys-upload">Upload notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sys-processing" defaultChecked />
                    <Label htmlFor="sys-processing">Processing notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sys-errors" defaultChecked />
                    <Label htmlFor="sys-errors">Error notifications</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
