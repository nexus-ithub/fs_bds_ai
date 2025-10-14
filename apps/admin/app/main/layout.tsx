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
    <>
      <Header />
      <div className="flex w-full h-[calc(100vh)] pt-[64px] overflow-y-auto">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto scrollbar-hover">
          {children}
        </div>
      </div>
    </>
  );
}

export default withAuth(MainLayout);
