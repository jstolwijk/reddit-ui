import { Suspense, useState } from "react";
import { Img, useImage } from "react-image";

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
    <div className="mx-auto relative">
      <Suspense fallback={<div className="h-96 w-full bg-gray-200"></div>}>
        <Image curSrc={imageUrls[currentImage]} />
      </Suspense>

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
      <div className="absolute p-2 m-2 rounded-md left-0 bottom-0 bg-white">
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

const Image: React.FC<any> = ({ curSrc }) => {
  const { src, isLoading } = useImage({
    srcList: curSrc,
  });

  return !src ? (
    <div className="h-96 w-full bg-gray-200"></div>
  ) : (
    <Img src={curSrc} className="object-scale-down max-h-1/2-screen w-full" />
  );
};

export const extractGalleryImagesFromMetaData = (post: any): string[] => {
  try {
    return (
      (post.data.media_metadata &&
        Object.values(post.data.media_metadata).map((item: any) => item.s.u.replace(/&amp;/g, "&"))) ||
      []
    );
  } catch (e) {
    console.error(e);
    return [];
  }
};
