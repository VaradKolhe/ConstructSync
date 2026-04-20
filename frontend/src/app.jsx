import { useState } from 'react'
import viteLogo from './assets/vite.svg'
import reactLogo from './assets/preact.svg' // Placeholder until user adds react logo
import heroImg from './assets/hero.png'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600 tracking-tight m-0">
            🏗️ CONSTRUCT<span className="text-gray-800">SYNC</span>
          </h1>
          <nav className="flex space-x-4">
            <a href="#" className="text-gray-500 hover:text-gray-900 font-medium">Dashboard</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 font-medium">Labour</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 font-medium">Attendance</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="relative mb-12">
          <img src={heroImg} className="w-48 h-auto" alt="ConstructSync Hero" />
          <div className="absolute -bottom-4 -right-4 flex space-x-2">
            <img src={viteLogo} className="w-10 h-10 animate-pulse" alt="Vite logo" />
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">R</div>
          </div>
        </div>

        <h2 className="text-5xl font-extrabold text-gray-900 mb-6">
          Next-Gen Construction <br />
          <span className="text-orange-500">Management Software</span>
        </h2>
        
        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Streamline labour attendance, deployment, and payroll with our enterprise-grade React platform. 
          Built for stability and scale.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button 
            className="px-8 py-3 bg-orange-600 text-white rounded-lg font-bold shadow-lg hover:bg-orange-700 transition-all cursor-pointer"
            onClick={() => setCount((count) => count + 1)}
          >
            Counter: {count}
          </button>
          <button className="px-8 py-3 bg-white text-gray-800 border border-gray-300 rounded-lg font-bold shadow-sm hover:bg-gray-50 transition-all cursor-pointer">
            View Live Sites
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-left">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Labour Tracking</h3>
            <p className="text-gray-600">Real-time monitoring of personnel across all active construction sites.</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-left">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Automated Payroll</h3>
            <p className="text-gray-600">Accurate working hour calculations integrated with attendance logs.</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-left">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Site Analytics</h3>
            <p className="text-gray-600">Visual reports on deployment density and project progression.</p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <span className="text-white font-bold text-xl tracking-tight">🏗️ CONSTRUCTSYNC</span>
            <p className="mt-2 text-sm">Building Progress, Together. © 2026</p>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white">Security</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
