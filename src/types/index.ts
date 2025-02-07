export interface NavItem {
  title: string;
  path: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType;
}

export interface Slide {
  id: number;
  image: string;
  text: string;
  title: string; 
  content: string; 
}
