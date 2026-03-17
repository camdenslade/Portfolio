import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Files - cslade',
  robots: { index: false, follow: false },
  icons: { icon: 'data:,' },
};

type FileEntry = {
  name: string;
  size: number;
  modified: Date;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return '🖼';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return '🎵';
  if (['pdf'].includes(ext)) return '📄';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return '📦';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📋';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'c', 'cpp', 'java'].includes(ext)) return '💻';
  return '📁';
}

export default function FilesPage() {
  const filesDir = path.join(process.cwd(), 'public', 'shared-files');

  let files: FileEntry[] = [];
  try {
    files = fs
      .readdirSync(filesDir)
      .filter((f) => !f.startsWith('.'))
      .map((name) => {
        const stat = fs.statSync(path.join(filesDir, name));
        return { name, size: stat.size, modified: stat.mtime };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
  } catch {
    files = [];
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'IBM Plex Mono', 'Fira Code', 'Courier New', monospace;
          background: #0e1117;
          color: #c9d1d9;
          min-height: 100vh;
          padding: 40px 24px;
        }
        .container { max-width: 860px; margin: 0 auto; }
        .header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 32px;
          border-bottom: 1px solid #21262d;
          padding-bottom: 16px;
        }
        .header h1 {
          font-size: 18px;
          font-weight: 600;
          color: #e6edf3;
          letter-spacing: -0.01em;
        }
        .header .path {
          font-size: 12px;
          color: #484f58;
        }
        .badge {
          margin-left: auto;
          font-size: 11px;
          color: #3fb950;
          border: 1px solid #3fb95033;
          background: #3fb95011;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .empty {
          text-align: center;
          padding: 80px 0;
          color: #484f58;
          font-size: 13px;
          line-height: 2;
        }
        .empty .hint {
          font-size: 11px;
          color: #30363d;
          margin-top: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        thead th {
          text-align: left;
          padding: 6px 12px;
          color: #484f58;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-bottom: 1px solid #21262d;
        }
        tbody tr {
          border-bottom: 1px solid #161b22;
          transition: background 0.1s;
        }
        tbody tr:hover { background: #161b22; }
        tbody td { padding: 10px 12px; vertical-align: middle; }
        .file-icon { width: 28px; font-size: 15px; line-height: 1; }
        .file-name a {
          color: #58a6ff;
          text-decoration: none;
          font-weight: 500;
        }
        .file-name a:hover { text-decoration: underline; }
        .file-size { color: #8b949e; text-align: right; white-space: nowrap; }
        .file-date { color: #8b949e; text-align: right; white-space: nowrap; font-size: 11px; }
        .dl-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-family: inherit;
          color: #c9d1d9;
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 4px;
          padding: 4px 10px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.1s, border-color 0.1s;
        }
        .dl-btn:hover { background: #30363d; border-color: #8b949e; }
        .footer {
          margin-top: 32px;
          font-size: 11px;
          color: #30363d;
          text-align: center;
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>📂 shared-files</h1>
          <span className="path">public/shared-files/</span>
          <span className="badge">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>

        {files.length === 0 ? (
          <div className="empty">
            <div>No files yet.</div>
            <div className="hint">Drop files into <code>public/shared-files/</code> in the workspace.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Size</th>
                <th style={{ textAlign: 'right' }}>Modified</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.name}>
                  <td className="file-icon">{getIcon(file.name)}</td>
                  <td className="file-name">
                    <a href={`/shared-files/${encodeURIComponent(file.name)}`} target="_blank" rel="noreferrer">
                      {file.name}
                    </a>
                  </td>
                  <td className="file-size">{formatSize(file.size)}</td>
                  <td className="file-date">{formatDate(file.modified)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <a
                      href={`/shared-files/${encodeURIComponent(file.name)}`}
                      download={file.name}
                      className="dl-btn"
                    >
                      ↓ Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="footer">cslade.space/files · drop files into public/shared-files/ to share</div>
      </div>
    </>
  );
}
