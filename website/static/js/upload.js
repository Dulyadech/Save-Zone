document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('uploadInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const uploadProgress = document.getElementById('uploadProgress');
    const processingStatus = document.getElementById('processingStatus');
    const uploadComplete = document.getElementById('uploadComplete');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const cancelUpload = document.getElementById('cancelUpload');
    const videoPreview = document.getElementById('videoPreview');
    const uploadAgainBtn = document.getElementById('uploadAgainBtn');
    
    // Variables to store interval and timeout IDs for cancellation
    let uploadIntervalId = null;
    let processingTimeouts = [];
    
    // Set up drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
    
    // Handle file drop
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files[0]);
        }
    }
    
    // Handle file input change
    uploadInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files[0]);
        }
    });
    
    // Cancel upload button
    cancelUpload.addEventListener('click', function() {
        // Cancel all ongoing processes
        cancelAllProcesses();
        // Reset UI to initial state
        resetUploadUI();
    });
    
    // Upload again button
    if (uploadAgainBtn) {
        uploadAgainBtn.addEventListener('click', function() {
            // Cancel all ongoing processes
            cancelAllProcesses();
            // Reset UI to initial state
            resetUploadUI();
        });
    }
    
    function cancelAllProcesses() {
        // Cancel upload interval if running
        if (uploadIntervalId !== null) {
            clearInterval(uploadIntervalId);
            uploadIntervalId = null;
        }
        
        // Cancel all processing timeouts
        processingTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        processingTimeouts = [];
        
        // Remove any created objectURL to prevent memory leaks
        if (sessionStorage.getItem('processedVideoURL')) {
            URL.revokeObjectURL(sessionStorage.getItem('processedVideoURL'));
            sessionStorage.removeItem('processedVideoURL');
        }
    }
    
    function resetUploadUI() {
        // Reset UI elements
        uploadPlaceholder.style.display = 'flex';
        uploadProgress.style.display = 'none';
        processingStatus.style.display = 'none';
        uploadComplete.style.display = 'none';
        
        // Reset progress
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        // Reset processing steps icons
        resetProcessingSteps();
        
        // Clear file input
        uploadInput.value = '';
        
        // Clear video preview
        videoPreview.innerHTML = '';
    }
    
    function resetProcessingSteps() {
        // Reset all processing steps to initial state
        const steps = [
            document.getElementById('step1'),
            document.getElementById('step2'),
            document.getElementById('step3'),
            document.getElementById('step4')
        ];
        
        // Reset step 1 (keep as completed for the next upload)
        steps[0].querySelector('.step-icon').className = 'step-icon completed';
        steps[0].querySelector('.step-icon ion-icon').setAttribute('name', 'checkmark-circle');
        
        // Reset steps 2-4
        for (let i = 1; i < steps.length; i++) {
            steps[i].querySelector('.step-icon').className = 'step-icon';
            steps[i].querySelector('.step-icon ion-icon').setAttribute('name', 'ellipse-outline');
        }
    }
    
    function handleFiles(file) {
        // Check if file is a video
        if (!file.type.match('video.*')) {
            alert('Please upload a video file');
            return;
        }
        
        // Check file size (500MB limit)
        if (file.size > 500 * 1024 * 1024) {
            alert('File size exceeds 500MB limit');
            return;
        }
        
        // Show upload progress UI
        uploadPlaceholder.style.display = 'none';
        uploadProgress.style.display = 'flex';
        
        // Simulate upload progress
        simulateUpload(file);
    }
    
    function simulateUpload(file) {
        let progress = 0;
        uploadIntervalId = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(uploadIntervalId);
                uploadIntervalId = null;
                
                // Upload complete, start processing
                const timeoutId = setTimeout(() => {
                    startProcessing(file);
                }, 500);
                processingTimeouts.push(timeoutId);
            }
            
            // Update progress UI
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 300);
    }
    
    function startProcessing(file) {
        // Hide upload progress, show processing UI
        uploadProgress.style.display = 'none';
        processingStatus.style.display = 'flex';
        
        // Create URL for video preview
        const videoURL = URL.createObjectURL(file);
        
        // Simulate processing steps
        simulateProcessingSteps(videoURL);
    }
    
    function simulateProcessingSteps(videoURL) {
        const steps = [
            document.getElementById('step1'),
            document.getElementById('step2'),
            document.getElementById('step3'),
            document.getElementById('step4')
        ];
        
        // Step 1 is already complete (upload)
        
        // Simulate step 2 (Dancer Detection)
        const timeout1 = setTimeout(() => {
            steps[1].querySelector('.step-icon').classList.remove('processing');
            steps[1].querySelector('.step-icon').classList.add('completed');
            steps[1].querySelector('.step-icon ion-icon').setAttribute('name', 'checkmark-circle');
            
            // Start step 3
            steps[2].querySelector('.step-icon').classList.add('processing');
            steps[2].querySelector('.step-icon ion-icon').setAttribute('name', 'sync-outline');
            
            const timeout2 = setTimeout(() => {
                // Complete step 3
                steps[2].querySelector('.step-icon').classList.remove('processing');
                steps[2].querySelector('.step-icon').classList.add('completed');
                steps[2].querySelector('.step-icon ion-icon').setAttribute('name', 'checkmark-circle');
                
                // Start step 4
                steps[3].querySelector('.step-icon').classList.add('processing');
                steps[3].querySelector('.step-icon ion-icon').setAttribute('name', 'sync-outline');
                
                const timeout3 = setTimeout(() => {
                    // Complete step 4
                    steps[3].querySelector('.step-icon').classList.remove('processing');
                    steps[3].querySelector('.step-icon').classList.add('completed');
                    steps[3].querySelector('.step-icon ion-icon').setAttribute('name', 'checkmark-circle');
                    
                    // Show completion UI
                    showCompletionUI(videoURL);
                }, 2000);
                processingTimeouts.push(timeout3);
            }, 3000);
            processingTimeouts.push(timeout2);
        }, 2000);
        processingTimeouts.push(timeout1);
    }
    
    function showCompletionUI(videoURL) {
        // Hide processing UI, show complete UI
        processingStatus.style.display = 'none';
        uploadComplete.style.display = 'flex';
        
        // Create video preview
        videoPreview.innerHTML = `
            <video controls>
                <source src="${videoURL}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
        
        // Store the video URL in session storage for use in preview & edit page
        sessionStorage.setItem('processedVideoURL', videoURL);
    }
});