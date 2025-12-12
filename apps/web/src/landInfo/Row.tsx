
import React from 'react'

export const Title = ({title}: {title: string}) => {
  return (
    <p className="font-h4 py-[12px]">{title}</p>
  )
}

export const Row = ({title, content}: {title: string, content: string | React.ReactNode}) => {
  return (
    <div className="font-s2 flex items-center justify-between py-[8px] min-h-[48px] gap-[24px]">
      <p className="text-text-03 shrink-0">{title}</p>
      <div className="">{content}</div>
    </div>
  )
}