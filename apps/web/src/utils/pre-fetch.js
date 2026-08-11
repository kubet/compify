"use client";

import Link from "next/link";

const PreloadLink = ({ href, children, className, onClick }) => {
  const handleClick = (event) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      typeof href !== "string" ||
      typeof window === "undefined"
    ) {
      return;
    }

    const targetUrl = new URL(href, window.location.href);
    const isSameDocument =
      targetUrl.origin === window.location.origin &&
      targetUrl.pathname === window.location.pathname &&
      targetUrl.search === window.location.search;

    if (!isSameDocument || !targetUrl.hash) return;

    const target = document.getElementById(decodeURIComponent(targetUrl.hash.slice(1)));
    if (!target) return;

    event.preventDefault();
    window.history.pushState(
      null,
      "",
      `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
    );

    const navbarHeight =
      document.querySelector(".site-navbar")?.getBoundingClientRect().height ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <Link href={href} className={className} onClick={handleClick} prefetch>
      {children}
    </Link>
  );
};

export default PreloadLink;
