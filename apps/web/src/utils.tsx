
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
