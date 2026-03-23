import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error monitoring in production — do not expose to users
    if (process.env.NODE_ENV !== 'production') {
      console.error('Uncaught error:', error.message, errorInfo.componentStack);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
          <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-zinc-800 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-zinc-400 mb-6">
              เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณารีเฟรชหน้าเพจแล้วลองใหม่
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-xl transition-colors"
            >
              รีเฟรชหน้าเพจ
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
