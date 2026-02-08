import { NavLink } from 'react-router-dom';

interface SubNavItem {
  to: string;
  label: string;
}

interface SubNavigationProps {
  items: SubNavItem[];
}

export function SubNavigation({ items }: SubNavigationProps) {
  return (
    <nav className="sub-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `sub-nav-link ${isActive ? 'sub-nav-link--active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

