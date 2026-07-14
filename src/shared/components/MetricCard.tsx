type MetricCardProps = {
  label: string
  value: string
  unit?: string
  description?: string
}

export function MetricCard({ label, value, unit, description }: MetricCardProps) {
  return (
    <article className="metric-card">
      <h3 className="metric-card__label">{label}</h3>
      <p className="metric-card__measurement">
        <span className="metric-card__value">{value}</span>
        {unit && <span className="metric-card__unit">{unit}</span>}
      </p>
      {description && <p className="metric-card__description">{description}</p>}
    </article>
  )
}
