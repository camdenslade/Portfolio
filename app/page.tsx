'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkipIntroButton } from '@/components/ui/SkipIntroButton';
import { APP_ROUTES } from '@/routes/paths';

const IntroCanvas = dynamic(() => import('@/components/scene/IntroCanvas'), {
  ssr: false,
  loading: () => <div className="h-dvh w-full bg-neutral-100" />,
});

const IntroCanvasMobile = dynamic(() => import('@/components/scene/IntroCanvasMobile'), {
  ssr: false,
  loading: () => <div className="h-dvh w-full bg-neutral-100" />,
});

export default function IntroPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-neutral-100">
      <SkipIntroButton onSkip={() => router.replace(APP_ROUTES.home)} />
      {isMobile ? (
        <IntroCanvasMobile />
      ) : (
        <IntroCanvas />
      )}
    </main>
  );
}
