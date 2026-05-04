// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-da-darker border-t border-white/10 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-black uppercase tracking-wider text-white mb-4">
              <span className="text-da-cyan">DIABETIC</span> ATHLETIC
            </h3>
            <p className="text-white/60 text-sm">Turning diabetic struggles into fitness successes.</p>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider text-da-cyan mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="#home" className="hover:text-da-cyan transition">Home</a></li>
              <li><a href="#about" className="hover:text-da-cyan transition">About</a></li>
              <li><a href="#resources" className="hover:text-da-cyan transition">Resources</a></li>
              <li><a href="#blog" className="hover:text-da-cyan transition">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider text-da-cyan mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="/terms" className="hover:text-da-cyan transition">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-da-cyan transition">Privacy Policy</a></li>
              <li><a href="/earnings" className="hover:text-da-cyan transition">Earnings Disclaimer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider text-da-cyan mb-4">Connect</h4>
            <p className="text-white/60 text-sm">Follow us on social media</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
          <p>Copyright 2025 © Diabetic Athletic. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
