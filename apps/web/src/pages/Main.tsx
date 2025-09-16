
import useAxiosWithAuth from "../axiosWithAuth";
import { Map, Polygon } from "react-kakao-maps-sdk";
import { YoutubeLogo, YoutubeVideoLogo, type DistrictInfo, type LandInfo, type LandInfoResp, type PlaceList } from "@repo/common";
import { useEffect, useState, useRef } from "react";
import { convertXYtoLatLng } from "../../utils";
import { LandInfoCard } from "../landInfo/LandInfo";
import { HomeBoard } from "../homeBoard/HomeBoard";
import { loadMapState, saveMapState } from "../utils";
import type { YoutubeVideo, PlayerMode } from "@repo/common";
import { PictureInPicture, PictureInPicture2, X } from "lucide-react";

export default function Main() {  
  const axiosInstance = useAxiosWithAuth();
  const [landInfo, setLandInfo] = useState<LandInfoResp | null>(null);
  const [businessDistrict, setBusinessDistrict] = useState<DistrictInfo[] | null>(null);
  const [place, setPlace] = useState<PlaceList | null>(null);
  const defaultMapState = loadMapState();

  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [openVideoMiniPlayer, setOpenVideoMiniPlayer] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);
  const iframeRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    console.log(">>>>>", playerMode);
  }, [playerMode])

  // console.log(landInfo?.polygon[0]);
  return (
    <div className="flex w-full h-full">
      <div className="w-[400px] h-full">
        {landInfo ? 
          <LandInfoCard landInfo={landInfo} businessDistrict={businessDistrict} place={place} onClose={() => setLandInfo(null)} /> : 
          <HomeBoard 
            selectedVideo={selectedVideo}
            setSelectedVideo={(video) => {
              setSelectedVideo(video);
              setPlayerMode("large");
            }}
            openVideoMiniPlayer={openVideoMiniPlayer}
            setOpenVideoMiniPlayer={setOpenVideoMiniPlayer}
          />}
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
      {openVideoMiniPlayer && (
        <div
          className={`fixed z-50 bg-white rounded-lg overflow-hidden shadow-lg transition-transform duration-300 border border-line-02
            ${playerMode === "large"
              ? "left-[30%] top-[17%] w-[80%] h-[605px] max-w-[960px] aspect-video scale-100"
              : "bottom-2 right-2 w-[480px] h-[320px]"}`
          }
        >
          <div className={`flex items-center justify-between py-[7px] border-b border-line-02 ${playerMode === "mini" ? "h-[44px]" : "h-[64px]"}`}>
            <div className="flex items-center gap-[13px] px-[12px] py-[14px]">
              <p className={playerMode === "mini" ? "font-h4" : "font-h3"}>빌딩의 신</p>
              <YoutubeLogo width={playerMode === "mini" ? 64 : 82} height={playerMode === "mini" ? 14 : 20}/>
            </div>
            <div className={`flex items-center gap-[13px] ${playerMode === "mini" ? "px-[12px]" : "px-[20px]"}`}>
              {playerMode === "mini" ? (
                <button onClick={() => setPlayerMode("large")}>
                  <PictureInPicture2 size={20}/>
                </button>
              ) : (
                <button onClick={() => setPlayerMode("mini")}>
                  <PictureInPicture size={20}/>
                </button>
              )}
              <button onClick={() => setOpenVideoMiniPlayer(false)}>
                <X size={20}/>
              </button>
            </div>
          </div>
          <div className={playerMode === "large" ? "w-[960px] h-[540px]" : "w-[488px] h-[275px]"}>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo?.videoId}?autoplay=1`}
              allow="autoplay; clipboard-write; encrypted-media; gyroscope;"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}