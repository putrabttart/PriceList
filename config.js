// config.js
window.CONFIG = {
  // Store Details
  storeName: "Putra Btt Store",
  shortStoreName: "PBS",
  whatsappNumber: "6282340915319", // Format: 62xxxxxxxxxx (no + or spaces)
  telegramUsername: "AutoOrderPBS_bot",
  telegramLink: "https://t.me/AutoOrderPBS_bot",
  websiteUrl: "https://putrabttstore.web.id",
  emailAdmin: "admin@putrabttstore.web.id",
  workHours: "08:00 – 23:00 WITA",
  location: "Indonesia",
  qrisImagePath: "qris.png", // Path or URL to QRIS payment image

  // Google Sheets Config (for index.html)
  sheetIdProducts: "1wgiOQyZfEZMB2nrO8E3ScBDqFxDGYiKXN3lDenUpXrs",
  sheetNameProducts: "Produk",
  sheetNameInfo: "informasi_modal"
};

// Automatic replacement on page load
document.addEventListener("DOMContentLoaded", () => {
  applyDynamicBranding();
});

function applyDynamicBranding() {
  const cfg = window.CONFIG;
  if (!cfg) return;

  // 1. Update Title (replace original brand names with config values)
  if (document.title) {
    document.title = document.title
      .replace(/Putra Btt Store/g, cfg.storeName)
      .replace(/PBS/g, cfg.shortStoreName);
  }

  // 2. Safe Text Nodes Traversal & Replacement
  const searchRegName = /Putra Btt Store/gi;
  const searchRegShort = /\bPBS\b/g;
  const searchRegWa = /6282340915319/g;
  const searchRegTele = /AutoOrderPBS_bot/gi;
  const searchRegWeb = /putrabttstore\.web\.id/gi;
  const searchRegEmail = /admin@putrabttstore\.web\.id/gi;

  function walkTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      let val = node.nodeValue;
      if (val) {
        let changed = false;
        if (val.match(searchRegName)) {
          val = val.replace(searchRegName, cfg.storeName);
          changed = true;
        }
        if (val.match(searchRegShort)) {
          val = val.replace(searchRegShort, cfg.shortStoreName);
          changed = true;
        }
        if (val.match(searchRegWa)) {
          val = val.replace(searchRegWa, cfg.whatsappNumber);
          changed = true;
        }
        if (val.match(searchRegTele)) {
          val = val.replace(searchRegTele, cfg.telegramUsername);
          changed = true;
        }
        if (val.match(searchRegWeb)) {
          val = val.replace(searchRegWeb, cfg.websiteUrl.replace(/^https?:\/\//i, ''));
          changed = true;
        }
        if (val.match(searchRegEmail)) {
          val = val.replace(searchRegEmail, cfg.emailAdmin);
          changed = true;
        }
        if (changed) {
          node.nodeValue = val;
        }
      }
    } else if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
      for (let i = 0; i < node.childNodes.length; i++) {
        walkTextNodes(node.childNodes[i]);
      }
    }
  }
  
  if (document.body) {
    walkTextNodes(document.body);
  }

  // 3. Update Anchor Hrefs
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    let href = link.getAttribute('href');
    if (href) {
      href = href.replace(/6282340915319/g, cfg.whatsappNumber);
      href = href.replace(/AutoOrderPBS_bot/g, cfg.telegramUsername);
      href = href.replace(/putrabttstore\.web\.id/g, cfg.websiteUrl.replace(/^https?:\/\//i, ''));
      href = href.replace(/admin@putrabttstore\.web\.id/g, cfg.emailAdmin);
      
      // Handle WhatsApp URL scheme formatting
      if (href.startsWith('https://wa.me/')) {
        try {
          const urlObj = new URL(href);
          const textParam = urlObj.searchParams.get('text');
          if (textParam) {
            urlObj.searchParams.set('text', textParam.replace(/Putra Btt Store/gi, cfg.storeName).replace(/\bPBS\b/g, cfg.shortStoreName));
          }
          href = urlObj.toString();
        } catch (e) {
          // Fallback if URL parsing fails for any reason
          href = href.replace(/Putra Btt Store/gi, cfg.storeName).replace(/\bPBS\b/g, cfg.shortStoreName);
        }
      } else if (href.startsWith('https://t.me/')) {
        href = cfg.telegramLink;
      } else if (href.includes('putrabttstore.web.id')) {
        href = cfg.websiteUrl;
      }
      
      link.setAttribute('href', href);
    }
  });

  // 4. Update elements with data-copy attributes
  const copyBtns = document.querySelectorAll('[data-copy]');
  copyBtns.forEach(btn => {
    let val = btn.getAttribute('data-copy');
    if (val) {
      val = val.replace(/6282340915319/g, cfg.whatsappNumber);
      btn.setAttribute('data-copy', val);
    }
  });

  // 5. Update QRIS images
  const qrisImages = document.querySelectorAll('img[src="qris.png"], img[alt*="QRIS"]');
  qrisImages.forEach(img => {
    img.src = cfg.qrisImagePath;
  });
}
