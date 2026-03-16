import { Button } from "@heroui/react";
import * as React from "react";
import { Home, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-danger/10 blur-3xl rounded-full pointer-events-none -z-10" />
          <h1 className="text-6xl font-black text-danger">Oops!</h1>
          <p className="mt-4 text-xl font-bold tracking-tight text-foreground">
            Something went wrong
          </p>
          <p className="mt-2 text-base text-muted max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div className="mt-8 flex gap-3">
            <Button onPress={this.handleReset}>
              <RefreshCw className="size-4 mr-1" />
              Try Again
            </Button>
            <Link to="/">
              <Button>
                <Home className="size-4 mr-1" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
