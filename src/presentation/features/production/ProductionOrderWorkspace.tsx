import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductionWorkflowNav from './ProductionWorkflowNav'
import StatusBadge from '../../components/ui/StatusBadge'
import { useOrdersHook } from '../../hooks/useOrders'
import { Container } from '../../../di/container'
import { Money } from '../../../core/domain/value-objects/Money'
import { CreateOrderDTO, OrderSpecs } from '../../../core/domain/entities/Order'
import { ROUTES } from '../../../config/appRoutes'
import { formatProductionOrderId } from '../../../core/domain/value-objects/ProductionOrderId'
import {
  PRODUCTION_WORKFLOW_TABS,
  ProductionWorkflowTabId,
} from './productionTabs'
import '../remissions/Remissions.css'
import '../orders/Orders.css'
import './Production.css'
import ProductionKpiGrid from './ProductionKpiGrid'
import ProductionSpecsSubNav from './ProductionSpecsSubNav'
import ProductionPreprensaSubNav from './ProductionPreprensaSubNav'
import ProductionClientPicker from './ProductionClientPicker'
import ProductionVendedorPicker from './ProductionVendedorPicker'
import { SpecsSubTabId } from './productionSpecsSubTabs'
import { PreprensaSubTabId } from './productionPreprensaSubTabs'
import { Client } from '../../../core/domain/entities/Client'
import { Vendedor } from '../../../core/domain/entities/Vendedor'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import { emptyPreprensaDiseno, PreprensaDisenoSpecs } from '../../../core/domain/entities/PreprensaDiseno'
import { buildPreprensaFromHistorial, clearPreprensaHistorialSelection, normalizePreprensaSnapshot } from './utils/applyPreprensaFromHistorial'
import { applyColoresPlanchasForHistorialReuse, buildColoresPlanchasPatch } from './utils/coloresPlanchasUtils'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'
import ProductionPreprensaDiseno from './ProductionPreprensaDiseno'
import PreprensaDisenoModoShell from './PreprensaDisenoModoShell'
import { patchPreprensaDesignNuevo } from './utils/preprensaDesignNuevoChange'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { buildClienteDisenosFromOrders } from './utils/buildClienteDisenos'

const parseQuantityDigits = (value: string): number => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits)
}

const blockNonDigitKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]
  if (allowed.includes(e.key)) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

const emptySpecs = (): OrderSpecs => ({
  paperRows: [{ type: '', size: '', cut: '' }],
  quantity: 0,
  sheets: 0,
  leftover: 0,
  mounting: false,
  mountingValue: new Money(0),
  design: true,
  preprensaDiseno: emptyPreprensaDiseno(),
  plates: 0,
  platesValue: new Money(0),
  thousands: 0,
  inks: '',
  machineOutputValue: new Money(0),
  chapoliado: false,
  finishes: [],
  operations: [],
})

