(async () => {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const DOWNLOAD_DELAY = 400;

  // Criar ou reaproveitar o statusBox
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
      fontFamily: 'Arial, sans-serif',
      minWidth: '300px',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    });
    document.body.appendChild(statusBox);
  }

  const updateStatus = (message) => {
    statusBox.textContent = message;
    console.log(message);
  };

  updateStatus("🚀 Iniciando scanner completo da galeria NightCafe...");

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
        // Ignorar imagens de assets da interface
        if (url.includes('/assets/')) return;
        // Limpar URL
        url = url.split('?')[0]
                 .replace(/=w\d+-h\d+(-no)?/, '')
                 .replace(/-thumbnail/, '')
                 .replace(/\/thumbnail\//, '/');

        // Garantir URLs de alta qualidade...
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
    const maxScrollAttempts = 300;
    let totalScrolls = 0;
    let initialPosition = window.scrollY;

    while (noNewImagesCounter < 3 && totalScrolls < maxScrollAttempts) {
      previousCount = discoveredUrls.size;
      scanForImages();
      const currentCount = discoveredUrls.size;
      const newImages = currentCount - previousCount;
      updateStatus(`🔍 Rolagem ${totalScrolls + 1}/${maxScrollAttempts}: Encontradas ${currentCount} imagens (+${newImages} novas)`);

      noNewImagesCounter = newImages === 0 ? noNewImagesCounter + 1 : 0;
      window.scrollBy(0, window.innerHeight * 0.6);
      totalScrolls++;
      await delay(2000);

      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
        const loadMoreButtons = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('load more') || text.includes('carregar mais') ||
                 text.includes('ver mais') || text.includes('mostrar mais');
        });

        if (loadMoreButtons.length > 0) {
          updateStatus("🖱️ Clicando em botão 'Carregar mais'...");
          loadMoreButtons[0].click();
          await delay(2000);
          noNewImagesCounter = 0;
        } else if (noNewImagesCounter >= 2) break;
      }
    }

    window.scrollTo(0, initialPosition);
    return totalScrolls;
  };

  updateStatus("📜 Iniciando rolagem inteligente para descobrir todas as imagens...");
  const scrollCount = await smartScroll();
  scanForImages();
  updateStatus(`✅ Escaneamento concluído após ${scrollCount} rolagens. Encontradas ${discoveredUrls.size} imagens únicas.`);

  const imageUrls = Array.from(discoveredUrls);

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
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    padding: 20px;
    color: black;
  `;

  downloadPanel.innerHTML = `
    <h2 style="margin-top: 0;">🖼️ Galeria NightCafe - ${imageUrls.length} imagens encontradas</h2>
    <div style="display: flex; gap: 10px; margin: 15px 0;">
      <button id="btn-export-urls" style="padding: 10px 15px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Exportar URLs</button>
      <button id="btn-download-all" style="padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Baixar Todas</button>
      <button id="btn-close" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
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

    if (!confirm(`Deseja baixar todas as ${imageUrls.length} imagens? Seu navegador pode solicitar confirmação para cada download.`)) {
      if (statusElem) {
        statusElem.style.display = 'block';
        statusElem.textContent = "Download cancelado.";
      }
      return;
    }

    let count = 0;
    let failures = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        if (statusElem) statusElem.textContent = `⏳ Baixando imagem ${i + 1}/${imageUrls.length}...`;

        const imageUrl = imageUrls[i];
        const isValidUrl = /^https:\/\/images\.nightcafe\.studio\/.+\.(jpg|jpeg|png|webp)$/i.test(imageUrl);

        if (!isValidUrl) {
          console.warn(`⚠️ URL inválida ou potencialmente perigosa ignorada: ${imageUrl}`);
          failures++;
          continue;
        }

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nightcafe_${String(i + 1).padStart(4, '0')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        count++;
        await delay(DOWNLOAD_DELAY);
      } catch (err) {
        console.error(`Erro ao baixar ${imageUrls[i]}:`, err);
        failures++;
      }
    }

    if (statusElem) {
      statusElem.textContent = `✅ Downloads finalizados: ${count} com sucesso, ${failures} falhas.`;
    }
  });
})();
