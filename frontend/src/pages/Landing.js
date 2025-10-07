import React, { useState, useEffect } from 'react';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: "📝",
      title: "Easy QCM Creation",
      description: "Intuitive interface for teachers to create comprehensive multiple-choice quizzes with various question types and automated grading."
    },
    {
      icon: "🌐",
      title: "Network-Focused Content",
      description: "Specialized templates and questions specifically designed for computer networking curriculum, from TCP/IP to network security."
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description: "Track student performance, identify knowledge gaps, and monitor progress with detailed analytics and performance reports."
    },
    {
      icon: "⏱️",
      title: "Timed Assessments",
      description: "Set time limits for quizzes to simulate exam conditions and help students improve their time management skills."
    },
    {
      icon: "🤝",
      title: "Collaborative Learning",
      description: "Enable peer learning with discussion forums, group quizzes, and collaborative problem-solving sessions."
    },
    {
      icon: "📱",
      title: "Mobile Friendly",
      description: "Access quizzes from any device with our responsive design that works perfectly on desktop, tablet, and mobile devices."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Sign Up & Choose Role",
      description: "Register as a teacher to create QCMs or as a student to participate in quizzes. Setup takes less than 2 minutes."
    },
    {
      number: "2",
      title: "Create or Join QCMs",
      description: "Teachers design comprehensive quizzes while students join using unique codes or class invitations."
    },
    {
      number: "3",
      title: "Interactive Learning",
      description: "Students answer questions with instant feedback, detailed explanations, and progress tracking."
    },
    {
      number: "4",
      title: "Track Progress",
      description: "Monitor performance with detailed analytics, progress reports, and personalized learning recommendations."
    }
  ];

  const testimonials = [
    {
      text: "QCM-Net has completely transformed how I teach computer networks. Creating quizzes is incredibly intuitive and my students love the interactive format. The analytics help me identify exactly where students need help.",
      author: "Dr. Sarah Chen",
      role: "Network Engineering Professor"
    },
    {
      text: "As a computer science student, the instant feedback and detailed explanations helped me understand complex networking concepts much faster than traditional methods. My grades improved significantly!",
      author: "Alex Rodriguez",
      role: "Computer Science Student"
    },
    {
      text: "The analytics dashboard provides invaluable insights into student performance, helping me tailor my teaching approach. It's become an essential tool in our IT curriculum.",
      author: "Prof. Michael Brown",
      role: "IT Department Head"
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <nav className="nav">
            <a href="#home" className="logo">QCM-Net</a>
            
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>

            <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
              <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
              <li><a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a></li>
              <li><a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a></li>
            </ul>

            <div className="auth-buttons">
              <a href="/auth" className="btn btn-outline login">Login</a>
              <a href="/auth" className="btn btn-primary">Sign Up Free</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content fade-in-up">
            <h1>Master Computer Networks with Interactive QCMs</h1>
            <p>
              QCM-Net revolutionizes how teachers create and students engage with 
              multiple-choice quizzes in computer networking. Make learning interactive, 
              track progress, and achieve better results with our specialized platform.
            </p>
            <div className="hero-buttons">
              <a href="/signup?role=teacher" className="btn btn-primary">
                Start Creating QCMs
              </a>
              <a href="/signup?role=student" className="btn btn-outline">
                Join as Student
              </a>
              <a href="#features" className="btn btn-outline">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-title fade-in-up">
            <h2>Powerful Features for Effective Learning</h2>
            <p>Everything you need to create, manage, and excel in computer networking assessments</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card fade-in-up">
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-title fade-in-up">
            <h2>How QCM-Net Works</h2>
            <p>Simple steps to transform computer networking education</p>
          </div>
          <div className="steps">
            {steps.map((step, index) => (
              <div key={index} className="step fade-in-up">
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <div className="section-title fade-in-up">
            <h2>What Our Users Say</h2>
            <p>Join hundreds of educators and students already using QCM-Net</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card fade-in-up">
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div>
                  <div className="testimonial-author">{testimonial.author}</div>
                  <div className="testimonial-role">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>QCM-Net</h3>
              <p>Revolutionizing computer networking education through interactive multiple-choice quizzes and comprehensive learning tools.</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
                <li><a href="/pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Resources</h3>
              <ul>
                <li><a href="/docs">Documentation</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/support">Support</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Legal</h3>
              <ul>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/cookies">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 QCM-Net. All rights reserved. Revolutionizing computer networking education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;