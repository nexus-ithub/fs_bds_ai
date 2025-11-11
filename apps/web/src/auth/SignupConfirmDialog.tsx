import { Dialog } from "@mui/material";
import { Button } from "@repo/common";
import { useNavigate } from "react-router-dom";

export const SignupConfirmDialog = ({open, onClose, userId}: {open: boolean, onClose: (open: boolean) => void, userId: string}) => {
  const navigate = useNavigate();
  const handleConfirm = () => {
    onClose(false);
    // navigate('/signup/additional-info', { state: { userId } });
    navigate('/');
  }
  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <div className="flex flex-col gap-[20px] py-[24px] min-w-[340px]">
        <p className="font-h2 px-[20px] text-center">회원가입이 완료되었습니다.</p>
        <p className="font-s1 px-[20px]">더 나은 서비스를 제공하기 위해 추가 정보를 입력해주시기 바랍니다.</p>
        <div className="flex justify-center gap-[12px] px-[20px] pt-[12px]">
          <Button className="w-[200px] h-[40px]" onClick={() => {handleConfirm();}}>확인</Button>
        </div>
      </div>
    </Dialog>
  )
}