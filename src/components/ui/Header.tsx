import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  /** 右上に配置するアクション要素 */
  rightAction?: ReactNode;
}

export function Header({ title, showBack = true, rightAction }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="app-header">
      {showBack && !isHome && (
        <button
          type="button"
          className="header-back-btn"
          onClick={() => navigate(-1)}
          aria-label="戻る"
        >
          ← 戻る
        </button>
      )}
      <h1 className="header-title">{title}</h1>
      {rightAction && (
        <div className="header-right-action">{rightAction}</div>
      )}
    </header>
  );
}
