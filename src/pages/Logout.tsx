
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would clear authentication state and tokens
    // For now, we'll just show a toast and redirect to login
    
    // Simulate logout delay
    const timer = setTimeout(() => {
      toast.success("You have been successfully logged out");
      navigate("/login");
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Logging out...</h1>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
};

export default Logout;
