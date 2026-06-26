import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { APP_LOGO_SRC, APP_NAME, APP_TAGLINE } from '@/config/brand'
import { resolveDefaultRouteForSession } from '../../../core/domain/auth/authRouting'
import { useAuth } from '../../hooks/useAuth'
import './Login.css'

const LOGIN_TEST_ACCOUNTS = [
  {
    role: 'Administrador',
    roleKey: 'admin' as const,
    email: 'bayron@indicolors.com',
    password: 'Indiclors123*',
    initials: 'BY',
  },
  {
    role: 'Operador',
    roleKey: 'operator' as const,
    email: 'andres@indicolors.com',
    password: 'Indiclors123*',
    initials: 'AN',
  },
] as const

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 11V8a4 4 0 1 1 8 0v3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12s3.5-7 9-7c2.1 0 3.9.9 5.2 2.1M21 12s-3.5 7-9 7c-2.1 0-3.9-.9-5.2-2.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9.5 9.5 14.5 14.5M14.5 9.5 9.5 14.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )

const Login: React.FC = () => {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) {
    return <Navigate to={resolveDefaultRouteForSession(session)} replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await signIn({ email, password })
      if (!result.ok) {
        setError(
          result.error === 'inactive_user'
            ? 'Su usuario está inactivo. Contacte al administrador.'
            : 'Correo o contraseña incorrectos.'
        )
      }
    } catch {
      setError('No se pudo iniciar sesión. Intente de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const applyDemoAccount = (account: (typeof LOGIN_TEST_ACCOUNTS)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    setSelectedDemo(account.email)
    setError(null)
  }

  return (
    <div className="login-page">
      <div className="login-page__backdrop" aria-hidden>
        <span className="login-page__orb login-page__orb--one" />
        <span className="login-page__orb login-page__orb--two" />
        <span className="login-page__orb login-page__orb--three" />
        <span className="login-page__grid" />
      </div>

      <div className="login-layout">
        <aside className="login-hero">
          <div className="login-hero__brand">
            <img src={APP_LOGO_SRC} alt={APP_NAME} className="login-hero__logo" />
            <div>
              <p className="login-hero__eyebrow">{APP_TAGLINE}</p>
              <h1 className="login-hero__title">{APP_NAME}</h1>
            </div>
          </div>
          <p className="login-hero__copy">
            Gestione producción, pedidos y trazabilidad desde un solo panel operativo.
          </p>
          <ul className="login-hero__features">
            <li>Órdenes en planta en tiempo real</li>
            <li>Panel dedicado para operadores</li>
            <li>Seguimiento por proceso y entregas</li>
          </ul>
        </aside>

        <main className="login-panel">
          <div className="login-card">
            <header className="login-card__header">
              <p className="login-card__eyebrow">Bienvenido</p>
              <h2 className="login-card__title">Iniciar sesión</h2>
              <p className="login-card__subtitle">Ingrese sus credenciales corporativas para continuar.</p>
            </header>

            <form className="login-card__form" onSubmit={handleSubmit}>
              <label className="login-field" htmlFor="login-email">
                <span className="login-field__label">Correo electrónico</span>
                <span className="login-field__control">
                  <span className="login-field__icon">
                    <MailIcon />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="nombre@indicolors.com"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    required
                  />
                </span>
              </label>

              <label className="login-field" htmlFor="login-password">
                <span className="login-field__label">Contraseña</span>
                <span className="login-field__control">
                  <span className="login-field__icon">
                    <LockIcon />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-field__toggle"
                    onClick={() => setShowPassword(value => !value)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </span>
              </label>

              {error ? (
                <div className="login-card__error" role="alert">
                  <span className="login-card__error-dot" aria-hidden />
                  {error}
                </div>
              ) : null}

              <button type="submit" className="login-card__submit" disabled={submitting || loading}>
                {submitting ? (
                  <>
                    <span className="login-card__submit-spinner" aria-hidden />
                    Ingresando…
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>

            <section className="login-demo" aria-label="Usuarios de prueba">
              <div className="login-demo__head">
                <div>
                  <p className="login-demo__eyebrow">Acceso rápido</p>
                  <h3 className="login-demo__title">Usuarios de prueba</h3>
                </div>
                <span className="login-demo__badge">Demo</span>
              </div>

              <div className="login-demo__grid">
                {LOGIN_TEST_ACCOUNTS.map(account => (
                  <button
                    key={account.email}
                    type="button"
                    className={`login-demo__card login-demo__card--${account.roleKey}${
                      selectedDemo === account.email ? ' login-demo__card--active' : ''
                    }`}
                    onClick={() => applyDemoAccount(account)}
                  >
                    <span className={`login-demo__avatar login-demo__avatar--${account.roleKey}`}>
                      {account.initials}
                    </span>
                    <span className="login-demo__meta">
                      <span className="login-demo__role">{account.role}</span>
                      <span className="login-demo__email">{account.email}</span>
                      <code className="login-demo__password">{account.password}</code>
                    </span>
                    <span className="login-demo__action">Usar cuenta</span>
                  </button>
                ))}
              </div>

              <p className="login-demo__hint">
                Seleccione una cuenta para autocompletar el formulario y luego pulse{' '}
                <strong>Ingresar al sistema</strong>.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Login
