import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class MobileErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-red-50 p-4 overflow-y-auto z-50">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Erro Detectado
            </h2>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Mensagem:</h3>
                <pre className="bg-red-100 p-3 rounded text-xs overflow-x-auto">
                  {this.state.error?.toString()}
                </pre>
              </div>

              {this.state.error?.stack && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Stack:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              {this.state.errorInfo && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Componente:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null })
                window.location.reload()
              }}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default MobileErrorBoundary
