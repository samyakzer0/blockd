const https = require("https");

function parseKanoonResults(query) {
  const url = `https://indiankanoon.org/search/?formInput=${encodeURIComponent(query)}`;
  const options = {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  };

  https.get(url, options, (res) => {
    let html = "";
    res.on("data", (chunk) => (html += chunk));
    res.on("end", () => {
      const articles = html.split('<article class="result"');
      const docs = [];

      for (let i = 1; i < articles.length; i++) {
        const chunk = articles[i];

        // Extract doc ID
        const docIdMatch = chunk.match(/\/doc(?:fragment)?\/(\d+)\//);
        // Extract title
        const titleMatch = chunk.match(/<h4 class="result_title"[^>]*>([\s\S]*?)<\/h4>/i);
        // Extract headline snippet
        const headlineMatch = chunk.match(/<div class="headline"[^>]*>([\s\S]*?)<\/div>/i);

        if (docIdMatch && titleMatch) {
          const tid = parseInt(docIdMatch[1], 10);
          const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
          const headline = headlineMatch ? headlineMatch[1].replace(/<[^>]+>/g, "").trim() : "";

          if (title && !docs.some(d => d.tid === tid)) {
            docs.push({
              tid,
              title,
              headline: headline || "Judicial appeal and judgment record from Indian Kanoon.",
              docsource: title.includes("Supreme Court") ? "Supreme Court of India" : title.includes("Bombay") ? "Bombay High Court" : "High Court of Judicature",
              publishdate: "Recent"
            });
          }
        }
      }

      console.log(`\n🎉 Discovered ${docs.length} real live Indian Kanoon results for query '${query}':`);
      docs.slice(0, 5).forEach((d, idx) => {
        console.log(`\n[${idx + 1}] Title    : ${d.title}`);
        console.log(`    Doc ID   : #${d.tid}`);
        console.log(`    Court    : ${d.docsource}`);
        console.log(`    Headline : ${d.headline.slice(0, 120)}...`);
      });
    });
  });
}

parseKanoonResults("Dilip Sitaram Palande vs The State Of Maharashtra");
