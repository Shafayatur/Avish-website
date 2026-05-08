import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="font-display text-6xl text-gradient-rose mb-4">AVISH</h1>
            <p className="font-body text-muted-foreground mb-8">Something went wrong. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="font-body text-xs tracking-[0.2em] uppercase px-8 py-3 rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
