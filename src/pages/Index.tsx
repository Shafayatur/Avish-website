import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryShowcase from "@/components/CategoryShowcase";
import BestSellers from "@/components/BestSellers";
import ShowStopper from "@/components/ShowStopper";
import NewArrivals from "@/components/NewArrivals";
import PromoBanner from "@/components/PromoBanner";
import BeautyInspiration from "@/components/BeautyInspiration";
import Reviews from "@/components/Reviews";
import WhyChooseUs from "@/components/WhyChooseUs";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedProducts />
      <CategoryShowcase />
      <ShowStopper />
      <NewArrivals />
      <BestSellers />
      <PromoBanner />
      <BeautyInspiration />
      <Reviews />
      <WhyChooseUs />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
