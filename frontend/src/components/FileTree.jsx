import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from 'lucide-react';

function buildTree(files) {
  const root = {};
  files.forEach((f) => {
    const name = typeof f === 'string' ? f : f.path || f.name;
    const parts = name.split('/');
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = { _isFile: true, _name: name, _size: f.size };
      } else {
        if (!node[part] || node[part]._isFile) {
          node[part] = {};
        }
        node = node[part];
      }
    });
  });
  return root;
}

function TreeNode({ name, node, depth = 0, selectedFile, onSelect }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isFile = node._isFile;

  if (isFile) {
    const isSelected = selectedFile === node._name;
    return (
      <div
        onClick={() => onSelect(node._name)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          paddingLeft: `${depth * 14 + 8}px`,
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '0.74rem',
          fontFamily: 'var(--font-mono)',
          background: isSelected ? 'var(--bg-surface-secondary)' : 'transparent',
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: isSelected ? 600 : 400,
        }}
      >
        <FileCode size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {node._size && <span style={{ fontSize: '0.64rem', color: 'var(--text-faint)', marginLeft: 'auto', flexShrink: 0 }}>{Math.round(node._size / 100) / 10}KB</span>}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          paddingLeft: `${depth * 14 + 8}px`,
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '0.74rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
          fontWeight: 600,
        }}
      >
        {isOpen ? <ChevronDown size={11} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />}
        {isOpen ? <FolderOpen size={12} style={{ color: 'var(--state-running)' }} /> : <Folder size={12} style={{ color: 'var(--text-muted)' }} />}
        <span>{name}/</span>
      </div>
      {isOpen && (
        <div>
          {Object.entries(node)
            .filter(([key]) => !key.startsWith('_'))
            .sort(([a, aNode], [b, bNode]) => {
              if (aNode._isFile && !bNode._isFile) return 1;
              if (!aNode._isFile && bNode._isFile) return -1;
              return a.localeCompare(b);
            })
            .map(([childName, childNode]) => (
              <TreeNode key={childName} name={childName} node={childNode} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ files = [], selectedFile = null, onSelectFile = null }) {
  if (!files || files.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        No files generated yet
      </div>
    );
  }

  const tree = buildTree(files);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {Object.entries(tree)
        .filter(([key]) => !key.startsWith('_'))
        .sort(([a, aNode], [b, bNode]) => {
          if (aNode._isFile && !bNode._isFile) return 1;
          if (!aNode._isFile && bNode._isFile) return -1;
          return a.localeCompare(b);
        })
        .map(([name, node]) => (
          <TreeNode key={name} name={name} node={node} depth={0} selectedFile={selectedFile} onSelect={onSelectFile} />
        ))}
    </div>
  );
}
