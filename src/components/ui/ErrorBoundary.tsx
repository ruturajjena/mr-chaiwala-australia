import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Rendered instead of the failed subtree. Defaults to nothing. */
  fallback?: ReactNode
}

/**
 * Keeps one broken section from taking the whole page with it.
 *
 * Every section below the theatre is a lazy chunk. If one fails to load — a
 * flaky mobile connection, a deploy that removed an old chunk while a tab was
 * open — React throws out of Suspense and, without a boundary, unmounts the
 * entire app, theatre included. With one, the visitor loses a section and keeps
 * the site.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[section failed to render]', error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
