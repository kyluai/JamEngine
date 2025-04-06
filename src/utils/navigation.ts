import { NavigateFunction } from 'react-router-dom';

/**
 * Utility function to navigate to a route and scroll to the top of the page
 * @param navigate The navigate function from useNavigate hook
 * @param path The path to navigate to
 */
export const navigateAndScrollToTop = (navigate: NavigateFunction, path: string) => {
  navigate(path);
  window.scrollTo(0, 0);
}; 