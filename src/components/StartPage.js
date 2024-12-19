import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTractor, FaLeaf, FaSeedling, FaTree, FaChartLine, FaCloud, FaMobileAlt, FaUsers } from 'react-icons/fa';
import { IoWaterOutline } from 'react-icons/io5';
import { BsArrowRight } from 'react-icons/bs';
import './StartPage.css';

const StartPage = () => {
  useEffect(() => {
    // Smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });

    // Text animation on scroll
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-text');
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        const isVisible = (elementTop < window.innerHeight) && (elementBottom >= 0);
        
        if (isVisible) {
          element.classList.add('visible');
        }
      });
    };

    // Initial check for elements in view
    animateOnScroll();

    // Add scroll event listener
    window.addEventListener('scroll', animateOnScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', animateOnScroll);
    };
  }, []);

  return (
    <div className="start-page-container">
      {/* Fixed Navbar */}
      <header className="start-page-header">
        <nav className="start-page-nav">
          <div className="start-page-logo">
            <FaTractor className="text-primary" size={24} />
            <h1 className="start-page-logo-text">Farm AI Simulator</h1>
          </div>
          <div className="start-page-nav-links">
            <a href="#features" className="start-page-nav-link">Features</a>
            <a href="#benefits" className="start-page-nav-link">Benefits</a>
            <a href="#testimonials" className="start-page-nav-link">Testimonials</a>
          </div>
          <div className="start-page-auth-buttons">
            <Link to="/login" className="start-page-btn start-page-btn-secondary">Log In</Link>
            <Link to="/signup" className="start-page-btn start-page-btn-primary">Sign Up</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="start-page-hero">
        <div className="start-page-hero-content">
          <h1 className="start-page-hero-title">
            Revolutionize Your Farming with AI-Powered 3D Simulation
          </h1>
          <p className="start-page-hero-description">
            Transform your agricultural practices with our intelligent platform that combines 3D visualization,
            real-time environmental data, and predictive analytics for optimized farming decisions.
          </p>
          <div className="start-page-hero-buttons">
            <Link to="/signup" className="start-page-btn start-page-btn-primary">Start Free Trial</Link>
            <a href="#features" className="start-page-btn start-page-btn-secondary">Learn More</a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="start-page-features">
        <div className="start-page-section-container">
          <div className="start-page-section-header">
            <h2 className="start-page-section-title">Powerful Features</h2>
            <p className="start-page-section-subtitle">
              Experience the future of farming with our comprehensive suite of tools
            </p>
          </div>
          <div className="start-page-features-grid">
            <FeatureCard
              icon={<FaLeaf size={32} />}
              title="Smart Crop Planning"
              description="AI-powered recommendations for optimal crop selection."
            />
            <FeatureCard
              icon={<FaSeedling size={32} />}
              title="Growth Monitoring"
              description="Real-time monitoring of crop growth stages with predictive analytics for yield estimation."
            />
            <FeatureCard
              icon={<FaCloud size={32} />}
              title="Weather Integration"
              description="Advanced weather forecasting and climate analysis for better farming decisions."
            />
            <FeatureCard
              icon={<FaChartLine size={32} />}
              title="Yield Analytics"
              description="Detailed analytics and reporting on crop performance and yield predictions."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="start-page-benefits">
        <div className="start-page-section-container">
          <div className="start-page-section-header">
            <h2 className="start-page-section-title">Key Benefits</h2>
            <p className="start-page-section-subtitle">
              Discover how our platform transforms your farming operations
            </p>
          </div>
          <div className="start-page-benefits-grid">
            <div className="start-page-benefit-card">
              <div className="start-page-benefit-icon">
                <div className="start-page-benefit-number">30%</div>
              </div>
              <h3 className="start-page-benefit-title">Increased Yield</h3>
              <p className="start-page-benefit-description">
                Boost your crop yield through AI-optimized farming practices
              </p>
            </div>
            <div className="start-page-benefit-card">
              <div className="start-page-benefit-icon">
                <div className="start-page-benefit-number">25%</div>
              </div>
              <h3 className="start-page-benefit-title">Water Savings</h3>
              <p className="start-page-benefit-description">
                Reduce water consumption with smart irrigation planning
              </p>
            </div>
            <div className="start-page-benefit-card">
              <div className="start-page-benefit-icon">
                <div className="start-page-benefit-number">40%</div>
              </div>
              <h3 className="start-page-benefit-title">Cost Reduction</h3>
              <p className="start-page-benefit-description">
                Lower operational costs through optimized resource management
              </p>
            </div>
            <div className="start-page-benefit-card">
              <div className="start-page-benefit-icon">
                <div className="start-page-benefit-number">50%</div>
              </div>
              <h3 className="start-page-benefit-title">Time Saved</h3>
              <p className="start-page-benefit-description">
                Automate routine tasks and streamline farming operations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="start-page-testimonials">
        <div className="start-page-section-container">
          <div className="start-page-section-header">
            <h2 className="start-page-section-title">Success Stories</h2>
            <p className="start-page-section-subtitle">
              See what our satisfied farmers have to say about their experience
            </p>
          </div>
          <div className="start-page-testimonials-grid">
            {[
              {
                name: "John Smith",
                role: "Crop Farmer",
                image: "https://randomuser.me/api/portraits/men/1.jpg",
                quote: "The AI recommendations have revolutionized how I plan my crops. My yield has increased significantly!"
              },
              {
                name: "Sarah Johnson",
                role: "Organic Farmer",
                image: "https://randomuser.me/api/portraits/women/2.jpg",
                quote: "The weather integration feature has helped me make better decisions about planting and harvesting."
              },
              {
                name: "Michael Brown",
                role: "Commercial Farmer",
                image: "https://randomuser.me/api/portraits/men/3.jpg",
                quote: "The analytics dashboard gives me insights I never had before. It's like having an expert advisor."
              },
              {
                name: "Emily Davis",
                role: "Sustainable Farmer",
                image: "https://randomuser.me/api/portraits/women/4.jpg",
                quote: "The water management features have helped reduce our water usage while maintaining crop health."
              }
            ].map((testimonial, index) => (
              <div key={index} className="start-page-testimonial-card">
                <div className="start-page-testimonial-header">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="start-page-testimonial-image"
                  />
                  <div className="start-page-testimonial-info">
                    <h4 className="start-page-testimonial-name">{testimonial.name}</h4>
                    <p className="start-page-testimonial-role">{testimonial.role}</p>
                  </div>
                </div>
                <p className="start-page-testimonial-quote">{testimonial.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="start-page-footer">
        <div className="start-page-footer-grid">
          <div className="start-page-footer-card">
            <h3 className="start-page-footer-title">About Us</h3>
            <p className="start-page-footer-description">
              Empowering farmers with cutting-edge AI technology for sustainable and profitable agriculture.
            </p>
          </div>
          <div className="start-page-footer-card">
            <h3 className="start-page-footer-title">Quick Links</h3>
            <ul className="start-page-footer-links">
              <li><Link to="/features" className="start-page-footer-link">Features</Link></li>
              <li><Link to="/pricing" className="start-page-footer-link">Pricing</Link></li>
              <li><Link to="/blog" className="start-page-footer-link">Blog</Link></li>
            </ul>
          </div>
          <div className="start-page-footer-card">
            <h3 className="start-page-footer-title">Support</h3>
            <ul className="start-page-footer-links">
              <li><Link to="/help" className="start-page-footer-link">Help Center</Link></li>
              <li><Link to="/documentation" className="start-page-footer-link">Documentation</Link></li>
              <li><Link to="/contact" className="start-page-footer-link">Contact Us</Link></li>
            </ul>
          </div>
          <div className="start-page-footer-card">
            <h3 className="start-page-footer-title">Contact</h3>
            <p className="start-page-footer-description">
              Email: info@farmsimulator.ai<br />
              Phone: (555) 123-4567<br />
              Address: 123 Farm Street<br />
              Silicon Valley, CA 94025
            </p>
          </div>
        </div>
        <div className="start-page-footer-copyright">
          <p>&copy; 2024 Farm AI Simulator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="start-page-feature-card">
    <div className="start-page-feature-icon">{icon}</div>
    <h3 className="start-page-feature-title">{title}</h3>
    <p className="start-page-feature-description">{description}</p>
  </div>
);

export default StartPage;