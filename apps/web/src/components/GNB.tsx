import { GNBBuildingShopIcon, GNBHomeIcon, GNBYoutubeIcon } from "@repo/common";
import { User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface GNBProps {
  onHomeClick?: () => void;
}

export function GNB({ onHomeClick }: GNBProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: "home",
      label: "홈",
      icon: GNBHomeIcon,
      path: "/main",
      onClick: onHomeClick,
    },
    {
      id: "building-shop",
      label: "빌딩샵매물",
      icon: GNBBuildingShopIcon,
      path: "/building-shop",
    },
    {
      id: "building-god",
      label: "빌딩의신",
      icon: GNBYoutubeIcon,
      path: "/god-of-building",
    },
    {
      id: "my",
      label: "마이",
      icon: User,
      path: "/myPage",
    },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-line-03 md:hidden">
      <div className="flex items-center justify-around h-[64px] px-[8px]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`flex flex-col items-center justify-center gap-[4px] flex-1 h-full transition-colors ${active ? "text-primary" : "text-text-03"
                }`}
            >
              <Icon color={active ? "var(--primary-050)" : "var(--text-03)"} />
              <span className={`font-c2-p`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}