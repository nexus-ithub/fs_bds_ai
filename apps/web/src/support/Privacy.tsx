import { ChevronDownCustomIcon, ChevronRightCustomIcon, HDivider } from "@repo/common"
import { MenuDropdown } from "@repo/common"
import { useState } from "react"

export const Privacy = () => {
  const [selectedMenu, setSelectedMenu] = useState('2025년 7월 11일 본');

  return (
    <div className="min-w-[1440px]">
      <div className="w-[1024px] mx-auto flex flex-col gap-[32px] px-[32px] pt-[32px] pb-[48px]">
        <div className="flex items-center gap-[4px]">
          <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
          <ChevronRightCustomIcon />
          <p className="font-s2 text-text-02">개인정보 처리방침</p>
        </div>
        <div className="flex flex-col gap-[32px] items-center">
          <HDivider className="!border-b-line-02"/>
          <div className="flex flex-col items-center gap-[16px]">
            <h1 className="font-h1">빌딩샵 개인정보 처리방침</h1>
            <MenuDropdown 
              options={[
                { value: '2025년 7월 11일 본', label: '2025년 7월 11일 본' },
                { value: '2025년 7월 12일 본', label: '2025년 7월 12일 본' },
                { value: '2025년 7월 13일 본', label: '2025년 7월 13일 본' },
                { value: '2025년 7월 14일 본', label: '2025년 7월 14일 본' },
                { value: '2025년 7월 15일 본', label: '2025년 7월 15일 본' },
              ]} 
              value={selectedMenu} 
              onChange={(value) => {setSelectedMenu(value)}}
              borderStyle="underline"
            />
          </div>
        </div>
      </div>
    </div>
  )
}