import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Settings } from 'lucide-react'

interface SettingsMenuProps {
  role?: string | null
}

export default function SettingsMenu({ role }: SettingsMenuProps) {
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('h-9 w-9')}>
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-40 p-2 flex flex-col gap-1"
      >
       
          <NavLink
            to="/access/admin-features"
            onClick={handleClose}
            className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            Header
          </NavLink>
       

        <NavLink
          to="/access/idoc"
          onClick={handleClose}
          className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
        >
          Dataroom
        </NavLink>

        <NavLink
          to="/forms"
          onClick={handleClose}
          className="px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
        >
          Form
        </NavLink>
      </PopoverContent>
    </Popover>
  )
}
