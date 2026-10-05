const getVideoDetails = async (url) => {
    let platform = 'Unknown';
    
    // Sabhi platforms ke URL variations detect karna
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('shorts')) {
        platform = 'YouTube';
    } 
    else if (url.includes('instagram.com') || url.includes('instagr.am')) {
        platform = 'Instagram';
    } 
    else if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
        platform = 'Facebook';
    }

    return { platform, url };
};

module.exports = { getVideoDetails };