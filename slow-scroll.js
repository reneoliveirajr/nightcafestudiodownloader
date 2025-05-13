(async () => {
  try {
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
      SCROLL_WAIT: 5000
    };
    
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

    const smartScroll = async () => {
      let noNewImagesCounter = 0;
      const maxScrollAttempts = Infinity;
      let totalScrolls = 0;
      let initialPosition = window.scrollY;
      let adaptiveWait = CONFIG.SCROLL_WAIT;

      while (noNewImagesCounter < 3 && totalScrolls < maxScrollAttempts) {
        previousCount = discoveredUrls.size;
        scanForImages();
        const currentCount = discoveredUrls.size;
        const newImages = currentCount - previousCount;
        updateStatus(`🔍 Scroll ${totalScrolls + 1}: Found ${currentCount} images (+${newImages} new)`);

        if (newImages === 0) {
          noNewImagesCounter++;
          adaptiveWait = Math.max(1500, adaptiveWait - 500);
        } else {
          noNewImagesCounter = 0;
          adaptiveWait = CONFIG.SCROLL_WAIT;
        }

        window.scrollBy(0, window.innerHeight * 0.3);
        totalScrolls++;
        await delay(adaptiveWait);

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
          const loadMoreButtons = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(el => {
            const text = el.textContent.toLowerCase();
            return text.includes('load more') || text.includes('carregar mais') ||
                  text.includes('ver mais') || text.includes('mostrar mais');
          });

          if (loadMoreButtons.length > 0) {
            updateStatus("🖱️ Clicking 'Load more' button...");
            loadMoreButtons[0].click();
            await delay(4000);
            noNewImagesCounter = 0;
          } else if (noNewImagesCounter >= 4) break;
        }
      }

      window.scrollTo(0, initialPosition);
      return totalScrolls;
    };

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

    updateStatus("📜 Starting intelligent scroll to discover all images...");
    const scrollCount = await smartScroll();
    scanForImages();
    updateStatus(`✅ Scan complete: ${discoveredUrls.size} unique images found in ${scrollCount} scrolls`);

    const imageUrls = Array.from(discoveredUrls);
    setConfig(imageUrls.length);

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
          <input type="radio" name="mode" value="normal" checked style="margin-right: 5px;"> 
          Normal Mode
        </label>
        <label style="display: flex; align-items: center; cursor: pointer; margin-right: 10px;">
          <input type="radio" name="mode" value="cautious" style="margin-right: 5px;"> 
          Cautious Mode
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="mode" value="ultraFast" style="margin-right: 5px;"> 
          Ultra-Fast Mode (risky)
        </label>
      </div>
      <div id="download-status" style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; display: none;"></div>
      <div style="flex: 1; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
        ${imageUrls.map((url, index) => `
          <div class="image-preview" style="position: relative; height: 150px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 3px 6px; font-size: 12px; text-align: center;">
              ${index + 1}
            </div>
          </div>`).join('')}
      </div>
    `;

    document.body.appendChild(downloadPanel);
    document.body.removeChild(statusBox);

    document.getElementById('btn-export-urls').addEventListener('click', () => {
      const blob = new Blob([imageUrls.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nightcafe_urls.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    document.getElementById('btn-close').addEventListener('click', () => {
      document.body.removeChild(downloadPanel);
    });

    document.getElementById('btn-download-all').addEventListener('click', async () => {
      const statusElem = document.getElementById('download-status');
      if (statusElem) statusElem.style.display = 'block';
      
      const modeInputs = document.querySelectorAll('input[name="mode"]');
      let selectedMode = 'normal';
      modeInputs.forEach(input => {
        if (input.checked) selectedMode = input.value;
      });
      
      setConfig(imageUrls.length, selectedMode);
      
      let confirmMessage = `Download all ${imageUrls.length} images? `;
      
      if (selectedMode === 'cautious') {
        confirmMessage += `Using cautious mode (${CONFIG.BATCH_SIZE} images per batch).`;
      } else if (selectedMode === 'ultraFast') {
        confirmMessage += `Using ultra-fast mode (${CONFIG.BATCH_SIZE} images, ${CONFIG.DOWNLOAD_DELAY}ms delay). WARNING: May get blocked!`;
      } else {
        confirmMessage += `Using ${CONFIG.BATCH_SIZE} images per batch, ${CONFIG.BATCH_INTERVAL/1000}s interval.`;
      }
      
      if (!confirm(confirmMessage)) {
        if (statusElem) {
          statusElem.textContent = "Download canceled.";
        }
        return;
      }

      let startIndex = 0;
      const savedProgress = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (savedProgress) {
        try {
          const saved = JSON.parse(savedProgress);
          if (saved.lastCompleted > 0 && confirm(`Found saved progress (${saved.lastCompleted}/${imageUrls.length}). Continue?`)) {
            startIndex = saved.lastCompleted;
          }
        } catch (e) {
          console.error("Error reading saved progress:", e);
        }
      }

      let count = startIndex;
      let failures = 0;
      
      const saveProgress = (index) => {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
          lastCompleted: index,
          total: imageUrls.length,
          timestamp: Date.now()
        }));
      };
      
      for (let i = startIndex; i < imageUrls.length; i += CONFIG.BATCH_SIZE) {
        const batchEnd = Math.min(i + CONFIG.BATCH_SIZE, imageUrls.length);
        if (statusElem) {
          statusElem.innerHTML = `
            <div>⏳ Batch ${Math.floor(i/CONFIG.BATCH_SIZE) + 1}/${Math.ceil(imageUrls.length/CONFIG.BATCH_SIZE)}</div>
            <div>Progress: ${count}/${imageUrls.length} (${failures} failed)</div>
            <progress value="${count}" max="${imageUrls.length}" style="width:100%;"></progress>
          `;
        }
        
        const batchPromises = [];
        for (let j = i; j < batchEnd; j++) {
          batchPromises.push((async () => {
            try {
              const imageUrl = imageUrls[j];
              const isValidUrl = /^https:\/\/images\.nightcafe\.studio\/.+\.(jpg|jpeg|png|webp)$/i.test(imageUrl);
              if (!isValidUrl) {
                console.warn(`⚠️ Invalid URL skipped: ${imageUrl}`);
                failures++;
                return;
              }
              
              let success = false;
              for (let attempt = 0; attempt < CONFIG.MAX_RETRIES && !success; attempt++) {
                try {
                  if (attempt > 0) {
                    console.log(`Attempt ${attempt+1} for ${imageUrl}`);
                    await delay(CONFIG.RETRY_DELAY * Math.pow(2, attempt-1));
                  }
                  
                  const response = await fetch(imageUrl);
                  if (response.status === 429) {
                    console.warn(`Rate limit (429) for ${imageUrl}`);
                    continue;
                  }
                  
                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                  
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `nightcafe_${String(j + 1).padStart(4, '0')}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  success = true;
                  count++;
                  
                } catch (err) {
                  console.error(`Error on attempt ${attempt+1} for ${imageUrl}:`, err);
                }
              }
              
              if (!success) failures++;
              
            } catch (err) {
              console.error(`Critical error downloading image ${j+1}:`, err);
              failures++;
            }
          })());
          
          await delay(CONFIG.DOWNLOAD_DELAY);
        }
        
        await Promise.allSettled(batchPromises);
        saveProgress(batchEnd);
        
        if (batchEnd < imageUrls.length) {
          if (statusElem) {
            statusElem.innerHTML = `
              <div>✅ Batch complete. Waiting ${CONFIG.BATCH_INTERVAL/1000}s...</div>
              <div>Progress: ${count}/${imageUrls.length} (${failures} failed)</div>
              <progress value="${count}" max="${imageUrls.length}" style="width:100%;"></progress>
            `;
          }
          await delay(CONFIG.BATCH_INTERVAL);
        }
      }
      
      if (count >= imageUrls.length - failures) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
      }
      
      if (statusElem) {
        statusElem.innerHTML = `
          <div>✅ Downloads finished: ${count} successful, ${failures} failed.</div>
          ${failures > 0 ? '<div>You can try again to download failed images.</div>' : ''}
        `;
      }
    });
  } catch (error) {
    console.error('Script error:', error);
  }
})();
