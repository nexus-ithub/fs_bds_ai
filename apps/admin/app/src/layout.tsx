import { Sidebar } from "./components/Sidebar";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Admin from "./admin/page";
import Users from "./users/page";
import Dashboard from "./dashboard/page";

export default function Main() {
  const pathname = usePathname();
  const [activePage, setActivePage] = useState<"admin" | "users" | "dashboard">("dashboard");

  let content;
  switch (activePage) {
    case "admin":
      content = <Admin />;
      break;
    case "users":
      content = <Users />;
      break;
    default:
      content = <Dashboard />;
      break;
  }

  return (
    <div className="w-full h-screen flex">
      <Sidebar onSelectPage={setActivePage}/>
      <div className="flex-1 h-full bg-blue-50">
        {content}
      </div>
    </div>
  );
}
