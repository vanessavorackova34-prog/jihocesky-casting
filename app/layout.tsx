import "./globals.css";
export const metadata = {
  title: "Jihočeský casting",
  description: "Registrace na casting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
