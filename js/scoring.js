/**
 * Ai Health Check - Scoring & Analysis Logic
 * Strictly implements Section 7.2 of the specification
 */

export const ScoringEngine = {
  config: {
    points: {
      rank1: 1.0,
      rank2to3: 0.85,
      rankLower: 0.65,
      unrankedMention: 0.60,
      notMentioned: 0.0,
      negativeSentimentMultiplier: 0.5
    },
    bands: {
      red: { max: 39, label: "Low AI Visibility", color: "#C8382E", class: "band-red" },
      amber: { min: 40, max: 69, label: "Moderate Visibility", color: "#B97A00", class: "band-amber" },
      green: { min: 70, max: 100, label: "Strong AI Visibility", color: "#1E8E5A", class: "band-green" }
    },
    verdicts: {
      none: "No answers came back from the AI models.",
      red: "AI models are directing virtually all local customer enquiries to your direct competitors.",
      amber: "You appear occasionally, but competitors capture the top 3 recommendations in most local searches.",
      green: "Your business is recognized and actively recommended across multiple major AI engines."
    }
  },

  /**
   * Normalises business name for fuzzy matching
   */
  normaliseName(name) {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\b(pty|ltd|the|co|group|services|pty ltd)\b/gi, "")
      .replace(/[^\w\s]/g, "")
      .trim();
  },

  /**
   * Calculates total check score from array of answers
   */
  calculateScore(answers, targetBusinessName) {
    if (!answers || answers.length === 0) {
      return {
        score: 0,
        answeredCount: 0,
        band: "none",
        bandLabel: "No Data",
        bandColor: "#5B6472",
        verdict: this.config.verdicts.none
      };
    }

    let totalPoints = 0;
    let validAnswerCount = 0;

    answers.forEach(ans => {
      if (ans.error || !ans.text) return;
      validAnswerCount++;

      let points = 0;
      if (ans.mentioned) {
        if (ans.rank === 1) points = this.config.points.rank1;
        else if (ans.rank === 2 || ans.rank === 3) points = this.config.points.rank2to3;
        else if (ans.rank && ans.rank > 3) points = this.config.points.rankLower;
        else points = this.config.points.unrankedMention;

        if (ans.sentiment === "negative") {
          points *= this.config.points.negativeSentimentMultiplier;
        }
      } else {
        points = this.config.points.notMentioned;
      }

      totalPoints += points;
    });

    if (validAnswerCount === 0) {
      return {
        score: 0,
        answeredCount: 0,
        band: "none",
        bandLabel: "No Data",
        bandColor: "#5B6472",
        verdict: this.config.verdicts.none
      };
    }

    const rawScore = (totalPoints / validAnswerCount) * 100;
    const finalScore = Math.round(rawScore);

    let band = "red";
    let bandLabel = this.config.bands.red.label;
    let bandColor = this.config.bands.red.color;
    let verdict = this.config.verdicts.red;

    if (finalScore >= 70) {
      band = "green";
      bandLabel = this.config.bands.green.label;
      bandColor = this.config.bands.green.color;
      verdict = this.config.verdicts.green;
    } else if (finalScore >= 40) {
      band = "amber";
      bandLabel = this.config.bands.amber.label;
      bandColor = this.config.bands.amber.color;
      verdict = this.config.verdicts.amber;
    }

    return {
      score: finalScore,
      answeredCount: validAnswerCount,
      band,
      bandLabel,
      bandColor,
      verdict
    };
  },

  /**
   * Aggregates competitor recommendations
   */
  aggregateCompetitors(answers, targetBusinessName) {
    const counts = {};
    const normTarget = this.normaliseName(targetBusinessName);

    // Initialise target count
    counts[targetBusinessName] = 0;

    answers.forEach(ans => {
      if (ans.mentioned) {
        counts[targetBusinessName] = (counts[targetBusinessName] || 0) + 1;
      }

      if (ans.businesses_named && Array.isArray(ans.businesses_named)) {
        ans.businesses_named.forEach(biz => {
          const normBiz = this.normaliseName(biz);
          if (normBiz === normTarget || normBiz.length < 3) return;

          counts[biz] = (counts[biz] || 0) + 1;
        });
      }
    });

    // Sort descending
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        isTarget: this.normaliseName(name) === normTarget
      }))
      .sort((a, b) => {
        // Target business always included
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

    // Top 6
    const topCompetitors = sorted.slice(0, 6);

    // Ensure target is in list if not already
    const hasTarget = topCompetitors.some(c => c.isTarget);
    if (!hasTarget) {
      topCompetitors.pop();
      topCompetitors.push({
        name: targetBusinessName,
        count: counts[targetBusinessName] || 0,
        isTarget: true
      });
      topCompetitors.sort((a, b) => b.count - a.count);
    }

    return topCompetitors;
  },

  /**
   * Aggregates authoritative sources quoted across answers
   */
  aggregateSources(answers) {
    const counts = {};
    answers.forEach(ans => {
      if (ans.sources && Array.isArray(ans.sources)) {
        ans.sources.forEach(src => {
          try {
            const url = new URL(src.url || src);
            const host = url.hostname.replace(/^www\./, "");
            counts[host] = (counts[host] || 0) + 1;
          } catch (e) {
            if (typeof src === "string") {
              counts[src] = (counts[src] || 0) + 1;
            }
          }
        });
      }
    });

    return Object.entries(counts)
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }
};
