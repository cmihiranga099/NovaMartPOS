import { useState } from 'react';
import apiClient from './api/client';
import type { LoginResponse } from './types/auth';

function App() {
  const [status, setStatus] = useState<string>('Not tested yet');

  const testLogin = async () => {
    try {
      const response = await apiClient.post<LoginResponse>('/Auth/login', {
        username: 'admin',
        password: 'Admin@123',
      });
      localStorage.setItem('token', response.data.token);
      setStatus(`✅ Connected! Logged in as ${response.data.fullName} (${response.data.role})`);
    } catch (error) {
      setStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
      <h1 className="text-2xl font-bold">Nova Mart — Connection Test</h1>
      <button
        onClick={testLogin}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Backend Connection
      </button>
      <p className="text-lg">{status}</p>
    </div>
  );
}

export default App;