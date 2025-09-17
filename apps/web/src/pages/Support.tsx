export const Support = () => {
  return (
    <div className="flex w-full h-full bg-yellow-200">
      <div 
        className="flex flex-col items-center justify-center w-full h-[360px] flex-shrink-0"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.3) 100%), url('/support_header.jpg')`,
          backgroundSize: "100% 355.469%",
          backgroundPosition: "0px -150px",
          backgroundRepeat: "no-repeat",
          backgroundColor: "lightgray",
        }}
      >
        <div className="flex flex-col items-center gap-[24px]">
          <h1
            className="text-center font-[Pretendard Variable] font-semibold"
            style={{
              color: "var(--Contents-Text_Reverse, #FFF)",
              fontSize: "40px",
              lineHeight: "48px",
              textShadow: "0 6px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            빌딩샵AI 고객센터에 궁금한 점을 검색해 보세요.
          </h1>
          <div className="w-[480px] p-[12px] bg-white rounded-[100px] border border-line-03">

          </div>
        </div>
      </div>
    </div>
  )
}