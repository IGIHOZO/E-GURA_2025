import React from 'react';

const TestPage = () => {
  console.log('TestPage component mounted!');
  
  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '48px' }}>✅ React is Working!</h1>
      <p style={{ color: '#666', fontSize: '24px' }}>If you can see this, React is rendering correctly.</p>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '10px' }}>
        <h2>System Status:</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✅ React App Loaded</li>
          <li>✅ Component Rendering</li>
          <li>✅ CSS Working</li>
        </ul>
      </div>
      
      <button 
        onClick={() => {
          fetch('/api/health')
            .then(res => res.json())
            .then(data => alert('Backend Status: ' + JSON.stringify(data)))
            .catch(err => alert('Backend Error: ' + err.message));
        }}
        style={{
          marginTop: '30px',
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Backend Connection
      </button>
    </div>
  );
};

export default TestPage;
