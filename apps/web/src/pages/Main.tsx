
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon } from "react-kakao-maps-sdk";
import type { LandInfo } from "@repo/common";
import { useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";

export default function Main() {  
  const axiosInstance = useAxiosWithAuth();
  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);

  // console.log(landInfo?.polygon[0]);
  return (
    <div className="flex w-full h-full">
      <div className="w-[400px] h-full">
        {landInfo ? <LandInfoCard landInfo={landInfo} /> : null}
      </div>
      <div className="flex-1 h-full">
        <Map
          onClick={(_, mouseEvent) => {
            // console.log(target, mouseEvent);
            console.log(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            
            axiosInstance.get(`/api/land/info?lat=${mouseEvent.latLng.getLat()}&lng=${mouseEvent.latLng.getLng()}`)
              .then((response) => {
                console.log(response.data);
                const landInfo = response.data as LandInfo;
                console.log(landInfo);
                setLandInfo(landInfo);
              })
              .catch((error) => {
                console.error(error);
              });

          }}
          center={{ lat: 37.506448, lng: 127.053366 }}
          level={3}
          className="w-full h-full"
        >
          {landInfo && (
            <Polygon
              fillColor="var(--color-primary)" // Red fill color
              fillOpacity={0.3} // 70% opacity
              strokeColor="var(--color-primary)" // Black border
              strokeOpacity={1}
              strokeWeight={1.5}
              path={convertXYtoLatLng(landInfo?.polygon || [])} />
          )}
        </Map>
      </div>
    </div>
  );
}