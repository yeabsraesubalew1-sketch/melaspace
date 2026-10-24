import "./globals.css";
import { Cormorant_Garamond, Manrope, Noto_Sans_Ethiopic } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import { getBaseUrl, seoConfig, organizationSchema, webSiteSchema } from "@/lib/seo";

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
		default: seoConfig.defaultTitle,
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
				{/* Safeguard against upstream Next.js / Turbopack dev performance.measure bug during RSC notFound/redirect/errors */}
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){if(typeof window!=='undefined'&&window.performance&&typeof window.performance.measure==='function'){var m=window.performance.measure.bind(window.performance);window.performance.measure=function(n,s,e){try{if(s&&typeof s==='object'){var o=Object.assign({},s);if(typeof o.end==='number'&&(!isFinite(o.end)||o.end<0)){o.end=Math.max(0,typeof o.start==='number'&&isFinite(o.start)?o.start:0);}if(typeof o.start==='number'&&(!isFinite(o.start)||o.start<0)){o.start=0;}return m(n,o);}return m(n,s,e);}catch(x){if(x instanceof TypeError&&(x.message.indexOf('negative')!==-1||x.message.indexOf('time stamp')!==-1)){return;}throw x;};};}})();`,
					}}
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema()) }}
				/>
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
