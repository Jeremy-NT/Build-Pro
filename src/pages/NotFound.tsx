import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 font-sans" id="notfound-root-card">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          {/* Sizable 404 Typography */}
          <h1 className="text-8xl font-black text-blue-600 font-mono tracking-tighter" id="404-brand">404</h1>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">Security coordinate lost</h2>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed">
            The page path you are aiming to navigate to does not exist or has moved. All portal connections are active, please redirect to home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/15 cursor-pointer transition"
          >
            <Home className="w-3.5 h-3.5" /> Return Home
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back Previous Page
          </button>
        </div>
      </div>
    </div>
  );
};
export default NotFound;
