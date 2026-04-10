import { ImageResponse } from "next/og";

const size = {
	width: 1200,
	height: 630,
};

const contentType = "image/png";

export { size, contentType };

export default function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					display: "flex",
					width: "100%",
					height: "100%",
					background: "linear-gradient(135deg, #f7f0e8 0%, #e8d8c7 100%)",
					position: "relative",
					padding: 64,
					fontFamily: "Inter, Arial, sans-serif",
					color: "#5a4338",
				}}
			>
				<div
					style={{
						display: "flex",
						position: "absolute",
						inset: 42,
						borderRadius: 36,
						border: "1px solid rgba(90,67,56,0.12)",
						background: "rgba(255,255,255,0.26)",
					}}
				/>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: "100%",
						height: "100%",
						position: "relative",
					}}
				>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 700 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, letterSpacing: 4, textTransform: "uppercase", opacity: 0.72 }}>
								<span style={{ width: 12, height: 12, borderRadius: 999, background: "#5a4338" }} />
								Mela Space
							</div>

							<div style={{ display: "flex", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 74, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.6, maxWidth: 740 }}>
								A step towards clarity.
							</div>
						</div>

						<div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 210, height: 210, borderRadius: 40, background: "rgba(90,67,56,0.06)", border: "1px solid rgba(90,67,56,0.1)" }}>
							<div style={{ display: "flex", width: 136, height: 136, borderRadius: 999, border: "7px solid rgba(90,67,56,0.78)", position: "relative" }}>
								<div style={{ display: "flex", position: "absolute", inset: 26, borderRadius: 999, border: "7px solid rgba(90,67,56,0.38)" }} />
							</div>
						</div>
					</div>

					<div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
							<div style={{ display: "flex", fontSize: 28, lineHeight: 1.45, opacity: 0.86 }}>
								Coaching and reflection tools
								for real progress.
							</div>

							<div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, opacity: 0.72 }}>
								<span style={{ width: 48, height: 2, background: "#5a4338", borderRadius: 999 }} />
								Read, reflect, and take your next clear step.
							</div>
						</div>

						<div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
							<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 10, maxWidth: 380 }}>
								<div style={{ display: "flex", padding: "10px 16px", borderRadius: 999, background: "rgba(90,67,56,0.08)", border: "1px solid rgba(90,67,56,0.12)", fontSize: 20, fontWeight: 600 }}>Reset</div>
								<div style={{ display: "flex", padding: "10px 16px", borderRadius: 999, background: "rgba(141,104,88,0.16)", border: "1px solid rgba(90,67,56,0.12)", fontSize: 20, fontWeight: 600 }}>Reframe</div>
								<div style={{ display: "flex", padding: "10px 16px", borderRadius: 999, background: "rgba(248,243,237,0.9)", border: "1px solid rgba(90,67,56,0.12)", fontSize: 20, fontWeight: 600 }}>Act</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		),
		size,
	);
}