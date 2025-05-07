
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header/Navigation */}
      <header className="fixed w-full z-10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Traffic Vision AI Hub</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-white hover:text-primary transition-colors">Home</Link>
              <Link to="#features" className="text-white hover:text-primary transition-colors">Features</Link>
              <Link to="#how-it-works" className="text-white hover:text-primary transition-colors">How it Works</Link>
              <Link to="#about" className="text-white hover:text-primary transition-colors">About</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-white hover:text-primary" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-hero-pattern bg-cover bg-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-sm"></div>
        <div className="container mx-auto px-6 py-16 md:py-24 relative z-1">
          <div className="flex flex-col items-center justify-center text-center space-y-8 pt-16">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-gradient animate-gradient-flow">
              Elevate Your Traffic <br /> Monitoring Experience
            </h1>
            <p className="max-w-[800px] text-lg text-white/80 md:text-xl">
              Unlock your traffic monitoring potential with AI-powered vehicle detection and analysis.
              Powered by computer vision technology.
            </p>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0 mt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6" asChild>
                <Link to="/register">Get Started <ArrowRight size={18} className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Glass Cards */}
        <div className="absolute bottom-20 left-10 md:left-32 glass-card p-4 md:p-6 max-w-[240px] hidden md:block">
          <div className="text-xs text-white/70 mb-1">Vehicle Detection</div>
          <div className="text-xl font-bold text-white">96% Accuracy</div>
          <div className="mt-2 bg-white/10 h-1 w-full rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "96%" }}></div>
          </div>
        </div>
        
        <div className="absolute top-40 right-10 md:right-32 glass-card p-4 md:p-6 max-w-[240px] hidden md:block">
          <div className="text-xs text-white/70 mb-1">Processing Speed</div>
          <div className="text-xl font-bold text-white">Real-Time</div>
          <div className="mt-2 bg-white/10 h-1 w-full rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "80%" }}></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-background py-24">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl text-gradient">Powerful Features</h2>
            <p className="mx-auto mt-4 max-w-3xl text-white/70">
              Our system uses advanced AI to analyze traffic videos and provide valuable insights
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="glass p-6 flex flex-col">
              <div className="mb-4 rounded-full bg-primary/20 p-3 inline-block">
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
                  className="text-primary"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Vehicle Detection</h3>
              <p className="text-white/70">
                Accurately detect and classify vehicles in traffic videos with YOLOv8 models
              </p>
            </div>
            <div className="glass p-6 flex flex-col">
              <div className="mb-4 rounded-full bg-primary/20 p-3 inline-block">
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
                  className="text-primary"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Real-time Analytics</h3>
              <p className="text-white/70">
                Get instant insights with comprehensive traffic data visualizations and charts
              </p>
            </div>
            <div className="glass p-6 flex flex-col">
              <div className="mb-4 rounded-full bg-primary/20 p-3 inline-block">
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
                  className="text-primary"
                >
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Custom Exports</h3>
              <p className="text-white/70">
                Download processed videos with detection boxes or raw JSON data for further analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-gradient-dark py-24">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl text-gradient">How It Works</h2>
            <p className="mx-auto mt-4 max-w-3xl text-white/70">
              Our simple process makes traffic analysis easy and efficient
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="glass p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                1
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Upload</h3>
              <p className="text-white/70">
                Upload traffic videos from any source - traffic cameras, drones, or mobile devices
              </p>
            </div>
            <div className="glass p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                2
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Process</h3>
              <p className="text-white/70">
                Our AI system automatically detects and counts vehicles by type using YOLOv8
              </p>
            </div>
            <div className="glass p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                3
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Analyze</h3>
              <p className="text-white/70">
                Review comprehensive analytics and download the results in various formats
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background py-16 text-center">
        <div className="container mx-auto px-6">
          <div className="glass p-10 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold md:text-4xl text-gradient">
              Ready to Start Analyzing Traffic?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              Join today and unlock the power of AI-driven traffic analysis for your transportation projects
            </p>
            <div className="mt-8 flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button size="lg" className="rounded-full px-8 py-6 bg-primary hover:bg-primary/90" asChild>
                <Link to="/register">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-6">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background/80 py-10 text-white/60 border-t border-white/5">
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
          <div className="mt-8 border-t border-white/5 pt-6 text-center">
            <p>&copy; 2025 Traffic Vision AI Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
