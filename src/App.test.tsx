import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the project foundation heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /kalenderanalyse/i })).toBeInTheDocument()
    expect(screen.getByText(/strukturierte Basis/i)).toBeInTheDocument()
  })
})
