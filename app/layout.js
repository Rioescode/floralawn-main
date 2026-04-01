import { Inter } from "next/font/google";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";
import BottomNav from './components/BottomNav';
import { AuthProvider } from '@/lib/context/AuthContext';
import { metadata } from './metadata';
import { generateLocalBusinessSchema } from '@/utils/seo-helpers';
import { businessInfo } from '@/utils/business-info';

import Script from "next/script";

const font = Inter({ subsets: ["latin"] });

export { metadata };
export const viewport = {
	width: 'device-width',
	initialScale: 1
};

export default function RootLayout({ children }) {
	return (
		<html
			lang="en"
			data-theme={config.colors.theme}
			className={font.className}
		>
			<body className="bg-gray-50 min-h-screen pb-24">
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(generateLocalBusinessSchema(businessInfo)) }}
				/>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							if (typeof window !== 'undefined' && !window.__globalErrorHandlerSetup) {
								window.__globalErrorHandlerSetup = true;
								const originalErrorHandler = window.onerror;
								window.onerror = function(message, source, lineno, colno, error) {
									if ((typeof message === 'string' && (message.includes('insecure') || message.includes('clipboard'))) || 
										(error && (error.message?.includes('insecure') || error.message?.includes('clipboard')))) {
										return true;
									}
									if (originalErrorHandler) return originalErrorHandler.call(this, message, source, lineno, colno, error);
									return false;
								};
								window.addEventListener('unhandledrejection', function(event) {
									const reason = event.reason;
									const errorMsg = reason?.message || reason?.toString() || '';
									if (errorMsg.includes('insecure') || errorMsg.includes('clipboard')) {
										event.preventDefault();
										event.stopPropagation();
									}
								}, true);
								window.addEventListener('error', function(event) {
									const errorMsg = event.message || event.error?.message || '';
									if (errorMsg.includes('insecure') || errorMsg.includes('clipboard')) {
										event.preventDefault();
										event.stopPropagation();
									}
								}, true);
							}
						`
					}}
				/>
				<AuthProvider>
					<ClientLayout>{children}</ClientLayout>
				</AuthProvider>
				<Script
					src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,drawing,geometry`}
					strategy="beforeInteractive"
				/>
				<BottomNav />
			</body>
		</html>
	);
}
