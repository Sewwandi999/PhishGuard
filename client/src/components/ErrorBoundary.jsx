import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="bg-white border border-red-100 rounded-xl p-6">
          <p className="text-red-900">This section could not be displayed.</p>
          <p className="text-slate-600 mt-2">{String(this.state.error.message || this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
