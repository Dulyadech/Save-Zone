// JavaScript for Login/Register Slide-in Effect
document.addEventListener('DOMContentLoaded', function() {
    // Add close button
    const container = document.querySelector('.container');
    
    if (container) {
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-auth';
        closeBtn.innerHTML = '&times;';
        container.appendChild(closeBtn);
        
        // Handle close button click
        closeBtn.addEventListener('click', function() {
            document.body.classList.add('auth-closed');
            
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
                
                // Don't prevent default - let it navigate to register page
                // But apply the same animation to the new page
                sessionStorage.setItem('auth_animate', 'true');
            });
        }
        
        if (loginLink) {
            loginLink.addEventListener('click', function(e) {
                // Similar approach for login link
                sessionStorage.setItem('auth_animate', 'true');
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