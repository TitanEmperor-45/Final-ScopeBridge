import React from 'react';

interface StaySyncLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export const StaySyncLogo: React.FC<StaySyncLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  textColor = 'text-white',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* StaySync Gold & Navy Shield Icon matching user desktop icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        className="shrink-0 drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoNavyBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0e1f38" />
            <stop offset="40%" stopColor="#0b172a" />
            <stop offset="100%" stopColor="#060c17" />
          </linearGradient>
          <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff0a6" />
            <stop offset="25%" stopColor="#e6bf65" />
            <stop offset="60%" stopColor="#d4a340" />
            <stop offset="100%" stopColor="#9a711c" />
          </linearGradient>
          <linearGradient id="logoGoldBright" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4a340" />
            <stop offset="50%" stopColor="#fff2b3" />
            <stop offset="100%" stopColor="#d4a340" />
          </linearGradient>
        </defs>

        {/* Navy Rounded Container */}
        <rect width="512" height="512" rx="100" fill="url(#logoNavyBg)" />
        <rect width="504" height="504" x="4" y="4" rx="96" fill="none" stroke="url(#logoGold)" strokeWidth="4" opacity="0.4" />

        <g transform="translate(0, -10)">
          {/* Top Center Crest Diamond */}
          <path d="M256 92 L264 104 L256 116 L248 104 Z" fill="url(#logoGoldBright)" />

          {/* Crown Structure */}
          <path
            d="M256 120 C262 120 270 126 278 136 L312 118 C306 142 296 160 286 168 L308 174 C286 182 272 184 256 184 C240 184 226 182 204 174 L226 168 C216 160 206 142 200 118 L234 136 C242 126 250 120 256 120 Z"
            fill="url(#logoGold)"
          />

          {/* Crown Base Band */}
          <path
            d="M214 186 C228 190 242 192 256 192 C270 192 284 190 298 186 L296 192 C282 196 269 198 256 198 C243 198 230 196 216 192 Z"
            fill="url(#logoGoldBright)"
          />

          {/* Outer Shield Frame */}
          <path
            d="M192 210 C212 202 234 198 256 198 C278 198 300 202 320 210 L320 286 C320 330 288 358 256 372 C224 358 192 330 192 286 Z"
            fill="none"
            stroke="url(#logoGold)"
            strokeWidth="7"
            strokeLinejoin="round"
          />

          {/* Top Arch Inner Rim */}
          <path
            d="M202 222 C218 215 236 211 256 211 C276 211 294 215 310 222"
            fill="none"
            stroke="url(#logoGoldBright)"
            strokeWidth="3"
          />

          {/* 4 Classical Pillars */}
          <rect x="210" y="238" width="16" height="66" rx="8" fill="url(#logoGold)" />
          <rect x="234" y="234" width="16" height="74" rx="8" fill="url(#logoGold)" />
          <rect x="262" y="234" width="16" height="74" rx="8" fill="url(#logoGold)" />
          <rect x="286" y="238" width="16" height="66" rx="8" fill="url(#logoGold)" />

          {/* Pillar Base Rail */}
          <path
            d="M204 314 C220 326 238 334 256 338 C274 334 292 326 308 314"
            fill="none"
            stroke="url(#logoGoldBright)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <polygon points="256,380 262,370 250,370" fill="url(#logoGoldBright)" />

          {/* STAYSYNC text */}
          <text
            x="256"
            y="426"
            fontFamily="'Cinzel', 'Trajan Pro', 'Montserrat', 'Georgia', serif"
            fontSize="34"
            fontWeight="900"
            letterSpacing="9"
            fill="url(#logoGoldBright)"
            textAnchor="middle"
          >
            STAYSYNC
          </text>
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-wider text-xs font-serif ${textColor}`}>STAYSYNC</span>
          <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">ScopeBridg</span>
        </div>
      )}
    </div>
  );
};
