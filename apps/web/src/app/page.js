import Wrapper from "@/components/Common/Wrapper";
import Footer from "@/components/Footer";
import Hero from "@/components/LandingSections/Hero";
import Sections from "@/components/LandingSections/Sections";
import { getAllPlans, getTopComponentsServerless } from "@/lib/api";

// Render from the live API instead of ISR. Production intentionally mounts the
// application tree read-only, so runtime prerender writes are not a valid cache
// mechanism. This changes data freshness only; the landing UI remains intact.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LANDING_CACHE_TTL_MS = 60_000;
const landingCache = { value: null, expiresAt: 0, pending: null };

async function getLandingData() {
  const now = Date.now();
  if (landingCache.value && landingCache.expiresAt > now) return landingCache.value;
  if (landingCache.pending) return landingCache.pending;
  landingCache.pending = Promise.all([fetchPricingPlans(), fetchTopComponents()])
    .then(([plansResult, componentsResult]) => {
      landingCache.value = {
        pricingPlans: plansResult.ok
          ? plansResult.value
          : landingCache.value?.pricingPlans || [],
        topComponents: componentsResult.ok
          ? componentsResult.value
          : landingCache.value?.topComponents || [],
      };
      landingCache.expiresAt = Date.now() + LANDING_CACHE_TTL_MS;
      return landingCache.value;
    })
    .finally(() => {
      landingCache.pending = null;
    });
  return landingCache.pending;
}

export default async function Home() {
  const { pricingPlans, topComponents } = await getLandingData();

  return (
    <Wrapper>
      <main className="w-full">
        <Hero />
        <Sections pricingPlans={pricingPlans} topComponents={topComponents} />
      </main>
      <Footer />
    </Wrapper>
  );
}

async function fetchPricingPlans() {
  try {
    const resp = await getAllPlans(5000);
    return resp.status === 200
      ? { ok: true, value: resp.data }
      : { ok: false, value: [] };
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return { ok: false, value: [] };
  }
}

async function fetchTopComponents() {
  try {
    const resp = await getTopComponentsServerless();
    // Check if data has items property (API format) or is already an array
    return resp.status === 200
      ? { ok: true, value: resp.data.items || resp.data || [] }
      : { ok: false, value: [] };
  } catch (error) {
    console.error("Error fetching top components:", error);
    return { ok: false, value: [] };
  }
}
