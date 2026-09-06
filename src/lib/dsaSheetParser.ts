import Papa from "papaparse";

export interface ParsedProblemRow {
  dayNumber: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  chapter: string;
  topic: string;
  companies: string;
  externalLink: string;
  articleLink: string;
  videoLink: string;
}

/**
 * Creates a clean LeetCode URL slug from problem title
 */
export function slugifyProblem(title: string): string {
  return title
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates default external links if blank or placeholders
 */
export function getStandardLinks(title: string, external?: string | null, article?: string | null, video?: string | null) {
  const isUrl = (s?: string | null) => s && (s.startsWith("http://") || s.startsWith("https://"));

  let resolvedExternal = "";
  if (isUrl(external)) {
    resolvedExternal = external!.trim();
  } else {
    const slug = slugifyProblem(title);
    resolvedExternal = `https://leetcode.com/problems/${slug}/`;
  }

  let resolvedArticle = "";
  if (isUrl(article)) {
    resolvedArticle = article!.trim();
  } else {
    resolvedArticle = `https://takeuforward.org/?s=${encodeURIComponent(title)}`;
  }

  let resolvedVideo = "";
  if (isUrl(video)) {
    resolvedVideo = video!.trim();
  } else {
    resolvedVideo = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " leetcode solution")}`;
  }

  return {
    externalLink: resolvedExternal,
    articleLink: resolvedArticle,
    videoLink: resolvedVideo,
  };
}

/**
 * Normalizes difficulty to "Easy", "Medium", "Hard"
 */
export function normalizeDifficulty(diff?: string | null): "Easy" | "Medium" | "Hard" {
  if (!diff) return "Medium";
  const lower = diff.toLowerCase().trim();
  if (lower.startsWith("e")) return "Easy";
  if (lower.startsWith("h")) return "Hard";
  return "Medium";
}

/**
 * Parses raw CSV content (either format) into strongly-typed problem rows
 */
export function parseDsaSheetCsv(csvContent: string): {
  problems: ParsedProblemRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const results = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: "greedy",
  });

  const rawRows = results.data as string[][];
  if (!rawRows || rawRows.length === 0) {
    return { problems: [], errors: ["CSV file is empty."] };
  }

  // Find header row index
  let headerRowIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(15, rawRows.length); i++) {
    const row = rawRows[i].map((c) => (c || "").trim().toLowerCase());
    if (
      (row.includes("day") || row.includes("sequence")) &&
      (row.includes("problem name") || row.includes("title") || row.includes("problem"))
    ) {
      headerRowIdx = i;
      headers = row;
      break;
    }
  }

  if (headerRowIdx === -1) {
    return {
      problems: [],
      errors: ["Could not find valid column headers (expected 'Day'/'Sequence' and 'Problem Name')."],
    };
  }

  // Map header indexes
  const colIndex = {
    day: headers.findIndex((h) => h === "day" || h === "sequence" || h === "no" || h === "#"),
    title: headers.findIndex((h) => h === "problem name" || h === "problem" || h === "title"),
    difficulty: headers.findIndex((h) => h === "difficulty"),
    chapter: headers.findIndex((h) => h === "chapter"),
    topic: headers.findIndex((h) => h === "topic" || h === "pattern"),
    companies: headers.findIndex((h) => h === "companies" || h === "top companies"),
    externalLink: headers.findIndex((h) => h === "external link" || h === "link" || h === "leetcode link"),
    articleLink: headers.findIndex((h) => h === "article link" || h === "article"),
    videoLink: headers.findIndex((h) => h === "video link" || h === "video solution" || h === "video"),
  };

  let currentChapter = "Foundations";
  let currentTopic = "General";
  let autoDay = 1;
  const problems: ParsedProblemRow[] = [];

  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Check if this row is a section header (e.g. "FOUNDATIONS,,,,," or "Arrays,,,,,")
    const filledCells = row.map((c) => (c || "").trim()).filter(Boolean);
    if (filledCells.length === 0) continue;

    if (filledCells.length === 1) {
      // It's a category/chapter header or topic header
      const headerText = filledCells[0];
      if (
        headerText.toUpperCase() === headerText &&
        !headerText.includes("151") &&
        !headerText.includes("SHEET")
      ) {
        currentChapter = headerText;
      } else {
        currentTopic = headerText;
      }
      continue;
    }

    const rawDay = colIndex.day !== -1 ? row[colIndex.day]?.trim() : "";
    const rawTitle = colIndex.title !== -1 ? row[colIndex.title]?.trim() : "";

    // If no title, skip
    if (!rawTitle) continue;

    // If day is not a number, maybe it's another header row
    const parsedDay = parseInt(rawDay, 10);
    const dayNumber = !isNaN(parsedDay) && parsedDay > 0 ? parsedDay : autoDay;
    autoDay = dayNumber + 1;

    const rawDiff = colIndex.difficulty !== -1 ? row[colIndex.difficulty]?.trim() : "Medium";
    const difficulty = normalizeDifficulty(rawDiff);

    const rowChapter = colIndex.chapter !== -1 && row[colIndex.chapter]?.trim()
      ? row[colIndex.chapter].trim()
      : currentChapter;

    const rowTopic = colIndex.topic !== -1 && row[colIndex.topic]?.trim()
      ? row[colIndex.topic].trim()
      : currentTopic;

    const rowCompanies = colIndex.companies !== -1 ? (row[colIndex.companies]?.trim() || "") : "";

    const rawExt = colIndex.externalLink !== -1 ? row[colIndex.externalLink]?.trim() : "";
    const rawArt = colIndex.articleLink !== -1 ? row[colIndex.articleLink]?.trim() : "";
    const rawVid = colIndex.videoLink !== -1 ? row[colIndex.videoLink]?.trim() : "";

    const { externalLink, articleLink, videoLink } = getStandardLinks(rawTitle, rawExt, rawArt, rawVid);

    problems.push({
      dayNumber,
      title: rawTitle,
      difficulty,
      chapter: rowChapter,
      topic: rowTopic,
      companies: rowCompanies,
      externalLink,
      articleLink,
      videoLink,
    });
  }

  return { problems, errors };
}
