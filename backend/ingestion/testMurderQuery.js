const https = require("https");

function parseKanoon(html) {
  const articles = html.split('<article class="result"');
  const docs = [];

  for (let i = 1; i < articles.length; i++) {
    const chunk = articles[i];
    const docIdMatch = chunk.match(/\/doc(?:fragment)?\/(\d+)\//);
    const titleMatch = chunk.match(/<h4 class="result_title"[^>]*>([\s\S]*?)<\/h4>/i);
    const headlineMatch = chunk.match(/<div class="headline"[^>]*>([\s\S]*?)<\/div>/i);

    if (docIdMatch && titleMatch) {
      const tid = parseInt(docIdMatch[1], 10);
      let title = titleMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      title = title.replace(/\[Entire Act\]/gi, "").trim();

      let headline = headlineMatch ? headlineMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

      if (title.startsWith("Section ") && !headline) {
        headline = `Statutory penal provisions under the Indian Penal Code / Criminal Law for ${title}.`;
      }

      if (title && !docs.some(d => d.tid === tid)) {
        docs.push({
          tid,
          title,
          headline: headline || "Judicial record and statutory precedent from Indian Kanoon archive.",
          docsource: title.startsWith("Section")
            ? "Indian Penal Code / Statute"
            : title.includes("Supreme Court")
            ? "Supreme Court of India"
            : title.includes("Bombay")
            ? "Bombay High Court"
            : "High Court of Judicature",
          publishdate: "Judicial Record"
        });
      }
    }
  }

  return docs;
}

const url = `https://indiankanoon.org/search/?formInput=${encodeURIComponent("murder")}`;
https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36" } }, res => {
  let d = "";
  res.on("data", c => d += c);
  res.on("end", () => {
    const docs = parseKanoon(d);
    console.log("Parsed " + docs.length + " real docs for query 'murder':");
    docs.slice(0, 5).forEach((doc, idx) => {
      console.log(`\n[${idx + 1}] Title    : ${doc.title}`);
      console.log(`    Doc ID   : #${doc.tid}`);
      console.log(`    Source   : ${doc.docsource}`);
      console.log(`    Headline : ${doc.headline}`);
    });
  });
});
