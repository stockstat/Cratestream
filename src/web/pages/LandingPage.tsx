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

  const DOWNLOAD_WIN     = 'https://f001.backblazeb2.com/file/1994HipHop/CrateStream-Setup-1.0.0.exe';
  const DOWNLOAD_MAC_ARM = 'https://f001.backblazeb2.com/file/1994HipHop/CrateStream-Setup-1.0.0-arm64.dmg';
  const DOWNLOAD_MAC_X64 = 'https://f001.backblazeb2.com/file/1994HipHop/CrateStream-Setup-1.0.0-x64.dmg';

  const btnHover = (el: HTMLAnchorElement, on: boolean, shadow: string) => {
    el.style.transform = on ? 'translateY(-2px)' : 'translateY(0)';
    el.style.boxShadow = shadow;
  };

  return (
    <div className="min-h-screen relative overflow-auto" style={{ backgroundColor: '#1a0f0a' }}>

      {/* ── BRICK WALL BACKGROUND ── */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ backgroundColor: '#5c2d1e' }} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Crect width='120' height='60' fill='%235c2d1e'/%3E%3Crect x='1' y='1' width='57' height='27' rx='1' fill='%23763828' stroke='%233d1a0e' stroke-width='1.5'/%3E%3Crect x='62' y='1' width='57' height='27' rx='1' fill='%236b3020' stroke='%233d1a0e' stroke-width='1.5'/%3E%3Crect x='-29' y='32' width='57' height='27' rx='1' fill='%23703322' stroke='%233d1a0e' stroke-width='1.5'/%3E%3Crect x='32' y='32' width='57' height='27' rx='1' fill='%237a3a26' stroke='%233d1a0e' stroke-width='1.5'/%3E%3Crect x='93' y='32' width='57' height='27' rx='1' fill='%236e3120' stroke='%233d1a0e' stroke-width='1.5'/%3E%3Cline x1='0' y1='30' x2='120' y2='30' stroke='%232e1208' stroke-width='2'/%3E%3Cline x1='60' y1='0' x2='60' y2='30' stroke='%232e1208' stroke-width='2'/%3E%3Cline x1='31' y1='30' x2='31' y2='60' stroke='%232e1208' stroke-width='2'/%3E%3Cline x1='92' y1='30' x2='92' y2='60' stroke='%232e1208' stroke-width='2'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 60px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.7) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.8) 0%, transparent 60%),
              radial-gradient(ellipse at 0% 50%, rgba(0,0,0,0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 100% 50%, rgba(0,0,0,0.4) 0%, transparent 50%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 15% 40%, rgba(255,140,0,0.6) 0%, transparent 30%),
              radial-gradient(circle at 85% 60%, rgba(100,180,255,0.5) 0%, transparent 25%),
              radial-gradient(circle at 50% 80%, rgba(140,80,200,0.4) 0%, transparent 30%),
              radial-gradient(circle at 70% 20%, rgba(80,200,120,0.3) 0%, transparent 20%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start pt-10 pb-16 px-4">

        {/* ── HERO LOGO ── */}
        <div className="w-full flex justify-center mb-8" style={{ maxWidth: '680px' }}>
          <div
            className="relative w-full"
            style={{
              filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 60px rgba(255,140,0,0.15))',
              animation: 'logoEntrance 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          >
            <img
              src="/Cratestream.PNG"
              alt="CrateStream"
              className="w-full h-auto"
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* ── TAGLINE ── */}
        <div className="text-center mb-8" style={{ animation: 'fadeUp 0.6s 0.3s ease both' }}>
          <p
            className="text-2xl md:text-3xl text-orange-400 font-black uppercase tracking-widest mb-3"
            style={{
              fontFamily: 'Impact, "Arial Narrow", sans-serif',
              textShadow: '2px 2px 0 #000, 0 0 20px rgba(255,140,0,0.4)',
            }}
          >
            The Vault of 90s Hip-Hop
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span
              className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-200 text-sm font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
            >
              <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              Over 100k tracks
            </span>
            <span className="text-orange-500 font-black text-lg">•</span>
            <span
              className="px-4 py-2 rounded-full text-gray-200 text-sm font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
            >
              1979 – 2005
            </span>
            <span
              className="flex items-center gap-2 px-4 py-2 rounded-full text-blue-300 text-sm font-bold"
              style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(96,165,250,0.3)', backdropFilter: 'blur(8px)' }}
            >
              🚀 BETA RELEASE
            </span>
          </div>
        </div>

        {/* ── DOWNLOAD BUTTONS ── */}
        <div className="mb-8 text-center w-full" style={{ maxWidth: '620px', animation: 'fadeUp 0.6s 0.45s ease both' }}>

          {/* Windows */}
          <a
            href={DOWNLOAD_WIN}
            className="inline-flex items-center justify-center gap-4 w-full px-10 py-5 font-black rounded-2xl uppercase tracking-wider text-xl text-white mb-3"
            style={{
              fontFamily: 'Impact, "Arial Narrow", sans-serif',
              background: 'linear-gradient(135deg, #c2410c, #ea580c, #fb923c)',
              boxShadow: '0 4px 0 #7c2d12, 0 8px 30px rgba(234,88,12,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              border: '2px solid rgba(253,186,116,0.3)',
              textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => btnHover(e.currentTarget as HTMLAnchorElement, true,  '0 6px 0 #7c2d12, 0 12px 40px rgba(234,88,12,0.6), inset 0 1px 0 rgba(255,255,255,0.15)')}
            onMouseLeave={e => btnHover(e.currentTarget as HTMLAnchorElement, false, '0 4px 0 #7c2d12, 0 8px 30px rgba(234,88,12,0.5), inset 0 1px 0 rgba(255,255,255,0.15)')}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download for Windows
          </a>
          <p className="text-gray-400 text-xs mb-5 font-medium tracking-wide">
            Free 7-day trial • Windows 10/11 • ~95MB
          </p>

          {/* Mac — two buttons side by side */}
          <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <a
              href={DOWNLOAD_MAC_ARM}
              className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 font-black rounded-2xl uppercase tracking-wider text-base text-white"
              style={{
                fontFamily: 'Impact, "Arial Narrow", sans-serif',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6)',
                boxShadow: '0 4px 0 #1e3a8a, 0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                border: '2px solid rgba(147,197,253,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => btnHover(e.currentTarget as HTMLAnchorElement, true,  '0 6px 0 #1e3a8a, 0 12px 32px rgba(37,99,235,0.55), inset 0 1px 0 rgba(255,255,255,0.15)')}
              onMouseLeave={e => btnHover(e.currentTarget as HTMLAnchorElement, false, '0 4px 0 #1e3a8a, 0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)')}
            >
              {/* Apple icon */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 814 1000">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 411.8 45 299.3 95.5 231.4c34.2-46.4 88-73.8 145-73.8 57.5 0 96.7 39.5 146 39.5 47.5 0 92.7-39.5 153.9-39.5 62.9-.1 116.1 25.3 148.7 83.3zm-237.6-69.6c28.5-35.4 48.1-84.5 48.1-133.5 0-6.4-.6-12.9-1.9-18-.1-.2-.3-.4-.5-.5-44.3 1.8-97.4 30-127.5 69.3-25.8 33.1-49.5 82-49.5 131.6 0 7.1 1.3 14.1 1.9 16.3.3.1.7.1 1 .1 39.8 0 90.5-26.8 128.4-65.3z"/>
              </svg>
              Mac — Apple Silicon (M1/M2/M3)
            </a>
            <a
              href={DOWNLOAD_MAC_X64}
              className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 font-black rounded-2xl uppercase tracking-wider text-base text-white"
              style={{
                fontFamily: 'Impact, "Arial Narrow", sans-serif',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6)',
                boxShadow: '0 4px 0 #1e3a8a, 0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                border: '2px solid rgba(147,197,253,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => btnHover(e.currentTarget as HTMLAnchorElement, true,  '0 6px 0 #1e3a8a, 0 12px 32px rgba(37,99,235,0.55), inset 0 1px 0 rgba(255,255,255,0.15)')}
              onMouseLeave={e => btnHover(e.currentTarget as HTMLAnchorElement, false, '0 4px 0 #1e3a8a, 0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)')}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 814 1000">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 411.8 45 299.3 95.5 231.4c34.2-46.4 88-73.8 145-73.8 57.5 0 96.7 39.5 146 39.5 47.5 0 92.7-39.5 153.9-39.5 62.9-.1 116.1 25.3 148.7 83.3zm-237.6-69.6c28.5-35.4 48.1-84.5 48.1-133.5 0-6.4-.6-12.9-1.9-18-.1-.2-.3-.4-.5-.5-44.3 1.8-97.4 30-127.5 69.3-25.8 33.1-49.5 82-49.5 131.6 0 7.1 1.3 14.1 1.9 16.3.3.1.7.1 1 .1 39.8 0 90.5-26.8 128.4-65.3z"/>
              </svg>
              Mac — Intel (x64)
            </a>
          </div>
          <p className="text-gray-400 text-xs mb-5 font-medium tracking-wide">
            Free 7-day trial • macOS 10.12+ • ~150MB • Unsigned — right-click → Open to launch
          </p>

          {/* Secondary buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 px-6 py-3 font-bold rounded-xl text-sm text-white transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              Login to Account
            </button>
            <a
              href="https://discord.gg/aGr2Cs9NFt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl text-sm text-white transition-all duration-150"
              style={{
                background: 'rgba(88,101,242,0.25)',
                border: '2px solid rgba(88,101,242,0.5)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(88,101,242,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(88,101,242,0.25)')}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </div>

        {/* ── FEATURES GRID ── */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8"
          style={{ maxWidth: '900px', animation: 'fadeUp 0.6s 0.6s ease both' }}
        >
          {[
            { emoji: '💿', title: 'Deep Catalog', desc: 'Complete albums, B-sides, rare cuts, and underground classics from the golden era' },
            { emoji: '📦', title: "Crate Digger's Paradise", desc: "Tracks you won't find on mainstream platforms. Real heads know." },
            { emoji: '💰', title: '$3/Month', desc: 'Unlimited streaming. No ads. Cancel anytime. Support the culture.' },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="rounded-xl p-6 text-center transition-all duration-200"
              style={{
                background: 'rgba(0,0,0,0.65)',
                border: '2px solid rgba(255,140,0,0.25)',
                backdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.border = '2px solid rgba(255,140,0,0.55)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.border = '2px solid rgba(255,140,0,0.25)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              <div className="text-5xl mb-3">{emoji}</div>
              <h3
                className="text-white font-black text-lg mb-2 uppercase tracking-wider"
                style={{ fontFamily: 'Impact, "Arial Narrow", sans-serif' }}
              >
                {title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── SYSTEM REQUIREMENTS ── */}
        <div
          className="w-full rounded-xl p-5 mb-5"
          style={{
            maxWidth: '700px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,140,0,0.2)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeUp 0.6s 0.75s ease both',
          }}
        >
          <h3
            className="text-orange-400 font-black text-base mb-3 uppercase tracking-widest"
            style={{ fontFamily: 'Impact, "Arial Narrow", sans-serif' }}
          >
            System Requirements
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-300">
            <div><span className="text-orange-300 font-bold">Windows:</span> 10/11 (x64)</div>
            <div><span className="text-blue-300 font-bold">Mac:</span> macOS 10.12+ (Intel & Apple Silicon)</div>
            <div><span className="text-white font-bold">RAM:</span> 4GB minimum</div>
            <div><span className="text-white font-bold">Storage:</span> 200MB free</div>
            <div><span className="text-white font-bold">Internet:</span> Required for streaming</div>
          </div>
        </div>

        {/* ── LAUNCH WEB PLAYER ── */}
        <div
          className="w-full mb-6"
          style={{ maxWidth: '700px', animation: 'fadeUp 0.6s 0.85s ease both' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">or stream from your browser</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <button
            onClick={() => navigate('/listen')}
            className="w-full inline-flex items-center justify-center gap-3 px-10 py-5 font-black rounded-2xl uppercase tracking-wider text-xl"
            style={{
              fontFamily: 'Impact, "Arial Narrow", sans-serif',
              background: 'linear-gradient(135deg, rgba(88,28,135,0.6), rgba(109,40,217,0.6), rgba(139,92,246,0.6))',
              boxShadow: '0 4px 0 rgba(60,10,100,0.8), 0 8px 30px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '2px solid rgba(196,181,253,0.35)',
              color: '#e9d5ff',
              textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 0 rgba(60,10,100,0.8), 0 12px 40px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 rgba(60,10,100,0.8), 0 8px 30px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            🌐 Launch Web Player
          </button>
          <p className="text-gray-500 text-xs mt-2 text-center font-medium tracking-wide">
            Stream from any browser • Mobile friendly • No download needed
          </p>
        </div>

        {/* ── FOOTER QUOTE ── */}
        <div
          className="w-full rounded-xl p-5 text-center"
          style={{
            maxWidth: '700px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,140,0,0.15)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeUp 0.6s 0.95s ease both',
          }}
        >
          <p className="text-gray-300 text-sm italic mb-2 font-medium">
            "If you're not diggin' in the crates, you're not really diggin' the culture."
          </p>
          <p
            className="text-orange-400 font-black uppercase text-xs tracking-widest"
            style={{ fontFamily: 'Impact, "Arial Narrow", sans-serif' }}
          >
            Real Hip-Hop. No Algorithm. Just Crates. 👑
          </p>
        </div>
      </div>

      {/* ── KEYFRAME ANIMATIONS ── */}
      <style>{`
        @keyframes logoEntrance {
          from { opacity: 0; transform: scale(0.92) translateY(-20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
