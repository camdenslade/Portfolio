import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: ''
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message
    };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('Renderer crash:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="viewer empty">
          App crashed: {this.state.message}
        </main>
      );
    }

    return this.props.children;
  }
}
