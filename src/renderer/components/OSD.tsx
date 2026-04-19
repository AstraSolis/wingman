import { useState, useEffect, useRef } from 'react';

interface OSDProps {
  message: { text: string; id: number } | null;
}

export default function OSD({ message }: OSDProps) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message?.text) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setText(message.text);
    setFadeOut(false);
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 300);
    }, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message]);

  if (!visible) return null;
  return <div className={`osd${fadeOut ? ' fade-out' : ''}`}>{text}</div>;
}
