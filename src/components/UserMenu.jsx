import { LogOut, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { resetMockData } from '@/lib/mock/store'
import { isMockMode } from '@/lib/supabase'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const name = user?.email?.split('@')[0] || 'Konto'

  async function handleSignOut() {
    const { error } = await signOut()
    if (error) toast.error(error.message)
    else navigate('/login', { replace: true })
  }

  async function handleResetMock() {
    await signOut()
    resetMockData()
    window.location.assign('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-[220px] px-2 sm:pr-3" aria-label={`Menu konta ${name}`}>
          <UserAvatar name={name} size="sm" />
          <span className="hidden truncate sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel className="truncate font-normal text-ink-muted">{user?.email}</DropdownMenuLabel>
        <DropdownMenuGroup className="flex flex-col gap-1">
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut />
            Wyloguj się
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {isMockMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleResetMock}>
              <RotateCcw />
              Wyczyść dane mock
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
