// Social Engineering & Urgency Tone Forensic Scorer
window.UrgencyScorer = {
  triggerCategories: [
    {
      category: "Urgent Deadlines & Expiration",
      weight: 25,
      patterns: [
        /immediate\s+(?:action|verification|attention)\s+required/i,
        /within\s+(?:24|48|12|2)\s+hours/i,
        /expires?\s+(?:today|soon|immediately)/i,
        /account\s+(?:suspended|locked|terminated|disabled)/i,
        /before\s+(?:termination|lockout|closing)/i,
        /right\s+now/i,
        /utmost\s+urgency/i
      ]
    },
    {
      category: "Financial & Wire Transfer Coercion",
      weight: 30,
      patterns: [
        /wire\s+transfer/i,
        /confidential\s+(?:payment|transaction|wire)/i,
        /vendor\s+(?:invoice|payment|acquisition)/i,
        /gift\s+cards?/i,
        /direct\s+deposit|payroll\s+update/i,
        /\$\d+[\d,]*\s+(?:to|before|urgent)/i
      ]
    },
    {
      category: "Secrecy & Security Circumvention",
      weight: 25,
      patterns: [
        /do\s+not\s+discuss/i,
        /strictly\s+confidential/i,
        /cannot\s+take\s+phone\s+calls/i,
        /locked\s+in\s+(?:a\s+)?meeting/i,
        /keep\s+this\s+between\s+us/i,
        /under\s+nda/i
      ]
    },
    {
      category: "Fear, Threat & Compliance",
      weight: 20,
      patterns: [
        /unauthorized\s+(?:access|activity|login)/i,
        /security\s+violation/i,
        /legal\s+(?:action|notice)/i,
        /revocation\s+of/i,
        /failure\s+to\s+verify/i
      ]
    }
  ],

  analyze(text) {
    if (!text) {
      return {
        score: 0,
        level: "LOW / NEUTRAL",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        barClass: "bg-emerald-500",
        summary: "No coercive language, artificial urgency, or psychological pressure triggers detected.",
        triggers: [],
        highlightedText: "No text to analyze."
      };
    }

    let totalScore = 0;
    const detectedTriggers = [];
    const matchedStrings = new Set();

    for (const cat of this.triggerCategories) {
      for (const pattern of cat.patterns) {
        const match = text.match(pattern);
        if (match) {
          totalScore += cat.weight;
          const phrase = match[0];
          matchedStrings.add(phrase);
          detectedTriggers.push({
            phrase,
            category: cat.category
          });
        }
      }
    }

    // Clamp score between 0 and 100
    const finalScore = Math.min(100, Math.max(0, totalScore));

    let level = "LOW / NEUTRAL";
    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let barClass = "bg-emerald-500";
    let summary = "Normal conversational or corporate tone without pressure tactics.";

    if (finalScore >= 70) {
      level = "CRITICAL URGENCY";
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
      barClass = "bg-rose-600";
      summary = "Aggressive social engineering tactics detected. The sender leverages artificial time deadlines, account termination threats, or confidential financial urgency to induce panic.";
    } else if (finalScore >= 40) {
      level = "HIGH URGENCY";
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      barClass = "bg-amber-500";
      summary = "Elevated urgency triggers detected. The email attempts to expedite action without standard verification.";
    } else if (finalScore > 0) {
      level = "MODERATE URGENCY";
      badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
      barClass = "bg-blue-500";
      summary = "Minor urgency keywords observed; common in business correspondence, but verify sender credentials.";
    }

    // Highlight triggers in text snippet
    let highlighted = text.slice(0, 1500); // sample snippet
    matchedStrings.forEach(str => {
      const escape = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      highlighted = highlighted.replace(new RegExp(escape, 'gi'), match => `<mark class="urgency-highlight">${match}</mark>`);
    });

    return {
      score: finalScore,
      level,
      badgeClass,
      barClass,
      summary,
      triggers: detectedTriggers,
      highlightedText: highlighted
    };
  }
};
