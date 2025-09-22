import { Figtree } from 'next/font/google';  // Import the font

// Configure Figtree with CSS variable
const figtree = Figtree({
  subsets: ['latin'],  // Supports Latin characters (add more if needed)
  weight: ['300', '400', '500', '600', '700'],  // Weights you might use
  variable: '--font-figtree',  // CSS variable name
  display: 'swap',  // Prevents layout shift
});

export default function MyApp({ Component, pageProps }) {
  return (
    // Apply the font variable to a root div (or body if using <html>)
    <div className={figtree.variable}>
      <Component {...pageProps} />
    </div>
  );
}
