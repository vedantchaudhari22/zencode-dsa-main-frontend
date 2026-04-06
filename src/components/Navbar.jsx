// The navbar gives the app one consistent top-level navigation pattern.
// It also exposes the current user's quick actions without every page rebuilding that UI.
import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    ZenCode
                </Link>

                <div className="flex items-center gap-6">
                    <Link to="/problemset" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                        Problems
                    </Link>
                    <Link to="/profile" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                        Profile
                    </Link>
                </div>
            </div>
        </nav>
    );
}
