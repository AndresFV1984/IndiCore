import colombiaData from 'colombia-cities/colombia_completa.json'

export type ColombiaMunicipality = {
  nombre: string
  codigo: string
  provincia: string
}

export type ColombiaDepartmentOption = {
  id: number
  nombre: string
  codigo: string
}

const departmentsSorted: ColombiaDepartmentOption[] = [...colombiaData.departamentos]
  .map(d => ({ id: d.id, nombre: d.nombre, codigo: d.codigo }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

export function listDepartments(): ColombiaDepartmentOption[] {
  return departmentsSorted
}

export function listCitiesByDepartment(departmentName: string): ColombiaMunicipality[] {
  if (!departmentName.trim()) return []
  const dept = colombiaData.departamentos.find(
    d => d.nombre.toLowerCase() === departmentName.trim().toLowerCase(),
  )
  if (!dept) return []
  return [...dept.municipios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function findCityByCode(code: string): (ColombiaMunicipality & { departamento: string }) | null {
  if (!code.trim()) return null
  for (const dept of colombiaData.departamentos) {
    const mun = dept.municipios.find(m => m.codigo === code)
    if (mun) return { ...mun, departamento: dept.nombre }
  }
  return null
}

export function formatLocationLabel(department: string, city: string): string {
  const dept = department.trim()
  const c = city.trim()
  if (!dept && !c) return '—'
  if (!dept) return c
  if (!c) return dept
  return `${dept} · ${c}`
}

/** Restaura selects al editar (por código DANE, nombre de ciudad o datos legacy). */
export function resolveLocationFields(
  city: string,
  department = '',
  cityCode = '',
): { department: string; city: string; cityCode: string } {
  if (cityCode) {
    const found = findCityByCode(cityCode)
    if (found) {
      return {
        department: found.departamento,
        city: found.nombre,
        cityCode: found.codigo,
      }
    }
  }

  if (department.trim() && city.trim()) {
    const match = listCitiesByDepartment(department).find(
      m => m.nombre.toLowerCase() === city.trim().toLowerCase(),
    )
    return {
      department: department.trim(),
      city: match?.nombre ?? city.trim(),
      cityCode: match?.codigo ?? cityCode,
    }
  }

  if (city.trim()) {
    const term = city.trim().toLowerCase()
    for (const dept of colombiaData.departamentos) {
      const match = dept.municipios.find(m => m.nombre.toLowerCase() === term)
      if (match) {
        return { department: dept.nombre, city: match.nombre, cityCode: match.codigo }
      }
    }
    return { department: '', city: city.trim(), cityCode: '' }
  }

  return { department: '', city: '', cityCode: '' }
}
