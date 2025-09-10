
import type { LandInfo } from "@repo/common";



export const LandInfoCard = ({landInfo = null}: {landInfo: LandInfo | null}) => {
  if (!landInfo) {
    return null;
  }
  return (
    <div>
      <p>{landInfo.id}</p>
      <p>{landInfo.area}</p>
      <p>{landInfo.possDivName}</p>
      <p>{landInfo.possPersonNum}</p>
      <p>{landInfo.usage1Name}</p>
      <p>{landInfo.usage2Name}</p>
      <p>{landInfo.jimokName}</p>
      <p>{landInfo.curUse}</p>
      <p>{landInfo.height}</p>
      <p>{landInfo.roadContact}</p>
      <p>{landInfo.price}</p>
      <p>{landInfo.shape}</p>
      {/* <p>{landInfo.usageList}</p> */}
      <p>{landInfo.sidoName}</p>
      <p>{landInfo.sigunguName}</p>
      <p>{landInfo.legEupmyeondongName}</p>
      <p>{landInfo.legLiName}</p>
      <p>{landInfo.roadName}</p>
      <p>{landInfo.isUnderground}</p>
      <p>{landInfo.buildingMainNum}</p>
      <p>{landInfo.buildingSubNum}</p>
      <p>{landInfo.localBuildingName}</p>
      <p>{landInfo.buildingLegName}</p>
      <p>{landInfo.isApartmentHouse}</p>
      <p>{landInfo.roadWidth}</p>
    </div>
  )
}