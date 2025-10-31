import { AdditionalInfoContent } from "../auth/AdditionalInfo"
import { useQuery, useQueryClient } from "react-query"
import { QUERY_KEY_USER } from "../constants"
import type { User } from "@repo/common"
import { getAccessToken } from "../authutil"
import { useState } from "react"

export const MyAdditionalInfo = () => {
  // const { data : config } = useQuery<User>({
  //   queryKey: [QUERY_KEY_USER, getAccessToken()]
  // })
  // const [gender, setGender] = useState<"M" | "F" | null>(config?.gender ?? null);
  // const [age, setAge] = useState<string | null>(config?.age ?? null);
  // const [interests, setInterests] = useState<string[]>(config?.interests ?? []);
  // const [additionalInfo, setAdditionalInfo] = useState<string[]>(config?.additionalInfo ?? []);
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const [gender, setGender] = useState<"M" | "F" | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<string[]>([]);

  return (
    <div className="w-[400px] flex flex-col gap-[32px] p-[32px] mx-auto my-[48px] rounded-[8px] border border-line-02">
      <AdditionalInfoContent
        gender={gender}
        setGender={setGender}
        age={age}
        setAge={setAge}
        interests={interests}
        setInterests={setInterests}
        additionalInfo={additionalInfo}
        setAdditionalInfo={setAdditionalInfo}
      />
    </div>
  )
}