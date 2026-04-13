import { useState, useEffect, useRef } from 'react';

export default function OSD({ message }) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef(null);

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
  }, [message]); // message 是 { text, id }，id 变化保证相同文本也能触发

  if (!visible) return null;
  return <div className={`osd${fadeOut ? ' fade-out' : ''}`}>{text}</div>;
}
