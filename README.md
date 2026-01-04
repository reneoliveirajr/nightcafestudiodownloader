
# 🚀 NightCafe Studio Downloader - Bulk Image Download

The **NightCafe Studio Downloader** is a powerful JavaScript script designed for bulk downloading images from NightCafe Studio pages. Perfect for backing up galleries, recovering artwork after a ban, or downloading inspiring art from other users.

## 🌟 Key Features
- **Automatic Image Detection:** Scans the page and identifies all relevant images, excluding interface elements like logos and backgrounds.
- **URL Export:** Creates a `nightcafe_urls.txt` file containing all the image links found.
- **Sequential Download:** Downloads all identified images in a structured sequence.
- **User-Friendly Interface:** Control panel to start or stop the download process easily.

## 📦 How to Use the NightCafe Studio Downloader
1. Go to the NightCafe Studio page where you want to download images.
2. Open the browser console (F12 or Ctrl + Shift + J on Windows/Linux, Option + ⌘ + J on macOS).
3. Copy the script code available [here](https://github.com/reneoliveirajr/nightcafestudiodownloader/blob/main/nightcafestudiodownloader.js).
4. Paste the code into the console and press **Enter** to start the download.

### ⚙️ Control Panel
- **Export URLs:** Saves all image URLs to a `.txt` file.
- **Download All:** Initiates the download of all images sequentially.
- **Close:** Closes the control panel without starting the download.

## 🔧 Advanced Customizations
- **Download Delay:** Adjust the delay between downloads by modifying the `DOWNLOAD_DELAY` constant at the start of the script.
- **Scroll Attempts:** Configure the maximum number of scroll attempts in the `maxScrollAttempts` variable.
- **Image Filtering:** The script ignores images containing `/assets/` in the URL, preventing unnecessary interface downloads.

## ⚠️ Legal Disclaimer
This script was developed for personal use, such as gallery backups or personal image recovery. Misuse or violation of NightCafe Studio's terms is the sole responsibility of the user.

---

Discover more useful scripts and free resources on our [GitHub repository](https://github.com/reneoliveirajr?tab=repositories). ⭐️🚀