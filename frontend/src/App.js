import React, { useState } from 'react';
import './App.css';
import Calculator from './components/Calculator';
import ImageUpload from './components/ImageUpload';
import Notes from './components/Notes';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Online Calculator</h1>
        <nav className="nav-tabs">
          <button
            className={activeTab === 'calculator' ? 'active' : ''}
            onClick={() => setActiveTab('calculator')}
          >
            Calculator
          </button>
          <button
            className={activeTab === 'image' ? 'active' : ''}
            onClick={() => setActiveTab('image')}
          >
            Image Upload
          </button>
          <button
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
        </nav>
      </header>

      <main className="App-main">
        {activeTab === 'calculator' && <Calculator />}
        {activeTab === 'image' && <ImageUpload />}
        {activeTab === 'notes' && <Notes />}
      </main>

      <footer className="App-footer">
        <p>© 2024 Online Calculator. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
