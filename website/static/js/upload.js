document.addEventListener('DOMContentLoaded', function () {
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
    
    let uploadIntervalId = null;
    let processingTimeouts = [];
    let xhr = null;

    // **ตั้งค่า Drag & Drop**
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

    uploadInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files[0]);
        }
    });

    cancelUpload.addEventListener('click', function() {
        // Cancel all ongoing processes
        cancelAllProcesses();
        // Reset UI to initial state
        resetUploadUI();
    });

    if (uploadAgainBtn) {
        uploadAgainBtn.addEventListener('click', function() {
            // Cancel all ongoing processes
            cancelAllProcesses();
            // Reset UI to initial state
            resetUploadUI();
        });
    }

    function handleFiles(file) {
        if (!file.type.match('video.*')) {
            alert('กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น');
            return;
        }
        
        // Start handling the upload
        handleUpload(file);
    }

    function handleUpload(file) {
        if (!file.type.match('video.*')) {
            alert('กรุณาอัปโหลดไฟล์วิดีโอเท่านั้น');
            return;
        }

        uploadPlaceholder.style.display = 'none';
        uploadProgress.style.display = 'flex';
        progressBar.style.width = '0%';
        progressText.innerText = "0%";

        let formData = new FormData();
        formData.append("video", file);

        xhr = new XMLHttpRequest();
        xhr.open("POST", "/upload", true);

        // **แสดง Progress Bar**
        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                let percent = (event.loaded / event.total) * 100;
                progressBar.style.width = `${percent}%`;
                progressText.innerText = Math.round(percent) + "%";
            }
        };

        // **เมื่ออัปโหลดเสร็จ**
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    let response = JSON.parse(xhr.responseText);
                    startProcessing(file);
                } catch (e) {
                    // If the response isn't JSON, just continue with processing
                    startProcessing(file);
                }
            } else {
                alert("เกิดข้อผิดพลาด: " + xhr.responseText);
                resetUploadUI();
            }
        };

        xhr.onerror = function () {
            alert("เกิดข้อผิดพลาด: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
            resetUploadUI();
        };

        xhr.send(formData);
    }

    cancelUpload.addEventListener('click', function () {
        if (xhr) {
            xhr.abort();
        }
        resetUploadUI();
    });

    if (uploadAgainBtn) {
        uploadAgainBtn.addEventListener('click', function () {
            resetUploadUI();
        });
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
        
        // Abort any ongoing XHR
        if (xhr) {
            xhr.abort();
            xhr = null;
        }
        
        // Remove any created objectURL to prevent memory leaks
        if (sessionStorage.getItem('processedVideoURL')) {
            URL.revokeObjectURL(sessionStorage.getItem('processedVideoURL'));
            sessionStorage.removeItem('processedVideoURL');
        }
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

    function startProcessing(file) {
        // Hide upload progress, show processing UI
        uploadProgress.style.display = 'none';
        processingStatus.style.display = 'flex';
        
        // Create URL for video preview
        const videoURL = URL.createObjectURL(file);
        
        // Store the video URL in session storage for use in preview & edit page
        sessionStorage.setItem('processedVideoURL', videoURL);
        
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
    }
});