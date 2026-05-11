import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-[1800px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-end gap-3">
            {/* Youthnic Logo Image */}
            <div className="flex flex-col justify-center h-full pt-1">
                <img 
                  src="https://lh3.googleusercontent.com/d/1_reUhF3EECu-Ehjx--xp7Q3rQOLWBTmc" 
                  alt="Logo" 
                  className="h-10 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
            </div>
            
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2 ml-1">AI Studio</span>
            <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded ml-2 mb-2">v2.1</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-6 mr-6 text-xs font-medium text-gray-500 tracking-wide uppercase">
                <span className="hover:text-black cursor-pointer transition-colors">Documentation</span>
                <span className="hover:text-black cursor-pointer transition-colors">Support</span>
             </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">System Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1800px] mx-auto px-8 py-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;