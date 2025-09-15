
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon } from "react-kakao-maps-sdk";
import type { DistrictInfo, LandInfo, LandInfoResp, PlaceList } from "@repo/common";
import { useState } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { loadMapState, saveMapState } from "../utils";

export default function Main() {  
  const axiosInstance = useAxiosWithAuth();
  const [landInfo, setLandInfo] = useState<LandInfoResp | null>(null);
  const [businessDistrict, setBusinessDistrict] = useState<DistrictInfo[] | null>(null);
  const [place, setPlace] = useState<PlaceList | null>(null);
  const defaultMapState = loadMapState();

  const getLandInfo = (lat: number, lng: number) => {
    axiosInstance.get(`/api/land/info?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);
        const landInfo = response.data as LandInfoResp;
        // console.log(landInfo);
        setLandInfo(landInfo);
      })
      .catch((error) => {
        console.error(error);
      });
  }
  
  const getBusinessDistrict = (lat: number, lng: number) => {
    axiosInstance.get(`/api/land/business-district?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);
        const businessDistrict = response.data as DistrictInfo[];
        // console.log(businessDistrict);
        setBusinessDistrict(businessDistrict);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const getPlace = (lat: number, lng: number) => {
    console.log('getPlace', lat, lng);
    axiosInstance.get(`/api/land/place?lat=${lat}&lng=${lng}`)
      .then((response) => {
        // console.log(response.data);
        const place = response.data as PlaceList;
        // console.log(place);
        setPlace(place);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // console.log(landInfo?.polygon[0]);
  return (
    <div className="flex w-full h-full">
      <div className="w-[400px] h-full">
        {landInfo ? <LandInfoCard landInfo={landInfo} businessDistrict={businessDistrict} place={place} onClose={() => setLandInfo(null)} /> : <HomeBoard />}
      </div>
      <div className="flex-1 h-full">
        <Map
          onClick={(_, mouseEvent) => {
            // console.log(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());

            getLandInfo(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            getBusinessDistrict(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            getPlace(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
          }}
          center={{ lat: defaultMapState.centerLat, lng: defaultMapState.centerLng }}
          level={defaultMapState.level}
          onCenterChanged={(map) => {
            // console.log(map.getCenter().getLat(), map.getCenter().getLng());
            saveMapState(map.getCenter().getLat(), map.getCenter().getLng(), map.getLevel());
          }}
          // onDragEnd={(map) => {
          //   console.log(map.getCenter().getLat(), map.getCenter().getLng());
          // }}
          onZoomChanged={(map) => {
            // console.log(map.getLevel());
            saveMapState(map.getCenter().getLat(), map.getCenter().getLng(), map.getLevel());
          }}
          className="w-full h-full"
        >
          {landInfo && (
            <Polygon
              fillColor="var(--color-primary)" // Red fill color
              fillOpacity={0.3} // 70% opacity
              strokeColor="var(--color-primary)" // Black border
              strokeOpacity={1}
              strokeWeight={1.5}
              path={convertXYtoLatLng(landInfo?.land?.polygon || [])} />
          )}
        </Map>
      </div>
    </div>
  );
}