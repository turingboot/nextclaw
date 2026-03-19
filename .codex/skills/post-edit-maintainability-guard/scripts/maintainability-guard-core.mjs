import {
  chooseBudget,
  collectDisableCommentFindings,
  countLinesInText,
  getHeadContent,
  isCodePath,
  normalizePath,
  parseChangedPatch,
  rangeIntersectsChanged,
  readFileText,
  suggestSeam
} from "./maintainability-guard-support.mjs";
import { buildSignature, lintContent } from "./maintainability-guard-lint.mjs";

function toPayload(item) {
  return {
    level: item.level,
    source: item.source,
    path: item.path,
    category: item.category,
    budget: item.budget,
    current_lines: item.current_lines,
    previous_lines: item.previous_lines,
    delta_lines: item.delta_lines,
    message: item.message,
    suggested_seam: item.suggested_seam,
    rule_id: item.rule_id ?? null,
    symbol_name: item.symbol_name ?? null,
    line: item.line ?? null,
    end_line: item.end_line ?? null,
    metric_value: item.metric_value ?? null,
    previous_metric_value: item.previous_metric_value ?? null
  };
}

function createFileBudgetFinding(level, pathText, category, budget, currentLines, previousLines, deltaLines, message, suggestedSeam) {
  return {
    level,
    source: "file-budget",
    path: pathText,
    category,
    budget,
    current_lines: currentLines,
    previous_lines: previousLines,
    delta_lines: deltaLines,
    message,
    suggested_seam: suggestedSeam
  };
}

export function inspectPaths(paths) {
  const inspectedPaths = [];
  const findings = [];

  for (const rawPath of paths) {
    const pathText = normalizePath(rawPath);
    if (!pathText || !isCodePath(pathText)) {
      continue;
    }

    let currentContent;
    try {
      currentContent = readFileText(pathText);
    } catch {
      continue;
    }

    const currentLines = countLinesInText(currentContent);
    const previousContent = getHeadContent(pathText);
    const previousLines = previousContent == null ? null : countLinesInText(previousContent);
    const deltaLines = previousLines == null ? null : currentLines - previousLines;
    const budget = chooseBudget(pathText);
    const seam = suggestSeam(pathText);
    const { changedLines, addedLines, isNewFile } = parseChangedPatch(pathText);

    inspectedPaths.push(pathText);

    if (previousLines == null && currentLines > budget.maxLines) {
      findings.push(createFileBudgetFinding("error", pathText, budget.category, budget.maxLines, currentLines, previousLines, deltaLines, "new file exceeds maintainability budget", seam));
    } else if (previousLines != null && previousLines <= budget.maxLines && currentLines > budget.maxLines) {
      findings.push(createFileBudgetFinding("error", pathText, budget.category, budget.maxLines, currentLines, previousLines, deltaLines, "file crossed from within budget to over budget", seam));
    } else if (previousLines != null && previousLines > budget.maxLines && currentLines > previousLines) {
      findings.push(createFileBudgetFinding("error", pathText, budget.category, budget.maxLines, currentLines, previousLines, deltaLines, "already oversized file kept growing", seam));
    } else if (currentLines > budget.maxLines) {
      findings.push(createFileBudgetFinding("warn", pathText, budget.category, budget.maxLines, currentLines, previousLines, deltaLines, "file remains over its maintainability budget", seam));
    } else if (currentLines >= Math.floor(budget.maxLines * 0.8)) {
      findings.push(createFileBudgetFinding("warn", pathText, budget.category, budget.maxLines, currentLines, previousLines, deltaLines, "file is near its maintainability budget", seam));
    } else if (deltaLines != null && deltaLines >= 120) {
      findings.push(createFileBudgetFinding("warn", pathText, budget.category, budget.maxLines, currentLines, previousLines, deltaLines, "file grew materially in this change", seam));
    }

    findings.push(
      ...collectDisableCommentFindings({
        pathText,
        category: budget.category,
        currentLines,
        previousLines,
        deltaLines,
        addedLines
      })
    );

    const currentLintFindings = lintContent(pathText, currentContent);
    const previousLintFindings = previousContent == null ? [] : lintContent(pathText, previousContent);
    const previousBySignature = new Map(
      previousLintFindings
        .map((finding) => [buildSignature(finding), finding])
        .filter(([signature]) => signature)
    );

    for (const lintFinding of currentLintFindings) {
      const signature = buildSignature(lintFinding);
      const previousLint = signature ? previousBySignature.get(signature) : null;
      const changedOverlap = isNewFile || rangeIntersectsChanged(lintFinding.line, lintFinding.endLine, changedLines);

      let level = null;
      let message = lintFinding.message;
      const previousMetricValue = previousLint?.metricValue ?? null;

      if (previousContent == null) {
        level = "error";
        message = "new file introduced a function-level maintainability violation";
      } else if (previousLint) {
        if (
          lintFinding.metricValue != null &&
          previousLint.metricValue != null &&
          lintFinding.metricValue > previousLint.metricValue
        ) {
          level = "error";
          message = "existing function-level maintainability violation got worse";
        } else if (changedOverlap) {
          level = "warn";
          message = "touched function still exceeds maintainability rule";
        }
      } else if (changedOverlap) {
        level = "error";
        message = "changed function introduced a new maintainability violation";
      }

      if (!level) {
        continue;
      }

      findings.push({
        level,
        source: "eslint-function-budget",
        path: pathText,
        category: budget.category,
        budget: budget.maxLines,
        current_lines: currentLines,
        previous_lines: previousLines,
        delta_lines: deltaLines,
        message,
        suggested_seam: suggestSeam(pathText, lintFinding.ruleId),
        rule_id: lintFinding.ruleId,
        symbol_name: lintFinding.symbolName,
        line: lintFinding.line,
        end_line: lintFinding.endLine,
        metric_value: lintFinding.metricValue,
        previous_metric_value: previousMetricValue
      });
    }
  }

  findings.sort((left, right) => {
    if ((left.level === "error") !== (right.level === "error")) {
      return left.level === "error" ? -1 : 1;
    }
    if (left.path !== right.path) {
      return left.path.localeCompare(right.path);
    }
    if ((left.line ?? 0) !== (right.line ?? 0)) {
      return (left.line ?? 0) - (right.line ?? 0);
    }
    if ((left.rule_id ?? "") !== (right.rule_id ?? "")) {
      return (left.rule_id ?? "").localeCompare(right.rule_id ?? "");
    }
    return left.message.localeCompare(right.message);
  });

  return {
    applicable: inspectedPaths.length > 0,
    inspected_paths: inspectedPaths,
    summary: {
      errors: findings.filter((item) => item.level === "error").length,
      warnings: findings.filter((item) => item.level === "warn").length
    },
    findings: findings.map(toPayload),
    file_findings: findings.filter((item) => item.source === "file-budget").map(toPayload),
    function_findings: findings.filter((item) => item.source !== "file-budget").map(toPayload)
  };
}

