import { useMapEvents } from "react-leaflet";

interface Props {
  onPin: (lat: number, lng: number) => void;
}

export function MapClickHandler({ onPin }: Props) {
  useMapEvents({
    click(e) {
      onPin(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
