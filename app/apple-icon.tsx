import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b291f 0%, #221610 100%)",
          borderRadius: 44,
          position: "relative",
        }}
      >
        {/* Outer Ring */}
        <div
          style={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: 999,
            border: "6px solid rgba(150, 112, 84, 0.45)",
          }}
        />
        {/* Core Clarity Ring */}
        <div
          style={{
            position: "absolute",
            width: 70,
            height: 70,
            borderRadius: 999,
            border: "8px solid #f5e6d3",
          }}
        />
        {/* Focal Dot */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: "#f5e6d3",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
