const AttLogo = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    role="img"
    aria-label="AT&T logo"
  >
    <defs>
      <clipPath id="attGlobeClip">
        <circle cx="16" cy="16" r="15" />
      </clipPath>
    </defs>
    <circle cx="16" cy="16" r="16" fill="#fff" />
    <circle cx="16" cy="16" r="15" fill="#009fdb" />
    <g
      clipPath="url(#attGlobeClip)"
      fill="none"
      stroke="#fff"
      strokeLinecap="round"
      transform="rotate(-25 16 16)"
    >
      <path d="M-4 6 Q16 2 36 6" strokeWidth="1.2" />
      <path d="M-4 11 Q16 7 36 11" strokeWidth="1.8" />
      <path d="M-4 16.5 Q16 12.5 36 16.5" strokeWidth="2.4" />
      <path d="M-4 22 Q16 18 36 22" strokeWidth="2.6" />
      <path d="M-4 27.5 Q16 23.5 36 27.5" strokeWidth="2" />
    </g>
  </svg>
);

export default AttLogo;
