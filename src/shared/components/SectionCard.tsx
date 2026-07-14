import type { ReactNode } from 'react'

type SectionCardProps = {
  title: string
  description: string
  status?: string
  children?: ReactNode
}

export function SectionCard({
  title,
  description,
  status = 'Geplant',
  children,
}: SectionCardProps) {
  return (
    <article className="section-card">
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      <span className="section-card__status">{status}</span>
    </article>
  )
}
