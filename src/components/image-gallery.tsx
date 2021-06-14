import { useState } from "react";

interface ImageGalleryProps {
  imageUrls: string[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ imageUrls }) => {
  const [currentImage, setCurrentImage] = useState(0);

  const previous = () => {
    setCurrentImage(currentImage > 0 ? currentImage - 1 : imageUrls.length - 1);
  };

  const next = () => {
    setCurrentImage(currentImage >= imageUrls.length - 1 ? 0 : currentImage + 1);
  };
  return (
    <div className="mx-auto max-h-1/2 relative">
      <img className="max-h-1/2" src={imageUrls[currentImage]}></img>

      <div className="absolute left-0 w-1/2 h-full top-0 cursor-pointer" onClick={previous}></div>
      <div className="absolute right-0 w-1/2 h-full top-0 cursor-pointer" onClick={next}></div>

      <div className="absolute ml-2 inset-y-1/2 left-0 bg-blue-300">
        <button className="p-2 rounded bg-blue-400" onClick={previous}>
          Prev
        </button>
      </div>
      <div className="absolute mr-2 inset-y-1/2 right-0 bg-blue-300">
        <button className="p-2 rounded bg-blue-400" onClick={next}>
          Next
        </button>
      </div>
      <div className="absolute p-2 m-2 bg-white rounded-md left-0 bottom-0">
        <p className="text-xl">
          <span className="font-mono">
            {currentImage + 1}/{imageUrls.length}
          </span>{" "}
          images
        </p>
      </div>
    </div>
  );
};
