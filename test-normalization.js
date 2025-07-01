import { normalizeAndMatch } from './normalization/index.js';

const testQueries = [
  "pl",
  "ply",
  "plywood",
  "fevicol",
  "adhesiv",
  "adhesive",
  "cheap",
  "expensive",
  "mob",
  "mobile",
  "laptp",
  "laptop",
  "mahanga",
  "सस्ता",
  "eye phone",
  "wi fi"
];

console.log("🚀 Embedding-based Normalization System Test\n");

(async () => {
  for (const query of testQueries) {
    const result = await normalizeAndMatch(query);
    console.log("------------------------------");
    console.log(`Input:        ${result.input}`);
    console.log(`Normalized:   ${result.normalized}`);
    console.log(`Embedding:    [${result.embedding.slice(0, 5).map(x => x.toFixed(3)).join(", ")} ...]`);
    console.log("Best Matches:");
    result.bestMatches.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} (score: ${m.score.toFixed(3)})`);
    });
  }
})(); 