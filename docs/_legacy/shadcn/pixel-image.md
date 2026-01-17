import { PixelImage } from '@/components/ui/shadcn-io/pixel-image';
const Example = () => (
  <div className="flex justify-center">
    <PixelImage
      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center"
      grid="6x4"
    />
  </div>
);
export default Example;