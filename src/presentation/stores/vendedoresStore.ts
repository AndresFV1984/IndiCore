import { create } from 'zustand'
import { Vendedor } from '../../core/domain/entities/Vendedor.js'
export const useVendedoresStore = create<{ vendedores: Vendedor[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setVendedores: (v: Vendedor[]) => void; addVendedor: (v: Vendedor) => void; updateVendedor: (v: Vendedor) => void; setError: (e: string) => void }>(set => ({
  vendedores: [], loading: false, error: null, setLoading: l => set({ loading: l }), setVendedores: v => set({ vendedores: v, loading: false, error: null }),
  addVendedor: v => set(s => ({ vendedores: [...s.vendedores, v] })), updateVendedor: v => set(s => ({ vendedores: s.vendedores.map(x => x.id === v.id ? v : x) })), setError: e => set({ error: e, loading: false }),
}))
