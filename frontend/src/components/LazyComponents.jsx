import { lazy, Suspense, Component } from 'react';

// Only keep lazy exports for components that actually exist in the codebase.
export const LazyReviewsSection = lazy(() => import('./reviews/ReviewsSection'));
export const LazyReviewForm = lazy(() => import('./reviews/ReviewForm'));

// Wrapper component for lazy loading with loading states. The actual lazy imports live
// beside the components that need them to avoid Vite trying to import missing files.
// This helper simply wraps any passed-in lazy component with a Suspense boundary.
export const LazyWrapper = ({
  children,
  fallback = <div className="animate-pulse bg-gray-200 h-20 rounded"></div>,
  errorFallback = <div className="text-red-500">Failed to load component</div>
}) => (
  <Suspense fallback={fallback}>
    <ErrorBoundary fallback={errorFallback}>
      {children}
    </ErrorBoundary>
  </Suspense>
);

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
