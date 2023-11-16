import { useStyletron } from "baseui";

type FlexPropsT = any;
export const Flex = ({ children, key, ...props }: FlexPropsT) => {
  const [css, theme] = useStyletron();
  return (
    <div
      key={key}
      className={css({
        display: "flex",
        ...props,
      })}
    >
      {children}
    </div>
  );
};
