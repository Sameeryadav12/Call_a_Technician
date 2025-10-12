import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { error:null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error('UI error:', error, info); }

  render(){
    if(this.state.error){
      return (
        <div className="min-h-screen bg-[#000154] text-white p-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <pre className="bg-black/30 p-4 rounded">{String(this.state.error)}</pre>
            <p className="mt-2 opacity-80">Check the console for details.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
