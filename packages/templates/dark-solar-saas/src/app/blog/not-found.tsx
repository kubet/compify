import Link from 'next/link';

export default function BlogNotFound() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
            <div className="w-full max-w-4xl text-center">
                {/* Error code with glow effect */}
                <h1 className="text-8xl md:text-9xl font-bold text-primary mb-4 drop-shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]">
                    404
                </h1>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Blog Post Not Found
                </h2>

                {/* Description */}
                <p className="text-xl text-white/70 mb-10 max-w-lg mx-auto">
                    The blog post you&apos;re looking for has been moved, deleted, or may never have existed.
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium transition-all transform hover:-translate-y-1"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/blog"
                        className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-black font-medium transition-all transform hover:-translate-y-1"
                    >
                        Browse All Articles
                    </Link>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-primary/10 via-transparent to-transparent blur-3xl opacity-50"></div>
            <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-gradient-radial from-primary/5 via-transparent to-transparent blur-3xl opacity-50"></div>
            <div className="absolute bottom-1/3 left-0 w-[300px] h-[300px] bg-gradient-radial from-primary/5 via-transparent to-transparent blur-3xl opacity-50"></div>
        </main>
    );
} 