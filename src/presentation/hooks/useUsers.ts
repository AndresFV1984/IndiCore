import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { CreateUserDTO, User } from '../../core/domain/entities/User.js'
import { useUsersStore } from '../stores/usersStore.js'

const container = Container.getInstance()

export const useUsersHook = () => {
  const { users, loading, error, setLoading, setUsers, addUser, updateUser: patchUser, setError } =
    useUsersStore()

  useEffect(() => {
    if (useUsersStore.getState().users.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:users', () => container.getUserUseCases().getUsers())
      .then(fetched => {
        if (!cancelled) setUsers(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando usuarios')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setUsers, setError])

  const createUser = async (dto: CreateUserDTO) => {
    const user = await container.getUserUseCases().createUser(dto)
    addUser(user)
    return user
  }

  const updateUser = async (dto: CreateUserDTO) => {
    if (!dto.id) throw new Error('ID requerido')
    const user = User.create(dto)
    await container.getUserUseCases().updateUser(user)
    patchUser(user)
    return user
  }

  return { users, loading, error, createUser, updateUser }
}
