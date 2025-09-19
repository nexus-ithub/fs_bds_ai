import { ChevronDownCustomIcon, ChevronRightCustomIcon, DownloadIcon, HDivider, PrintIcon, VDivider } from "@repo/common"
import { MenuDropdown } from "@repo/common"
import { useState } from "react"

const termsIndexSample = [
  { id: "article1", title: "제1조 (목적)", content: `본 약관은 주식회사 원티드랩(이하 "회사")이 운영하는 웹사이트(이하 "사이트")에서 제공하는 제반 서비스를 이용함에 있어, 사이트와 회원 간의 이용 조건 및 제반 절차, 기타 필요한 사항을 규정함을 목적으로 한다.` },
  { id: "article2", title: "제2조 (용어의 정의)", content: `이 약관에서 사용하는 용어의 정의는 아래와 같다.\n "사이트"라 함은 "회사"가 서비스를 "회원"에게 제공하기 위하여 컴퓨터 등 정보 통신 설비를 이용하여 설정한 가상의 영업장 또는 "회사"가 운영하는 웹사이트를 말한다. "서비스"라 함은 "회사"가 "사이트"를 통해 개인이 등록한 자료를 DB화하여 각각의 목적에 맞게 분류, 가공, 집계하여 정보를 제공하는 서비스, 개인이 구직 등의 목적으로 등록한 자료를 제공받는 서비스, 기업에 관한 자료를 수집, 분류, 가공하여 정보를 제공하는 서비스 등 및 이들 서비스와 관련하여 각 "사이트"에서 제공하는 모든 부대/제휴 서비스를 총칭한다. "회원"이라 함은 서비스를 이용하기 위하여 동 약관에 동의하거나 페이스북 등 연동 된 서비스를 통해 "회사"와 이용 계약을 체결한 개인을 말한다. "아이디"라 함은 회원의 식별과 회원의 서비스 이용을 위하여 "회원"이 가입 시 사용한 이메일 주소를 말한다. "비밀번호"라 함은 "회사"의 서비스를 이용하려는 사람이 아이디를 부여받은 자와 동일인임을 확인하고 "회원"의 권익을 보호하기 위하여 "회원"이 선정한 문자와 숫자의 조합 또는 이와 동일한 용도로 쓰이는 "사이트"에서 자동 생성된 인증코드를 말한다. "비회원"이라 함은 "회원"에 가입하지 않고 "회사"가 제공하는 서비스를 이용하는 자를 말한다. "콘텐츠"라 함은 "회원"이 등록한 개인정보 및 이력서와 사이트에 게시한 게시물을 말한다. "커뮤니티"라 함은 "사이트"에 가입한 "회원"이 자신의 정보를 공개 및 공유하고, 다른 "회원"과 의사, 생각, 지식 등을 표현 및 소통할 수 있도록 "회사"가 "사이트" 내에 부가적으로 만든 인터넷 게시판을 의미한다. "커뮤니티 콘텐츠"란 "회원"이 "커뮤니티"에 게시한 부호, 문자, 도형, 색채, 음성, 음향, 이미지, 영상, 그리고 이들의 복합체를 포함한 것을 의미한다. "포인트"라 함은 "회사"가 "회원"의 서비스 이용을 위하여 지급 및 적립하고, "회원"이 각 "사이트" 내에서 사용 가능한 가상의 적립금, e-머니, 충전금 등을 말하며, 어떠한 경우에도 현금성 재화로 출금되지 않는다.` },
  { id: "article3", title: "제3조 (약관의 명시와 개정)", content: "" },
  { id: "article4", title: "제4조 (약관의 해석)", content: "" },
  { id: "article5", title: "제5조 (이용계약의 성립)", content: "" },
  { id: "article6", title: "제6조 (이용신청의 승낙과 제한)", content: "" },
  { id: "article7", title: "제7조 (약관의 명시와 개정)", content: "" },
  { id: "article8", title: "제8조 (약관의 해석)", content: "" },
  { id: "article9", title: "제9조 (이용계약의 성립)", content: "" },
  { id: "article10", title: "제10조 (이용신청의 승낙과 제한)", content: "" },
  { id: "article11", title: "제11조 (약관의 명시와 개정)", content: "" },
  { id: "article12", title: "제12조 (약관의 해석)", content: "" },
  { id: "article13", title: "제13조 (이용계약의 성립)", content: "" },
  { id: "article14", title: "제14조 (이용신청의 승낙과 제한)", content: "" },
  { id: "article15", title: "제15조 (약관의 명시와 개정)", content: "" },
  { id: "article16", title: "제16조 (약관의 해석)", content: "" },
  { id: "article17", title: "제17조 (이용계약의 성립)", content: "" },
  { id: "article18", title: "제18조 (이용신청의 승낙과 제한)", content: "" },
  { id: "article19", title: "제19조 (약관의 명시와 개정)", content: "" },
  { id: "article20", title: "제20조 (약관의 해석)", content: "" },
  { id: "article21", title: "제21조 (이용계약의 성립)", content: "" },
  { id: "article22", title: "제22조 (이용신청의 승낙과 제한)", content: "" },
  { id: "article23", title: "제23조 (약관의 명시와 개정)", content: "" },
  { id: "article24", title: "제24조 (약관의 해석)", content: "" },
  { id: "article25", title: "제25조 (이용계약의 성립)", content: "" },
  { id: "article26", title: "제26조 (이용신청의 승낙과 제한)", content: "" },
];

export const Privacy = () => {
  const [selectedMenu, setSelectedMenu] = useState('2025년 7월 11일 본');

  const TermsIndexTable = () => {
    // 3열로 나누기
    const chunkSize = 3;
    const rows = [];
    for (let i = 0; i < termsIndexSample.length; i += chunkSize) {
      rows.push(termsIndexSample.slice(i, i + chunkSize));
    }

    const handleClick = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
  
    return (
      <table className="w-full border border-line-02 text-sm">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-line-02">
              {row.map((item) => (
                <td
                  key={item.id}
                  className="border-r border-line-02 px-4 py-2"
                  onClick={() => handleClick(item.id)}
                >
                  <h5 className="font-h5 text-primary-040 cursor-pointer">
                    {item.title}
                  </h5>
                </td>
              ))}
              {/* {row.length < chunkSize &&
                Array.from({ length: chunkSize - row.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="border-r border-line-02" />
                ))} */}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

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
          <div className="w-full flex flex-col gap-[24px]">
            <div className="w-full flex flex-col gap-[16px]">
              {/* TODO: 다운로드, 인쇄하기 버튼 */}
              <div className="w-full flex items-center justify-end gap-[20px]">
                <button className="flex items-center gap-[4px]"><span className="font-b3 text-text-02">다운로드</span><DownloadIcon/></button>
                <VDivider colorClassName="bg-line-03" className="!h-[12px]"/>
                <button className="flex items-center gap-[4px]"><span className="font-b3 text-text-02">인쇄하기</span><PrintIcon/></button>
              </div>
              <HDivider className="!border-b-line-02"/>
            </div>
            <TermsIndexTable/>
          </div>
          <HDivider className="!border-b-line-02"/>
          <div className="w-full flex flex-col gap-[20px]">
            {termsIndexSample.map((item) => (
              <div
                key={item.id}
                id={item.id}
                className="w-full flex flex-col gap-[12px]"
              >
                <h3 className="font-h3">{item.title}</h3>
                {item.content ? (
                  <p className="font-b1 whitespace-pre-line">
                    {item.content}
                  </p>
                ) : (
                  <p className="font-b1 text-gray-400">내용 준비 중</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}