import Wrapper from "@/components/Common/Wrapper";
import Footer from "@/components/Footer";
import Hero from "@/components/LandingSections/Hero";
import Sections from "@/components/LandingSections/Sections";
import { getTopComponentsServerless } from "@/lib/api";

// Re-generate periodically so public registry items can appear without a redeploy.
export const revalidate = 3600;

export default async function Home() {
  const topComponents = await fetchTopComponents();
  return (
    <Wrapper>
      <Hero />
      <Sections topComponents={topComponents} />
      <Footer />
    </Wrapper>
  );
}

async function fetchTopComponents() {
  try {
    const response = await getTopComponentsServerless();
    return response.status === 200 ? (response.data.items || response.data || []) : [];
  } catch (error) {
    console.error("Error fetching public registry items:", error);
    return [];
  }
}
