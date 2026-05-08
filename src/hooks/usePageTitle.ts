import { useEffect } from "react";

const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title ? `${title} | Avish Luxury Beauty` : "Avish - Luxury Beauty | Beauty in Every Shade";
    return () => {
      document.title = "Avish - Luxury Beauty | Beauty in Every Shade";
    };
  }, [title]);
};

export default usePageTitle;
