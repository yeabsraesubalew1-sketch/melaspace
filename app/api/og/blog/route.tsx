import { ImageResponse } from "next/og";

function getBaseUrl() {
	const envBaseUrl =
		process.env.NEXT_PUBLIC_SITE_URL ??
		process.env.NEXT_PUBLIC_BASE_URL ??
		process.env.NEXTAUTH_URL;

	if (envBaseUrl) {
		return envBaseUrl;
	}

	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	return "http://localhost:3000";
}

interface Blog {
	title: string;
	excerpt: string;
	categories: {
		name: string;
		slug: string;
	}[];
}

async function getBlog(slug: string): Promise<Blog | null> {
	try {
		const res = await fetch(`${getBaseUrl()}/api/blogs/${encodeURIComponent(slug)}`, {
			next: { revalidate: 60 },
		});

		if (!res.ok) {
			return null;
		}

		const json = await res.json();

		if (!json.success) {
			return null;
		}

		return json.data as Blog;
	} catch {
		return null;
	}
}

function clampText(text: string, maxLength: number) {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function fallbackImage() {
	return new ImageResponse(
		(
			<div
				style={{
					display: "flex",
					width: "100%",
					height: "100%",
					background: "linear-gradient(135deg, #f7f0e8 0%, #e8d8c7 100%)",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 54,
					fontWeight: 700,
					color: "#5a4338",
					fontFamily: "Georgia, serif",
				}}
			>
				Mela Space
			</div>
		),
		{ width: 1200, height: 630 },
	);
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const slug = searchParams.get("slug")?.trim();

	if (!slug) {
		return fallbackImage();
	}

	const blog = await getBlog(slug);

	if (!blog) {
		return fallbackImage();
	}

	const categories = blog.categories?.slice(0, 3).map((cat) => cat.name) ?? [];
	const title = clampText(blog.title, 68);
	const excerpt = clampText(blog.excerpt || "Thoughts on clarity, growth, and practical reflection.", 150);

	return new ImageResponse(
		(
			<div
				style={{
					display: "flex",
					width: "100%",
					height: "100%",
					background: "linear-gradient(135deg, #f7f0e8 0%, #e9dac9 100%)",
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
						inset: 44,
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
					<div style={{ display: "flex", justifyContent: "space-between", gap: 32 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7 }}>
								<span style={{ width: 12, height: 12, borderRadius: 999, background: "#5a4338" }} />
								Mela Space
							</div>

							<div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
								{categories.map((category) => (
									<div
										key={category}
										style={{
											display: "flex",
											padding: "12px 18px",
											borderRadius: 999,
											background: "rgba(90,67,56,0.08)",
											border: "1px solid rgba(90,67,56,0.12)",
											fontSize: 22,
											fontWeight: 600,
										}}
									>
										{category}
									</div>
								))}
							</div>
						</div>

						<div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 210, height: 210, borderRadius: 40, background: "rgba(90,67,56,0.06)", border: "1px solid rgba(90,67,56,0.1)" }}>
							<div style={{ display: "flex", width: 136, height: 136, borderRadius: 999, border: "7px solid rgba(90,67,56,0.78)", position: "relative" }}>
								<div style={{ display: "flex", position: "absolute", inset: 26, borderRadius: 999, border: "7px solid rgba(90,67,56,0.38)" }} />
							</div>
						</div>
					</div>

					<div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
						<div style={{ display: "flex", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 74, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.5 }}>
							{title}
						</div>

						<div style={{ display: "flex", fontSize: 28, lineHeight: 1.45, opacity: 0.86, maxWidth: 900 }}>
							{excerpt}
						</div>

						<div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, opacity: 0.72 }}>
							<span style={{ width: 48, height: 2, background: "#5a4338", borderRadius: 999 }} />
							Read on Mela Space
						</div>
					</div>
				</div>
			</div>
		),
		{ width: 1200, height: 630 },
	);
}