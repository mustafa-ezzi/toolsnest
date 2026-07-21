import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window scroll when the route (or search) changes. */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
