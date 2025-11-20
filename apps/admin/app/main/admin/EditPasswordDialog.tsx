import { Dialog } from "@mui/material";
import { CloseIcon, FormField } from "@repo/common";
import { Check, Eye, EyeOff } from "lucide-react";
import { HDivider, Button, Spinner, Admin } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../../utils/axiosWithAuth";

interface EditPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  selectedAdmin?: Admin;
}

export const EditPasswordDialog = ({ open, onClose, selectedAdmin }: EditPasswordDialogProps) => {
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
      await axiosInstance.put("/admin", {action: "updatePassword", id: selectedAdmin?.id, password, newPassword});
      setPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setError('');
      setOpenSuccessDialog(true);
    } catch (error: any) {
      // console.log(error)
      setError(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setError('');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="w-full flex justify-center">
        <div className="w-[420px] flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[20px] p-[26px] rounded-[8px] border border-line-02">
            <div className="flex items-center justify-between">
              <h2 className="font-h3">비밀번호 변경</h2>
              <button onClick={onClose}><CloseIcon/></button>
            </div>
            <HDivider/>
            <form 
              className="flex flex-col gap-[20px] relative" 
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <FormField 
                label="현재 비밀번호" 
                type={showCurrentPW ? 'text' : 'password'} 
                placeholder="비밀번호를 입력하세요." 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <span onClick={() => setShowCurrentPW(!showCurrentPW)} className="cursor-pointer">
                    {showCurrentPW ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/> }
                  </span>
                }
              />
              {error && (
                <p className="font-s3 text-secondary-050 absolute top-[2px] right-[10px]">{error}</p>
              )}

              <HDivider/>

              <FormField 
                label="새 비밀번호" 
                type={showNewPW ? 'text' : 'password'} 
                placeholder="비밀번호를 입력하세요." 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                rightElement={
                  <span onClick={() => setShowNewPW(!showNewPW)} className="cursor-pointer">
                    {showNewPW ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/> }
                  </span>
                }
              />

              <FormField 
                label="새 비밀번호 확인" 
                type={showNewPWConfirm ? 'text' : 'password'} 
                placeholder="비밀번호를 입력하세요." 
                value={newPasswordConfirm} 
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                rightElement={
                  <div onClick={() => setShowNewPWConfirm(!showNewPWConfirm)} className="cursor-pointer flex items-center">
                    <div
                      className={`transition-opacity duration-200 pr-[6px] ${
                        newPassword && newPasswordConfirm ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {newPassword === newPasswordConfirm ? (
                        <Check className="text-green-500 w-5 h-5" />
                      ) : (
                        ""
                      )}
                    </div>
                    {showNewPWConfirm ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/> }
                  </div>
                }
              />

              <div className="flex items-center justify-center gap-[12px] pt-[12px]">
                <Button 
                  type="button"
                  variant="bggray"
                  className="h-[40px] w-[88px]"
                  fontSize="font-h5"
                  onClick={onClose}
                >
                  취소
                </Button>
                <Button 
                  type="submit"
                  className="h-[40px] w-[160px]"
                  fontSize="font-h5"
                  disabled={!password || !newPassword || !newPasswordConfirm || newPassword !== newPasswordConfirm}
                >
                  {loading ? <Spinner /> : '변경'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Dialog 
        open={openSuccessDialog} 
        onClose={() => {setOpenSuccessDialog(false); onClose();}}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setOpenSuccessDialog(false);
            onClose();
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-col gap-[24px] min-w-[300px] p-[20px]">
          <div className="flex flex-col items-center justify-center gap-[8px]">
            <p className="font-h3 pt-[12px]">비밀번호가 성공적으로 변경되었습니다.</p>
          </div>
          <div className="flex justify-center gap-[12px]">
            <Button className="w-[160px]" onClick={() => {setOpenSuccessDialog(false); onClose();}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </Dialog>
  )
}