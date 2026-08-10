import Wrapper from '@/components/Common/Wrapper';
import Footer from '@/components/Footer';
import Hero from '@/components/LandingSections/Hero';
import Sections from '@/components/LandingSections/Sections';

export default function Home() {
  return (
    <Wrapper>
      <main className="w-full">
        <Hero />
        <Sections />
      </main>
      <Footer />
    </Wrapper>
  );
}
