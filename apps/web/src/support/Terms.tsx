import { ChevronDownCustomIcon, ChevronRightCustomIcon, HDivider, VDivider, DownloadIcon, PrintIcon, MenuDropdown } from "@repo/common"
import { useState } from "react"

export const TermsContent = ({menuSelectable=true, contentClassName=''}: {menuSelectable?: boolean, contentClassName?: string}) => {
  const [selectedMenu, setSelectedMenu] = useState('2025년 7월 11일 본');

  return (
    <>
      <div className="flex flex-col items-center gap-[16px]">
        <div className="flex flex-col items-center gap-[8px]">
          <h1 className="font-h1">빌딩샵 서비스 이용약관</h1>
          <p className="font-s3 text-text-02 w-[550px]">본 약관은 주식회사 정인부동산그룹(이하 "회사")이 제공하는 부동산 설계 서비스 ‘빌딩샵’(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
        </div>
        {menuSelectable ? (
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
        ) : (
          <p className="font-s2 text-text-02">2025년 7월 11일 본</p>
        )}
      </div>
      <div className="w-full flex flex-col gap-[16px]">
        {/* TODO: 다운로드, 인쇄하기 버튼 */}
        <div className="w-full flex items-center justify-end gap-[20px]">
          <button className="flex items-center gap-[4px]"><span className="font-b3 text-text-02">다운로드</span><DownloadIcon/></button>
          <VDivider colorClassName="bg-line-03" className="!h-[12px]"/>
          <button className="flex items-center gap-[4px]"><span className="font-b3 text-text-02">인쇄하기</span><PrintIcon/></button>
        </div>
        <HDivider className="!border-b-line-02"/>
      </div>
      <div className={`w-full flex flex-col gap-[20px] ${contentClassName}`}>
        <h2 className="font-h2-p">제 1 장 개인회원 이용약관</h2>
        <div className="flex flex-col gap-[12px]">
          <h3 className="font-h3">제 1 조 (목적 및 정의)</h3>
          <p className="font-b1">주식회사 카카오(이하 ‘회사’)가 제공하는 서비스를 이용해 주셔서 감사합니다. 회사는 여러분이 회사가 제공하는 다양한 인터넷과 모바일 서비스(카카오 서비스, Daum 서비스 등을 의미하며 이하 해당 서비스들을 모두 합하여 “통합서비스” 또는 “서비스”라 함)에 더 가깝고 편리하게 다가갈 수 있도록 ‘카카오 통합서비스약관’(이하 ‘본 약관’)을 마련하였습니다. 여러분은 본 약관에 동의함으로써 통합서비스에 가입하여 통합서비스를 이용할 수 있습니다. 단, 여러분은 회사가 아닌 계열사를 포함한 제3자가 제공하는 서비스 (예: ㈜카카오모빌리티가 제공하는 카카오 T 택시 서비스)에 가입되지는 않으며, 회사가 제공하는 유료서비스의 경우 여러분이 별도의 유료이용약관에 대한 동의한 때에 회사와 여러분 간의 유료서비스 이용계약이 성립합니다. 본 약관은 여러분이 통합서비스를 이용하는 데 필요한 권리, 의무 및 책임사항, 이용조건 및 절차 등 기본적인 사항을 규정하고 있으므로 조금만 시간을 내서 주의 깊게 읽어주시기 바랍니다.</p>
          <ul className="list-disc list-outside pl-[24px] font-b2">
            <li>카카오 서비스: 회사가 제공하는 1) “카카오” 브랜드를 사용하는 서비스(예:카카오톡) 또는 2) 카카오계정으로 이용하는 서비스(Daum 서비스는 제외, 예: 브런치) (단, 서비스 명칭에 ‘카카오’가 사용되더라도 회사가 아닌 카카오 계열사에서 제공하는 서비스 (예: 카카오 T택시 서비스)는 본 약관의 카카오 서비스에 포함되지 않습니다)</li>
            <li>Daum 서비스: 회사가 제공하는 Daum(다음) 브랜드를 사용하는 서비스(예: Daum 포털 서비스)</li>
            <li>개별 서비스: 통합서비스를 구성하는 카카오 서비스, Daum 서비스 등 브랜드 단위의 서비스를 각 의미함</li>
            <li>세부 하위 서비스: 개별 서비스를 구성하는 개별 서비스 내의 세부 하위 서비스를 의미하며, 예를 들어 각 개별 서비스 내의 유료서비스, 카카오 서비스 내의 카카오톡 서비스, Daum 서비스 내의 카페, 메일 등 서비스 등을 의미함</li>
          </ul>
        </div>
        <div className="flex flex-col gap-[12px]">
          <h3 className="font-h3">제 2 조 (약관의 효력 및 변경)</h3>
          <div className="font-b2">
            <p>① 본 약관의 내용은 통합서비스의 화면에 게시하거나 기타의 방법으로 공지하고, 본 약관에 동의한 여러분 모두에게 그 효력이 발생합니다.</p>
            <p>② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다. 본 약관이 변경되는 경우 회사는 변경사항을 시행일자 15일 전부터 여러분에게 서비스 공지사항에서 공지 또는 통지하는 것을 원칙으로 하며, 피치 못하게 여러분에게 불리한 내용으로 변경할 경우에는 그 시행일자 30일 전부터 카카오계정에 등록된 이메일 주소로 이메일(이메일주소가 없는 경우 서비스 내 전자쪽지 발송, 서비스 내 알림 메시지를 띄우는 등의 별도의 전자적 수단) 발송 또는 여러분이 등록한 휴대폰번호로 카카오톡 메시지 또는 문자메시지 발송하는 방법 등으로 개별적으로 알려 드리겠습니다.</p>
            <p>③ 회사가 전 항에 따라 공지 또는 통지를 하면서 공지 또는 통지일로부터 개정약관 시행일 7일 후까지 거부의사를 표시하지 아니하면 승인한 것으로 본다는 뜻을 명확하게 고지하였음에도 여러분의 의사표시가 없는 경우에는 변경된 약관을 승인한 것으로 봅니다.</p>
            <p>④ 여러분은 변경된 약관에 대하여 거부의사를 표시함으로써 이용계약의 해지를 선택할 수 있습니다.</p>
            <p>⑤ 본 약관은 여러분이 본 약관에 동의한 날로부터 본 약관 제13조에 따른 이용계약의 해지 시까지 적용하는 것을 원칙으로 합니다. 단, 본 약관의 일부 조항은 이용계약의 해지 후에도 유효하게 적용될 수 있습니다</p>
          </div>
        </div>
      </div>
    </>
  )
}

export const Terms = () => {

  return (
    <div className="min-w-[1440px]">
      <div className="w-[1024px] mx-auto flex flex-col gap-[32px] px-[32px] pt-[32px] pb-[48px]">
        <div className="flex items-center gap-[4px]">
          <p className="font-s2 text-text-04">빌딩샵 고객센터</p>
          <ChevronRightCustomIcon />
          <p className="font-s2 text-text-02">서비스 이용약관</p>
        </div>
        <div className="flex flex-col gap-[32px] items-center">
          <HDivider className="!border-b-line-02"/>
          <TermsContent />
        </div>
      </div>
    </div>
  )
}