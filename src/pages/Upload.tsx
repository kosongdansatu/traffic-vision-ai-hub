
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { videoService } from "@/services/api";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  // Create a mutation for uploading videos
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return videoService.uploadVideo(formData);
    },
    onSuccess: () => {
      toast.success("Video uploaded successfully! Processing will begin shortly.");
      navigate("/dashboard");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload video. Please try again.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if the file is a video
      if (!selectedFile.type.startsWith("video/")) {
        toast.error("Please select a valid video file.");
        return;
      }
      setFile(selectedFile);
      
      // Auto-fill the name field with the file name (without extension)
      const fileName = selectedFile.name.split(".").slice(0, -1).join(".");
      setVideoName(fileName);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a video file to upload.");
      return;
    }
    
    if (!videoName.trim()) {
      toast.error("Please enter a name for your video.");
      return;
    }
    
    // Prepare form data for upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", videoName);
    if (description) {
      formData.append("description", description);
    }
    
    // Upload the video
    uploadMutation.mutate(formData);
    
    // Simulate upload progress (since the actual upload doesn't provide progress)
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100 || uploadMutation.isSuccess || uploadMutation.isError) {
        clearInterval(interval);
      }
    }, 200);
  };

  const isUploading = uploadMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Upload Video</h1>
          <p className="text-muted-foreground">
            Upload a traffic video for AI analysis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Upload</CardTitle>
            <CardDescription>
              Upload traffic footage for vehicle detection and counting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="videoName">Video Name</Label>
                  <Input 
                    id="videoName" 
                    placeholder="Enter a name for your video" 
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    disabled={isUploading}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter a description for your video" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="video">Video File</Label>
                  {!file && !isUploading ? (
                    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-input p-8 hover:bg-muted/50 cursor-pointer" onClick={() => document.getElementById("video")?.click()}>
                      <UploadCloud className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag and drop your video here, or click to browse
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Supports: MP4, AVI, MOV, WEBM (Max 500MB)
                      </p>
                      <Input 
                        id="video" 
                        type="file" 
                        accept="video/*"
                        className="hidden" 
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </div>
                  ) : (
                    <div className="rounded-md border p-4">
                      {file && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          {!isUploading && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setFile(null);
                                setVideoName("");
                              }}
                            >
                              Change
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!file || isUploading}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
