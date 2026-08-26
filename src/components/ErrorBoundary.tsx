import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Mind Check-in:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear URL params if corrupted and reload
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.href = cleanUrl;
    } catch {
      window.location.reload();
    }
  };

  private handleHardReset = () => {
    try {
      localStorage.removeItem('mind_checkin_current_student_v1');
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.href = cleanUrl;
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F7] text-[#2D2A26] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-[#EBE7E1] shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF1ED] text-[#E87A5D] border border-[#E87A5D]/20 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-serif font-bold text-[#2D2A26]">
                화면을 불러오는 중 문제가 발생했습니다
              </h1>
              <p className="text-xs sm:text-sm font-sans text-[#8C867E] leading-relaxed">
                스마트폰 브라우저 데이터 또는 네트워크 연결을 다시 확인해주세요. 아래 버튼을 눌러 초기 화면으로 돌아갈 수 있습니다.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#FAF9F7] rounded-xl border border-[#EBE7E1] text-[11px] font-mono text-[#8C867E] text-left break-all max-h-24 overflow-y-auto">
                {this.state.error.message || 'Unknown Error'}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-sm rounded-xl shadow-md shadow-[#E87A5D]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>새로고침 및 다시 접속</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full py-2.5 bg-[#F5EFE6] hover:bg-[#EBE7E1] text-[#3D3A35] font-sans font-bold text-xs rounded-xl border border-[#EBE7E1] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>기본 출석부 화면으로 이동</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
