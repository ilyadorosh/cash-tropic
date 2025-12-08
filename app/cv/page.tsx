import fs from "fs";
import path from "path";
import InteractiveCV from "./InteractiveCV";
import styles from "./cv.module.scss";

// Parse LaTeX to extract readable content
function parseLatexToReadable(latex: string): string {
  let text = latex;

  // Remove preamble and document wrapper
  text = text.replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '');
  text = text.replace(/\\end\{document\}/g, '');

  // Extract name
  text = text.replace(/\\name\{([^}]+)\}/g, '# $1\n\n');

  // Convert sections
  text = text.replace(/\\cvsection(?:\[[^\]]*\])?\{([^}]+)\}/g, '\n## $1\n\n');

  // Convert events with formatting
  text = text.replace(/\\cvevent\{([^}]+)\}\{([^}]*)\}\{([^}]+)\}\{([^}]+)\}/g, 
    (_, title, org, date, loc) => `### ${title}${org ? ' - ' + org : ''}\n**${date}** | ${loc}\n\n`);

  // Convert itemize to markdown lists
  text = text.replace(/\\begin\{itemize\}/g, '');
  text = text.replace(/\\end\{itemize\}/g, '');
  text = text.replace(/\\item\s*/g, '- ');

  // Convert divider
  text = text.replace(/\\divider/g, '\n---\n');

  // Convert text formatting
  text = text.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
  text = text.replace(/\\emph\{([^}]+)\}/g, '*$1*');
  text = text.replace(/\\printlink\{([^}]+)\}\{([^}]+)\}/g, '[$1]($2)');
  text = text.replace(/\\cvskill\{([^}]+)\}\{([^}]+)\}/g, '- **$1**: $2');
  text = text.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g, '> $1');
  text = text.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, '\n$$\n$1\n$$\n');
  text = text.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
  text = text.replace(/\\emph\{([^}]+)\}/g, '*$1*');
  text = text.replace(/\\tagline\{([^}]+)\}/g, '*$1*\n\n');

  // Clean up LaTeX commands we don't need
  text = text.replace(/\\photo\{[^}]+\}\{[^}]+\}/g, '');
  text = text.replace(/\\[a-zA-Z]+\{[^}]*\}/g, (match) => {
    // Keep content of unknown commands
    return match.replace(/\\[a-zA-Z]+\{([^}]*)\}/, '$1');
  });

  // Clean up comments
  text = text.replace(/%.*$/gm, '');

  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/^\s+/gm, '');

  return text.trim();
}

export default async function Page() {
  const cvPath = path.join(process.cwd(), "docs", "CV.md");
  let latex = "";
  let readable = "";
  
  try {
    latex = fs.readFileSync(cvPath, "utf8");
    readable = parseLatexToReadable(latex);
  } catch (e) {
    latex = "% CV file not found";
    readable = "# CV\n\nNo CV found at docs/CV.md";
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Interactive CV</h1>
          <p className={styles.subtitle}>
            A living document of my journey through AI, systems engineering, and the pursuit of peace.
          </p>
        </header>
        <InteractiveCV markdown={readable} latex={latex} />
      </div>
    </div>
  );
}
