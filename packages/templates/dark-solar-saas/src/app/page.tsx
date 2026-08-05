import { Hero } from "@/components/Hero";
import { CTASection } from "@/components/CTA";
import { BlogSection } from "@/components/BlogSection";
import { PricingSection } from "@/components/PricingSection";
import { getAllPosts } from "@/lib/blog-service";

// Set revalidation for this page
export const revalidate = 600; // 10 minutes

export default async function Home() {
  // Fetch blog posts at the page level
  const blogPosts = await getAllPosts();

  return (
    <main className="">
      <Hero />

      <BlogSection blogPosts={blogPosts} />

      <PricingSection />

      <CTASection
        title="Transform Your Energy Future"
        description="Join forward-thinking businesses saving up to 60% on energy costs while reducing environmental impact."
        primaryButtonText="Get Started"
        secondaryButtonText="Book a Demo"
      />
    </main>
  );
}
