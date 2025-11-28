import { Button, Checkbox, Spinner } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { useNavigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { toast } from "react-toastify";
import { logout } from "../authutil";
import { Dialog } from "@mui/material";
import { useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import type { User } from "@repo/common";

export const DeleteAccount = () => {
  const axiosInstance = useAxiosWithAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  // const { pwConfirm } = location.state ?? { pwConfirm: false };
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axiosInstance.put('/api/user/delete');
      setOpenCompleteDialog(true);
    } catch (err) {
      Sentry.captureException(err);
      toast.error('회원 탈퇴 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!config) navigate("/")
  }, [config])

  return (
    <div className="flex flex-col w-[460px] h-full mx-auto pt-[70px]">
      <h1 className="font-h1 border-b border-line-02 text-center py-[16px]">회원 탈퇴</h1>
      <div className="w-full px-[20px] flex flex-col gap-[32px]">
        <div className="mt-[16px] bg-background-02 rounded-[8px]">
          <p className="font-h3 mb-[8px]">
            {config?.name}님 정말 탈퇴하시겠어요?
          </p>
          <p className="font-s2">
            그동안 이용해주셔서 감사합니다. 탈퇴 전 아래 내용을 꼭 확인해주세요.
          </p>
        </div>
        <div>
          <h3 className="font-h4 pb-[12px]">삭제되는 정보</h3>
          <ul className="flex flex-col gap-[6px] font-s1 text-text-02">
            <li>
              <p><span className="mx-[4px]">•</span> 이메일 주소</p>
            </li>
            <li>
              <p><span className="mx-[4px]">•</span> 이름</p>
            </li>
            <li>
              <p><span className="mx-[4px]">•</span> 전화번호</p>
            </li>
            <li>
              <p><span className="mx-[4px]">•</span> 프로필 이미지</p>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-h4 pb-[12px]">유의사항</h3>
          <ul className="flex flex-col gap-[6px] font-s1 text-text-02">
            <li className="flex items-start gap-[8px]">
              <span className="">•</span>
              <span>삭제된 정보는 <span className="font-s1-p text-text-01">복구가 불가능</span>합니다.</span>
            </li>
            <li className="flex items-start gap-[8px]">
              <span className="">•</span>
              <span>활동 기록은 개인 식별이 불가능한 형태로 보관됩니다.</span>
            </li>
            <li className="flex items-start gap-[8px]">
              <span className="">•</span>
              <span>동일 이메일로 재가입이 가능합니다.</span>
            </li>
          </ul>
        </div>
        <Checkbox 
          checked={isChecked}
          onChange={(checked) => setIsChecked(checked)}
          label="위 내용을 모두 확인했으며, 탈퇴에 동의합니다."
          labelOrderLast={true}
          className="pt-[10px]"
        />
        <div className="flex gap-[12px] mt-[6px]">
          <Button 
            variant="bggray" 
            size="semiMedium" 
            fontSize="font-h4" 
            className="w-[150px]" 
            disabled={loading} 
            onClick={() => navigate("/mypage")}
          >
            나중에 하기
          </Button>
          <Button 
            variant="bgsecondary"
            size="semiMedium" 
            fontSize="font-h4" 
            className="flex-1" 
            disabled={!isChecked} 
            onClick={() => setOpenConfirmDialog(true)}
          >
            탈퇴하기
          </Button>
        </div>
      </div>
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <div className="flex flex-col items-center px-[34px] py-[28px] gap-[16px]">
          <div className="mx-auto p-[8px] bg-secondary-020 font-h2 rounded-full">❗</div>
          <div className="flex flex-col items-center gap-[10px]">
            <h2 className="font-h2">정말 탈퇴하시겠습니까?</h2>
            <p className="font-s1 text-text-02">탈퇴 후에는 복구가 불가능합니다.</p>
          </div>
          <div className="flex gap-[12px] mt-[8px]">
            <Button variant="bggray" fontSize="font-h5" className="w-[96px]" onClick={() => setOpenConfirmDialog(false)} disabled={loading}>
              취소
            </Button>
            <Button 
              onClick={() => handleSubmit()}
              variant="bgsecondary"
              fontSize="font-h5"
              className="w-[120px]"
            >
              {loading ? <Spinner/> : '확인'}
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={openCompleteDialog}
        onClose={() => {logout(); navigate('/'); setOpenCompleteDialog(false);}}
      >
        <div className="flex flex-col items-center p-[28px] gap-[24px]">
          <h2 className="font-h2">회원 탈퇴가 완료되었습니다</h2>
          <Button 
            onClick={() => {logout(); navigate('/'); setOpenCompleteDialog(false);}}
            fontSize="font-h5"
            className="w-[140px]"
          >
            메인으로 이동
          </Button>
        </div>
      </Dialog>
    </div>
  )
}