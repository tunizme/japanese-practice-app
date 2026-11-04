import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Minna Play · Mỗi ngày một chút tiếng Nhật', description: 'Học từ vựng Minna no Nihongo, luyện Hiragana và Katakana theo cách của bạn.', icons: { icon: { url: '/cat-small.svg', type: 'image/svg+xml', sizes: 'any' } } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body>{children}</body></html>; }
