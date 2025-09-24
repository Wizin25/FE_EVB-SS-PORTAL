function header(){
    return(
    <header className="header">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="logo">
            <img src="/logo.png" alt="PowerCycle Logo" className="h-8 w-8"/>
            <h1 className="text-xl text-primary">PowerCycle</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="">Home</a>
            <a href="#products" className="">Products</a>
            <a href="#features" className="">Features</a>
            <a href="#about" className="">About</a>
            <a href="#contact" className="">Contact</a>
          </nav>
          
          <div className="action">
            <Button variant="outline" className="hidden md:inline-flex">
              Get Quote
            </Button>
            <Button className="md:hidden" variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
    );
}