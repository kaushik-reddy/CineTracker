import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-zinc-900 border border-zinc-800 rounded-lg">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                    <p className="text-zinc-400 mb-4 max-w-md">
                        The component crashed. This is likely due to a rendering error.
                    </p>
                    <div className="bg-zinc-800 p-4 rounded text-left overflow-auto max-w-full max-h-[200px] w-full">
                        <code className="text-xs text-red-300 font-mono">
                            {this.state.error && this.state.error.toString()}
                        </code>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-6 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
