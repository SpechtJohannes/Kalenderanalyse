import { type ReactNode } from 'react'

type AppShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <p className="app-shell__eyebrow">Projektgrundlage</p>
        <h1>{title}</h1>
        <p className="app-shell__subtitle">{subtitle}</p>
      </header>
      {children}
    </main>
  )
}
