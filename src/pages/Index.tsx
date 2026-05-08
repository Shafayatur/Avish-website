import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryShowcase from "@/components/CategoryShowcase";
import NewArrivals from "@/components/NewArrivals";
import ShowStopper from "@/components/ShowStopper";
import BestSellers from "@/components/BestSellers";
import PromoBanner from "@/components/PromoBanner";
import WhyChooseUs from "@/components/WhyChooseUs";
import Reviews from "@/components/Reviews";
import BeautyInspiration from "@/components/BeautyInspiration";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedProducts />
      <CategoryShowcase />
      <NewArrivals />
      <ShowStopper />
      <BestSellers />
      <PromoBanner />
      <WhyChooseUs />
      <Reviews />
      <BeautyInspiration />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
