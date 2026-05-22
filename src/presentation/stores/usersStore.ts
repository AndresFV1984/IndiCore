import { create } from 'zustand'
import { User } from '../../core/domain/entities/User.js'
export const useUsersStore = create<{ users: User[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setUsers: (u: User[]) => void; addUser: (u: User) => void; updateUser: (u: User) => void; setError: (e: string) => void }>(set => ({
  users: [], loading: false, error: null, setLoading: l => set({ loading: l }), setUsers: u => set({ users: u, loading: false, error: null }),
  addUser: u => set(s => ({ users: [...s.users, u] })), updateUser: u => set(s => ({ users: s.users.map(x => x.id === u.id ? u : x) })), setError: e => set({ error: e, loading: false }),
}))
