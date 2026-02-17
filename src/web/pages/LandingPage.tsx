import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Logged-in users go to account page (not player)
  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const DOWNLOAD_URL = 'https://f001.backblazeb2.com/file/1994HipHop/CrateStream-Setup-1.0.0.exe';

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/crate-digging.jpg')`,
          backgroundPosition: 'center',
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/80 to-black/90" />
      
      {/* Orange glow overlay */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(255, 140, 0, 0.5) 0%, transparent 60%),
            radial-gradient(circle at 20% 70%, rgba(255, 215, 0, 0.3) 0%, transparent 50%)
          `,
        }}
      />

      {/* Film grain texture */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo / Brand */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="flex items-center justify-center gap-12 mb-8">
            <div className="text-center">
              <h1 className="text-8xl md:text-9xl font-black text-white leading-none tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
                <span 
                  className="block text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600"
                  style={{ 
                    WebkitTextStroke: '2px rgba(255, 140, 0, 0.3)',
                    filter: 'drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5))'
                  }}
                >
                  CRATE
                </span>
                <span 
                  className="block"
                  style={{ 
                    filter: 'drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5))'
                  }}
                >
                  STREAM
                </span>
              </h1>
            </div>

            <div className="hidden md:block flex-shrink-0">
              <img 
                src="/vinyl-crate.PNG"
                alt="Record Crate" 
                className="w-40 h-40 object-contain drop-shadow-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
          
          <p className="text-2xl md:text-3xl text-orange-400 mb-3 font-black uppercase tracking-widest" style={{ fontFamily: 'Impact, sans-serif', textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)' }}>
            The Vault of 90s Hip-Hop
          </p>
          
          <div className="flex items-center justify-center gap-4 text-lg text-gray-200 mb-4">
            <span className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
              <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              <span className="font-bold">Over 100k tracks</span>
            </span>
            <span className="text-orange-400 font-bold">•</span>
            <span className="bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm font-bold">1979-2005</span>
          </div>

          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-400/40 px-4 py-2 rounded-full backdrop-blur-sm">
            <span className="text-blue-400 font-bold text-sm">🚀 BETA RELEASE</span>
          </div>
        </div>

        {/* Main Download CTA */}
        <div className="mb-12 text-center">
          <a
            href={DOWNLOAD_URL}
            className="inline-block px-16 py-6 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white font-black rounded-2xl hover:from-orange-700 hover:via-orange-600 hover:to-orange-700 hover:scale-105 transition-all text-2xl uppercase tracking-wider shadow-2xl border-4 border-orange-400/30"
            style={{ fontFamily: 'Impact, sans-serif' }}
          >
            <div className="flex items-center gap-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Download for Windows</span>
            </div>
          </a>
          
          <p className="text-gray-400 text-sm mt-4 font-medium">
            Free 7-day trial • Windows 10/11 • ~95MB
          </p>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border-2 border-white/20"
            >
              Login to Account
            </button>
            <a
              href="https://discord.gg/aGr2Cs9NFt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all border-2 border-indigo-400/30"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <div className="bg-black/60 backdrop-blur-md border-2 border-orange-500/40 rounded-xl p-8 text-center transform hover:scale-105 hover:border-orange-400/60 transition-all shadow-2xl">
            <div className="text-6xl mb-4">💿</div>
            <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
              Deep Catalog
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              Complete albums, B-sides, rare cuts, and underground classics from the golden era
            </p>
          </div>
          
          <div className="bg-black/60 backdrop-blur-md border-2 border-orange-500/40 rounded-xl p-8 text-center transform hover:scale-105 hover:border-orange-400/60 transition-all shadow-2xl">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
              Crate Digger's Paradise
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              Tracks you won't find on mainstream platforms. Real heads know.
            </p>
          </div>
          
          <div className="bg-black/60 backdrop-blur-md border-2 border-orange-500/40 rounded-xl p-8 text-center transform hover:scale-105 hover:border-orange-400/60 transition-all shadow-2xl">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
              $3/Month
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              Unlimited streaming. No ads. Cancel anytime. Support the culture.
            </p>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20 max-w-2xl mb-8">
          <h3 className="text-orange-400 font-black text-lg mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>
            System Requirements
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div><span className="text-white font-bold">OS:</span> Windows 10/11</div>
            <div><span className="text-white font-bold">RAM:</span> 4GB minimum</div>
            <div><span className="text-white font-bold">Storage:</span> 200MB free</div>
            <div><span className="text-white font-bold">Internet:</span> Required for streaming</div>
          </div>
        </div>

        {/* Web Player Notice */}
        <div className="bg-blue-600/10 border border-blue-400/30 rounded-xl p-4 max-w-2xl mb-8">
          <p className="text-blue-300 text-sm text-center">
            <span className="font-bold">🌐 Web Player Coming Soon</span> • Currently in development for browser & mobile access
          </p>
        </div>

        {/* Footer Quote */}
        <div className="text-center max-w-2xl bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
          <p className="text-gray-300 text-sm italic mb-3 font-medium">
            "If you're not diggin' in the crates, you're not really diggin' the culture."
          </p>
          <p className="text-orange-400 font-black uppercase text-sm tracking-widest" style={{ fontFamily: 'Impact, sans-serif' }}>
            Real Hip-Hop. No Algorithm. Just Crates. 👑
          </p>
        </div>
      </div>
    </div>
  );
}
