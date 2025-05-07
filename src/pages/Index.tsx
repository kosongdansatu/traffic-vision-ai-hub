
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
                Traffic Vision AI Hub
              </h1>
              <p className="max-w-[600px] text-lg text-blue-100 md:text-xl">
                Intelligent traffic monitoring powered by computer vision. Detect and count vehicles
                by type using state-of-the-art YOLOv8 AI models.
              </p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button size="lg" asChild>
                  <Link to="/login">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/register">Create Account</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="overflow-hidden rounded-2xl shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1574767848755-475ec68136e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80"
                  alt="Traffic Monitoring"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Powerful Features</h2>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
              Our system uses advanced AI to analyze traffic videos and provide valuable insights
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="traffic-card">
              <div className="mb-4 rounded-full bg-blue-100 p-3 inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-700"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Vehicle Detection</h3>
              <p className="text-muted-foreground">
                Accurately detect and classify vehicles in traffic videos with YOLOv8 models
              </p>
            </div>
            <div className="traffic-card">
              <div className="mb-4 rounded-full bg-blue-100 p-3 inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-700"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Real-time Analytics</h3>
              <p className="text-muted-foreground">
                Get instant insights with comprehensive traffic data visualizations and charts
              </p>
            </div>
            <div className="traffic-card">
              <div className="mb-4 rounded-full bg-blue-100 p-3 inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-700"
                >
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Custom Exports</h3>
              <p className="text-muted-foreground">
                Download processed videos with detection boxes or raw JSON data for further analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
              Our simple process makes traffic analysis easy and efficient
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="traffic-card text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                1
              </div>
              <h3 className="mb-2 text-xl font-bold">Upload</h3>
              <p className="text-muted-foreground">
                Upload traffic videos from any source - traffic cameras, drones, or mobile devices
              </p>
            </div>
            <div className="traffic-card text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                2
              </div>
              <h3 className="mb-2 text-xl font-bold">Process</h3>
              <p className="text-muted-foreground">
                Our AI system automatically detects and counts vehicles by type using YOLOv8
              </p>
            </div>
            <div className="traffic-card text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                3
              </div>
              <h3 className="mb-2 text-xl font-bold">Analyze</h3>
              <p className="text-muted-foreground">
                Review comprehensive analytics and download the results in various formats
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 py-16 text-center text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to Start Analyzing Traffic?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Join today and unlock the power of AI-driven traffic analysis for your transportation projects
          </p>
          <div className="mt-8 flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button size="lg" variant="default" asChild>
              <Link to="/register">Get Started for Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-blue-900">
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 text-gray-400">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between space-y-4 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-xl font-bold text-white">Traffic Vision AI Hub</h2>
              <p className="mt-1">Intelligent traffic monitoring with AI</p>
            </div>
            <div className="flex space-x-4">
              <Link to="/login" className="hover:text-white">Login</Link>
              <Link to="/register" className="hover:text-white">Register</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-6 text-center">
            <p>&copy; 2025 Traffic Vision AI Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
