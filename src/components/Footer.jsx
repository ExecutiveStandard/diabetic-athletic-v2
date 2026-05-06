import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-da-darker border-t border-white/10">
      <div className="da-container py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-16">
          <div>
            <h3 className="font-black uppercase tracking-wider text-white mb-5 text-lg">
              <span className="text-da-cyan">DIABETIC</span> ATHLETIC
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Turning diabetic struggles into fitness successes.
            </p>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider text-da-cyan mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/" className="hover:text-da-cyan transition">Home</Link></li>
              <li><Link to="/about" className="hover:text-da-cyan transition">About</Link></li>
              <li><Link to="/free-resources" className="hover:text-da-cyan transition">Resources</Link></li>
              <li><Link to="/blog" className="hover:text-da-cyan transition">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider text-da-cyan mb-5">Legal</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="/terms" className="hover:text-da-cyan transition">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-da-cyan transition">Privacy Policy</a></li>
              <li><a href="/earnings" className="hover:text-da-cyan transition">Earnings Disclaimer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase text-sm tracking-wider text-da-cyan mb-5">Connect</h4>
            <p className="text-white/60 text-sm leading-relaxed mb-3">Follow us on social media</p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-da-cyan/20 border border-white/10 hover:border-da-cyan/40 flex items-center justify-center transition" aria-label="Instagram">
                <span className="text-white/60 text-sm">IG</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-da-cyan/20 border border-white/10 hover:border-da-cyan/40 flex items-center justify-center transition" aria-label="Facebook">
                <span className="text-white/60 text-sm">FB</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-da-cyan/20 border border-white/10 hover:border-da-cyan/40 flex items-center justify-center transition" aria-label="YouTube">
                <span className="text-white/60 text-sm">YT</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/40">
          <p>Copyright 2026 © Diabetic Athletic. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
