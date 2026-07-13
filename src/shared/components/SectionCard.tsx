type SectionCardProps = {
  title: string
  description: string
  status?: string
}

export function SectionCard({ title, description, status = 'Geplant' }: SectionCardProps) {
  return (
    <article className="section-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="section-card__status">{status}</span>
    </article>
  )
}
