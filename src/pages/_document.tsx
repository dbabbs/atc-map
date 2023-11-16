// @ts-ignore
import { Server, Sheet } from "styletron-engine-atomic";
import { styletron } from "../styletron";
import { DocumentContext, Head, Html, Main, NextScript } from "next/document";
import { Provider as StyletronProvider } from "styletron-react";
import React from "react";
import { useStyletron } from "baseui";

const MyDocument = ({ stylesheets }: { stylesheets: Sheet[] }) => {
  const [css, theme] = useStyletron();
  return (
    <Html>
      <Head>
        <style>{`
          body, html { border: 0; margin: 0; padding: 0; background: #141414; }
         * { box-sizing: border-box; }
          a { text-decoration: none; }
        `}</style>

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {stylesheets.map((sheet, i) => (
          <style
            key={i}
            className="_styletron_hydrate_"
            dangerouslySetInnerHTML={{ __html: sheet.css }}
            media={sheet.attrs.media}
            data-hydrate={sheet.attrs["data-hydrate"]}
          />
        ))}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const page = await ctx.renderPage({
    // eslint-disable-next-line react/display-name
    enhanceApp: (App: any) => (props: any) =>
      (
        <StyletronProvider value={styletron}>
          <App {...props} />
        </StyletronProvider>
      ),
  });
  const stylesheets = (styletron as Server).getStylesheets() || [];
  return { ...page, stylesheets };
};

export default MyDocument;
