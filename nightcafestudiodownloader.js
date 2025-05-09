(async () => {
  try {
    // Optimized configurations for different gallery sizes using Fibonacci numbers
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    const CONFIGS = {
      veryLarge: {
        BATCH_SIZE: 89,
        BATCH_INTERVAL: 13000,
        DOWNLOAD_DELAY: 741
      },
      medium: {
        BATCH_SIZE: 89,
        BATCH_INTERVAL: 8000,
        DOWNLOAD_DELAY: 639
      },
      small: {
        BATCH_SIZE: 144,
        BATCH_INTERVAL: 5000,
        DOWNLOAD_DELAY: 369
      },
      cautious: {
        BATCH_SIZE: 21,
        BATCH_INTERVAL: 9000,
        DOWNLOAD_DELAY: 1001
      },
      ultraFast: {
        BATCH_SIZE: 55,
        BATCH_INTERVAL: 0,
        DOWNLOAD_DELAY: 233
      }
    };
    
    let CONFIG = {
      BATCH_SIZE: 89,
      BATCH_INTERVAL: 8000,
      DOWNLOAD_DELAY: 639,
      MAX_RETRIES: 3,
      RETRY_DELAY: 5129,
      STORAGE_KEY: 'nightcafe_progress',
      SCROLL_WAIT: 1500
    };
    
    // Adapts download parameters based on gallery size and selected mode
    const setConfig = (totalImages, mode) => {
      if (mode === 'cautious') {
        Object.assign(CONFIG, CONFIGS.cautious);
      } else if (mode === 'ultraFast') {
        Object.assign(CONFIG, CONFIGS.ultraFast);
      } else if (totalImages > 999) {
        Object.assign(CONFIG, CONFIGS.veryLarge);
      } else if (totalImages >= 333) {
        Object.assign(CONFIG, CONFIGS.medium);
      } else {
        Object.assign(CONFIG, CONFIGS.small);
      }
    };

    // Creates visual elements for user feedback and interaction
    let statusBox = document.getElementById('nightcafe-status');
    if (!statusBox) {
      statusBox = document.createElement('div');
      statusBox.id = 'nightcafe-status';
      Object.assign(statusBox.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '15px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '8px',
        zIndex: 9999,
        fontFamily: 'Arial',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        overflowY: 'auto',
        maxHeight: '50vh'
      });
      document.body.appendChild(statusBox);
    }

    const updateStatus = (message) => {
      statusBox.innerHTML = message.replace(/\n/g, '<br>');
      console.log(message);
    };

    updateStatus("🚀 Starting NightCafe gallery scanner...");

    // Detects images using multiple selector strategies and upgrades URLs to high quality versions
    let discoveredUrls = new Set();
    let previousCount = 0;

    const scanForImages = () => {
      const selectors = [
        'img[src*="nightcafe"]',
        'img[src*="images.nightcafe"]',
        'img[data-src*="nightcafe"]',
        'img[data-original*="nightcafe"]',
        '.gallery-item img',
        '.creation-card img',
        '.image-container img',
        '[style*="background-image"]'
      ];
      const elements = document.querySelectorAll(selectors.join(', '));

      elements.forEach(el => {
        let url = '';
        if (el.tagName === 'IMG') {
          url = el.src || el.dataset.src || el.getAttribute('data-original') || '';
        } else if (el.style && el.style.backgroundImage) {
          const match = el.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
          if (match && match[1]) url = match[1];
        }

        if (url && url.includes('nightcafe')) {
          if (url.includes('/assets/')) return;
          url = url.split('?')[0]
                  .replace(/=w\d+-h\d+(-no)?/, '')
                  .replace(/-thumbnail/, '')
                  .replace(/\/thumbnail\//, '/');

          if (!url.includes('/jobs/') && !url.includes('/ik-seo/')) {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            if (filename.includes('nightcafe')) {
              const jobId = filename.split('_')[0];
              if (jobId) {
                url = `https://images.nightcafe.studio/jobs/${jobId}/${jobId}--1.jpg`;
              }
            }
          }
          discoveredUrls.add(url);
        }
      });

      return discoveredUrls.size;
    };

    // Dynamically explores the page to find all images with adaptive timing
    const smartScroll = async () => {
      let noNewImagesCounter = 0;
      const maxScrollAttempts = Infinity;
      let totalScrolls = 0;
      let initialPosition = window.scrollY;
      let adaptiveWait = 1500;

      while (noNewImagesCounter < 4 && totalScrolls < maxScrollAttempts) {
        previousCount = discoveredUrls.size;
        scanForImages();
        const currentCount = discoveredUrls.size;
        const newImages = currentCount - previousCount;
        updateStatus(`🔍 Scroll ${totalScrolls + 1}: Found ${currentCount} images (+${newImages} new)`);

        if (newImages === 0) {
          noNewImagesCounter++;
          adaptiveWait = Math.max(1000, adaptiveWait - 200);
        } else {
          noNewImagesCounter = 0;
          adaptiveWait = 1500;
        }

        window.scrollBy(0, window.innerHeight * 0.8);
        totalScrolls++;
        await delay(adaptiveWait);

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
          await delay(800);
          scanForImages();
        }

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
          const loadMoreButtons = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(el => {
            const text = el.textContent.toLowerCase();
            return text.includes('load more') || text.includes('carregar mais') ||
                  text.includes('ver mais') || text.includes('mostrar mais');
          });

          if (loadMoreButtons.length > 0) {
            updateStatus("🖱️ Clicking 'Load more' button...");
            loadMoreButtons[0].click();
            await delay(2500);
            noNewImagesCounter = 0;
          } else if (noNewImagesCounter >= 5) break;
        }
      }

      window.scrollTo(0, 0);
      await delay(1000);
      scanForImages();
      
      window.scrollTo(0, document.body.scrollHeight);
      await delay(1500);
      scanForImages();
      
      window.scrollTo(0, initialPosition);
      return totalScrolls;
    };

    // Optional user-assisted loading to improve discovery in large galleries
    const preloadOption = confirm("Manually preload gallery first? (Recommended for large galleries)");
    
    if (preloadOption) {
      updateStatus(`
        📜 Manual preload instructions:
        
        1) Scroll SLOWLY through the gallery
        2) Wait for images to load
        3) Click "Preload Complete" button
      `);
      
      await new Promise(resolve => {
        const preloadBtn = document.createElement('button');
        preloadBtn.innerText = "Preload Complete";
        preloadBtn.style = `
          position: fixed;
          bottom: 80px;
          right: 20px;
          padding: 10px 15px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          z-index: 10000;
          font-weight: bold;
        `;
        preloadBtn.onclick = async () => {
          updateStatus("⏫ Returning to top...");
          window.scrollTo({ top: 0, behavior: 'smooth' });
          document.body.removeChild(preloadBtn);
          await delay(1500);
          resolve();
        };
        document.body.appendChild(preloadBtn);
      });
      
      scanForImages();
      updateStatus(`🔍 Pre-scan: Found ${discoveredUrls.size} images after manual preload`);
    }

    // Initiates the full gallery scan and displays results to user
    updateStatus("📜 Starting intelligent scroll to discover all images...");
    const scrollCount = await smartScroll();
    scanForImages();
    updateStatus(`✅ Scan complete: ${discoveredUrls.size} unique images found in ${scrollCount} scrolls`);

    const imageUrls = Array.from(discoveredUrls);
    setConfig(imageUrls.length);

    // Creates a panel showing all discovered images with download options
    const downloadPanel = document.createElement('div');
    downloadPanel.style = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 900px;
      height: 80vh;
      background: white;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      z-index: 10000;
      font-family: Arial;
      display: flex;
      flex-direction: column;
      padding: 20px;
      color: black;
    `;

    downloadPanel.innerHTML = `
      <h2 style="margin-top: 0;">🖼️ NightCafe Gallery - ${imageUrls.length} images found</h2>
      <div style="display: flex; gap: 10px; margin: 15px 0;">
        <button id="btn-export-urls" style="padding: 10px 15px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Export URLs</button>
        <button id="btn-download-all" style="padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Download All</button>
        <button id="btn-close" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
      <div style="display: flex; gap: 15px; margin-bottom: 10px; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; cursor: pointer; margin-right: 10px;">
          <input type="radio" name="mode" value="normal" checked style="margin-
    `;
    
    // Code was truncated here in the provided document
    // Would continue with the implementation of the rest of the panel and download functionalities
    
  } catch (error) {
    console.error("Error in NightCafe gallery downloader:", error);
    alert(`Error: ${error.message}`);
  }
})();
