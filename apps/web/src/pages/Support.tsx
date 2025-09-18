import { Route, Routes } from "react-router-dom";
import { SupportMain } from "../support/SupportMain";
import { Notice } from "../support/Notice";
import { FAQ } from "../support/FAQ";
import { Terms } from "../support/Terms";
import { Privacy } from "../support/Privacy";
import { NoticeDetail } from "../support/NoticeDetail";

export const Support = () => {
  return (
    <div className="flex flex-col h-full">
      <Routes>
        <Route path="/" element={<SupportMain />} />
        <Route path="notice" element={<Notice />} />
        <Route path="notice/:id" element={<NoticeDetail />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
      </Routes>
    </div>
  )
}