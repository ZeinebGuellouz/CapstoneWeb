import { Presentation, Brain, MessageCircle, Zap } from "lucide-react";
import type { Feature } from "../types";

// Define the features array
const features: Feature[] = [
  {
    title: "AI-Powered Presentations",
    description:
      "Transform your slides into engaging presentations with natural voice synthesis and dynamic delivery.",
    icon: Presentation,
  },
  {
    title: "Smart Q&A Handling",
    description:
      "Real-time audience question handling with AI-powered responses based on your presentation content.",
    icon: MessageCircle,
  },
  {
    title: "Natural Language Processing",
    description:
      "Advanced NLP algorithms ensure smooth, context-aware presentation delivery and responses.",
    icon: Brain,
  },
  {
    title: "Instant Processing",
    description:
      "Quick conversion of your presentations with real-time preview capabilities.",
    icon: Zap,
  },
];

export function Features() {
  return (
    <div id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
            Powerful Features
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Everything you need to deliver perfect presentations, powered by AI
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon; // Store the icon component in a variable
              return (
                <div
                  key={feature.title}
                  className="relative animate-fade-in hover-scale"
                  style={{ animationDelay: `${0.2 * index}s` }}
                >
                  <div
                    className="absolute feature-icon-container flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white"
                    style={{ animationDelay: `${0.5 * index}s` }}
                  >
                    {/* Render the icon as a component */}
                    <Icon size={24} />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-xl font-medium text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
