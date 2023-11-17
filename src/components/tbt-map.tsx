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
import { useStyletron } from "baseui";
import { hexToRgb } from "baseui/styles";
import { Skeleton } from "baseui/skeleton";
import { Flex } from "./util/flex";
import { HeadingLarge, HeadingXSmall, HeadingXLarge } from "baseui/typography";
import { MdTurnLeft } from "react-icons/md";
import useAnimationFrame from "use-animation-frame";
import length from "@turf/length";
import along from "@turf/along";
import bearing from "@turf/bearing";

/*
  This component's viewstate is controlled by the parent component.
  Pass in a viewState and setViewState in order to move the map around
  */

const CurrentLocation = ({ frame }) => {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        position: "absolute",
        margin: "32px",
        bottom: 0,
        padding: "16px 32px",
        borderRadius: "8px",
        background: hexToRgb(theme.colors.backgroundPrimary, "0.8"),
        backdropFilter: "blur(10px)",
        display: "flex",
        gap: "16px",
        left: "50%",
        transform: `translate(-50%)`,
      })}
    >
      <HeadingLarge margin="0">
        {frame < max * 0.26 ? "Taxiway A" : "Runway 9"}
      </HeadingLarge>
    </div>
  );
};

const Panel = ({ frame }) => {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        position: "absolute",
        margin: "32px",

        padding: "32px",
        borderRadius: "8px",
        background: hexToRgb(theme.colors.backgroundPrimary, "0.8"),
        backdropFilter: "blur(10px)",
        display: "flex",

        gap: "16px",
        width: "calc(100% - 64px)",
      })}
    >
      <MdTurnLeft size={84} color="white" />

      <Flex flexDirection="column">
        <HeadingLarge color={theme.colors.contentSecondary} margin="0">
          {frame < max * 0.08 && "0.3 miles"}
          {frame >= max * 0.08 && frame < max * 0.16 && "0.2 miles"}
          {frame >= max * 0.16 && frame < max * 0.26 && "0.1 miles"}
        </HeadingLarge>
        <HeadingXLarge margin="0">
          {frame < max * 0.26 ? "Runway 9" : "Takeoff"}
        </HeadingXLarge>
      </Flex>
    </div>
  );
};

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

const max = 30000;

const useCurrentPosition = (frame, route) => {
  if (!route || route.geometry.coordinates.length < 2) {
    return {
      currentPosition: [-66.10049911054594, 18.45718748211543],
      currentBearing: 0,
    };
  }

  // console.log(route);

  const _length = length(route, { units: "miles" });
  // console.log(_length);
  //
  const currentPosition = along(route, _length * (frame / max), {
    units: "miles",
  });

  return {
    currentPosition: currentPosition.geometry.coordinates,
    currentBearing: bearing(
      currentPosition.geometry.coordinates,
      along(route, _length * ((frame + 100) / max), {
        units: "miles",
      }).geometry.coordinates
    ),
  };
};
export const TBTMap = ({
  children,
  planePosition,
  viewState,
  setViewState,
  route,
}) => {
  const mapStyle = `mapbox://styles/mapbox/satellite-v9`;
  const [attributionText, setAttributionText] = useState(null);
  const layers = [];

  const tiles3DLayer = getSatellite3DLayer({ setAttributionText });
  layers.push(tiles3DLayer);

  const [frame, setFrame] = useState(0);

  useAnimationFrame(() => setFrame((f) => f + 1));

  const { currentPosition, currentBearing } = useCurrentPosition(
    frame,
    route,
    viewState
  );

  // console.log(frame);

  if (route) {
    layers.push(
      new GeoJsonLayer({
        id: "geojson-layer",
        data: {
          type: "FeatureCollection",
          features: [route],
        },
        pickable: true,
        stroked: false,
        filled: true,
        extruded: true,
        pointType: "circle",
        lineWidthScale: 1,
        lineWidthMinPixels: 2,
        getFillColor: [160, 160, 180, 200],
        getLineColor: (d) => {
          return [255, 0, 0];
        },
        getPointRadius: 100,
        getLineWidth: 4,
        getElevation: 0,
        // extensions: [new TerrainExtension()],
      })
    );
  }

  if (planePosition) {
    const plane = new ScenegraphLayer({
      id: "scenegraph-layer",
      data: [currentPosition],
      pickable: true,

      scenegraph: MODEL_URL,
      sizeScale: 30,
      sizeMinPixels: 0.1,
      sizeMaxPixels: 1.5,
      getPosition: (d) => [...d, -10],
      getOrientation: (d) => [0, 360 - currentBearing, 90],
      extensions: [new TerrainExtension()],
    });
    layers.push(plane);
  }

  return (
    <>
      <DeckGL
        viewState={{
          latitude: currentPosition[1],
          longitude: currentPosition[0],
          zoom: 19,
          pitch: 70,
          bearing: currentBearing,
        }}
        // onViewStateChange={(e) => setViewState(e.viewState)}
        controller={true}
        layers={layers}
      />

      <Panel frame={frame} />
      <CurrentLocation frame={frame} />
    </>
  );
};
