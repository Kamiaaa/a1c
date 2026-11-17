import { getActiveSlides } from "@/lib/carousel";
import Carousel from "./components/carousel/Carousel";
import FaqSection from "./components/faq-section/FaqSection";
import OurInternet from "./components/our-internet/OurInternet";
import PricingPlans from "./components/pricing/PricingPlan";
import SpecialFeatures from "./components/special-features/SpecialFeatures";

// Re-generate at most once a minute; saving a slide in the dashboard also refreshes it immediately.
export const revalidate = 60;

export default async function Home() {
    const slides = await getActiveSlides();

    return (
        <>
            {/* No active slides in the database -> Carousel falls back to its built-in defaults */}
            <Carousel slides={slides.length ? slides : undefined} />
            <PricingPlans />
            <SpecialFeatures />
            <FaqSection />
            <OurInternet/>
        </>
    );
}