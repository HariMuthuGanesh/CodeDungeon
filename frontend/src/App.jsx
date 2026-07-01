import { useState } from 'react';
import Login from './components/Login';

function App() {
  const [teamName, setTeamName] = useState(null);

  if (!teamName) {
    return <Login onLogin={setTeamName} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-500 tracking-tight">
          CODE DUNGEON
        </h1>
        <div className="flex items-center gap-4">
          <span className="font-mono text-gray-400">Team: {teamName}</span>
          <button 
            onClick={() => setTeamName(null)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Dungeon</h2>
          <p className="text-gray-400">The dungeon map and challenges will be revealed soon...</p>
        </div>
      </main>
    </div>
  );
}

export default App;
