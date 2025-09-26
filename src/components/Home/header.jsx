import { Button } from "./ui/button";
import { Menu, User, Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-green-600" />
          <span className="text-xl font-semibold">EVHub</span>
        </div>
        
        <nav className="items-center hidden gap-8 md:flex">
          <a href="#home" className="text-sm font-medium transition-colors hover:text-green-600">
            Home
          </a>
          <a href="#features" className="text-sm font-medium transition-colors hover:text-green-600">
            Features
          </a>
          <a href="#charging" className="text-sm font-medium transition-colors hover:text-green-600">
            Charging
          </a>
          <a href="#about" className="text-sm font-medium transition-colors hover:text-green-600">
            About
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <User className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            Get Started
          </Button>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}