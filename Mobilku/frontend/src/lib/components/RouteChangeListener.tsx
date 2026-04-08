'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/lib/contexts/LoadingContext';

export default function RouteChangeListener() {
  const pathname = usePathname();
  const { setIsLoading } = useLoading();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      setIsLoading(true);
      previousPathnameRef.current = pathname;

      // Stop loading after a short delay
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, setIsLoading]);

  return null;
}
