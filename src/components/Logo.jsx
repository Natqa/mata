import { Link } from 'react-router-dom'

/** Czarny kwadrat 40px jak w Inspiration Board, w środku prosta "mata" z oddechem. */
export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="12" fill="#000" />
      <circle cx="20" cy="14" r="4" fill="#fff" />
      <path d="M10 27c3.5-4 6.5-6 10-6s6.5 2 10 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Logo({ to = '/' }) {
  return (
    <Link to={to} aria-label="Mata — strona główna" className="shrink-0 rounded-[12px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <LogoMark />
    </Link>
  )
}
