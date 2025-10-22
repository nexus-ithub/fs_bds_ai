
// lat: 37.506448, lng: 127.053366 
// level : 3
export const saveMapState = (centerLat: number, centerLng: number, level: number) => {
  const mapState = {
    centerLat,
    centerLng,
    level
  };
  localStorage.setItem('mapState', JSON.stringify(mapState));
};

export const loadMapState = () => {
  const mapStateString = localStorage.getItem('mapState');
  
  if (!mapStateString) {
    return {
      centerLat: 37.506448,
      centerLng: 127.053366,
      level: 3
    };
  }
  
  try {
    const mapState = JSON.parse(mapStateString);
    return {
      centerLat: mapState.centerLat ?? 37.506448,
      centerLng: mapState.centerLng ?? 127.053366,
      level: mapState.level ?? 3
    };
  } catch {
    return {
      centerLat: null,
      centerLng: null,
      level: null
    };
  }
};


export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg360 = (rad: number) => {
  const deg = (rad * 180) / Math.PI;
  return (deg + 360) % 360;
};
export function bearingFromTo(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const φ1 = toRad(fromLat), φ2 = toRad(toLat), Δλ = toRad(toLng - fromLng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return toDeg360(Math.atan2(y, x));
}
