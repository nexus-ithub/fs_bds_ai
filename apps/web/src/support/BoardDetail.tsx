import { useParams } from "react-router-dom";
import { NoticeSample, FAQSample } from "./Board";
import { Button, ChevronRightCustomIcon, HDivider, type NoticeSampleType, type FaqSampleType } from "@repo/common";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export const BoardDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  // const [notice, setNotice] = useState<>(null);
  const type = location.pathname.startsWith("/support/notice") ? "notice" : "faq";
  const item = type === "notice" 
  ? (NoticeSample.find(d => d.id === Number(id)) as NoticeSampleType)
  : (FAQSample.find(d => d.id === Number(id)) as FaqSampleType);



  return (
    <div className="w-[1024px] h-full mx-auto flex flex-col gap-[40px] px-[32px] pt-[32px] pb-[48px]">
      <div className="flex items-center gap-[4px]">
        <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
        <ChevronRightCustomIcon />
        <p className="font-s2 text-text-02">공지사항</p>
        <ChevronRightCustomIcon />
        <p className="font-s2 text-text-02">{type === "notice" ? "공지" : `${item?.category}`}</p>
        {/* faq일때 category 수정 필요. "AI 관련" 이런식으로.. */}
      </div>
      <div className="flex flex-col gap-[24px] flex-1">
        <div className="flex flex-col gap-[12px]">
          <h2 className="font-h2 text-text-01">{item?.title}</h2>
          {type === "notice" && (
            <p className="font-s2 text-text-03">{format(new Date((item as NoticeSampleType)?.date), "yyyy.MM.dd")}</p>
          )}
        </div>
        <HDivider colorClassName="bg-line-02"/>
        <div className="flex-1 font-b1">{item?.content}</div>
      </div>
      <div className="flex flex-col gap-[24px]">
        <HDivider colorClassName="bg-line-02"/>
        <Button
          variant="outline"
          size="default"
          fontSize="font-h5"
          className="self-start py-[11px]"
          onClick={() => navigate("/support/" + type)}
        >
          목록으로 돌아가기
        </Button>
      </div>
    </div>
  )
}