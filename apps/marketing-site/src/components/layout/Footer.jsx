import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import logo2 from "../../assets/logo/Transparent-09.png";
import aboriginalFlag from "../../assets/Australian_Aboriginal_Flag.png";
import tsiFlag from "../../assets/Flag_of_the_Torres_Strait_Islanders.png";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Company Links */}
        <div>
          <h3 className="font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-red-400">About</Link></li>
            <li><Link to="/contact" className="hover:text-red-400">Contact</Link></li>
            <li><Link to="/careers" className="hover:text-red-400">Careers</Link></li>
            <li><Link to="/become-tech" className="hover:text-red-400">Become a Tech</Link></li>
            <li><Link to="/legal" className="hover:text-red-400">Legal Stuff</Link></li>
          </ul>
        </div>

        {/* Discover */}
        <div>
          <h3 className="font-semibold mb-3">Discover</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/pricing" className="hover:text-red-400">Pricing</Link></li>
            <li><Link to="/blog" className="hover:text-red-400">Blog</Link></li>
            <li><Link to="/why-us" className="hover:text-red-400">Why Choose Us?</Link></li>
            <li><Link to="/customers" className="hover:text-red-400">Our Customers</Link></li>
            <li><Link to="/faqs" className="hover:text-red-400">FAQs</Link></li>
          </ul>
        </div>

        {/* Popular */}
        <div>
          <h3 className="font-semibold mb-3">Popular</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/services/computer" className="hover:text-red-400">Computer Repairs</Link></li>
            <li><Link to="/services/laptop" className="hover:text-red-400">Laptop Repairs</Link></li>
            <li><Link to="/services/pc" className="hover:text-red-400">PC Repairs</Link></li>
            <li><Link to="/services/mac" className="hover:text-red-400">Mac Repairs</Link></li>
            <li><Link to="/services/it-support" className="hover:text-red-400">IT Support</Link></li>
          </ul>
        </div>

        {/* Hours */}
        <div>
          <h3 className="font-semibold mb-3">Hours (ACST)</h3>
          <p className="text-sm"><b>Mon–Fri:</b> 8am – 7pm</p>
          <p className="text-sm"><b>Sat:</b> 10am – 5pm</p>
          <p className="text-sm"><b>Sun:</b> 10am – 5pm</p>
          <p className="text-sm"><b>Holidays:</b> 10am – 5pm</p>
        </div>

        {/* Customer Rating */}
        <div>
          <h3 className="font-semibold mb-3">Customer Rating</h3>
          <p className="text-2xl font-bold text-red-500">4.6/5</p>
          <p className="text-xs text-gray-400">based on 300,000+ ratings</p>
        </div>
      </div>

      <div className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <img src={aboriginalFlag} alt="Aboriginal Flag" className="h-6 w-auto" />
            <img src={tsiFlag} alt="Torres Strait Islander Flag" className="h-6 w-auto" />
          </div>
          <h3 className="text-lg font-semibold text-white">Acknowledgement of Country</h3>
          <p className="text-sm text-gray-300 mt-2 max-w-3xl leading-relaxed">
            Call-a-Technician acknowledges Aboriginal and Torres Strait Islander people
            as the Traditional Custodians of the land and pays respect to their Elders,
            past and present.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-700 mt-6 pt-6 text-sm text-gray-400 max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div>
          <Link to="/" className="flex items-center gap-2 ml-[-20px]">
            <img src={logo2} alt="Call-a-Technician logo" className="h-20 w-auto" />
          </Link>
        </div>
        
        <p>© {new Date().getFullYear()} Call-a-Technician. All rights reserved.</p>
        <div className="flex space-x-4">
          <a href="#"><Twitter className="w-5 h-5 hover:text-red-400" /></a>
          <a href="#"><Facebook className="w-5 h-5 hover:text-red-400" /></a>
          <a href="#"><Linkedin className="w-5 h-5 hover:text-red-400" /></a>
          <a href="#"><Youtube className="w-5 h-5 hover:text-red-400" /></a>
        </div>
      </div>
    </footer>
  );
}
