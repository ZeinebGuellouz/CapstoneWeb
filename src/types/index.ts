export interface NavItem {
  title: string;
  path: string;
}


export interface Slide {
  image: string;
  text: string;
  title: string;
  presentationId: string; // ✅ Add this property
  slideNumber: number; // ✅ Add this property
}

import { LucideProps } from "lucide-react";

export type Feature = {
  title: string;
  description: string;
  icon: React.ElementType<LucideProps>; // ✅ Ensure proper typing
};

