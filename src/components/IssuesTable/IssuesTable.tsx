import type { KeyIssue } from "../../types/glossary";
import { TableRow } from "../TableRow/TableRow";
import "./IssuesTableStyles.css";

interface IssuesTableProps {
    issues: KeyIssue[];
    totalKeys: number;
    namespace: string;
}

export function IssuesTable({ issues, totalKeys, namespace }: IssuesTableProps) {
    if (issues.length === 0) {
        return (
            <div className="table-empty">
                <p>
                    No issues found for {namespace} in this language. All keys
                    use valid references.
                </p>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <div className="table-summary">
                Found <strong>{issues.length}</strong> issue
                {issues.length !== 1 ? "s" : ""} out of{" "}
                <strong>{totalKeys}</strong> total {namespace} keys
            </div>
            <table className="candidates-table">
                <thead>
                    <tr>
                        <th className="th-key">{namespace} Key Path</th>
                        <th className="th-value">Current Value</th>
                        <th className="th-issue">Issue Type</th>
                        <th className="th-suggestion">Suggested Replacement</th>
                        <th className="th-note">Note</th>
                    </tr>
                </thead>
                <tbody>
                    {issues.map((issue) => (
                        <TableRow key={issue.keyPath} candidate={issue} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
