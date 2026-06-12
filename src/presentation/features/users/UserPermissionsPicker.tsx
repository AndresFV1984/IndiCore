import React from 'react'
import {
  USER_PERMISSION_CATALOG,
  type UserPermission,
} from '../../../core/domain/auth/userPermissions'

interface UserPermissionsPickerProps {
  selected: UserPermission[]
  onChange: (permissions: UserPermission[]) => void
}

const UserPermissionsPicker: React.FC<UserPermissionsPickerProps> = ({ selected, onChange }) => {
  const selectedSet = new Set(selected)

  const toggle = (permission: UserPermission) => {
    onChange(
      selectedSet.has(permission)
        ? selected.filter(item => item !== permission)
        : [...selected, permission]
    )
  }

  return (
    <div className="user-permissions-picker">
      {USER_PERMISSION_CATALOG.map(option => (
        <label key={option.id} className="user-permissions-picker__item">
          <input
            type="checkbox"
            checked={selectedSet.has(option.id)}
            onChange={() => toggle(option.id)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}

export default UserPermissionsPicker
