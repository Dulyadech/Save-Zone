// JavaScript for Login/Register Slide-in Effect
document.addEventListener('DOMContentLoaded', function() {
    // Add close button
    const container = document.querySelector('.container');
    
    if (container) {
        // Apply initial animation if needed
        if (sessionStorage.getItem('auth_animate') === 'true') {
            // Start from left outside and animate to center
            container.style.opacity = '0';
            container.style.transform = 'translate(-100%, -50%)';
            
            // Animate to center
            setTimeout(function() {
                container.style.transition = 'all 0.6s ease-out';
                container.style.opacity = '1';
                container.style.transform = 'translate(-50%, -50%)';
            }, 100);
            
            // Remove the flag
            sessionStorage.removeItem('auth_animate');
        }
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-auth';
        closeBtn.innerHTML = '&times;';
        container.appendChild(closeBtn);
        
        // Handle close button click
        closeBtn.addEventListener('click', function() {
            // Animate out to left
            container.style.transition = 'all 0.6s ease-out';
            container.style.opacity = '0';
            container.style.transform = 'translate(-100%, -50%)';
            
            // Redirect back to main page after animation completes
            setTimeout(function() {
                window.location.href = '/';
            }, 600);
        });
        
        // Fix for links between login and register
        const registerLink = document.querySelector('a[href*="register"]');
        const loginLink = document.querySelector('a[href*="login"]');
        
        if (registerLink) {
            registerLink.addEventListener('click', function(e) {
                // Store current form data in localStorage if needed
                const form = document.querySelector('form');
                if (form) {
                    const email = form.querySelector('[name="email"]')?.value;
                    if (email) {
                        localStorage.setItem('temp_email', email);
                    }
                }
                
                // Animate out to left
                container.style.transition = 'all 0.6s ease-out';
                container.style.opacity = '0';
                container.style.transform = 'translate(-100%, -50%)';
                
                // Prevent default temporarily
                e.preventDefault();
                
                // Navigate after animation
                setTimeout(function() {
                    sessionStorage.setItem('auth_animate', 'true');
                    window.location.href = registerLink.href;
                }, 600);
            });
        }
        
        if (loginLink) {
            loginLink.addEventListener('click', function(e) {
                // Animate out to left
                container.style.transition = 'all 0.6s ease-out';
                container.style.opacity = '0';
                container.style.transform = 'translate(-100%, -50%)';
                
                // Prevent default temporarily
                e.preventDefault();
                
                // Navigate after animation
                setTimeout(function() {
                    sessionStorage.setItem('auth_animate', 'true');
                    window.location.href = loginLink.href;
                }, 600);
            });
        }
        
        // Auto-fill from localStorage if available
        const emailField = document.querySelector('[name="email"]');
        if (emailField && localStorage.getItem('temp_email')) {
            emailField.value = localStorage.getItem('temp_email');
            localStorage.removeItem('temp_email');
        }
    }
});