import "./globals.css";

export const metadata = {
  title: "COOP Prep — Fellowship Ready",
  description: "Private learning app for COOP Financial Services Track",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
