"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

export default function ProgressBar() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		// Configure NProgress
		NProgress.configure({
			showSpinner: false,
			trickleSpeed: 200,
			minimum: 0.08,
		});

		// Start progress on route change
		const handleStart = () => {
			NProgress.start();
		};

		// Complete progress when route change is done
		const handleComplete = () => {
			NProgress.done();
		};

		// Trigger on pathname or searchParams change
		handleStart();
		const timer = setTimeout(() => {
			handleComplete();
		}, 100);

		return () => {
			clearTimeout(timer);
			handleComplete();
		};
	}, [pathname, searchParams]);

	return null;
}

