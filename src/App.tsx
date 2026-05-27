import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Context & Hook setup
import { AuthProvider } from './context/AuthContext';

// Layout & Route protectors
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RoleRoute } from './components/layout/RoleRoute';

// Pages
import { Home } from './pages/Home';
import { PropertiesBrowse } from './pages/PropertiesBrowse';
import { PropertyDetails } from './pages/PropertyDetails';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AgentDashboard } from './pages/AgentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientPortal } from './pages/ClientPortal';
import { NotFound } from './pages/NotFound';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Global Navbar */}
            <Navbar />

            {/* Layout Wrapper & Routes Container */}
            <div className="flex-grow">
              <Routes>
                {/* --- PUBLIC WORKFLOWS --- */}
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<PropertiesBrowse />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* --- SECURE ROUTING WORKSPACE --- */}
                <Route element={<ProtectedRoute />}>
                  
                  {/* Real Estate Agents / Admin CRM Area */}
                  <Route element={<RoleRoute allowedRoles={['agent', 'admin']} />}>
                    <Route path="/dashboard" element={<AgentDashboard />} />
                    <Route path="/dashboard/*" element={<AgentDashboard />} />
                  </Route>

                  {/* Root System Administrator Area */}
                  <Route element={<RoleRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                  </Route>

                  {/* Buyer & Seller Client Portal Area */}
                  <Route element={<RoleRoute allowedRoles={['client', 'agent', 'admin']} />}>
                    <Route path="/portal" element={<ClientPortal />} />
                    <Route path="/portal/*" element={<ClientPortal />} />
                  </Route>

                </Route>

                {/* Redirection fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            
            {/* Minimal footer */}
            <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-[11px] font-sans text-center py-4">
              <p>© 2026 BuildProConnect Real Estate. Systems synchronized.</p>
            </footer>
          </div>

          {/* Interactive toast notifications */}
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif'
              }
            }} 
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
