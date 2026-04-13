import { useState, useEffect } from 'react';

export default function HomeView({ onNavigate, onFavorites, onHistory, t }) {
  const [time, setTime] = useState('');
  const [input, setInput] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleGo = () => { if (input) onNavigate(input); };

  return (
    <div className="home-view">
      <div className="home-bg" style={{ backgroundImage: "url('https://api.dujin.org/bing/1920.php')" }} />
      <div className="home-bg-overlay" />
      <div className="home-content">
        <div className="home-clock">{time}</div>
        <div className="home-search">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGo()}
            placeholder={t('home.searchPlaceholder')}
            spellCheck={false}
          />
          <button onClick={handleGo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>
      <div className="home-dock-container">
        <div className="home-dock">
          <button className="dock-btn" title={t('home.favorites')} onClick={onFavorites}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <button className="dock-btn" title={t('home.history')} onClick={onHistory}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
