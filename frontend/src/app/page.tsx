import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-orange-50">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Bring Your Creations <span className="text-primary-600">To Life</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                Upload images and videos, then send beautiful animations to your Oro device via Bluetooth. 
                Transform any screen into a personal display.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="rounded-lg bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="#features"
                  className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-gray-900">How It Works</h2>
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Upload Media',
                  description: 'Upload your images or short videos through the web or mobile app.',
                  icon: '📤',
                },
                {
                  title: 'Process Animation',
                  description: 'Our system converts your media into optimized frames for embedded display.',
                  icon: '⚙️',
                },
                {
                  title: 'Send via Bluetooth',
                  description: 'Use the Flutter app to send animations to your Oro device wirelessly.',
                  icon: '📡',
                },
              ].map((feature) => (
                <div key={feature.title} className="rounded-xl border p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="text-4xl">{feature.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
            © 2026 Oro. All rights reserved.
          </div>
        </footer>
      </main>
    </>
  );
}
