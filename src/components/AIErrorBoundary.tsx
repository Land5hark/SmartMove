'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, WandSparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  feature: string; // e.g., "AI Tagging", "Room Suggestion"
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`AI Error in ${this.props.feature}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <WandSparkles className="h-4 w-4" />
          <AlertTitle>{this.props.feature} Unavailable</AlertTitle>
          <AlertDescription>
            AI features are temporarily unavailable. You can still manually enter information.
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Error details (dev mode)</summary>
                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error?.message}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default AIErrorBoundary;