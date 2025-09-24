import { Routes, Route } from "react-router-dom"
import { SignupTerms } from "../auth/SignupTerms"
import { SignupInfo } from "../auth/SignupInfo"
import { AdditionalInfo } from "../auth/AdditionalInfo"

export const Signup = () => {
  return (
    <Routes>
      <Route path="/" element={<SignupTerms />} />
      <Route path="info" element={<SignupInfo />} />
      <Route path="additional-info" element={<AdditionalInfo />} />
    </Routes>
  )
}