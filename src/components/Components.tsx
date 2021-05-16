import React, { useEffect, useState } from "react";

interface BlockProps {
  backGroundColor?: string;
}

export const Block: React.FC<BlockProps> = ({ children, backGroundColor = "bg-white" }) => {
  return <div className={`p-2 sm:rounded-lg ${backGroundColor} shadow-lg divide-y font-extralight`}>{children}</div>;
};

export const Stack: React.FC = ({ children }) => {
  return <div className="sm:py-1 lg:py-2 sm:space-y-2 space-y-1">{children}</div>;
};

export enum ScreenSize {
  none = 0,
  sm = 1,
  md = 2,
  lg = 3,
  xl = 4,
  double_xl = 5,
}

export function useScreenSize(): ScreenSize {
  const sm = useMediaQuery("(min-width: 640px)");
  const md = useMediaQuery("(min-width: 768px)");
  const lg = useMediaQuery("(min-width: 1024px)");
  const xl = useMediaQuery("(min-width: 1280px)");
  const doublexl = useMediaQuery("(min-width: 1536px)");

  if (doublexl) {
    return ScreenSize.double_xl;
  } else if (xl) {
    return ScreenSize.xl;
  } else if (lg) {
    return ScreenSize.lg;
  } else if (md) {
    return ScreenSize.md;
  } else if (sm) {
    return ScreenSize.sm;
  } else {
    return ScreenSize.none;
  }
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
}
