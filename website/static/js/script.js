
document.getElementById("uploadInput").addEventListener("change", function() {
    if (this.files.length > 0) {
        alert("Uploaded: " + this.files[0].name);
    }
});
