import React, {
  forwardRef,
  Ref,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import MapGL, { Layer, MapRef, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import taxiWayData from "../data/taxiways.json";
import DeckGL from "@deck.gl/react";
import { styled } from "baseui";
import { Tile3DLayer, TileLayer } from "@deck.gl/geo-layers";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { _TerrainExtension as TerrainExtension } from "@deck.gl/extensions";
import { BitmapLayer } from "@deck.gl/layers";

/*
This component's viewstate is controlled by the parent component.
Pass in a viewState and setViewState in order to move the map around
*/

export const Polyline = ({ data, color = "red", id }) => {
  return (
    <Source id={`${id}-taxiways-source`} type="geojson" data={data}>
      <Layer
        id={`${id}-taxiways-layer`}
        type="line"
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
        paint={{
          "line-color": color,
          "line-width": 3,
        }}
      />
    </Source>
  );
};

export const getSatellite3DLayer = ({ setAttributionText }) => {
  return new Tile3DLayer({
    id: "google-3d-tiles",
    data: `https://tile.googleapis.com/v1/3dtiles/root.json`,
    loadOptions: {
      fetch: {
        headers: {
          "X-GOOG-API-KEY": process.env.NEXT_PUBLIC_GMAPS_API_KEY,
        },
      },
    },
    operation: "terrain+draw",
    onTilesetLoad: (tileset3d) => {
      tileset3d.options.onTraversalComplete = (selectedTiles) => {
        const uniqueCredits = new Set();
        selectedTiles.forEach((tile) => {
          const { copyright } = tile.content.gltf.asset;
          copyright.split(";").forEach(uniqueCredits.add, uniqueCredits);
        });
        setAttributionText([...uniqueCredits].join("; "));
        return selectedTiles;
      };
    },
  });
};

const MODEL_URL =
  "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/scenegraph-layer/airplane.glb";

export const getSatelliteLayer = ({ googleSession }) => {
  return new TileLayer({
    id: "google-satellite-tiles",
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    data: `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${googleSession}&key=${process.env.NEXT_PUBLIC_GMAPS_API_KEY}`,

    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: (props) => {
      const {
        bbox: { west, south, east, north },
      } = props.tile;
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
      });
    },
  });
};

export const MAP_STYLES = {
  satellite: "satellite",
  satellite3D: "satellite3D",
  streets: "streets",
  // minimal: "minimal",
};

export const useGoogleSession = (mapStyle) => {
  const [googleSession, setGoogleSession] = useState({
    [MAP_STYLES.streets]: null,
    [MAP_STYLES.satellite]: null,
  });
  const fetchGoogleSession = useCallback(async () => {
    if (googleSession[mapStyle]) {
      return;
    }

    const response = await fetch(
      `https://tile.googleapis.com/v1/createSession?key=${process.env.NEXT_PUBLIC_GMAPS_API_KEY}`,
      {
        body: JSON.stringify({
          mapType: mapStyle === MAP_STYLES.satellite ? "satellite" : "roadmap",
          language: "en-US",
          region: "US",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );
    const json = await response.json();
    const session = json.session;

    setGoogleSession({
      ...googleSession,
      [mapStyle]: session,
    });
  }, [googleSession, mapStyle]);

  useEffect(() => {
    fetchGoogleSession();
  }, [mapStyle, fetchGoogleSession]);

  return googleSession;
};

export const AirportMap = ({
  children,
  planePosition,

  route,
}) => {
  const [viewState, setViewState] = useState({
    latitude: 18.45673146145344,
    longitude: -66.09967831152712,
    zoom: 15,
  });

  const mapStyle = `mapbox://styles/mapbox/satellite-v9`;
  const [attributionText, setAttributionText] = useState(null);
  const layers = [];

  const tiles3DLayer = getSatellite3DLayer({ setAttributionText });
  // layers.push(tiles3DLayer);

  const googleSession = useGoogleSession("satellite");

  const satelliteLayer = getSatelliteLayer({
    googleSession: googleSession.satellite,
  });
  layers.push(satelliteLayer);

  if (route) {
    layers.push(
      new GeoJsonLayer({
        id: "geojson-layer",
        data: {
          type: "FeatureCollection",
          features: [
            {
              ...route,
              geometry: {
                ...route.geometry,
                coordinates: route.geometry.coordinates.map((x) => [
                  x[0],
                  x[1],
                  0,
                ]),
              },
            },
          ],
        },
        pickable: true,
        stroked: false,
        filled: true,
        extruded: true,
        pointType: "circle",
        lineWidthScale: 1,
        lineWidthMinPixels: 2,
        getFillColor: [160, 160, 180, 200],
        getLineColor: (d) => [255, 0, 0],

        getPointRadius: 100,
        getLineWidth: 6,
        getElevation: 0,
      })
    );
  }

  if (planePosition) {
    const plane = new ScenegraphLayer({
      id: "scenegraph-layer-2",
      data: [planePosition],
      pickable: true,

      scenegraph: MODEL_URL,
      sizeScale: 3,
      sizeMinPixels: 0.1,
      sizeMaxPixels: 5,
      getPosition: (d) => [...d, 600],
      getOrientation: (d) => [0, 93, 90],
    });
    layers.push(plane);
  }

  return (
    <DeckGL
      initialViewState={viewState}
      // onViewStateChange={(e) => setViewState(e.viewState)}
      controller={true}
      layers={layers}
    />
  );
};
