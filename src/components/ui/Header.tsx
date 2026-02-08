import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export function Header({ title, showBack = true }: HeaderProps) {
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
    </header>
  );
}

