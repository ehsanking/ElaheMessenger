'use client';

import dynamic from 'next/dynamic';

const PwaPrompt = dynamic(() => import('./PwaPrompt'), { ssr: false });

export default function PwaPromptClient() {
  return <PwaPrompt />;
}
