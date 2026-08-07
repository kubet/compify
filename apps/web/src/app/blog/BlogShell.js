import Link from 'next/link';
import Wrapper from '@/components/Common/Wrapper';
import Footer from '@/components/Footer';

export function BlogShell({ children }) {
    return (
        <Wrapper>
            <div className="mx-auto w-full max-w-2xl px-4 py-16 text-gray-300">
                {children}
            </div>
            <Footer />
        </Wrapper>
    );
}

export function PostHeader({ title, date }) {
    return (
        <header className="mb-10">
            <Link href="/blog" className="text-sm text-purple-300 hover:text-purple-200">
                ← Blog
            </Link>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h1>
            <p className="mt-3 text-sm text-gray-500">{date}</p>
        </header>
    );
}

export function P({ children }) {
    return <p className="mb-5 leading-relaxed">{children}</p>;
}

export function H2({ children, id }) {
    return <h2 id={id} className="mb-4 mt-10 scroll-mt-24 text-xl font-semibold text-white">{children}</h2>;
}

export function Code({ children }) {
    return (
        <pre className="mb-5 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-sm text-gray-300">
            {children}
        </pre>
    );
}

export function A({ href, children }) {
    return (
        <a href={href} className="text-purple-300 underline decoration-purple-300/40 hover:text-purple-200">
            {children}
        </a>
    );
}
