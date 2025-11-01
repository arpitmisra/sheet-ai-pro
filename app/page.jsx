import Link from 'next/link';
import { FileSpreadsheet, Zap, Users, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SheetAI Pro</span>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Spreadsheets Made
            <span className="text-blue-600"> Smart & Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create, collaborate, and analyze data with powerful spreadsheets. 
            No complexity, just results.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
            >
              Start Free
            </Link>
            <Link 
              href="/dashboard"
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-medium text-lg"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Real-time calculations and instant updates. No lag, no waiting.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Work together in real-time. See changes as they happen.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Formulas</h3>
            <p className="text-gray-600">
              Built-in functions for calculations, analysis, and data processing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2025 SheetAI Pro. Built for the future of spreadsheets.</p>
        </div>
      </footer>
    </div>
  );
}
