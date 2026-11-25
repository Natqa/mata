import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { UserMenu } from '@/components/UserMenu'

const LINKS = [
  { to: '/', label: 'Dobierz', end: true },
  { to: '/historia', label: 'Historia' },
  { to: '/biblioteka', label: 'Biblioteka' },
]

export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <nav className="flex items-center gap-4 sm:gap-12" aria-label="Główna">
        <Logo />
        <div className="flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {({ isActive }) => (
                <Button asChild variant="ghost" data-active={isActive} className="px-3 sm:px-4">
                  <span aria-current={isActive ? 'page' : undefined}>{l.label}</span>
                </Button>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <UserMenu />
    </header>
  )
}

export function PageShell({ children }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-[1200px] flex-col gap-10 p-4 sm:p-6">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-10 pb-20">{children}</main>
    </div>
  )
}
