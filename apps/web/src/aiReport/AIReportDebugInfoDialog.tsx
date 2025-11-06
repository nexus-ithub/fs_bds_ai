import { Dialog } from "@mui/material"
import { Button, type AIReportDebugInfo } from "@repo/common"



export const AIReportDebugInfoDialog = ({open, onClose, aiReportDebugInfo}: {open: boolean, onClose: () => void, aiReportDebugInfo : AIReportDebugInfo}) => {
  if (!aiReportDebugInfo) return null;


  const buildInfoList = aiReportDebugInfo?.devDetailInfo.debugBuildInfo?.reduce((acc, cur) => {
    if (cur === "\n") {
      // 새 그룹 시작
      acc.push([]);
    } else {
      // 현재 그룹에 추가
      acc[acc.length - 1].push(cur);
    }
    return acc;
  }, [[]]);
  const remodelInfoList = aiReportDebugInfo?.devDetailInfo.debugRemodelInfo?.reduce((acc, cur) => {
    if (cur === "\n") {
      // 새 그룹 시작
      acc.push([]);
    } else {
      // 현재 그룹에 추가
      acc[acc.length - 1].push(cur);
    }
    return acc;
  }, [[]]);
    const rentInfoList = aiReportDebugInfo?.devDetailInfo.debugRentInfo?.reduce((acc, cur) => {
    if (cur === "\n") {
      // 새 그룹 시작
      acc.push([]);
    } else {
      // 현재 그룹에 추가
      acc[acc.length - 1].push(cur);
    }
    return acc;
  }, [[]]);

  console.log('buildInfoList',buildInfoList)
  return (
    <Dialog
      maxWidth="xl"
      open={open} onClose={onClose}>

      <p className="px-[20px] py-[20px] font-h3">사업계획서 확인(개발용)</p>
      <div className="p-[20px] h-[100vh] space-y-[16px] overflow-y-auto">
        <div className="flex-1">
          <p className="font-s2 space-y-[4px] bg-gray-200 p-[16px] rounded-[8px]">{aiReportDebugInfo?.devDetailInfo.debugExtraInfo.map((item, index) => (
            <p key={index}>{item}</p>
          ))}</p>
        </div>          
        <div className="flex gap-[16px]">
          <div className="flex-1 border border-gray-200 rounded-[8px] p-2">
            <div className="flex flex-col gap-2 font-s2">
              {buildInfoList?.map((item, index) => (
                item.length > 0 && (
                  <div className="bg-surface-third p-[16px] rounded-[8px] border border-gray-200" key={index}>
                    {item.map((item, index) => (
                      <p key={index} className={`${item.startsWith('<') ? 'text-primary font-bold' : ''} ${index === 0 ? 'font-h3' : ''}`}>{item}</p>
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>
          <div className="flex-1 border border-gray-200 rounded-[8px] p-2">
            <div className="flex flex-col gap-2 font-s2">
              {remodelInfoList?.map((item, index) => (
                item.length > 0 && (
                  <div className="bg-surface-third p-[16px] rounded-[8px] border border-gray-200" key={index}>
                    {item.map((item, index) => (
                     <p key={index} className={`${item.startsWith('<') ? 'text-primary font-bold' : ''} ${index === 0 ? 'font-h3' : ''}`}>{item}</p>
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>       
          <div className="flex-1 border border-gray-200 rounded-[8px] p-2">
            <div className="flex flex-col gap-2 font-s2">
              {rentInfoList?.map((item, index) => (
                item.length > 0 && (
                  <div className="bg-surface-third p-[16px] rounded-[8px] border border-gray-200" key={index}>
                    {item.map((item, index) => (
                      <p key={index} className={`${item.startsWith('<') ? 'text-primary font-bold' : ''} ${index === 0 ? 'font-h3' : ''}`}>{item}</p>
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>                 
        </div>
      </div>
      <Button 
        className="my-[12px] py-[12px] w-full" 
        fontSize="font-h4"
        onClick={onClose}>
        확인
      </Button>          
    </Dialog>
  )
}