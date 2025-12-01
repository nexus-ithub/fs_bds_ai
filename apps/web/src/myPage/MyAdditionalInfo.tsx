import { AdditionalInfoContent } from "../auth/AdditionalInfo"
import { useQuery, useQueryClient } from "react-query"
import { QUERY_KEY_USER } from "../constants"
import type { User } from "@repo/common"
import { getAccessToken } from "../authutil"
import { useEffect, useState } from "react"
import { HDivider, Button, type AdditionalInfo, Spinner } from "@repo/common"
import useAxiosWithAuth from "../axiosWithAuth";
import { toast } from "react-toastify";
import * as Sentry from "@sentry/react";

export const MyAdditionalInfo = () => {
  const queryClient = useQueryClient()
  const axiosInstance = useAxiosWithAuth()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const [initialData, setInitialData] = useState<AdditionalInfo | null>({gender: null, age: null, interests: []})
  const [gender, setGender] = useState<"M" | "F" | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [interests, setInterests] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const getAdditionalInfo = async() => {
    try {
      const response = await axiosInstance.get(`/api/user/additional-info/${config?.id}`)
      setGender(response.data.gender)
      setAge((response.data.age))
      setInterests(response.data.interests)
      setInitialData(response.data)
    } catch (error) {
      console.error(error);
      toast.error('서버 오류가 발생했습니다.')
      Sentry.captureException(error);
    }
  }

  const handleSubmit = async() => {
    try {
      setLoading(true);
      await axiosInstance.post(`/api/user/additional-info`, {
        gender,
        age,
        interests,
      });
      setInitialData({gender, age, interests})
      toast.success('추가 정보가 저장되었습니다.')
    } catch (error) {
      console.error(error);
      toast.error('서버 오류가 발생했습니다.')
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  }

  const isChanged = () => {
    const interestsChanged = interests.length !== initialData.interests.length
      || !interests.every(id => initialData.interests.includes(id));

    return gender !== initialData.gender
      || age !== initialData.age
      || interestsChanged;
  }

  useEffect(() => {
    getAdditionalInfo()
  }, [])

  return (
    <div className="w-[400px] flex flex-col gap-[32px] p-[32px] mx-auto my-[48px] rounded-[8px] border border-line-02">
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
        <Button 
          size="medium" 
          className="flex-1 h-[48px]" 
          fontSize="font-h4" 
          onClick={() => {handleSubmit()}}
          disabled={!isChanged() || loading}
        >{loading ? <Spinner/> : "입력 완료"}</Button>
      </div>
    </div>
  )
}