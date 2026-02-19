import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const WINDOWS_URL = 'https://f001.backblazeb2.com/file/1994HipHop/CrateStream-Setup-1.0.0.exe';
  const MAC_ARM_URL = 'https://f001.backblazeb2.com/file/1994HipHop/CrateStream-Setup-1.0.0-arm64.dmg';
  const MAC_X64_URL = 'https://f001.backblazeb2.com/file/1994HipHop/CrateStream-Setup-1.0.0-x64.dmg';

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/crate-digging.jpg')`, backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/80 to-black/90" />
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `radial-gradient(circle at 50% 30%, rgba(255, 140, 0, 0.5) 0%, transparent 60%), radial-gradient(circle at 20% 70%, rgba(255, 215, 0, 0.3) 0%, transparent 50%)` }} />
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">

        {/* Logo */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="flex items-center justify-center gap-12 mb-8">
            <div className="text-center">
              <h1 className="text-8xl md:text-9xl font-black text-white leading-none tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600" style={{ WebkitTextStroke: '2px rgba(255, 140, 0, 0.3)', filter: 'drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5))' }}>CRATE</span>
                <span className="block" style={{ filter: 'drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.5))' }}>STREAM</span>
              </h1>
            </div>
            <div className="hidden md:block flex-shrink-0">
              <img src="/vinyl-crate.PNG" alt="Record Crate" className="w-40 h-40 object-contain drop-shadow-2xl" onError={e => { e.currentTarget.style.display = 'none'; }} />
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
            <span className="bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm font-bold">1979–2005</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-400/40 px-4 py-2 rounded-full backdrop-blur-sm">
            <span className="text-blue-400 font-bold text-sm">🚀 BETA RELEASE</span>
          </div>
        </div>

        {/* ── CTA SECTION ── */}
        <div className="mb-12 text-center w-full max-w-2xl">

          {/* Windows Download — primary */}
          <a href={WINDOWS_URL} className="inline-block w-full px-10 py-5 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white font-black rounded-2xl hover:from-orange-700 hover:via-orange-600 hover:to-orange-700 hover:scale-105 transition-all text-xl uppercase tracking-wider shadow-2xl border-4 border-orange-400/30 mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
            <div className="flex items-center justify-center gap-4">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download for Windows
            </div>
          </a>
          <p className="text-gray-400 text-sm mb-6">Free 7-day trial • Windows 10/11 • ~95MB</p>

          {/* Mac Downloads */}
          <div className="flex gap-3 mb-6">
            <a href={MAC_ARM_URL} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-bold rounded-xl transition-all border-2 border-blue-400/30 text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 814 1000">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.1 269-317.1 70.6 0 129.5 46.4 173.1 46.4 42.8 0 109.7-49.1 188.2-49.1 30.4 0 110.3 2.6 164.4 100.7zm-252.3-185.5c31.8-37.7 54.3-90.4 54.3-143.1 0-7.1-.6-14.3-1.9-20.1-51.6 1.9-112.7 34.4-149.3 76.4-28.5 32.4-55.1 85.1-55.1 138.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 46.4 0 102.8-31.1 136.5-71.1z"/>
              </svg>
              Mac — Apple Silicon (M1/M2/M3)
            </a>
            <a href={MAC_X64_URL} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-bold rounded-xl transition-all border-2 border-blue-400/30 text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 814 1000">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.1 269-317.1 70.6 0 129.5 46.4 173.1 46.4 42.8 0 109.7-49.1 188.2-49.1 30.4 0 110.3 2.6 164.4 100.7zm-252.3-185.5c31.8-37.7 54.3-90.4 54.3-143.1 0-7.1-.6-14.3-1.9-20.1-51.6 1.9-112.7 34.4-149.3 76.4-28.5 32.4-55.1 85.1-55.1 138.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 46.4 0 102.8-31.1 136.5-71.1z"/>
              </svg>
              Mac — Intel (x64)
            </a>
          </div>
          <p className="text-gray-500 text-xs mb-8">Mac: Unsigned — right-click → Open to launch</p>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Launch Web Player — prominent secondary CTA */}
          <button
            onClick={() => navigate('/listen')}
            className="w-full flex items-center justify-center gap-3 px-10 py-5 font-black rounded-2xl text-xl uppercase tracking-wider transition-all border-4 mb-2"
            style={{
              fontFamily: 'Impact, sans-serif',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
              borderColor: 'rgba(139,92,246,0.5)',
              color: '#c4b5fd',
              boxShadow: '0 0 30px rgba(139,92,246,0.2)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            🌐 Launch Web Player
          </button>
          <p className="text-gray-500 text-xs mb-8">Stream from any browser • Mobile friendly • No download needed</p>

          {/* Login + Discord */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/login')} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border-2 border-white/20">
              Login to Account
            </button>
            <a href="https://discord.gg/aGr2Cs9NFt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all border-2 border-indigo-400/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <div className="bg-black/60 backdrop-blur-md border-2 border-orange-500/40 rounded-xl p-8 text-center transform hover:scale-105 hover:border-orange-400/60 transition-all shadow-2xl">
            <div className="text-6xl mb-4">💿</div>
            <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>Deep Catalog</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">Complete albums, B-sides, rare cuts, and underground classics from the golden era</p>
          </div>
          <div className="bg-black/60 backdrop-blur-md border-2 border-orange-500/40 rounded-xl p-8 text-center transform hover:scale-105 hover:border-orange-400/60 transition-all shadow-2xl">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>Crate Digger's Paradise</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">Tracks you won't find on mainstream platforms. Real heads know.</p>
          </div>
          <div className="bg-black/60 backdrop-blur-md border-2 border-orange-500/40 rounded-xl p-8 text-center transform hover:scale-105 hover:border-orange-400/60 transition-all shadow-2xl">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>$3/Month</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">Unlimited streaming. No ads. Cancel anytime. Support the culture.</p>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20 max-w-2xl mb-8">
          <h3 className="text-orange-400 font-black text-lg mb-3 uppercase tracking-wider" style={{ fontFamily: 'Impact, sans-serif' }}>System Requirements</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div><span className="text-white font-bold">Windows:</span> 10/11 • 4GB RAM • 200MB storage</div>
            <div><span className="text-white font-bold">Mac:</span> macOS 10.15+ • Intel or Apple Silicon</div>
            <div><span className="text-white font-bold">Web:</span> Any modern browser • Mobile friendly</div>
            <div><span className="text-white font-bold">Internet:</span> Required for streaming</div>
          </div>
        </div>

        {/* Footer */}
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
