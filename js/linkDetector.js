// Phishing Link & Deceptive Button Forensic Detector
window.LinkDetector = {
  knownBrands: [
    { name: "Microsoft", regex: /micros[o0]ft|office365|outlook|sharepoint|azure/i, legit: "microsoft.com" },
    { name: "Google", regex: /g[o0]{2}gle|gmail|google-drive/i, legit: "google.com" },
    { name: "PayPal", regex: /paypa[l1]|pay-pal/i, legit: "paypal.com" },
    { name: "Apple", regex: /app[l1]e|icloud/i, legit: "apple.com" },
    { name: "Amazon", regex: /amaz[o0]n|aws/i, legit: "amazon.com" },
    { name: "DHL", regex: /dh[l1]/i, legit: "dhl.com" },
    { name: "FedEx", regex: /fed-?ex/i, legit: "fedex.com" },
    { name: "Netflix", regex: /netf[l1]ix/i, legit: "netflix.com" },
    { name: "DocuSign", regex: /docus[i1]gn/i, legit: "docusign.com" }
  ],

  suspiciousTlds: ['ru', 'xyz', 'top', 'tk', 'buzz', 'cc', 'click', 'work', 'link', 'gq', 'ml', 'cf'],

  inspect(htmlOrText) {
    if (!htmlOrText) return [];

    const extracted = [];
    const seenUrls = new Set();

    // 1. Extract HTML <a> tags with anchor text and href
    const htmlAnchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = htmlAnchorRegex.exec(htmlOrText)) !== null) {
      const destinationUrl = match[1].trim();
      const rawAnchor = match[2].replace(/<[^>]+>/g, '').trim(); // strip inner tags

      if (destinationUrl && !destinationUrl.startsWith('#') && !destinationUrl.startsWith('mailto:')) {
        extracted.push(this.analyzeSingleLink(rawAnchor, destinationUrl, true));
        seenUrls.add(destinationUrl);
      }
    }

    // 2. Extract plaintext URLs
    const plainUrlRegex = /(https?:\/\/[^\s<>"'\)]+)/gi;
    while ((match = plainUrlRegex.exec(htmlOrText)) !== null) {
      const url = match[1].trim();
      if (!seenUrls.has(url)) {
        extracted.push(this.analyzeSingleLink(url, url, false));
        seenUrls.add(url);
      }
    }

    return extracted;
  },

  analyzeSingleLink(anchorText, destUrl, isButtonOrAnchor) {
    const defanged = this.defang(destUrl);
    let domain = "";
    let isIpAddress = false;
    let isLookalike = false;
    let lookalikeTarget = "";
    let isSuspiciousTld = false;
    let isMismatch = false;

    try {
      const parsed = new URL(destUrl);
      domain = parsed.hostname.toLowerCase();
      isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);

      // Check suspicious TLD
      const tld = domain.split('.').pop();
      if (this.suspiciousTlds.includes(tld)) {
        isSuspiciousTld = true;
      }

      // Check lookalike cousin domains
      for (const b of this.knownBrands) {
        if (b.regex.test(domain) && !domain.endsWith(b.legit)) {
          isLookalike = true;
          lookalikeTarget = b.name;
          break;
        }
      }

      // Check Anchor vs Destination Mismatch
      if (isButtonOrAnchor && anchorText) {
        const anchorLower = anchorText.toLowerCase();
        // Case A: Anchor text is a URL that points somewhere else
        if (anchorLower.startsWith('http://') || anchorLower.startsWith('https://') || anchorLower.startsWith('www.')) {
          const anchorDomain = anchorLower.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          if (!domain.includes(anchorDomain) && !anchorDomain.includes(domain)) {
            isMismatch = true;
          }
        } else {
          // Case B: Anchor text says "Microsoft Login" or "PayPal" but destination is completely different
          for (const b of this.knownBrands) {
            if (b.regex.test(anchorLower) && !domain.endsWith(b.legit)) {
              isMismatch = true;
              break;
            }
          }
        }
      }

    } catch (e) {
      domain = destUrl;
    }

    // Determine Verdict
    let verdict = "Clean";
    let verdictClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let flags = [];

    if (isMismatch) {
      verdict = "DECEPTIVE LINK";
      verdictClass = "bg-rose-50 text-rose-700 border-rose-200";
      flags.push("Visible text deceptively disguises malicious target destination");
    }
    if (isIpAddress) {
      verdict = "MALICIOUS (RAW IP)";
      verdictClass = "bg-rose-50 text-rose-700 border-rose-200";
      flags.push("Raw IP address used in link (common in credential harvesters)");
    }
    if (isLookalike) {
      verdict = "TYPOSQUATTED DOMAIN";
      verdictClass = "bg-rose-50 text-rose-700 border-rose-200";
      flags.push(`Lookalike domain mimicking official ${lookalikeTarget} infrastructure`);
    }
    if (isSuspiciousTld && verdict === "Clean") {
      verdict = "SUSPICIOUS TLD";
      verdictClass = "bg-amber-50 text-amber-700 border-amber-200";
      flags.push(`Unusual or high-abuse top-level domain (.${domain.split('.').pop()})`);
    }

    return {
      type: isButtonOrAnchor ? "Button / Hyperlink" : "Plaintext URL",
      anchorText: anchorText || "(No text)",
      destinationUrl: destUrl,
      defangedUrl: defanged,
      domain,
      isMismatch,
      isIpAddress,
      isLookalike,
      verdict,
      verdictClass,
      flags
    };
  },

  defang(url) {
    if (!url) return "";
    return url
      .replace(/^http:\/\//i, 'hxxp://')
      .replace(/^https:\/\//i, 'hxxps://')
      .replace(/\./g, '[.]');
  }
};
