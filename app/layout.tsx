import "./globals.css";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import { getBaseUrl, seoConfig } from "@/lib/seo";

const manrope = Manrope({
	subsets: ["latin"],
	display: "swap",
});

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["500", "600", "700"],
	display: "swap",
	variable: "--font-brand-heading",
});

export const metadata: Metadata = {
	metadataBase: new URL(getBaseUrl()),
	title: {
		default: seoConfig.siteName,
		template: `%s | ${seoConfig.siteName}`,
	},
	description: seoConfig.defaultDescription,
	applicationName: seoConfig.siteName,
	openGraph: {
		type: "website",
		siteName: seoConfig.siteName,
		title: seoConfig.siteName,
		description: seoConfig.defaultDescription,
		url: "/",
	},
	twitter: {
		card: "summary_large_image",
		title: seoConfig.siteName,
		description: seoConfig.defaultDescription,
	},
	alternates: {
		canonical: "/",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={`${manrope.className} ${cormorant.variable} min-h-screen bg-background text-foreground`}>
				<Toaster position="top-center" />
				<div className="relative min-h-screen w-full bg-background">
					<div className="relative z-10">
						{children}
					</div>
				</div>
			</body>
		</html>
	);
}
