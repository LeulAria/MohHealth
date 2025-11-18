"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMemo } from "react";

const LOGO_BLUE = "#005EB8";

export default function MUIThemeProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode: "light",
					primary: {
						main: LOGO_BLUE,
						light: "#3378C4",
						dark: "#004085",
						contrastText: "#ffffff",
					},
					secondary: {
						main: "#ffffff",
						contrastText: LOGO_BLUE,
					},
					background: {
						default: "#ffffff",
						paper: "#ffffff",
					},
					text: {
						primary: "rgba(0, 0, 0, 0.87)",
						secondary: "rgba(0, 0, 0, 0.6)",
					},
				},
				typography: {
					fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					h1: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					h2: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					h3: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					h4: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					h5: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					h6: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					body1: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					body2: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					button: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					caption: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
					overline: {
						fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif',
					},
				},
				components: {
					MuiCssBaseline: {
						styleOverrides: {
							"*": {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
							},
							body: {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
							},
						},
					},
					MuiButton: {
						styleOverrides: {
							root: {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
								textTransform: "none",
								borderRadius: 8,
							},
						},
					},
					MuiTextField: {
						styleOverrides: {
							root: {
								"& .MuiInputBase-root": {
									fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
								},
								"& .MuiInputLabel-root": {
									fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
								},
							},
						},
					},
					MuiSelect: {
						styleOverrides: {
							root: {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
							},
						},
					},
					MuiMenuItem: {
						styleOverrides: {
							root: {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
							},
						},
					},
					MuiTypography: {
						styleOverrides: {
							root: {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
							},
						},
					},
					MuiInputBase: {
						styleOverrides: {
							root: {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
							},
						},
					},
					MuiFormLabel: {
						styleOverrides: {
							root: {
								fontFamily: '"Shuromeda Serif", "Nokia", "Roboto", "Arial", sans-serif !important',
							},
						},
					},
				},
			}),
		[],
	);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
}

