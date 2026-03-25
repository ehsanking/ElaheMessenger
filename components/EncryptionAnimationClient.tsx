'use client';

import dynamic from 'next/dynamic';

const EncryptionAnimation = dynamic(() => import('./EncryptionAnimation'), { ssr: false });

export default function EncryptionAnimationClient() {
  return <EncryptionAnimation />;
}
