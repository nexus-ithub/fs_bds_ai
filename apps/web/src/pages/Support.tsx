import { Route, Routes } from "react-router-dom";
import { SupportMain } from "../support/SupportMain";
import { Board } from "../support/Board";
import { Terms } from "../support/Terms";
import { Privacy } from "../support/Privacy";
import { BoardDetail } from "../support/BoardDetail";
import { Footer } from "../footer/Footer";

export const Support = () => {
  return (
    <div className="flex flex-col h-full min-w-[1440px]">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<SupportMain />} />
          <Route path="notice" element={<Board type="notice" />} />
          <Route path="notice/:id" element={<BoardDetail />} />
          <Route path="faq" element={<Board type="faq" />} />
          <Route path="faq/:id" element={<BoardDetail />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}