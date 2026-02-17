import React from 'react';

function TestApp() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🚀 DEBY E-COMMERCE TEST</h1>
        <p className="text-xl mb-4">React is working!</p>
        <p className="text-lg">If you see this, the frontend is loading correctly.</p>
        <div className="mt-8">
          <button 
            onClick={() => alert('Button clicked!')}
            className="bg-white text-blue-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestApp;
