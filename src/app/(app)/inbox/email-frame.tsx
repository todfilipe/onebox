"use client";

import { useEffect, useRef, useState } from "react";

export function EmailFrame({ srcDoc }: { srcDoc: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const doc = frame.current?.contentDocument;

    if (!loaded || !doc?.body) {
      return;
    }

    const observer = new ResizeObserver(() =>
      setHeight(doc.documentElement.scrollHeight),
    );
    observer.observe(doc.body);

    return () => observer.disconnect();
  }, [loaded]);

  return (
    <iframe
      ref={frame}
      // Sem allow-scripts os scripts do email continuam a não correr; juntar os dois deixava-o sair da sandbox.
      sandbox="allow-same-origin"
      title="Corpo do email"
      srcDoc={srcDoc}
      onLoad={() => setLoaded(true)}
      style={{ height: height || undefined }}
      className={`w-full rounded-2xl border border-hairline bg-white ${height ? "" : "h-96"}`}
    />
  );
}
