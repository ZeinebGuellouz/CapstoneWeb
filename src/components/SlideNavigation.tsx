import { Slide } from "@/types";

interface SlideNavigationProps {
  slides: Slide[];
  setCurrentSlideIndex: (index: number) => void;
  currentSlideIndex: number;
}

export default function SlideNavigation({ slides, setCurrentSlideIndex, currentSlideIndex }: SlideNavigationProps) {
  return (
    <div className="p-6 bg-gradient-to-tr from-blue-50 via-white to-blue-100 rounded-3xl shadow-xl border border-blue-200 transition-all duration-700 animate-fade-in w-80 overflow-y-auto h-screen">
      <h2 className="text-2xl font-extrabold text-blue-800 mb-4 flex items-center gap-2">
        <span className="text-3xl">📑</span> Your Slides
      </h2>
      <ul className="space-y-4">
        {slides.map((slide, index) => (
          <li
            key={index}
            className={`p-3 flex items-center gap-4 rounded-xl cursor-pointer transition-all duration-300 border hover:shadow-md shadow-inner
              ${
                currentSlideIndex === index
                  ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                  : "bg-white hover:bg-blue-100 border-blue-100"
              }`}
            onClick={() => setCurrentSlideIndex(index)}
          >
            <img
              src={slide.image}
              alt={`Slide ${index + 1}`}
              className="w-16 h-12 rounded-lg object-cover border border-gray-200"
            />
            <span className="text-sm font-medium">Slide {index + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
