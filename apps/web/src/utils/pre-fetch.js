import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PreloadLink = ({ href, children, className, onClick }) => {
    const router = useRouter();

    const handleClick = (e) => {
        // If it's a hash link
        if (href.includes('#')) {
            e.preventDefault();

            const [pathname, hash] = href.split('#');
            const targetId = hash;

            // If we're already on the correct page, just scroll
            if (pathname === '' || pathname === '/' && router.pathname === '/') {
                const element = document.getElementById(targetId);

                if (element) {
                    // Get navbar height for offset (assuming 80px, adjust if needed)
                    const navbarHeight = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            } else {
                // We need to navigate to the page first, then scroll
                // Use router.push with a callback to scroll after navigation
                router.push(href);
            }
        }

        // Call the original onClick if provided
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <Link
            href={href}
            className={className}
            onClick={handleClick}
            prefetch={true}
        >
            {children}
        </Link>
    );
};

export default PreloadLink;