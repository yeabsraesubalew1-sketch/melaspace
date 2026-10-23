import "./globals.css";
import { Cormorant_Garamond, Manrope, Noto_Sans_Ethiopic } from "next/font/google";
import localFont from "next/font/local";
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

const selam = localFont({
	src: "../public/fonts/Selam.otf",
	variable: "--font-kewti-selam",
	display: "swap",
});

const notoEthiopic = Noto_Sans_Ethiopic({
	subsets: ["ethiopic"],
	display: "swap",
	variable: "--font-noto-ethiopic",
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

import AuthProvider from "@/components/providers/AuthProvider";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<link rel="preconnect" href="https://website-973c67d0.zvl.obd.mybluehost.me" crossOrigin="anonymous" />
				<link rel="dns-prefetch" href="https://website-973c67d0.zvl.obd.mybluehost.me" />
			</head>
			<body className={`${manrope.className} ${cormorant.variable} ${selam.variable} ${notoEthiopic.variable} min-h-screen bg-background text-foreground`}>
				<AuthProvider>
					<Toaster position="top-center" />
					<div className="relative min-h-screen w-full bg-background">
						<div className="relative z-10">
							{children}
						</div>
					</div>
				</AuthProvider>
			</body>
		</html>
	);
}
