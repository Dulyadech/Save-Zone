document.addEventListener('DOMContentLoaded', function() {
    const logoContainer = document.querySelector('.big_logo_container');
    
    // Create dynamic sparkles
    function createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'dynamic-sparkle';
        
        // Random position around the logo
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 8 + 3;
        
        // Apply styles
        sparkle.style.top = `${top}%`;
        sparkle.style.left = `${left}%`;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        
        // Add to container
        logoContainer.appendChild(sparkle);
        
        // Remove after animation completes
        setTimeout(() => {
            sparkle.remove();
        }, 1800);
    }
    
    // Create sparkles at intervals
    let sparkleInterval;
    
    function startSparkles() {
        sparkleInterval = setInterval(createSparkle, 300);
    }
    
    // Start sparkles after logo appears
    setTimeout(startSparkles, 1500);
    
    // Stop creating extra sparkles after some time
    setTimeout(() => {
        clearInterval(sparkleInterval);
    }, 10000);
    // Circle animation on scroll
    const purpleCircle = document.querySelector('.circle.purple');
    const pinkCircle = document.querySelector('.circle.pink');
    const featuredSection = document.querySelector('.featured-content');
    const actionSection = document.querySelector('.action-section');
    
    // Initial positions
    const initialPurplePosition = { left: '-400px', top: '300px', right: 'auto' };
    const initialPinkPosition = { right: '-400px', top: '300px', left: 'auto' };
    
    // Featured section positions (top position)
    const featuredPurplePosition = { left: '-200px', top: '-500px', right: 'auto' };
    const featuredPinkPosition = { right: '-200px', top: '-500px', left: 'auto' };
    
    // Action section positions (right position)
    const actionPurplePosition = { right: '0', top: '-800px', left: 'auto' };
    const actionPinkPosition = { right: '-400px', top: '-800px', left: 'auto' };
    
    function updateCirclePositions() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Calculate section positions
        const featuredSectionTop = featuredSection.getBoundingClientRect().top + scrollPosition;
        const actionSectionTop = actionSection.getBoundingClientRect().top + scrollPosition;
        
        // Distance from top of viewport to the sections
        const featuredDistance = featuredSectionTop - scrollPosition;
        const actionDistance = actionSectionTop - scrollPosition;
        
        // Check scroll position and update circle positions
        if (featuredDistance > windowHeight/2) {
            // Home/Hero section - initial position
            animateCircles(initialPurplePosition, initialPinkPosition);
        } 
        else if (actionDistance > windowHeight/2) {
            // Featured content section - top position
            animateCircles(featuredPurplePosition, featuredPinkPosition);
        } 
        else {
            // Action section - right position
            animateCircles(actionPurplePosition, actionPinkPosition);
        }
    }
    
    function animateCircles(purplePos, pinkPos) {
        // Apply smooth transition to purple circle
        purpleCircle.style.transition = 'all 1.2s ease-out';
        
        // Set purple circle position
        if (purplePos.left !== undefined) purpleCircle.style.left = purplePos.left;
        if (purplePos.right !== undefined) purpleCircle.style.right = purplePos.right;
        if (purplePos.top !== undefined) purpleCircle.style.top = purplePos.top;
        
        // Apply smooth transition to pink circle
        pinkCircle.style.transition = 'all 1.2s ease-out';
        
        // Set pink circle position
        if (pinkPos.left !== undefined) pinkCircle.style.left = pinkPos.left;
        if (pinkPos.right !== undefined) pinkCircle.style.right = pinkPos.right;
        if (pinkPos.top !== undefined) pinkCircle.style.top = pinkPos.top;
    }
    
    // Initial positioning
    updateCirclePositions();
    
    // Update on scroll
    window.addEventListener('scroll', updateCirclePositions);
    
    // Update on resize for responsive behavior
    window.addEventListener('resize', updateCirclePositions);
    
    // Feature showcase slider functionality
    const slides = document.querySelectorAll('.showcase-slide');
    const dots = document.querySelectorAll('.showcase-dots .dot');
    let currentSlide = 0;
    let slideInterval;

    // Function to show a specific slide
    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Deactivate all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show the selected slide
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        currentSlide = index;
    }
    
    // Function to move to the next slide
    function nextSlide() {
        const newIndex = (currentSlide + 1) % slides.length;
        showSlide(newIndex);
    }
    
    // Function to start auto-sliding
    function startAutoSlide() {
        if (!slideInterval) {
            slideInterval = setInterval(nextSlide, 2000); // Change slide every 2 seconds
        }
    }
    
    // Function to pause auto-sliding
    function pauseAutoSlide() {
        clearInterval(slideInterval);
        slideInterval = null;
    }
    
    // Function to reset auto-slide timer
    function resetAutoSlide() {
        pauseAutoSlide();
        startAutoSlide();
    }
    
    // Initialize the slider if it exists on the page
    if (slides.length > 0 && dots.length > 0) {
        // Set up initial state
        showSlide(0);
        
        // Start auto-sliding
        startAutoSlide();
        
        // Add click event listeners to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                showSlide(index);
                resetAutoSlide();
            });
        });
        
        // Pause auto-slide on hover
        const showcase = document.querySelector('.feature-showcase');
        if (showcase) {
            showcase.addEventListener('mouseenter', pauseAutoSlide);
            showcase.addEventListener('mouseleave', startAutoSlide);
        }
    }
    
    // Add smooth hover effect to showcase images
    const showcaseImages = document.querySelectorAll('.showcase-image');
    showcaseImages.forEach(image => {
        image.addEventListener('mouseenter', function() {
            this.style.transform = 'perspective(1000px) rotateY(0deg)';
        });
        
        image.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateY(-10deg)';
        });
    });
});