const ProductionOrderWorkspace: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const isNew = orderId === 'new'
  const { orders, loading: ordersLoading, createOrder } = useOrdersHook()

  const [activeTab, setActiveTab] = useState<ProductionWorkflowTabId>('especificaciones')
  const [specsSubTab, setSpecsSubTab] = useState<SpecsSubTabId>('cliente')
  const [preprensaSubTab, setPreprensaSubTab] = useState<PreprensaSubTabId>('diseno')
  const [clients, setClients] = useState<Client[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [planchas, setPlanchas] = useState<TamanoPlancha[]>([])
  const [preciosMontaje, setPreciosMontaje] = useState<PrecioMontaje[]>([])
  const [vendedorId, setVendedorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingOrder = useMemo(
    () => (isNew ? null : orders.find(o => o.id === orderId) ?? null),
    [isNew, orderId, orders]
  )

  const [clientId, setClientId] = useState('')
  const [workName, setWorkName] = useState('')
  const [specs, setSpecs] = useState<OrderSpecs>(emptySpecs)

  useEffect(() => {
    const container = Container.getInstance()
    container
      .getClientUseCases()
      .getClients()
      .then((list: Client[]) => {
        setClients(list)
      })
      .catch(() => setClients([]))
    container
      .getVendedorUseCases()
      .getVendedores()
      .then((list: Vendedor[]) => setVendedores(list))
      .catch(() => setVendedores([]))
    container
      .getTamanoPlanchaUseCases()
      .getTiposPlancha()
      .then(setPlanchas)
      .catch(() => setPlanchas([]))
    container
      .getPrecioMontajeUseCases()
      .getPreciosMontaje()
      .then(setPreciosMontaje)
      .catch(() => setPreciosMontaje([]))
  }, [])

  useEffect(() => {
    if (isNew) {
      setClientId('')
      setVendedorId('')
      setWorkName('')
      setSpecs(emptySpecs())
      setActiveTab('especificaciones')
      setSpecsSubTab('cliente')
      setPreprensaSubTab('diseno')
    }
  }, [orderId, isNew])

  useEffect(() => {
    if (isNew || !existingOrder) return
    setClientId(existingOrder.clientId)
    setVendedorId(existingOrder.vendedorId ?? '')
    setWorkName(existingOrder.workName)
    setSpecs({
      ...existingOrder.specs,
      preprensaDiseno: normalizePreprensaSnapshot(existingOrder.specs.preprensaDiseno),
    })
  }, [isNew, existingOrder])

  const clientName = clients.find(c => c.id === clientId)?.name ?? clientId

  const disenosCliente = useMemo(
    () =>
      buildClienteDisenosFromOrders(
        orders,
        clientId,
        isNew ? undefined : orderId
      ),
    [orders, clientId, isNew, orderId]
  )

  const updateSpecs = <K extends keyof OrderSpecs>(key: K, value: OrderSpecs[K]) => {
    setSpecs(prev => ({ ...prev, [key]: value }))
  }

  const updatePreprensaDiseno = (patch: Partial<PreprensaDisenoSpecs>) => {
    setSpecs(prev => {
      const next = { ...prev.preprensaDiseno, ...patch }
      return {
        ...prev,
        preprensaDiseno: next,
        design: next.designNuevo === 'si',
      }
    })
  }

  const applyHistorialTrabajo = (option: ClienteDisenoOption) => {
    const sourceOrder = orders.find(o => o.id === option.sourceOrderId)
    const raw = sourceOrder?.specs.preprensaDiseno ?? option.preprensaSnapshot
    const coloresPlanchas = applyColoresPlanchasForHistorialReuse(raw, specs.quantity, planchas)
    const preprensaDiseno: PreprensaDisenoSpecs = {
      ...emptyPreprensaDiseno(),
      ...buildPreprensaFromHistorial(raw, option.sourceOrderId, option.workName),
      ...buildColoresPlanchasPatch(coloresPlanchas),
    }
    setSpecs(prev => ({
      ...prev,
      design: false,
      preprensaDiseno,
    }))
  }

  const updatePaperRow = (index: number, field: 'type' | 'size' | 'cut', value: string) => {
    setSpecs(prev => {
      const rows = [...prev.paperRows]
      rows[index] = { ...rows[index], [field]: value }
      return { ...prev, paperRows: rows }
    })
  }

  const goToTab = (id: ProductionWorkflowTabId) => {
    setActiveTab(id)
    setError(null)
    if (id === 'prepensa') {
      setPreprensaSubTab('diseno')
    }
  }

  const goToAdjacentTab = (direction: -1 | 1) => {
    const index = PRODUCTION_WORKFLOW_TABS.findIndex(t => t.id === activeTab)
    const next = PRODUCTION_WORKFLOW_TABS[index + direction]
    if (next) goToTab(next.id)
  }

  const handleSave = async () => {
    if (!clientId.trim()) {
      setError('Selecciona un cliente en Especificaciones.')
      goToTab('especificaciones')
      setSpecsSubTab('cliente')
      return
    }
    if (!workName.trim()) {
      setError('Indica el nombre del trabajo.')
      goToTab('especificaciones')
      setSpecsSubTab('detalle-op')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const dto: CreateOrderDTO = {
        clientId: clientId.trim(),
        workName: workName.trim(),
        date: new Date(),
        specs: {
          ...specs,
          design: specs.preprensaDiseno.designNuevo === 'si',
        },
        vendedorId: vendedorId.trim() || undefined,
      }
      const order = await createOrder(dto)
      navigate(`${ROUTES.production.path}/${order.id}`, { replace: true })
    } catch {
      setError('No se pudo guardar la orden. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && !ordersLoading && orders.length > 0 && !existingOrder) {
    return (
      <div className="orders-container production-workspace">
        <p className="orders-error">No se encontró la orden solicitada.</p>
        <Link to={ROUTES.production.path} className="production-workspace-back">
          ← Volver al listado
        </Link>
      </div>
    )
  }

  if (ordersLoading && !isNew && !existingOrder) {
    return <div className="orders-loading">Cargando orden de producción…</div>
  }

  const activeStepIndex = PRODUCTION_WORKFLOW_TABS.findIndex(t => t.id === activeTab)
  const nextStep = PRODUCTION_WORKFLOW_TABS[activeStepIndex + 1]
  const orderCode = orderId ? formatProductionOrderId(orderId) : ''
  const title = isNew ? 'Nueva orden de producción' : `Orden ${orderCode}`
  const breadcrumbSuffix = isNew ? 'Nueva' : orderCode

  return (
    <div
      className={`remissions-container production-workspace${isNew ? ' production-workspace--new-order' : ''}`}
    >
      {!isNew && (
      <div className="remissions-header">
        <div className="remissions-header-left">
          <button
            type="button"
            className="production-workspace-back"
            onClick={() => navigate(ROUTES.production.path)}
          >
            ← Órdenes de producción
          </button>
          <h1 className="remissions-title">{title}</h1>
          <p className="remissions-breadcrumb">
            IndiColors › Producción › {breadcrumbSuffix}
            {workName ? ` · ${workName}` : ''}
          </p>
          {clientName && (
            <p className="remissions-breadcrumb" style={{ marginTop: 0 }}>
              {clientName}
            </p>
          )}
        </div>
        <div className="remissions-header-right">
          {existingOrder && <StatusBadge status={existingOrder.status} />}
        </div>
      </div>
      )}

      <ProductionKpiGrid orders={orders} />

      <section className="production-workspace-tabs-card" aria-label="Etapas de producción">
        <ProductionWorkflowNav active={activeTab} onChange={goToTab} />
        <div
          className="production-workspace-panel"
          role="tabpanel"
          id={`production-panel-${activeTab}`}
          aria-labelledby={`production-tab-${activeTab}`}
        >
          {error && (
            <p className="orders-error" style={{ marginBottom: '1rem' }} role="alert">
              {error}
            </p>
          )}

          {activeTab === 'especificaciones' && (
            <>
              <h2 className="production-workspace-panel-title production-specs-title">Especificaciones</h2>

              <div className="production-specs-layout">
                <ProductionSpecsSubNav active={specsSubTab} onChange={setSpecsSubTab} />

                <div className="production-specs-content">
              {specsSubTab === 'cliente' && (
                <div
                  className="production-specs-panel production-specs-panel--sections"
                  role="tabpanel"
                  id="production-specs-panel-cliente"
                  aria-labelledby="production-specs-subtab-cliente"
                >
                  <ProductionWorkspaceSection
                    tag="Cliente"
                    title="Datos del cliente"
                    subtitle="Seleccione quién encarga esta orden"
                    tone={0}
                  >
                    <ProductionClientPicker
                      clients={clients}
                      selectedId={clientId}
                      onSelect={client => {
                        setClientId(client?.id ?? '')
                        updatePreprensaDiseno(clearPreprensaHistorialSelection())
                      }}
                    />
                  </ProductionWorkspaceSection>
                </div>
              )}

              {specsSubTab === 'detalle-op' && (
                <div
                  className="production-specs-panel production-specs-panel--sections"
                  role="tabpanel"
                  id="production-specs-panel-detalle-op"
                  aria-labelledby="production-specs-subtab-detalle-op"
                >
                  <div className="production-ws-sections-stack">
                    <ProductionWorkspaceSection
                      tag="Trabajo"
                      title="Identificación del pedido"
                      tone={0}
                    >
                      <div className="production-form-grid production-form-grid--detalle-op">
                        <div className="production-form-field production-form-field--full">
                          <label className="production-form-label" htmlFor="prod-work">
                            Nombre del trabajo
                          </label>
                          <input
                            id="prod-work"
                            className="production-form-input"
                            value={workName}
                            onChange={e => setWorkName(e.target.value)}
                            placeholder="Ej. Catálogo corporativo 2026"
                          />
                        </div>
                        <div className="production-form-field">
                          <label className="production-form-label" htmlFor="prod-qty">
                            Cantidad
                          </label>
                          <input
                            id="prod-qty"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="production-form-input"
                            value={specs.quantity > 0 ? String(specs.quantity) : ''}
                            onChange={e =>
                              updateSpecs('quantity', parseQuantityDigits(e.target.value))
                            }
                            onKeyDown={blockNonDigitKey}
                            onPaste={e => {
                              e.preventDefault()
                              const pasted = e.clipboardData.getData('text')
                              updateSpecs('quantity', parseQuantityDigits(pasted))
                            }}
                            placeholder="Ej. 5000"
                            aria-label="Cantidad numérica"
                          />
                        </div>
                      </div>
                    </ProductionWorkspaceSection>
                    <ProductionWorkspaceSection
                      tag="Comercial"
                      title="Vendedor asignado"
                      tone={1}
                    >
                      <ProductionVendedorPicker
                        vendedores={vendedores}
                        selectedId={vendedorId}
                        onSelect={v => setVendedorId(v?.id ?? '')}
                      />
                    </ProductionWorkspaceSection>
                  </div>
                </div>
              )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'prepensa' && (
            <>
              <h2 className="production-workspace-panel-title production-specs-title">Preprensa</h2>

              <div className="production-specs-layout">
                <ProductionPreprensaSubNav active={preprensaSubTab} onChange={setPreprensaSubTab} />

                <div className="production-specs-content">
                  {preprensaSubTab === 'diseno' && (
                    <div
                      className="production-preprensa-diseno-detail"
                      role="tabpanel"
                      id="production-preprensa-panel-diseno"
                      aria-labelledby="production-preprensa-subtab-diseno"
                    >
                      <PreprensaDisenoModoShell
                        value={specs.preprensaDiseno.designNuevo}
                        onChange={value =>
                          updatePreprensaDiseno(patchPreprensaDesignNuevo(value))
                        }
                      />
                      <p className="production-workspace-panel-desc production-preprensa-diseno-desc">
                        Registre el tipo de diseño, complete los datos del arte (nombre, PDF, colores
                        y planchas) y seleccione los acabados que aplican a esta orden.
                      </p>
                      <ProductionPreprensaDiseno
                        diseno={specs.preprensaDiseno}
                        isNewOrder={isNew}
                        orderQuantity={specs.quantity}
                        clientId={clientId}
                        clientName={clientName}
                        clients={clients}
                        disenosCliente={disenosCliente}
                        ordersLoading={ordersLoading}
                        planchas={planchas}
                        preciosMontaje={preciosMontaje}
                        onChange={updatePreprensaDiseno}
                        onHistorialSelect={applyHistorialTrabajo}
                        onClientSelect={client => {
                          setClientId(client?.id ?? '')
                          updatePreprensaDiseno(clearPreprensaHistorialSelection())
                        }}
                        onGoToClienteTab={() => {
                          goToTab('especificaciones')
                          setSpecsSubTab('cliente')
                        }}
                        onGoToDetalleOpTab={() => {
                          goToTab('especificaciones')
                          setSpecsSubTab('detalle-op')
                        }}
                      />
                    </div>
                  )}

                  {preprensaSubTab === 'detalle' && (
                    <div
                      className="production-specs-panel production-specs-panel--sections"
                      role="tabpanel"
                      id="production-preprensa-panel-detalle"
                      aria-labelledby="production-preprensa-subtab-detalle"
                    >
                      <div className="production-ws-sections-stack">
                        <ProductionWorkspaceSection
                          tag="Planchas"
                          title="Planchas y montaje"
                          tone={0}
                        >
                      <div className="production-form-grid production-form-grid--3">
                        <div className="production-form-field">
                          <label className="production-form-label" htmlFor="prod-plates">
                            Nº planchas
                          </label>
                  <input
                    id="prod-plates"
                    type="number"
                    min={0}
                    className="production-form-input"
                    value={specs.plates || ''}
                    onChange={e => updateSpecs('plates', Number(e.target.value) || 0)}
                  />
                </div>
                <div className="production-form-field">
                  <label className="production-form-label" htmlFor="prod-plates-value">
                    Valor planchas
                  </label>
                  <input
                    id="prod-plates-value"
                    type="number"
                    min={0}
                    className="production-form-input"
                    value={specs.platesValue.getValue() || ''}
                    onChange={e =>
                      updateSpecs('platesValue', new Money(Number(e.target.value) || 0))
                    }
                  />
                </div>
                <div className="production-form-field">
                  <label className="production-form-label">
                    <input
                      type="checkbox"
                      checked={specs.mounting}
                      onChange={e => updateSpecs('mounting', e.target.checked)}
                    />{' '}
                    Montaje
                  </label>
                </div>
                {specs.mounting && (
                  <div className="production-form-field">
                    <label className="production-form-label" htmlFor="prod-mounting-value">
                      Valor montaje
                    </label>
                    <input
                      id="prod-mounting-value"
                      type="number"
                      min={0}
                      className="production-form-input"
                      value={specs.mountingValue?.getValue() ?? ''}
                      onChange={e =>
                        updateSpecs('mountingValue', new Money(Number(e.target.value) || 0))
                      }
                    />
                  </div>
                )}
                      </div>
                        </ProductionWorkspaceSection>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'corte-papel' && (
            <>
              <h2 className="production-workspace-panel-title">Corte de papel</h2>
              <p className="production-workspace-panel-desc">
                Tipo, tamaño y corte de papel; pliegos y sobrante.
              </p>
              <div className="production-ws-sections-stack">
                <ProductionWorkspaceSection
                  tag="Papel"
                  title="Tipo y dimensiones"
                  tone={0}
                >
                  <div className="production-form-grid production-form-grid--3">
                    {specs.paperRows.map((row, index) => (
                      <React.Fragment key={index}>
                        <div className="production-form-field">
                          <label className="production-form-label">Tipo de papel</label>
                          <input
                            className="production-form-input"
                            value={row.type}
                            onChange={e => updatePaperRow(index, 'type', e.target.value)}
                          />
                        </div>
                        <div className="production-form-field">
                          <label className="production-form-label">Tamaño</label>
                          <input
                            className="production-form-input"
                            value={row.size}
                            onChange={e => updatePaperRow(index, 'size', e.target.value)}
                            placeholder="90×64"
                          />
                        </div>
                        <div className="production-form-field">
                          <label className="production-form-label">Corte</label>
                          <input
                            className="production-form-input"
                            value={row.cut}
                            onChange={e => updatePaperRow(index, 'cut', e.target.value)}
                          />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </ProductionWorkspaceSection>
                <ProductionWorkspaceSection
                  tag="Pliegos"
                  title="Cantidades de corte"
                  tone={1}
                >
                  <div className="production-form-grid production-form-grid--2">
                    <div className="production-form-field">
                      <label className="production-form-label" htmlFor="prod-sheets">
                        Pliegos
                      </label>
                      <input
                        id="prod-sheets"
                        type="number"
                        min={0}
                        className="production-form-input"
                        value={specs.sheets || ''}
                        onChange={e => updateSpecs('sheets', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="production-form-field">
                      <label className="production-form-label" htmlFor="prod-leftover">
                        Sobrante
                      </label>
                      <input
                        id="prod-leftover"
                        type="number"
                        min={0}
                        className="production-form-input"
                        value={specs.leftover || ''}
                        onChange={e => updateSpecs('leftover', Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </ProductionWorkspaceSection>
              </div>
            </>
          )}

          {activeTab === 'impresion' && (
            <>
              <h2 className="production-workspace-panel-title">Impresión</h2>
              <p className="production-workspace-panel-desc">
                Parámetros de máquina, salida y acabados en línea de impresión.
              </p>
              <div className="production-ws-sections-stack">
                <ProductionWorkspaceSection
                  tag="Máquina"
                  title="Salida de impresión"
                  tone={2}
                >
                  <div className="production-form-field">
                    <label className="production-form-label" htmlFor="prod-machine">
                      Valor salida máquina
                    </label>
                    <input
                      id="prod-machine"
                      type="number"
                      min={0}
                      className="production-form-input"
                      value={specs.machineOutputValue.getValue() || ''}
                      onChange={e =>
                        updateSpecs('machineOutputValue', new Money(Number(e.target.value) || 0))
                      }
                    />
                  </div>
                </ProductionWorkspaceSection>
                <ProductionWorkspaceSection tag="Acabado" title="En línea" tone={0}>
                  <div className="production-form-field">
                    <label className="production-form-label">
                      <input
                        type="checkbox"
                        checked={specs.chapoliado}
                        onChange={e => updateSpecs('chapoliado', e.target.checked)}
                      />{' '}
                      Chapoliado
                    </label>
                  </div>
                </ProductionWorkspaceSection>
              </div>
            </>
          )}

          {activeTab === 'terminados' && (
            <>
              <h2 className="production-workspace-panel-title">Terminados</h2>
              <p className="production-workspace-panel-desc">
                Terminaciones del catálogo asignadas a esta orden (laminado, troquel, etc.).
              </p>
              <ProductionWorkspaceSection tag="Catálogo" title="Terminados vinculados" tone={1}>
                {specs.finishes.length > 0 ? (
                  <ul className="production-ws-list">
                    {specs.finishes.map((f, i) => (
                      <li key={i}>
                        {f.name} · Cant: {f.quantity} · {f.total.toString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="production-empty-hint">
                    Aún no hay terminados asignados. Podrás vincularlos desde el catálogo de Terminados.
                  </p>
                )}
              </ProductionWorkspaceSection>
            </>
          )}

          {activeTab === 'acabados' && (
            <>
              <h2 className="production-workspace-panel-title">Acabados</h2>
              <p className="production-workspace-panel-desc">
                Operaciones de acabado y mano de obra asociada a la orden.
              </p>
              <ProductionWorkspaceSection tag="Operaciones" title="Acabados vinculados" tone={2}>
                {specs.operations.length > 0 ? (
                  <ul className="production-ws-list">
                    {specs.operations.map((op, i) => (
                      <li key={i}>
                        {op.name} · {op.value.toString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="production-empty-hint">
                    Aún no hay operaciones de acabado. Podrás asignarlas desde el catálogo de Operaciones.
                  </p>
                )}
              </ProductionWorkspaceSection>
            </>
          )}

          <footer className="production-workspace-footer">
            <button
              type="button"
              className="production-btn-secondary"
              disabled={activeTab === PRODUCTION_WORKFLOW_TABS[0].id}
              onClick={() => goToAdjacentTab(-1)}
            >
              Anterior
            </button>
            {activeTab !== PRODUCTION_WORKFLOW_TABS[PRODUCTION_WORKFLOW_TABS.length - 1].id ? (
              <button
                type="button"
                className="orders-btn-new"
                onClick={() => goToAdjacentTab(1)}
              >
                {nextStep ? `Siguiente: ${nextStep.label}` : 'Siguiente etapa'}
              </button>
            ) : isNew ? (
              <button
                type="button"
                className="orders-btn-new"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Crear orden'}
              </button>
            ) : (
              <button type="button" className="orders-btn-new" onClick={() => navigate(ROUTES.production.path)}>
                Volver al listado
              </button>
            )}
          </footer>
        </div>
      </section>
    </div>
  )
}

export default ProductionOrderWorkspace
