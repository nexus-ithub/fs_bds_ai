import { Dialog } from "@mui/material";
import { Button } from "@repo/common";

export const NeedLoginDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <div className="flex flex-col items-center justify-center px-[40px] pt-[40px] pb-[32px] gap-[8px]">
        <p className="font-h2 text-center">로그인 후 이용 가능한 서비스입니다.</p>
        <p className="font-s1 text-text-03 text-center">
          더 나은 이용을 위해 로그인을 진행해주세요.
        </p>
        <div className="flex items-center justify-center gap-[12px] w-full mt-[16px]">
          <Button
            className="w-[72px]"
            size="semiMedium"
            variant="bggray"
            onClick={() => onClose()}
          >
            취소
          </Button>
          <Button
            className="w-[112px]"
            size="semiMedium"
            onClick={() => {
              onClose();
              window.location.href = "/login";
            }}
          >
            로그인
          </Button>
        </div>
      </div>
    </Dialog>
  )
}