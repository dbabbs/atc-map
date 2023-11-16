import { Button, KIND, SIZE } from "baseui/button";
import { styled } from "baseui";

import { hexToRgb } from "baseui/styles";
import Link from "next/link";

import { APP_URL } from "../constants";

export const NAV_HEIGHT = 53;

export const NavContainer = styled("nav", ({ $theme }) => ({
  display: "flex",
  gap: "8px",
  borderBottom: `1px solid ${hexToRgb($theme.colors.contentPrimary, "0.1")}`,
  padding: "8px 16px",
  justifyContent: "space-between",
  background: hexToRgb($theme.colors.backgroundPrimary, "0.5"),
  backdropFilter: "blur(10px)",
  width: "100%",
  zIndex: 2,
  position: "absolute",
}));

export const Navigation = () => {
  return (
    <NavContainer>
      <Link href={`${APP_URL}/`} passHref legacyBehavior>
        <Button kind={KIND.tertiary} size={SIZE.compact}>
          ATC Map
        </Button>
      </Link>
    </NavContainer>
  );
};
