
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button1';

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
    <div 
      id="hero" 
      className="relative h-screen animate-fade-in"
    >
      <div className="grid lg:grid-cols-2 h-full items-center gap-8 px-4">
        {/* Content section */}
        <div className="max-w-xl mx-auto lg:ml-auto lg:mr-0 text-center lg:text-left animate-scale-in">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4 sm:text-5xl md:text-6xl">
            Transform Your <span className="text-blue-700">Presentations with AI</span> 
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Elevate your presentations with our AI-powered virtual presenter.
            Engage your audience with natural delivery and real-time Q&A capabilities.
           
          </p>

          <Button 
            onClick={scrollToUpload}
            className="mt-6 mb-10 w-fit flex justify-center items-center py-8 px-7 text-white text-base font-bold bg-blue-700 hover:bg-blue-800 rounded-md shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Image section */}
        <div className="hidden lg:block animate-slide-in-right">
          <div className="relative h-[600px] w-full">
            <img
              className="w-full h-full object-cover rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300"
              src="/src/preview (1).webp"
              alt="AI presentation visualization"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
