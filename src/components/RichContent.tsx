import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";

interface RichContentProps {
  html: string;
  baseUrl?: string;
}

export function RichContent({ html, baseUrl }: RichContentProps) {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(200);

  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 12px;
            background: #1e293b;
            color: #e2e8f0;
            font-family: -apple-system, system-ui;
            font-size: 14px;
            line-height: 1.5;
          }
          pre { background: #0f172a; padding: 12px; border-radius: 8px; overflow-x: auto; }
          code { font-family: 'SF Mono', monospace; font-size: 13px; }
          img { max-width: 100%; height: auto; border-radius: 8px; }
          a { color: #818cf8; }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'resize', height: document.body.scrollHeight })
          );
          new ResizeObserver(() => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'resize', height: document.body.scrollHeight })
            );
          }).observe(document.body);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ height, width: width - 32 }} className="rounded-xl overflow-hidden">
      <WebView
        source={{ html: wrappedHtml, baseUrl }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "resize") {
              setHeight(Math.max(50, data.height + 24));
            }
          } catch {
            // Ignore parse errors
          }
        }}
        style={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}
