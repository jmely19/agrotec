// =================== PROFILE PHOTO SYSTEM ===================

// Function to get user's profile photo
function getUserProfilePhoto(userId) {
    const savedPhoto = localStorage.getItem(`profile_photo_${userId}`);
    if (savedPhoto) {
        return savedPhoto; // Base64 string of the image
    }
    return null; // No photo, use default avatar
}

// Function to save profile photo
function saveUserProfilePhoto(userId, imageBase64) {
    try {
        localStorage.setItem(`profile_photo_${userId}`, imageBase64);
        console.log('Profile photo saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving profile photo:', error);
        alert('Error: The image is too large. Try with a smaller one.');
        return false;
    }
}

// Function to create avatar with photo or default SVG
function createUserAvatar(user, size = 80) {
    const userPhoto = getUserProfilePhoto(user.id);
    
    if (userPhoto) {
        // Show user's photo
        return `
            <div class="profile-avatar" style="width: ${size}px; height: ${size}px; border-radius: 50%; overflow: hidden; border: 3px solid rgba(255,255,255,0.3);">
                <img src="${userPhoto}" alt="Photo of ${user.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    } else {
        // Show default SVG avatar
        return `
            <div class="profile-avatar" style="width: ${size}px; height: ${size}px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
        `;
    }
}

// Function to create the file input
function createPhotoUploadInput() {
    return `
        <input 
            type="file" 
            id="profilePhotoInput" 
            accept="image/*" 
            style="display: none;"
            onchange="handleProfilePhotoUpload(event)"
        >
        <label 
            for="profilePhotoInput" 
            style="
                background: #007bff;
                color: white;
                padding: 8px 15px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                display: inline-block;
                margin-top: 10px;
                transition: all 0.3s ease;
            "
            onmouseover="this.style.background='#0056b3'"
            onmouseout="this.style.background='#007bff'"
        >
            📷 Change Photo
        </label>
    `;
}

// Function to handle photo upload
function handleProfilePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image');
        return;
    }
    
    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('The image is too large. Please select one smaller than 2MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageBase64 = e.target.result;
        
        // Resize image before saving
        resizeImage(imageBase64, 200, 200, function(resizedImage) {
            if (currentUser && saveUserProfilePhoto(currentUser.id, resizedImage)) {
                // Update modal view
                updateProfilePhotoInModal(resizedImage);
                // Update navbar avatar if necessary
                updateNavbarAvatar();
            }
        });
    };
    
    reader.readAsDataURL(file);
}

// Function to resize image
function resizeImage(base64, maxWidth, maxHeight, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Calculate new dimensions keeping aspect ratio
        let { width, height } = img;
        
        if (width > height) {
            if (width > maxWidth) {
                height = height * (maxWidth / width);
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = width * (maxHeight / height);
                height = maxHeight;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with reduced quality
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        callback(resizedBase64);
    };
    
    img.src = base64;
}

// Function to update profile photo inside modal
function updateProfilePhotoInModal(newImageBase64) {
    const avatarElement = document.querySelector('.profile-modal .profile-avatar');
    if (avatarElement) {
        avatarElement.innerHTML = `
            <img src="${newImageBase64}" alt="Profile photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
        `;
    }
}

// Function to update navbar avatar (optional)
function updateNavbarAvatar() {
    // Implement this function if you want to show the photo also in the navbar
    const dropdownAvatar = document.querySelector('.navbar__dropdown-avatar');
    if (dropdownAvatar && currentUser) {
        const userPhoto = getUserProfilePhoto(currentUser.id);
        if (userPhoto) {
            dropdownAvatar.innerHTML = `
                <img src="${userPhoto}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            `;
        }
    }
}

// Function to display profile with photo
function showUserProfileWithPhoto(user) {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    
    const userAvatar = createUserAvatar(user, 100);
    const photoUploadInput = createPhotoUploadInput();
    
    modal.innerHTML = `
        <div onclick="closeProfileModal()" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;"></div>
        <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:15px;max-width:500px;width:90%;z-index:9999;box-shadow:0 15px 40px rgba(0,0,0,0.3);">
            <div style="background:linear-gradient(135deg,#174a23,#174a23);color:white;padding:25px;text-align:center;border-radius:15px 15px 0 0;position:relative;">
                <button onclick="closeProfileModal()" style="position:absolute;top:15px;right:20px;background:none;border:none;color:white;font-size:24px;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;">&times;</button>
                
                <div style="margin-bottom: 15px;">
                    ${userAvatar}
                </div>
                
                ${photoUploadInput}
                
                <h2 style="margin: 15px 0 5px 0;">${user.name} ${user.lastName}</h2>
                <p style="background:rgba(255,255,255,0.2);padding:5px 15px;border-radius:15px;font-size:12px;display:inline-block;margin:0;">
                    ${user.type === 'CUSTOMER' ? 'Customer' : user.type}
                </p>
            </div>
            
            <div style="padding:20px;">
                <div style="margin-bottom: 20px;">
                    <h3 style="color:#28a745;margin-bottom:15px;border-bottom:2px solid #e9ecef;padding-bottom:5px;">Personal Information</h3>
                    
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8f9fa;">
                        <span style="font-weight:600;color:#6c757d;">Email:</span>
                        <span>${user.email}</span>
                    </div>
                    
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8f9fa;">
                        <span style="font-weight:600;color:#6c757d;">Phone:</span>
                        <span>${user.phone || 'Not specified'}</span>
                    </div>
                    
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8f9fa;">
                        <span style="font-weight:600;color:#6c757d;">Registration date:</span>
                        <span>${user.date}</span>
                    </div>
                    
                    <div style="display:flex;justify-content:space-between;padding:8px 0;">
                        <span style="font-weight:600;color:#6c757d;">Status:</span>
                        <span style="color:#28a745;font-weight:bold;">${user.status}</span>
                    </div>
                </div>
                
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button onclick="editUserProfile()" style="flex:1;min-width:120px;background:#007bff;color:white;border:none;padding:12px 15px;border-radius:8px;cursor:pointer;font-weight:600;">
                        Edit Profile
                    </button>
                    <button onclick="closeProfileModal(); showUserOrders(currentUser)" style="flex:1;min-width:120px;background:#28a745;color:white;border:none;padding:12px 15px;border-radius:8px;cursor:pointer;font-weight:600;">
                        View Orders
                    </button>
                    <button onclick="removeProfilePhoto()" style="flex:1;min-width:120px;background:#dc3545;color:white;border:none;padding:12px 15px;border-radius:8px;cursor:pointer;font-weight:600;">
                        Remove Photo
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Function to remove profile photo
function removeProfilePhoto() {
    if (currentUser && confirm('Are you sure you want to remove your profile photo?')) {
        localStorage.removeItem(`profile_photo_${currentUser.id}`);
        
        // Update modal view
        const avatarElement = document.querySelector('.profile-modal .profile-avatar');
        if (avatarElement) {
            avatarElement.outerHTML = createUserAvatar(currentUser, 100);
        }
        
        // Update navbar
        updateNavbarAvatar();
        
        console.log('Profile photo removed');
    }
}

// Placeholder function for editing profile
function editUserProfile() {
    alert('Profile editing functionality in development');
}

// Make functions global
window.handleProfilePhotoUpload = handleProfilePhotoUpload;
window.removeProfilePhoto = removeProfilePhoto;
window.editUserProfile = editUserProfile;

// Override the original show profile function

window.showUserProfile = showUserProfileWithPhoto;
