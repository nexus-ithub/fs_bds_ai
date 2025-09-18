import { useParams } from "react-router-dom";
import { NoticeSample } from "./Notice";
import { ChevronRightCustomIcon, HDivider } from "@repo/common";
import { format } from "date-fns";

export const NoticeDetail = () => {
  const { id } = useParams();
  // const [notice, setNotice] = useState<>(null);
  const notice = NoticeSample.find((notice) => notice.id === Number(id));


  return (
    <div className="w-[1024px] h-full mx-auto flex flex-col gap-[40px] px-[32px] pt-[32px] pb-[48px] bg-red-200">
      <div className="flex items-center gap-[4px]">
        <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
        <ChevronRightCustomIcon />
        <p className="font-s2 text-text-02">공지사항</p>
        <ChevronRightCustomIcon />
        <p className="font-s2 text-text-02">공지</p>
      </div>
      <div className="flex flex-col gap-[24px] flex-1">
        <div className="flex flex-col gap-[12px]">
          <h2 className="font-h2 text-text-01">{notice?.title}</h2>
          <p className="font-s2 text-text-03">{format(new Date(notice?.date), "yyyy.MM.dd")}</p>
        </div>
        <HDivider className="!border-b-line-02"/>
        <div className="flex-1 font-b1 bg-purple-200">{notice?.content}</div>
      </div>
    </div>
  )
}