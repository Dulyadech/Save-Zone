// Scroll animations
window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const heroSection = document.getElementById('hero');
    const bigLogo = document.querySelector('.big_logo');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    // If we're scrolling down, start transitioning the logo
    if (scrollPosition > 100) {
        scrollIndicator.style.opacity = "0";
    } else {
        scrollIndicator.style.opacity = "1";
    }
    
    // When we reach the about section
    if (scrollPosition > window.innerHeight * 0.5) {
        bigLogo.style.opacity = "0"; // Hide the original big logo when in about section
    } else {
        bigLogo.style.opacity = "1";
    }
    
    // Parallax effect for the circles
    const purple = document.querySelector('.purple');
    const pink = document.querySelector('.pink');
    
    if (purple && pink) {
        purple.style.transform = `translateY(${scrollPosition * 0.2}px)`;
        pink.style.transform = `translateY(${scrollPosition * 0.1}px)`;
    }
});

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Make the scroll indicator clickable to scroll to about section
document.querySelector('.scroll-indicator').addEventListener('click', function() {
    document.getElementById('about').scrollIntoView({
        behavior: 'smooth'
    });
});