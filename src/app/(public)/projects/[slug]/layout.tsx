'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Layout = ({ children }: React.PropsWithChildren) => {
  const router = useRouter();

  return (
    <main className="container space-y-4">
      <Button onClick={() => router.back()} variant="secondary" size="icon">
        <ArrowLeftIcon />
      </Button>
      <div className="prose dark:prose-invert prose-zinc">{children}</div>
    </main>
  );
};

export default Layout;
