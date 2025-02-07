
interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Slider: React.FC<SliderProps> = (props) => {
  return <input type="range" className="w-full" {...props} />;
};
