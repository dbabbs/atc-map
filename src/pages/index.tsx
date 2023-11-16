import { styled, useStyletron } from "baseui";
import { Navigation } from "../components/navigation";
import { AirportMap } from "../components/airport-map";
import { useState, useEffect } from "react";
import { hexToRgb } from "baseui/styles";
import { Polyline } from "../components/airport-map";
import {
  LabelSmall,
  HeadingXSmall,
  ParagraphSmall,
  ParagraphMedium,
  LabelMedium,
  ParagraphLarge,
  LabelLarge,
} from "baseui/typography";
import taxiWayData from "../data/taxiways.json";
import Head from "next/head";
import { Flex } from "../components/util/flex";
import { Skeleton } from "baseui/skeleton";
import { Button, SIZE, KIND } from "baseui/button";
import planeImg from "../plane.png";
import { Marker } from "react-map-gl";
import { TBTMap } from "../components/tbt-map";

import { useInterval } from "usehooks-ts";
import { useRouter } from "next/router";

export const StatRow = ({ label, value, color }) => {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      })}
    >
      <ParagraphLarge margin="0" color={theme.colors.contentTertiary}>
        {label}
      </ParagraphLarge>
      <LabelLarge color={color ?? theme.colors.contentPrimary}>
        {value}
      </LabelLarge>
    </div>
  );
};

const Panel = ({ stats, isLoading, revalidate }) => {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        position: "absolute",
        margin: "16px",

        padding: "16px",
        borderRadius: "8px",
        background: hexToRgb(theme.colors.backgroundPrimary, "0.6"),
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "400px",
      })}
    >
      <HeadingXSmall margin="0">Overview Map</HeadingXSmall>
      <Flex flexDirection="column" gap="8px">
        {isLoading ? (
          <>
            <Skeleton height="20x" width="200px" animation />
            <Skeleton height="20px" width="200px" animation />
            <Skeleton height="20px" width="200px" animation />
            <Skeleton height="20px" width="200px" animation />
          </>
        ) : (
          stats.map(([_key, value], index) => {
            return <StatRow key={index} label={_key} value={value} />;
          })
        )}
      </Flex>
    </div>
  );
};

const PathFinder = require("geojson-path-finder").default;

const pathFinder = new PathFinder(taxiWayData);

const route = pathFinder.findPath(
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-66.10049911054594, 18.45718748211543],
    },
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-66.10634892369458, 18.455936180901475],
    },
  }
);

const Container = styled("div", {
  height: "100%",
  width: "100%",
  position: "absolute",
  display: "flex",
});

const useData = (cacheBust, airplaneCode) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(
      `https://gist.githubusercontent.com/hsuperman/7f07968ccf95cb814607b28f55d56e3e/raw/?cachebust=${cacheBust}`
    )
      .then((resp) => resp.json())
      .then((json) => {
        if (json?.airplane_code.toLowerCase() === airplaneCode.toLowerCase()) {
          setData(json);
        }
      });
    setIsLoading(false);
  }, [cacheBust]);
  return { isLoading, data };
};

const useRoute = (data) => {
  if (!data) {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [],
      },
    };
  }

  if (data.taxiway.toLowerCase() === "bravo") {
    //Taxiway Bravo, runway 27
    if (data.runway === 27) {
      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [-66.0974896, 18.4558499],
            [-66.0975682, 18.4563141],
            [-66.0959338, 18.456538],
            [-66.0955667, 18.4570023],
            [-66.0932156, 18.4572924],
            [-66.0932418, 18.4574417],
          ],
        },
      };
    }

    //Taxiway Bravo, runway 9
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [-66.0978947, 18.4558495],
          [-66.0979529, 18.4563007],
          [-66.1056217, 18.4553849],
          [-66.1056985, 18.4559209],
        ],
      },
    };
  }

  //Default (taxiway alpha), runway 27
  if (data.runway === 27) {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [-66.0968287, 18.4579105],
          [-66.0967652, 18.4576562],
          [-66.0937107, 18.4579974],
          [-66.0935978, 18.4573685],
        ],
      },
    };
  }

  //Default (taxiway alpha), runway 9
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-66.0952106, 18.4578262, -40],
        [-66.1062352, 18.4565185, -40],
        [-66.1063442, 18.4564646, -40],
        [-66.1064056, 18.4563633, -40],
        [-66.1063919, 18.4561565, -40],
        [-66.1063397, 18.4558333, -40],
        [-66.0733647, 18.4598812, 500],
      ],
    },
  };
};

const Section = styled("div", {
  height: "100%",
  width: "100%",
  position: "relative",
  flex: 1,
});

const Page = () => {
  const [viewState, setViewState] = useState({
    latitude: 18.45673146145344,
    longitude: -66.09767831152712,
    zoom: 16,
  });

  const router = useRouter();

  const airplaneCode = router.query?.code || "";

  const [cacheBust, setCacheBust] = useState(`${Math.random()}`);

  const { data, isLoading } = useData(cacheBust, airplaneCode);

  const route = useRoute(data);

  const strokeWidth = 1.5;
  const strokeColor = "black";

  useInterval(() => {
    setCacheBust(`${Math.random()}`);
  }, 1000);

  const planePosition =
    route.geometry.coordinates.length > 0
      ? route.geometry.coordinates[0]
      : null;

  const [tbtMounted, setTbtMounted] = useState(false);

  return (
    <Container>
      <Head>
        <title>ATC Map</title>
      </Head>
      <Section>
        <AirportMap
          viewState={viewState}
          setViewState={setViewState}
          planePosition={planePosition}
          route={route}
        ></AirportMap>
        <Panel
          isLoading={isLoading}
          stats={data ? Object.keys(data).map((key) => [key, data[key]]) : []}
        />
        {!tbtMounted && (
          <Button
            onClick={() => setTbtMounted(!tbtMounted)}
            colors={{
              color: "white",
              backgroundColor: "black",
            }}
            overrides={{
              BaseButton: {
                style: {
                  position: "absolute",
                  bottom: "16px",
                  left: "50%",
                  transform: `translateX(-50%)`,
                },
              },
            }}
          >
            Start Navigation
          </Button>
        )}
      </Section>
      {tbtMounted && (
        <Section>
          <TBTMap
            viewState={viewState}
            setViewState={setViewState}
            planePosition={planePosition}
            route={route}
          />
        </Section>
      )}
    </Container>
  );
};

export default Page;
