import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";
import ProgressBar from "@/components/progress-bar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "my-better-t-app",
	description: "my-better-t-app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Suspense fallback={null}>
					<ProgressBar />
				</Suspense>
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}
