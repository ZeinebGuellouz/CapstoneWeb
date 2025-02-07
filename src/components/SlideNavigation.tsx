import { Slide } from "@/types";

interface SlideNavigationProps {
  slides: Slide[];
  setCurrentSlideIndex: (index: number) => void;
  currentSlideIndex: number;
}

export default function SlideNavigation({ slides, setCurrentSlideIndex, currentSlideIndex }: SlideNavigationProps) {
  return (
    <div className="w-80 p-4 border-r bg-white dark:bg-gray-900 overflow-y-auto h-screen shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Slides</h2>
      <ul className="space-y-3">
        {slides.map((slide, index) => (
          <li
            key={index}
            className={`p-2 flex items-center gap-3 rounded-lg cursor-pointer transition-all duration-200 
              ${
                currentSlideIndex === index
                  ? "bg-blue-500 text-white shadow-lg"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            onClick={() => setCurrentSlideIndex(index)}
          >
            <img
              src={slide.image}
              alt={`Slide ${index + 1}`}
              className="w-16 h-12 rounded-md object-cover border border-gray-300 dark:border-gray-700"
            />
            <span className="text-sm font-medium">Slide {index + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
