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
	isExactTitle?: boolean;
}

export function buildPageMetadata({
	title,
	description = DEFAULT_DESCRIPTION,
	path = "/",
	type = "website",
	noIndex = false,
	isExactTitle = false,
}: BuildPageMetadataOptions): Metadata {
	const imageUrl = absoluteUrl(`/opengraph-image?v=${OG_IMAGE_VERSION}`);
	const shouldBeAbsolute = isExactTitle || path === "/";

	return {
		title: shouldBeAbsolute ? { absolute: title } : title,
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
	defaultTitle: `${SITE_NAME} - Calm Coaching, Clarity & Growth`,
	defaultDescription: DEFAULT_DESCRIPTION,
};

export function breadcrumbSchema(items: { name: string; path: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path),
		})),
	};
}

export function organizationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: SITE_NAME,
		alternateName: ["መላ ስፔስ", "MelaSpace", "Mela"],
		url: absoluteUrl("/"),
		logo: absoluteUrl("/icon.svg"),
		description: DEFAULT_DESCRIPTION,
		founder: {
			"@type": "Person",
			name: "Dr. Simret E. Tesfahun",
			jobTitle: "Founder & Coach",
			url: absoluteUrl("/about"),
		},
		sameAs: [
			"https://t.me/DrSimaEsu",
			"https://www.instagram.com/sima_esu",
			"https://www.youtube.com/@simretesubalew",
			"https://www.tiktok.com/@simretesubalew",
			"https://t.me/SimaEsubooks",
			"https://t.me/PageTurnersBookClubEthiopia",
		],
	};
}

export function webSiteSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_NAME,
		alternateName: ["መላ ስፔስ", "MelaSpace"],
		url: absoluteUrl("/"),
		description: DEFAULT_DESCRIPTION,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${absoluteUrl("/blogs")}?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};
}

