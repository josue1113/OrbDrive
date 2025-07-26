// Definições básicas do Google Maps para TypeScript
declare namespace google {
  namespace maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface Icon {
      url: string;
      size?: Size;
      origin?: Point;
      anchor?: Point;
      scaledSize?: Size;
    }

    interface Symbol {
      path: string | SymbolPath;
      anchor?: Point;
      fillColor?: string;
      fillOpacity?: number;
      rotation?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    interface Size {
      width: number;
      height: number;
    }

    interface Point {
      x: number;
      y: number;
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      streetViewControl?: boolean;
      rotateControl?: boolean;
      fullscreenControl?: boolean;
    }

    enum SymbolPath {
      CIRCLE = 'circle',
      FORWARD_CLOSED_ARROW = 'forward_closed_arrow',
      FORWARD_OPEN_ARROW = 'forward_open_arrow',
      BACKWARD_CLOSED_ARROW = 'backward_closed_arrow',
      BACKWARD_OPEN_ARROW = 'backward_open_arrow'
    }
  }
} 