export function printHuman(report) {
  if (!report.applicable) {
    console.log("Maintainability check not applicable: no changed code-like files found.");
    return;
  }

  console.log("Maintainability check report");
  console.log(`Inspected files: ${report.inspected_paths.length}`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);

  if (report.findings.length === 0) {
    console.log("No maintainability findings.");
    return;
  }

  for (const item of report.findings) {
    const deltaText = item.delta_lines == null ? "n/a" : `${item.delta_lines >= 0 ? "+" : ""}${item.delta_lines}`;
    const previousText = item.previous_lines == null ? "new" : String(item.previous_lines);
    const budgetText = item.budget == null ? "" : `, budget=${item.budget}`;
    const ruleText = item.rule_id ? `, rule=${item.rule_id}` : "";
    const symbolText = item.symbol_name ? `, symbol=${item.symbol_name}` : "";
    let locationText = "";
    if (item.line != null) {
      locationText = item.end_line != null && item.end_line !== item.line ? `, lines=${item.line}-${item.end_line}` : `, line=${item.line}`;
    }
    let metricText = "";
    if (item.metric_value != null) {
      const previousMetricText = item.previous_metric_value == null ? "n/a" : String(item.previous_metric_value);
      metricText = `, metric=${item.metric_value}, previous_metric=${previousMetricText}`;
    }
    console.log(
      `- [${item.level}] ${item.path} (source=${item.source}, current=${item.current_lines}, previous=${previousText}, delta=${deltaText}${budgetText}${ruleText}${symbolText}${locationText}${metricText})`
    );
    console.log(`  ${item.message}`);
    console.log(`  seam: ${item.suggested_seam}`);
  }
}
