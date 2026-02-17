import React from 'react';

function MinimalApp() {
  return (
    <div className="min-h-screen bg-green-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">✅ DEBY E-COMMERCE WORKING!</h1>
        <p className="text-xl mb-4">Frontend is loading correctly!</p>
        <p className="text-lg">Server restart successful.</p>
        <div className="mt-8 p-4 bg-white bg-opacity-20 rounded-lg">
          <p className="text-sm">If you see this green screen, React is working perfectly.</p>
        </div>
      </div>
    </div>
  );
}

export default MinimalApp;
