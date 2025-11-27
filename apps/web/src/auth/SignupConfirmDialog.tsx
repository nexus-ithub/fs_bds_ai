import { Dialog } from "@mui/material";
import { Button } from "@repo/common";
import { useNavigate } from "react-router-dom";

export const SignupConfirmDialog = ({open, onClose, userId}: {open: boolean, onClose: (open: boolean) => void, userId: string}) => {
  const navigate = useNavigate();
  const handleConfirm = () => {
    onClose(false);
    navigate('/signup/additional-info', { state: { userId } });
  }
  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <div className="flex flex-col gap-[20px] py-[24px] min-w-[400px]">
        <style>{`
          @keyframes draw-check {
            to {
              stroke-dashoffset: 0;
            }
          }
          .animate-draw-check {
            animation: draw-check 0.6s ease-out forwards;
          }
        `}</style>
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16" viewBox="0 0 80 80">
              <circle 
                cx="40" 
                cy="40" 
                r="38" 
                fill="#EEF2FF"
              />
            </svg>
            
            <svg 
              className="absolute top-0 left-0 w-16 h-16" 
              viewBox="0 0 80 80"
            >
              <path
                d="M 25 40 L 35 50 L 55 30"
                fill="none"
                stroke="#4E52FF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-draw-check"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50,
                }}
              />
            </svg>
          </div>
        </div>
        <p className="font-h1 px-[20px] text-center">회원가입 완료</p>
        <div className="flex flex-col items-center gap-[4px] px-[20px]">
          <p className="font-s1 text-text-02">회원가입이 완료되었습니다.</p>
          <p className="font-s2 text-text-02">더 나은 서비스를 제공하기 위해 추가 정보를 입력해주세요.</p>
        </div>
        <div className="flex justify-center gap-[12px] px-[20px] pt-[12px]">
          <Button className="w-[200px] h-[40px]" onClick={() => {handleConfirm();}}>확인</Button>
        </div>
      </div>
    </Dialog>
  )
}