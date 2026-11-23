// Realistic Phishing & Email Forensic Samples for SOC Analyst Testing
window.SOC_SAMPLES = {
  m365_spoof: {
    name: "Microsoft 365 Credential Harvester (Spoofed)",
    targetBrand: "Microsoft",
    previewUrl: "http://185.220.101.5/office365-login/auth.php",
    previewType: "m365",
    raw: `Received: from mail-router12.evil-relay.net (mail-router12.evil-relay.net [185.220.101.5])
	by mx.company.com (Postfix) with ESMTPS id 4SlKq71239
	for <analyst@company.com>; Mon, 23 Nov 2026 14:22:15 +0000 (UTC)
Received: from desktop-vps.hostkey.ru (unknown [194.26.29.112])
	by mail-router12.evil-relay.net (Postfix) with ESMTP id 8F1B3004
	for <analyst@company.com>; Mon, 23 Nov 2026 14:21:49 +0000 (UTC)
Authentication-Results: mx.company.com;
	dkim=fail (bad signature) header.d=micros0ft-support.ru;
	spf=fail (mx.company.com: domain of bounce@evil-relay.net does not designate 185.220.101.5 as permitted sender);
	dmarc=fail (p=REJECT dis=NONE) header.from=microsoft.com
From: "Microsoft Security Alert" <notifications@micros0ft-support.ru>
Reply-To: credential-collector@temp-box.xyz
Return-Path: <bounce@evil-relay.net>
To: "SOC Team" <analyst@company.com>
Subject: CRITICAL: Immediate Password Expiration - 24 Hours Before Termination
Date: Mon, 23 Nov 2026 14:21:40 +0000
Message-ID: <20261123142140.84920.phish@micros0ft-support.ru>
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"
X-Originating-IP: [185.220.101.5]

<html>
<body>
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0;">
  <h2 style="color: #d9381e;">Urgent: Action Required on Your Corporate Account</h2>
  <p>Dear Corporate User,</p>
  <p>Your Microsoft 365 access password is scheduled for <strong>immediate termination</strong> within the next <strong>24 hours</strong> due to outdated security compliance protocols.</p>
  <p>Failure to verify your identity immediately will result in complete account lockout and revocation of corporate intranet access.</p>
  <p style="margin: 30px 0;">
    <a href="http://185.220.101.5/office365-login/auth.php" style="background-color: #0078d4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      https://login.microsoftonline.com/common/oauth2/authorize
    </a>
  </p>
  <p>For assistance, visit our help portal: <a href="http://portal-verify.micros0ft-support.ru/help">https://portal.office.com/support</a></p>
  <p style="font-size: 11px; color: #888;">Microsoft Corporation, One Microsoft Way, Redmond, WA 98052</p>
</div>
</body>
</html>`
  },

  urgency_wire: {
    name: "Urgent CEO Wire Transfer (Display Name Spoof)",
    targetBrand: "Executive / Banking",
    previewUrl: "hxxp://exec-asia-wire[.]com/portal/login",
    previewType: "banking",
    raw: `Received: from mail-out-4.freemail-relay.org (mail-out-4.freemail-relay.org [103.251.167.22])
	by mx.company.com (Postfix) with ESMTPS id 3W99aB0012
	for <finance@company.com>; Mon, 23 Nov 2026 10:15:02 +0000 (UTC)
Authentication-Results: mx.company.com;
	dkim=pass header.d=gmail.com;
	spf=pass (mx.company.com: domain of ceo.executive1029@gmail.com designates 103.251.167.22 as permitted sender);
	dmarc=none
From: "David Chen (Chief Executive Officer)" <ceo.executive1029@gmail.com>
Reply-To: direct-confidential@exec-asia-wire.com
Return-Path: <ceo.executive1029@gmail.com>
To: "Head of Accounts" <finance@company.com>
Subject: URGENT & CONFIDENTIAL: Vendor Acquisition Payment - Wire Required Today
Date: Mon, 23 Nov 2026 10:14:30 +0000
Message-ID: <CAG982K-ceo-wire-urgent@gmail.com>
Content-Type: text/plain; charset="UTF-8"
X-Originating-IP: [103.251.167.22]

Hi Sarah,

Are you at your desk right now?

I am currently locked in an acquisition negotiation meeting and cannot take phone calls. 
We urgently need to execute a confidential wire transfer of $48,500 to our prospective strategic partner before 3:00 PM today to finalize the contract closing.

Please confirm receipt of this email immediately so I can send through the wire bank details and invoice. Do not discuss this with anyone in the office yet as this deal is strictly confidential under NDA.

Treat this with utmost urgency.

Best regards,
David Chen
Chief Executive Officer
Company Group Inc.`
  },

  fake_dhl: {
    name: "DHL Tracking Delivery (Malicious Attachment)",
    targetBrand: "DHL Express",
    previewUrl: "http://track-parcel-express.xyz/dhl/release.html",
    previewType: "dhl",
    raw: `Received: from vps-mailer.track-parcel-express.xyz (vps-mailer.track-parcel-express.xyz [91.240.118.66])
	by mx.company.com (Postfix) with ESMTPS id 9K0023aL
	for <logistics@company.com>; Mon, 23 Nov 2026 08:05:12 +0000 (UTC)
Authentication-Results: mx.company.com;
	dkim=neutral;
	spf=fail;
	dmarc=fail (p=REJECT) header.from=dhl.com
From: "DHL Express Delivery Support" <tracking-notice@track-parcel-express.xyz>
Return-Path: <bounce@track-parcel-express.xyz>
To: <logistics@company.com>
Subject: DHL Notification: Shipment ID #892019-NL Failed Delivery - Download Receipt
Date: Mon, 23 Nov 2026 08:04:45 +0000
Message-ID: <dhl-delivery-failed-892019@track-parcel-express.xyz>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_Part_9821_4901.1293"
X-Originating-IP: [91.240.118.66]

------=_Part_9821_4901.1293
Content-Type: text/html; charset="UTF-8"

<p>Dear Customer,</p>
<p>Your package with tracking number <strong>#NL-8920192</strong> could not be delivered to your registered facility due to unpaid duty taxes.</p>
<p>Please inspect the attached shipping receipt and release form (DHL_Receipt_892019.iso) or visit our tracking portal below within 48 hours to prevent return of package to sender:</p>
<p><a href="http://track-parcel-express.xyz/dhl/release.html">https://www.dhl.com/global-en/home/tracking.html</a></p>
<br>
<p>DHL International Team</p>

------=_Part_9821_4901.1293
Content-Type: application/x-iso9660-image; name="DHL_Receipt_892019.iso"
Content-Disposition: attachment; filename="DHL_Receipt_892019.iso"
Content-Transfer-Encoding: base64

TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAA2AAAAA4fug4AtAnNIbgBTM0hVGhpcyBwcm9ncmFtIGNhbm5vdCBiZSBydW4gaW4gRE9TIG1v
ZGUuDQ0KJAAAAAAAAABQRQAATAEDAAAAAAAAAAAAAAAAAOAADwELAQIAAAAAAAAAAAAAAAAAAAAA
------=_Part_9821_4901.1293
Content-Type: text/html; name="Payment_Gateway.html"
Content-Disposition: attachment; filename="Payment_Gateway.html"
Content-Transfer-Encoding: 7bit

<script>
// Obfuscated HTML Smuggling Payload
const b64 = "dmFyIGE9bmV3IEFjdGl2ZVhPYmplY3QoKTs=";
</script>
------=_Part_9821_4901.1293--`
  },

  clean_mail: {
    name: "Clean Internal Corporate Email (All Passes)",
    targetBrand: "Company Internal",
    previewUrl: "https://wiki.internal.company.com/sync",
    previewType: "clean",
    raw: `Received: from mail-mw2nam10on2072.outbound.protection.outlook.com (mail-mw2nam10on2072.outbound.protection.outlook.com [40.107.94.72])
	by mx.company.com (Postfix) with ESMTPS id 1A2B3C4D
	for <analyst@company.com>; Mon, 23 Nov 2026 09:30:00 +0000 (UTC)
Authentication-Results: mx.company.com;
	dkim=pass (signature was verified) header.d=company.com;
	spf=pass (mx.company.com: domain of jsmith@company.com designates 40.107.94.72 as permitted sender);
	dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=company.com
From: "John Smith" <jsmith@company.com>
Return-Path: <jsmith@company.com>
To: "SOC Team" <analyst@company.com>
Subject: Team Sync Agenda for Tuesday
Date: Mon, 23 Nov 2026 09:29:45 +0000
Message-ID: <MW2NAM10ON207299A101@company.com>
Content-Type: text/plain; charset="UTF-8"
X-Originating-IP: [40.107.94.72]

Hi Team,

Just sharing the agenda for our regular weekly engineering sync scheduled for tomorrow at 10:00 AM in Conference Room B.

Topics:
1. Review of Q4 sprint milestones
2. CI/CD pipeline improvements
3. On-call rotation handover

Please add any additional discussion points to our team wiki: https://wiki.internal.company.com/sync

See you all tomorrow!

Best,
John Smith
Engineering Lead`
  }
};
