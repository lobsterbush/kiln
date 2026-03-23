import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[Kiln] Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <p className="text-6xl font-bold text-slate-200">Oops</p>
          <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
            An unexpected error occurred. Try refreshing the page — if the problem persists,{' '}
            <a
              href="mailto:charles.crabtree@monash.edu?subject=Kiln error report"
              className="text-kiln-600 hover:underline"
            >
              contact support
            </a>
            .
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-kiln-600 text-white font-semibold rounded-xl hover:bg-kiln-700 transition-all shadow-sm"
          >
            Refresh page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
