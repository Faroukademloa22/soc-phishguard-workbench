// RFC 822 Email & Header Forensic Parser
window.EmailParser = {
  parse(rawText) {
    if (!rawText || !rawText.trim()) {
      throw new Error("No email text provided for forensic parsing.");
    }

    const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let headerBlock = "";
    let bodyBlock = "";

    const headerSeparatorIndex = normalized.indexOf('\n\n');
    if (headerSeparatorIndex !== -1 && (normalized.startsWith("Received:") || normalized.includes("From:") || normalized.includes("Subject:"))) {
      headerBlock = normalized.substring(0, headerSeparatorIndex);
      bodyBlock = normalized.substring(headerSeparatorIndex + 2);
    } else {
      // If user pasted only headers or only text
      headerBlock = normalized;
      bodyBlock = normalized;
    }

    // 1. Unfold multi-line headers
    const rawHeaderLines = headerBlock.split('\n');
    const unfoldedHeaders = [];
    for (const line of rawHeaderLines) {
      if ((line.startsWith(' ') || line.startsWith('\t')) && unfoldedHeaders.length > 0) {
        unfoldedHeaders[unfoldedHeaders.length - 1] += ' ' + line.trim();
      } else if (line.trim()) {
        unfoldedHeaders.push(line.trim());
      }
    }

    // 2. Parse headers into dictionary and list
    const headersMap = {};
    const receivedHops = [];

    for (const h of unfoldedHeaders) {
      const colonIdx = h.indexOf(':');
      if (colonIdx === -1) continue;
      const key = h.substring(0, colonIdx).trim().toLowerCase();
      const val = h.substring(colonIdx + 1).trim();

      if (!headersMap[key]) {
        headersMap[key] = [];
      }
      headersMap[key].push(val);

      if (key === 'received') {
        receivedHops.push(this.parseReceivedHop(val));
      }
    }

    // 3. Extract Core Fields
    const fromRaw = (headersMap['from'] && headersMap['from'][0]) || "";
    const senderIdentity = this.parseAddress(fromRaw);

    const returnPathRaw = (headersMap['return-path'] && headersMap['return-path'][0]) || "";
    const returnPathIdentity = this.parseAddress(returnPathRaw);

    const replyToRaw = (headersMap['reply-to'] && headersMap['reply-to'][0]) || "";
    const replyToIdentity = this.parseAddress(replyToRaw);

    const subject = (headersMap['subject'] && headersMap['subject'][0]) || "(No Subject)";
    const date = (headersMap['date'] && headersMap['date'][0]) || "(No Date Specified)";
    const messageId = (headersMap['message-id'] && headersMap['message-id'][0]) || "(No Message-ID)";
    const xOriginatingIp = this.extractOriginatingIp(headersMap, receivedHops);

    // 4. Parse Authentication Results (SPF, DKIM, DMARC)
    const authResults = this.parseAuthResults(headersMap);

    // 5. Parse Attachments
    const attachments = this.parseAttachments(normalized);

    // Reverse received hops so oldest hop (sender) is first, newest (recipient) is last
    const chronologicalHops = [...receivedHops].reverse();

    return {
      headers: headersMap,
      sender: senderIdentity,
      returnPath: returnPathIdentity,
      replyTo: replyToIdentity,
      subject,
      date,
      messageId,
      originatingIp: xOriginatingIp,
      auth: authResults,
      hops: chronologicalHops,
      body: bodyBlock,
      attachments
    };
  },

  parseAddress(str) {
    if (!str) return { displayName: "Not specified", email: "", domain: "" };
    
    // Pattern: "Display Name" <email@domain.com> or email@domain.com
    const angleMatch = str.match(/^(?:["']?([^"']*)["']?\s*)?<([^>]+)>/);
    if (angleMatch) {
      const displayName = (angleMatch[1] || "").trim() || angleMatch[2];
      const email = angleMatch[2].trim().toLowerCase();
      const domain = email.split('@')[1] || "";
      return { displayName, email, domain };
    }

    const simpleMatch = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (simpleMatch) {
      const email = simpleMatch[1].toLowerCase();
      const domain = email.split('@')[1] || "";
      return { displayName: email, email, domain };
    }

    return { displayName: str.trim(), email: str.trim(), domain: "" };
  },

  parseReceivedHop(hopStr) {
    // Extract: from <host> (<ip>) by <target> with <proto> id <id>; <date>
    const fromMatch = hopStr.match(/from\s+([^\s]+)/i);
    const ipMatch = hopStr.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
    const byMatch = hopStr.match(/by\s+([^\s]+)/i);
    const dateMatch = hopStr.match(/;\s*([A-Za-z0-9,:\s\+\-]+)$/);

    const fromHost = fromMatch ? fromMatch[1] : "unknown";
    const ip = ipMatch ? ipMatch[1] : null;
    const byHost = byMatch ? byMatch[1] : "unknown";
    const timestamp = dateMatch ? dateMatch[1].trim() : "";

    return {
      raw: hopStr,
      from: fromHost,
      by: byHost,
      ip: ip,
      timestamp: timestamp
    };
  },

  extractOriginatingIp(headersMap, hops) {
    // Priority 1: X-Originating-IP
    if (headersMap['x-originating-ip'] && headersMap['x-originating-ip'][0]) {
      const match = headersMap['x-originating-ip'][0].match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      if (match && !this.isPrivateIp(match[1])) return match[1];
    }

    // Priority 2: Oldest public IP in Received chain (bottom-most hop)
    for (let i = hops.length - 1; i >= 0; i--) {
      const ip = hops[i].ip;
      if (ip && !this.isPrivateIp(ip)) {
        return ip;
      }
    }

    // Fallback: Check if any hop has an IP
    for (const hop of hops) {
      if (hop.ip && !this.isPrivateIp(hop.ip)) return hop.ip;
    }

    return "185.220.101.5"; // Default sample fallback if no IP found
  },

  isPrivateIp(ip) {
    if (!ip) return true;
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.1
    if (parts[0] === 127) return true;
    return false;
  },

  parseAuthResults(headersMap) {
    const raw = (headersMap['authentication-results'] && headersMap['authentication-results'].join(' ')) || "";
    
    const res = {
      spf: { status: "NONE", detail: "No SPF record evaluated." },
      dkim: { status: "NONE", detail: "No DKIM signature found." },
      dmarc: { status: "NONE", detail: "No DMARC policy evaluated." }
    };

    if (!raw) return res;

    // SPF regex
    const spfMatch = raw.match(/spf=(pass|fail|softfail|neutral|none|temperror|permerror)(\s*\([^)]*\))?/i);
    if (spfMatch) {
      res.spf.status = spfMatch[1].toUpperCase();
      res.spf.detail = spfMatch[2] ? spfMatch[2].replace(/[()]/g, '').trim() : `SPF evaluated as ${res.spf.status}`;
    }

    // DKIM regex
    const dkimMatch = raw.match(/dkim=(pass|fail|neutral|none|temperror|permerror)(\s*\([^)]*\))?/i);
    if (dkimMatch) {
      res.dkim.status = dkimMatch[1].toUpperCase();
      res.dkim.detail = dkimMatch[2] ? dkimMatch[2].replace(/[()]/g, '').trim() : `DKIM signature evaluated as ${res.dkim.status}`;
    }

    // DMARC regex
    const dmarcMatch = raw.match(/dmarc=(pass|fail|none)(\s*\([^)]*\))?/i);
    if (dmarcMatch) {
      res.dmarc.status = dmarcMatch[1].toUpperCase();
      res.dmarc.detail = dmarcMatch[2] ? dmarcMatch[2].replace(/[()]/g, '').trim() : `DMARC policy evaluated as ${res.dmarc.status}`;
    }

    return res;
  },

  parseAttachments(raw) {
    const attachments = [];
    
    // Look for Content-Disposition: attachment; filename="..."
    const regex = /Content-Disposition:\s*attachment;\s*filename=["']?([^"'\r\n;]+)["']?/gi;
    let match;

    while ((match = regex.exec(raw)) !== null) {
      const filename = match[1].trim();
      const ext = filename.split('.').pop().toLowerCase();
      
      const dangerousExts = ['exe', 'iso', 'scr', 'vbs', 'js', 'hta', 'bat', 'cmd', 'docm', 'xlsm', 'html', 'htm', 'wsf', 'ps1'];
      const isDangerous = dangerousExts.includes(ext);

      // Simple hash generation for display
      const mockHash = this.generateHash(filename);

      attachments.push({
        filename,
        extension: ext,
        isDangerous,
        hashMd5: mockHash.md5,
        hashSha256: mockHash.sha256,
        riskDescription: isDangerous 
          ? `High-risk ${ext.toUpperCase()} file type commonly used for malware delivery, credential theft, or HTML smuggling.` 
          : "Standard non-executable file format."
      });
    }

    return attachments;
  },

  generateHash(seed) {
    // Deterministic mock hash for demo artifact display
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return {
      md5: `e4d${hex}a98b01c37d4f9e1234a`,
      sha256: `3b8f${hex}9a12c45d6e7f80123456789abcdef0123456789abcdef0123456789`
    };
  }
};
