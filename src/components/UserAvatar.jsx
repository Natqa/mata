import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const FONT = { sm: 'text-[24px]', default: 'text-[32px]', lg: 'text-[40px]' }

/**
 * shadcn Avatar with the Figma look: black circle, photo on top.
 * Falls back to the first letter of the name.
 * size: 'sm' (24px, header) | 'default' (32px) | 'lg' (40px); className can override.
 */
export function UserAvatar({ url, name, size = 'default', className }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    // Root font size = avatar size, so the initial scales with it (0.45em).
    <Avatar size={size} className={cn('after:hidden', FONT[size], className)}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback className="bg-black text-[0.45em] font-medium text-white">
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
