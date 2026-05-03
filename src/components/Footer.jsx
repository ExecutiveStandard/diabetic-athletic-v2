// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-da-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4">Diabetic Athletic</h3>
            <p className="text-gray-300 text-sm">Turning diabetic struggles into fitness successes.</p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#home" className="hover:text-da-cyan">Home</a></li>
              <li><a href="#about" className="hover:text-da-cyan">About</a></li>
              <li><a href="#resources" className="hover:text-da-cyan">Resources</a></li>
              <li><a href="#blog" className="hover:text-da-cyan">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/terms" className="hover:text-da-cyan">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-da-cyan">Privacy Policy</a></li>
              <li><a href="/earnings" className="hover:text-da-cyan">Earnings Disclaimer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <p className="text-gray-300 text-sm">Follow us on social media</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>Copyright 2025 © Diabetic Athletic. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
