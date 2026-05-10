import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare function gtag(...args: unknown[]): void;

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof gtag === 'undefined') return;
    gtag('config', 'G-ZQ3T2E6BQV', {
      page_path: location.pathname + location.search,
    });
  }, [location]);

  return null;
};

export default Analytics;
