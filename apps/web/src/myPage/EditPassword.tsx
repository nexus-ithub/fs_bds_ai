import { Button, FormField, HDivider, Spinner } from "@repo/common"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import useAxiosWithAuth from "../axiosWithAuth";
import { Dialog } from "@mui/material";

export const EditPassword = ({userId}: {userId: number}) => {
  const axiosInstance = useAxiosWithAuth();
  const [showCurrentPW, setShowCurrentPW] = useState<boolean>(false);
  const [showNewPW, setShowNewPW] = useState<boolean>(false);
  const [showNewPWConfirm, setShowNewPWConfirm] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>("");
  const [openSuccessDialog, setOpenSuccessDialog] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await axiosInstance.put('/api/user/password', {userId, password, newPassword});
      setPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setError('');
      setOpenSuccessDialog(true);
    } catch (error) {
      setError(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-[480px] flex flex-col gap-[24px] px-[32px] py-[48px]">
        <div className="flex flex-col gap-[24px] p-[32px] rounded-[8px] border border-line-02">
          <h2 className="font-h2 text-center">비밀번호 변경</h2>
          <HDivider/>
          <div className="flex flex-col gap-[4px]">
            <FormField 
              label="현재 비밀번호" 
              type={showCurrentPW ? 'text' : 'password'} 
              placeholder="비밀번호를 입력하세요." 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button type="button" onClick={() => setShowCurrentPW(!showCurrentPW)}>
                  {showCurrentPW ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/>}
                </button>
              }
              />
            {error && (
              <p className="font-s3 text-secondary-050">{error}</p>
            )}
          </div>
          <HDivider/>
          <FormField 
            label="새 비밀번호" 
            type={showNewPW ? 'text' : 'password'} 
            placeholder="비밀번호를 입력하세요." 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)}
            rightElement={
              <button type="button" onClick={() => setShowNewPW(!showNewPW)}>
                {showNewPW ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/>}
              </button>
            }
            />
          <FormField 
            label="새 비밀번호 확인" 
            type={showNewPWConfirm ? 'text' : 'password'} 
            placeholder="비밀번호를 입력하세요." 
            value={newPasswordConfirm} 
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            rightElement={
              <button type="button" onClick={() => setShowNewPWConfirm(!showNewPWConfirm)}>
                {showNewPWConfirm ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/>}
              </button>
            }
            />
          <div className="flex flex-col pt-[12px]">
            <Button 
              className="h-[40px]"
              fontSize="font-h5"
              onClick={handleSubmit}
              disabled={!password || !newPassword || !newPasswordConfirm || newPassword !== newPasswordConfirm}
            >
              {loading ? <Spinner /> : '변경'}
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={openSuccessDialog} onClose={() => {setOpenSuccessDialog(false)}}>
        <div className="flex flex-col gap-[24px] min-w-[300px] p-[20px]">
          <div className="flex flex-col items-center justify-center gap-[8px]">
            <p className="font-h3 pt-[12px]">비밀번호가 성공적으로 변경되었습니다.</p>
          </div>
          <div className="flex justify-center gap-[12px]">
            <Button className="w-[160px]" onClick={() => {setOpenSuccessDialog(false)}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}