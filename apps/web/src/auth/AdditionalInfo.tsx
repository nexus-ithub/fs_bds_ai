import { Button, HDivider, AGES, INTERESTS, ADDITIONAL_INFO, Spinner } from "@repo/common";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAxiosWithAuth from "../axiosWithAuth";
import { toast } from "react-toastify";
import { trackError } from "../utils/analytics";

export const AdditionalInfoContent = ({
  gender,
  setGender,
  age,
  setAge,
  interests,
  setInterests,
  // additionalInfo,
  // setAdditionalInfo,
}) => {
  const location = useLocation();
  return (
    <>
      <div className="flex flex-col items-center gap-[6px]">
        <h2 className="font-h2">추가정보 입력</h2>
        <div className="flex flex-col items-center font-s2 text-text-02">
          <p>고객님의 추가 정보를 입력해 주시면</p>
          <p>더 좋은 서비스를 만드는데 도움이 됩니다.</p>
        </div>
      </div>
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col items-center gap-[4px]">
          <h4 className="font-h4">성별</h4>
          <p className="font-s3 text-text-03">고객님의 성별을 선택해 주세요.</p>
        </div>
        <div className="flex items-center gap-[12px]">
          <Button variant={gender === 'M' ? 'outline' : 'outlinegray'} className="flex-1" onClick={() => setGender('M')}>남성</Button>
          <Button variant={gender === 'F' ? 'outline' : 'outlinegray'} className="flex-1" onClick={() => setGender('F')}>여성</Button>
        </div>
      </div>
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col items-center gap-[4px]">
          <h4 className="font-h4">연령</h4>
          <p className="font-s3 text-text-03">고객님의 연령을 알려주세요.</p>
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          {AGES.map((ageItem) => (
            <Button key={ageItem.id} variant={age === ageItem.id ? 'outline' : 'outlinegray'} className="flex-1" onClick={() => setAge(ageItem.id)}>{ageItem.label}</Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col items-center gap-[4px]">
          <h4 className="font-h4">관심 분야</h4>
          <p className="font-s3 text-text-03">고객님의 관심분야를 선택해 주세요 (복수선택)</p>
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          {INTERESTS.map((interest) => (
            <Button 
            key={interest.id}
            variant={interests.includes(interest.id) ? 'outline' : 'outlinegray'} 
            className="flex-1"
            onClick={() => {
              setInterests(prev => 
                prev.includes(interest.id) ? prev.filter(i => i !== interest.id) : [...prev, interest.id]
              );
            }}
            >{interest.label}</Button>
          ))}
        </div>
      </div>
      {/* <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col items-center gap-[4px]">
          <h4 className="font-h4">고객 부가 정보</h4>
          <p className="font-s3 text-text-03">현재 고객님의 정보를 알려주세요.</p>
        </div>
        <div className="flex flex-col gap-[12px]">
          {ADDITIONAL_INFO.map((info) => (
            <Button 
            key={info}
            variant={additionalInfo.includes(info) ? 'outline' : 'outlinegray'} 
            className="flex-1"
            onClick={() => {
              setAdditionalInfo(prev => 
                prev.includes(info) ? prev.filter(i => i !== info) : [...prev, info]
              );
            }}
            >{info}</Button>
          ))}
        </div>
      </div> */}
    </>
  )
}

export const AdditionalInfo = () => {
  const axiosInstance = useAxiosWithAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasAlerted = useRef(false);

  const [gender, setGender] = useState<"M" | "F" | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [interests, setInterests] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!location.state || !location.state.userId) {
      if (!hasAlerted.current) {
        hasAlerted.current = true;
        alert('잘못된 접근입니다.');
        navigate('/signup');
      }
      return;
    }
  }, [location.state, navigate]);

  if (!location.state) {
    return null;
  }

  // const { userId } = location.state;
  // console.log("AdditionalInfo state >>>>> ", location.state)
  
  const handleSubmit = async() => {
    try {
      setLoading(true);
      await axiosInstance.post(`/api/user/additional-info`, {
        gender,
        age,
        interests,
      });
      navigate('/');
    } catch (error) {
      console.log(error);
      toast.error('서버 오류가 발생했습니다.')
      trackError(error, {
        message: '추가정보 입력 중 오류 발생',
        file: 'AdditionalInfo.tsx',
        page: window.location.pathname,
        severity: 'error'
      })
    } finally { 
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-[360px] flex flex-col gap-[32px] p-[32px] rounded-[8px] border border-line-02 shadow-[0_20px_40px_0_rgba(0,0,0,0.06)]">
        <AdditionalInfoContent
          gender={gender}
          setGender={setGender}
          age={age}
          setAge={setAge}
          interests={interests}
          setInterests={setInterests}
          // additionalInfo={additionalInfo}
          // setAdditionalInfo={setAdditionalInfo}
        />
        <HDivider colorClassName="bg-line-02"/>
        <div className="flex items-center gap-[12px]">
          {/* <Button variant="bggray" size="medium" className="w-[80px]" fontSize="font-h4">취소</Button> */}
          <Button size="medium" className="flex-1" fontSize="font-h4" onClick={() => {handleSubmit()}} disabled={loading}>
            {loading ? <Spinner/> : "입력 완료"}
          </Button>
        </div>
      </div>
    </div>
  )
}