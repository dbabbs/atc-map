import React, { useEffect, useState } from "react";
import { Provider as StyletronProvider } from "styletron-react";
import {
  createLightTheme,
  createDarkTheme,
  BaseProvider,
  useStyletron,
} from "baseui";
import { styletron } from "../styletron";
import NextNProgress from "nextjs-progressbar";

export const COLOR_THEMES = {
  light: "light",
  dark: "dark",
};

const primitives = {
  primaryFontFamily: "Inter",
};
export const lightTheme = {
  ...createLightTheme({ ...primitives }),
  name: COLOR_THEMES.light,
};

export const darkTheme = {
  ...createDarkTheme(
    { ...primitives },
    {
      colors: {
        contentWarning: "#FFC700",
      },
    }
  ),
  name: COLOR_THEMES.dark,
};

export type ColorTheme = (typeof COLOR_THEMES)[keyof typeof COLOR_THEMES];

export const useColorTheme = (): ColorTheme => {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(COLOR_THEMES.light);

  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)")?.matches) {
      setColorTheme(COLOR_THEMES.dark);
    }
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        setColorTheme(event.matches ? COLOR_THEMES.dark : COLOR_THEMES.light);
      });
  }, []);

  return colorTheme;
};

const ProgressBar = () => {
  const [, theme] = useStyletron();
  return (
    <NextNProgress
      color={theme.colors.contentWarning}
      options={{ showSpinner: false }}
    />
  );
};

function MyApp({ Component, pageProps }) {
  const colorTheme = useColorTheme();

  return (
    <StyletronProvider value={styletron}>
      <BaseProvider
        // theme={colorTheme === COLOR_THEMES.light ? lightTheme : darkTheme}
        theme={darkTheme}
      >
        <ProgressBar />
        <Component {...pageProps} />
      </BaseProvider>
    </StyletronProvider>
  );
}

export default MyApp;
