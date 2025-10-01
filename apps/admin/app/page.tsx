'use client';

import { usePathname } from "next/navigation";
import Dashboard from "./dashboard/page";
import Admin from "./admin/page";
import Users from "./users/page";

export default function Home() {
  const pathname = usePathname();
  
  let content;
  if (pathname === "/") {
    content = <Dashboard />;
  } else if (pathname === "/admin") {
    content = <Admin />;
  } else if (pathname === "/users") {
    content = <Users />;
  }

  return (
    <div className="w-full h-full flex overflow-y-auto">
      <div className="flex-1 h-full overflow-y-auto scrollbar-hover">
        {content}
      </div>
    </div>
  );
}
