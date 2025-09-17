import type { AreaPolygons, DistanceLines, LatLng } from "@repo/common";
import { X } from "lucide-react";
import React from "react";
import { CustomOverlayMap, Polygon, Polyline } from "react-kakao-maps-sdk"

export const AreaOverlay = (
  {
    isDrawingArea,
    areaPaths,
    mousePosition,
    // polygonArea,
    areas,
    // setPolygonArea,
    setAreas,
  }: {
    isDrawingArea: boolean;
    areaPaths: LatLng[];
    mousePosition: LatLng;
    // polygonArea: any;
    areas: AreaPolygons[];
    // setPolygonArea: (polygonArea: any) => void;
    setAreas: React.Dispatch<React.SetStateAction<AreaPolygons[]>>;
  }
) => {
  return (
    <>
      {isDrawingArea && (
        <Polygon
          // path={isDrawingArea ? [...areaPaths, mousePosition] : areaPaths}
          path={[...areaPaths, mousePosition]}
          strokeWeight={2}
          strokeColor={"var(--color-primary)"}
          strokeOpacity={1}
          strokeStyle={"solid"}
          fillColor={"var(--color-primary)"}
          fillOpacity={0.2}
          // onCreate={setPolygonArea}
        />
      )}
      {areas.map((area) => (
    <React.Fragment key={area.id}>
      <Polygon
        path={area.paths}
        strokeWeight={2}
        strokeColor={"var(--color-primary)"}
        strokeOpacity={1}
        strokeStyle={"solid"}
        fillColor={"var(--color-primary)"}
        fillOpacity={0.2}
        onCreate={(polygon) => {
          area.polygonArea = polygon;
        }}
      />
      <CustomOverlayMap position={area.paths[area.paths.length - 1]} clickable={true}>
        <div className="relative p-[8px] bg-white rounded-[4px] shadow-md border border-line-03 font-s2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAreas((prev: AreaPolygons[]) => prev.filter((a) => a.id !== area.id))
            }}
            className="absolute -top-2 -right-2 bg-white rounded-full border border-line-03 p-[2px]"
          >
            <X size={12} />
          </button>
          총면적{" "}
          <span className="font-s2-p text-primary pl-[2px]">
            {Math.round(area.polygonArea?.getArea() ?? 0).toLocaleString()}
          </span>{" "}
          m<sup>2</sup>
        </div>
      </CustomOverlayMap>
    </React.Fragment>
  ))}
    </>
  );
};

