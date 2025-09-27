import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AshaWorker from "./pages/dashboards/AshaWorker";
import HealthOfficial from "./pages/dashboards/HealthOfficial";
import CommunityMember from "./pages/dashboards/CommunityMember";
import Villager from "./pages/dashboards/Villager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Dashboard Routes */}
            <Route 
              path="/dashboard/asha" 
              element={
                <RequireAuth requiredRole="asha">
                  <AshaWorker />
                </RequireAuth>
              } 
            />
            <Route 
              path="/dashboard/official" 
              element={
                <RequireAuth requiredRole="official">
                  <HealthOfficial />
                </RequireAuth>
              } 
            />
            <Route 
              path="/dashboard/community" 
              element={
                <RequireAuth requiredRole="community">
                  <CommunityMember />
                </RequireAuth>
              } 
            />
            <Route 
              path="/dashboard/villager" 
              element={
                <RequireAuth requiredRole="villager">
                  <Villager />
                </RequireAuth>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
