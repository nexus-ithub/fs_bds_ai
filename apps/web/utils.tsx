
import type { LatLng, Coords } from "@repo/common";


export function convertXYtoLatLng(data: Coords[] | Coords[][]): LatLng[] | LatLng[][] {
  if (Array.isArray(data[0])) {
    // XY[][] → LatLng[][]
    return (data as Coords[][]).map(ring =>
      ring.map(p => ({ lat: p.y, lng: p.x }))
    )
  } else {
    // XY[] → LatLng[]
    return (data as Coords[]).map(p => ({ lat: p.y, lng: p.x }))
  }
}