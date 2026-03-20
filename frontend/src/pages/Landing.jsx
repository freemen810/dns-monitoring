import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔍</span>
              </div>
              <span className="font-semibold text-gray-900">DNS Monitor</span>
            </div>
            <Link
              to="/"
              className="px-5 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 text-sm font-medium transition-colors duration-150"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Monitor Your DNS with{' '}
            <span className="bg-gradient-to-r from-accent-500 to-accent-600 bg-clip-text text-transparent">
              Precision
            </span>
          </h1>
          <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto leading-relaxed">
            Real-time DNS monitoring dashboard designed for reliability engineers. Track response times,
            detect failures instantly, and get alerts when something goes wrong.
          </p>

          <div className="flex gap-4 justify-center mt-8">
            <Link
              to="/"
              className="px-8 py-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium transition-colors duration-150 flex items-center gap-2"
            >
              Enter Dashboard
              <span>→</span>
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-150"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Feature Preview Image Placeholder */}
        <div className="mt-16 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-lg">Dashboard Preview</p>
              <p className="text-gray-300 text-sm mt-2">Your monitoring interface</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">
          Built for Reliability
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Real-time Monitoring',
              description: 'Monitor DNS queries in real-time with sub-second refresh rates'
            },
            {
              icon: '🎯',
              title: 'Instant Alerts',
              description: 'Get notified immediately when DNS servers go down or slow'
            },
            {
              icon: '📊',
              title: 'Performance Analytics',
              description: 'Track response times and identify performance trends'
            },
            {
              icon: '🔐',
              title: 'Multi-Server Support',
              description: 'Monitor multiple DNS servers and record types simultaneously'
            },
            {
              icon: '📈',
              title: 'Historical Data',
              description: 'Review past incidents and analyze uptime patterns'
            },
            {
              icon: '🛠️',
              title: 'Easy Management',
              description: 'Simple interface to add, edit, and manage monitors'
            },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-8 hover:shadow-md transition-shadow duration-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to monitor your DNS?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Start protecting your infrastructure today. Create your first monitor in minutes.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium transition-colors duration-150"
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>DNS Monitor v1.0.0 • Built with React & TailwindCSS</p>
        </div>
      </footer>
    </div>
  );
}
