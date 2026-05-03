import Nav from './components/Nav'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Nav />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold text-center">Coming Soon</h1>
      </main>
      <Footer />
    </div>
  )
}
