import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export function Hero() {
  const scrollToUpload = () => {
    const element = document.getElementById('upload');
    if (element) {
      const offset = 64;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  useEffect(() => {
    const target = sessionStorage.getItem("scrollTo");
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      sessionStorage.removeItem("scrollTo");
    }
  }, []);
  

  return (
    <div id="hero" className="relative bg-white overflow-hidden pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl animate-slide-in">
                <span className="block">Transform Your</span>
                <span className="block text-primary">Presentations with AI</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Elevate your presentations with our AI-powered virtual presenter. 
                Engage your audience with natural delivery and real-time Q&A capabilities.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="rounded-md shadow hover-scale">
                  <button
                    onClick={scrollToUpload}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-light transition-colors duration-200 md:py-4 md:text-lg md:px-10"
                  >
                    Get Started
                    <ArrowRight className="ml-2" size={20} />
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80"
          alt="AI presentation visualization"
        />
      </div>
    </div>
  );
}