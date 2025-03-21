// Main page auth integration functions
document.addEventListener('DOMContentLoaded', function() {
    // Handle auth links to make them trigger the slide-in effect
    const authLinks = document.querySelectorAll('a[href*="login"], a[href*="register"]');
    
    authLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            
            // Create a container for the auth page
            const authContainer = document.createElement('div');
            authContainer.className = 'auth-frame-container';
            authContainer.style.position = 'fixed';
            authContainer.style.top = '0';
            authContainer.style.left = '0';
            authContainer.style.width = '100%';
            authContainer.style.height = '100%';
            authContainer.style.zIndex = '9999';
            authContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            
            // Create iframe to load the auth page
            const authFrame = document.createElement('iframe');
            authFrame.style.position = 'absolute';
            authFrame.style.top = '0';
            authFrame.style.left = '-50%';
            authFrame.style.width = '50%';
            authFrame.style.height = '100%';
            authFrame.style.border = 'none';
            authFrame.style.transition = 'left 0.6s ease-out';
            authFrame.src = url;
            
            // Add close button for the overlay
            const closeOverlay = document.createElement('div');
            closeOverlay.className = 'auth-close-overlay';
            closeOverlay.style.position = 'absolute';
            closeOverlay.style.top = '0';
            closeOverlay.style.right = '0';
            closeOverlay.style.width = '50%';
            closeOverlay.style.height = '100%';
            closeOverlay.style.cursor = 'pointer';
            
            // Append elements
            authContainer.appendChild(authFrame);
            authContainer.appendChild(closeOverlay);
            document.body.appendChild(authContainer);
            
            // Animate iframe in (delayed to ensure it's loaded in the DOM)
            setTimeout(() => {
                authFrame.style.left = '0';
            }, 100);
            
            // Handle closing when clicking outside
            closeOverlay.addEventListener('click', function() {
                authFrame.style.left = '-50%';
                
                // Remove container after animation
                setTimeout(() => {
                    document.body.removeChild(authContainer);
                }, 600);
            });
            
            // Add message listener to handle redirection after successful auth
            window.addEventListener('message', function(event) {
                if (event.data === 'auth-success') {
                    // Redirect to home or reload page
                    window.location.reload();
                }
            });
        });
    });
});