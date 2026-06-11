import React from "react";
import { AlertTriangle } from "lucide-react";

// catches render errors below it and shows a fallback instead of a blank white screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // TODO: forward to an error reporter (Sentry, etc.) in prod
    console.error("Unhandled UI error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="card p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h1 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h1>
            <p className="text-text-secondary mb-6">
              An unexpected error occurred. You can try reloading the page.
            </p>
            <button
              type="button"
              onClick={() => {
                this.handleReset();
                window.location.reload();
              }}
              className="btn-primary px-6 py-2"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