export const DistanceOverlay = (
  {
    isDrawingDistance,
    distancePaths,
    mousePosition,
    showDistanceOverlay,
    distances,
    distanceLines,
    setClickLine,
    setMoveLine,
    setDistanceLines,
  }: {
    isDrawingDistance: boolean;
    distancePaths: LatLng[];
    mousePosition: LatLng;
    showDistanceOverlay: boolean;
    distances: number[];
    distanceLines: DistanceLines[];
    setClickLine: (clickLine: any) => void;
    setMoveLine: (moveLine: any) => void;
    setDistanceLines: React.Dispatch<React.SetStateAction<DistanceLines[]>>;
  }
) => {
  const formatDistance = (distance: number): string => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`;
    }
    return `${distance} m`;
  }

  const DistanceInfo = ({ distance, distanceLineId }: { distance: number; distanceLineId?: string }) => {
    const walkTime = (distance / 67) | 0
    const bycicleTime = (distance / 227) | 0

    return (
      <ul className="relative p-[8px] bg-white rounded-[4px] shadow-md border border-line-03 font-s2">
        <li className="mb-[4px] flex justify-between gap-[8px]">
          <span className="label text-gray-700">총거리</span>
          <span className="number text-primary font-s2-p">{formatDistance(distance)}</span>
        </li>
        <li className="mb-[4px] flex justify-between">
          <span className="label text-gray-700">도보</span>
          <span className="number text-primary font-s2-p">
            {walkTime > 60 && `${Math.floor(walkTime / 60)} 시간 `}
            {walkTime % 60} 분
          </span>
        </li>
        <li className="flex justify-between">
          <span className="label text-gray-700">자전거</span>
          <span className="number text-primary font-s2-p">
            {bycicleTime > 60 && `${Math.floor(bycicleTime / 60)} 시간 `}
            {bycicleTime % 60} 분
          </span>
        </li>
        {distanceLineId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDistanceLines((prev: DistanceLines[]) => prev.filter((d) => d.id !== distanceLineId))
            }}
            className="absolute -top-2 -right-2 bg-white rounded-full border border-line-03 p-[2px]"
          >
            <X size={12} />
          </button>
        )}
      </ul>
    )
  }
  
  return (
    <>
      {/* 현재 그리고 있는 거리 측정 라인 */}
      {showDistanceOverlay && (
        <>
          <Polyline
            path={distancePaths}
            strokeWeight={2}
            strokeColor={"var(--color-primary)"}
            strokeOpacity={1}
            strokeStyle={"solid"}
            onCreate={setClickLine}
          />
          {distancePaths.map((path) => (
            <CustomOverlayMap
              key={`dot-${path.lat},${path.lng}`}
              position={path}
              zIndex={1}
              clickable={true}
            >
              <span className="dot"></span>
            </CustomOverlayMap>
          ))}
          {distancePaths.length > 1 &&
            distances.slice(1, distances.length).map((distance, index) => (
              <CustomOverlayMap
                key={`distance-${distancePaths[index + 1].lat},${distancePaths[index + 1].lng}`}
                position={distancePaths[index + 1]}
                yAnchor={1}
                zIndex={2}
                // clickable={true}
              >
                {!isDrawingDistance && distances.length === index + 2 ? (
                  <DistanceInfo distance={distance} />
                ) : (
                  <div className="dotOverlay px-[4px] py-[2px] bg-white rounded-[4px] shadow-md border border-line-03 font-s4">
                    <span className="number">{formatDistance(distance)}</span>
                  </div>
                )}
              </CustomOverlayMap>
            ))}
          <Polyline
            path={isDrawingDistance ? [distancePaths[distancePaths.length - 1], mousePosition] : []}
            strokeWeight={2}
            strokeColor={"var(--color-primary)"}
            strokeOpacity={0.6}
            strokeStyle={"solid"}
            onCreate={setMoveLine}
          />
        </>
      )}

      {/* 완료된 거리 측정 라인들 */}
      {distanceLines.map((distanceLine) => (
        <React.Fragment key={distanceLine.id}>
          <Polyline
            path={distanceLine.paths}
            strokeWeight={2}
            strokeColor={"var(--color-primary)"}
            strokeOpacity={1}
            strokeStyle={"solid"}
          />
          {distanceLine.paths.map((path, pathIndex) => (
            <CustomOverlayMap
              key={`completed-dot-${distanceLine.id}-${pathIndex}`}
              position={path}
              zIndex={1}
              clickable={true}
            >
              <span className="dot"></span>
            </CustomOverlayMap>
          ))}
          {distanceLine.distances.slice(1).map((distance, index) => (
            <CustomOverlayMap
              key={`completed-distance-${distanceLine.id}-${index}`}
              position={distanceLine.paths[index + 1]}
              yAnchor={1}
              zIndex={2}
              clickable={true}
            >
              {index === distanceLine.distances.length - 2 ? (
                <DistanceInfo 
                  distance={distance} 
                  distanceLineId={distanceLine.id}
                />
              ) : (
                <div className="dotOverlay px-[4px] py-[2px] bg-white rounded-[4px] shadow-md border border-line-03 font-s4">
                  <span className="number">{formatDistance(distance)}</span>
                </div>
              )}
            </CustomOverlayMap>
          ))}
        </React.Fragment>
      ))}
    </>
  )
}