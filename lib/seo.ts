import type { Metadata } from "next";

const SITE_NAME = "Mela Space";
const DEFAULT_DESCRIPTION =
	"Mela Space helps creators and founders grow with clarity through practical strategy, content systems, and coaching.";
export const OG_IMAGE_VERSION = "2026-04-11-1";

export function getBaseUrl() {
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

export function absoluteUrl(path = "/") {
	return new URL(path, getBaseUrl()).toString();
}

interface BuildPageMetadataOptions {
	title: string;
	description?: string;
	path?: string;
	type?: "website" | "article";
	noIndex?: boolean;
}

export function buildPageMetadata({
	title,
	description = DEFAULT_DESCRIPTION,
	path = "/",
	type = "website",
	noIndex = false,
}: BuildPageMetadataOptions): Metadata {
	const imageUrl = absoluteUrl(`/opengraph-image?v=${OG_IMAGE_VERSION}`);

	return {
		title,
		description,
		alternates: {
			canonical: path,
		},
		openGraph: {
			title,
			description,
			url: absoluteUrl(path),
			siteName: SITE_NAME,
			type,
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 630,
					alt: `${SITE_NAME} preview card`,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [imageUrl],
		},
		robots: noIndex
			? {
					index: false,
					follow: true,
				}
			: undefined,
	};
}

export const seoConfig = {
	siteName: SITE_NAME,
	defaultDescription: DEFAULT_DESCRIPTION,
};
