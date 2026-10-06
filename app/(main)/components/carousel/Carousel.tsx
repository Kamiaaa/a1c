'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import styles from './Carousel.module.css';

interface Slide {
  id: number;
  image: string;
  alt: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: '/img/slide-01.jpg',
    alt: 'Ultra-Fast Fiber Internet',
    title: 'Blazing Fast Ultra Fiber Internet',
    subtitle: 'Experience buffer-free 4K streaming and high-speed online gaming.',
  },
  {
    id: 2,
    image: '/img/slide-02.jpg',
    alt: 'Zero Lag Broadband',
    title: 'Zero Lag. Unlimited Possibilities.',
    subtitle: 'Power your home and work with ultra-low latency connectivity.',
  },
  {
    id: 3,
    image: '/img/slide-03.jpg',
    alt: 'Reliable Enterprise Network',
    title: 'Powering Your Digital Lifestyle',
    subtitle: 'Next-generation optical fiber internet for seamless browsing.',
  },
];

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const prevSlide = () => {
    setDirection('prev');
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = useCallback(() => {
    setDirection('next');
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
      {/* Left Main Carousel */}
      <div className={`relative lg:col-span-2 overflow-hidden rounded-3xl aspect-[16/9] sm:aspect-[21/9] lg:aspect-auto lg:h-[420px] ${styles.perspectiveContainer}`}>
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={slide.id}
              className={`${styles.slide} ${
                isActive
                  ? direction === 'next'
                    ? styles.slideInRight
                    : styles.slideInLeft
                  : styles.slideOut
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                className={`object-cover ${isActive ? styles.animatedZoom : ''}`}
                sizes="(max-width: 1024px) 100vw, 70vw"
              />

              {isActive && <div className={styles.shimmerOverlay} />}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {isActive && (
                <div className="absolute bottom-8 left-6 right-6 sm:bottom-10 sm:left-10 text-white z-20 pointer-events-none max-w-2xl">
                  {slide.title && (
                    <h2 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight ${styles.captionTitle}`}>
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className={`mt-1.5 text-xs sm:text-base text-orange-200/90 font-medium ${styles.captionSubtitle}`}>
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-orange-500/80 hover:bg-orange-600 text-white flex items-center justify-center shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-orange-500/80 hover:bg-orange-600 text-white flex items-center justify-center shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Progress Indicators */}
        <div className="absolute bottom-3 right-4 sm:bottom-5 sm:right-8 z-30 flex items-center space-x-2.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {slides.map((_, index) => {
            const isActive = currentSlide === index;
            return (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentSlide ? 'next' : 'prev');
                  setCurrentSlide(index);
                }}
                className="focus:outline-none relative flex items-center justify-center w-5 h-5 group"
                aria-label={`Go to slide ${index + 1}`}
              >
                <svg className="w-full h-full -rotate-90 transform">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    className="stroke-white/20 fill-none"
                    strokeWidth="2"
                  />
                  {isActive && (
                    <circle
                      cx="10"
                      cy="10"
                      r="7"
                      className={`stroke-orange-500 fill-none ${styles.progressRing}`}
                      strokeWidth="2.5"
                      strokeDasharray="44"
                    />
                  )}
                </svg>
                <span
                  className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-orange-400 scale-110' : 'bg-white/50 group-hover:bg-white'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Side Promo Banner - No Black Space (Edge-to-Edge Fill) */}
      <div className={`relative overflow-hidden rounded-3xl aspect-video lg:aspect-auto lg:h-105 ${styles.promoBanner}`}>
        <a href="#promo" className="block w-full h-full relative overflow-hidden group">
          <Image
            src="/img/banner.jpeg"
            alt="ISP Promo Banner"
            fill
            priority
            className="object-fill transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 30vw"
          />
          <div className={styles.bannerGlassGlow} />
        </a>
      </div>
    </div>
  );
}