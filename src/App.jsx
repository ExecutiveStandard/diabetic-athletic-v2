import Nav from './components/Nav'
import Footer from './components/Footer'
import Hero from './features/hero/Hero'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Nav />
      <main className="flex-1">
        <Hero />
      </main>
      <Footer />
    </div>
  )
}
