'use client';

import { useEffect } from 'react';

export default function AdSenseBlock() {
  const publisher = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  if (!publisher) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', minHeight: 90 }}
      data-ad-client={publisher}
      data-ad-slot="auto"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
