import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "NovaFlow",
  description: "Workspace Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Toaster position="bottom-right" />
        {children}
      </body>
    </html>
  );
}