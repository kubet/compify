import Wrapper from "@/components/Common/Wrapper";
import Footer from "@/components/Footer";
import Hero from "@/components/LandingSections/Hero";
import Sections from "@/components/LandingSections/Sections";
import { getAllPlans, getTopComponentsServerless } from "@/lib/api";

// Re-generate the landing periodically so newly published components show up
// without requiring a redeploy.
export const revalidate = 3600;


export default async function Home() {
  const pricingPlans = await fetchPricingPlans();
  const topComponents = await fetchTopComponents();

  return (
    <Wrapper>
      <Hero />
      <Sections pricingPlans={pricingPlans} topComponents={topComponents} />
      <Footer />
    </Wrapper>
  );
}

async function fetchPricingPlans() {
  try {
    const resp = await getAllPlans();
    return resp.status === 200 ? resp.data : [];
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return [];
  }
}

async function fetchTopComponents() {
  try {
    const resp = await getTopComponentsServerless();
    // Check if data has items property (API format) or is already an array
    return resp.status === 200 ? (resp.data.items || resp.data || []) : [];
  } catch (error) {
    console.error("Error fetching top components:", error);
    return [];
  }
}
