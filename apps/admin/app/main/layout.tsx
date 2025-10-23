'use client';

import { Sidebar } from "../Sidebar";
import { Header } from "../Header";
import { withAuth } from "../utils/withAuth";

function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen">
      <Header />
      <div className="flex w-full h-full pt-[64px]">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto scrollbar-hover">
          {children}
        </div>
      </div>
    </div>
  );
}

export default withAuth(MainLayout);
