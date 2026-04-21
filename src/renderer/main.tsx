import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/toolbar.css';
import './styles/home.css';
import './styles/webview.css';
import './styles/osd.css';
import './styles/modal.css';
import './styles/settings.css';
import './styles/context-menu.css';

// 全局屏蔽默认右键菜单（capture 阶段确保最先执行，覆盖 input 等元素的原生菜单）
document.addEventListener('contextmenu', (e) => e.preventDefault(), { capture: true });

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
