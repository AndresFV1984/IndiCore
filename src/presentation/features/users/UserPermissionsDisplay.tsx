import React, { useId, useMemo, useState } from 'react'
import {
  hasFullUserPermissions,
  USER_PERMISSION_CATALOG,
  type UserPermission,
} from '../../../core/domain/auth/userPermissions'

interface UserPermissionsDisplayProps {
  permissions: readonly UserPermission[]
  className?: string
}

const UserPermissionsDisplay: React.FC<UserPermissionsDisplayProps> = ({
  permissions,
  className,
}) => {
  const listId = useId()
  const [open, setOpen] = useState(false)

  const fullAccess = useMemo(() => hasFullUserPermissions(permissions), [permissions])

  const sortedLabels = useMemo(() => {
    const selected = new Set(permissions)
    return USER_PERMISSION_CATALOG.filter(item => selected.has(item.id)).map(item => item.label)
  }, [permissions])

  if (!permissions.length) {
    return <span className="users-permissions-display users-permissions-display--empty">—</span>
  }

  const summaryLabel = fullAccess
    ? `Acceso completo (${permissions.length})`
    : `${permissions.length} permiso${permissions.length === 1 ? '' : 's'}`

  return (
    <div className={['users-permissions-display', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={[
          'users-permissions-display__toggle',
          open && 'users-permissions-display__toggle--open',
          fullAccess && 'users-permissions-display__toggle--full',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-expanded={open}
        aria-controls={listId}
        onClick={e => {
          e.stopPropagation()
          setOpen(prev => !prev)
        }}
      >
        <span className="users-permissions-display__summary">{summaryLabel}</span>
        <span className="users-permissions-display__chevron" aria-hidden />
      </button>

      {open ? (
        <ul
          id={listId}
          className="users-permissions-display__list"
        >
          {sortedLabels.map(label => (
            <li key={label} className="users-permissions-display__item">
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default UserPermissionsDisplay
