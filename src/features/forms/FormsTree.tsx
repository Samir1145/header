import React, { useState } from 'react';

// Unicode icons (can be replaced with SVGs)
const icons = {
  folderClosed: '📁',
  folderOpen: '📂',
  form: '📄',
};

// Type definitions
export interface FormNode {
  id: string;
  type: 'form';
  title: string;
  schema: Record<string, any>;
  uiSchema?: Record<string, any>;
}

export interface FolderNode {
  type: 'folder';
  title: string;
  children: TreeNode[];
}

export type TreeNode = FormNode | FolderNode;

interface TreeNodeProps {
  node: TreeNode;
  onSelectForm: (form: FormNode) => void;
  selectedFormId: string | null;
  level?: number;
}

function TreeNodeComponent({
  node,
  onSelectForm,
  selectedFormId,
  level = 0,
}: TreeNodeProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  const paddingLeft = `pl-${level * 4 + 2}`;

  if (node.type === 'folder') {
    return (
      <li>
        <div
          className={`flex items-center cursor-pointer font-semibold text-blue-700 select-none py-1 ${paddingLeft} hover:bg-blue-50 rounded transition`}
          onClick={() => setExpanded((e) => !e)}
        >
          <span className="mr-2">
            {expanded ? icons.folderOpen : icons.folderClosed}
          </span>
          {node.title}
          <span className="ml-2 text-xs text-gray-400">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
        {expanded && (
          <ul className="ml-4 border-l border-gray-200">
            {node.children.map((child, idx) => (
              <TreeNodeComponent
                key={'id' in child ? child.id : child.title + idx}
                node={child}
                onSelectForm={onSelectForm}
                selectedFormId={selectedFormId}
                level={level + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const formPaddingLeft = `pl-${level * 4 + 8}`;

  return (
    <li>
      <div
        className={`flex items-center cursor-pointer py-1 ${formPaddingLeft} rounded transition ${
          node.id === selectedFormId
            ? 'bg-blue-600 text-white font-bold'
            : 'text-gray-800 hover:bg-blue-100'
        }`}
        onClick={() => onSelectForm(node)}
      >
        <span className="mr-2">{icons.form}</span>
        {node.title}
      </div>
    </li>
  );
}

interface FormsTreeProps {
  tree: TreeNode[];
  onSelectForm: (form: FormNode) => void;
  selectedFormId: string | null;
}

export default function FormsTree({
  tree,
  onSelectForm,
  selectedFormId,
}: FormsTreeProps): React.ReactElement {
  return (
    <nav className="w-full max-w-xs bg-white rounded-lg shadow p-2">
      <ul className="space-y-1">
        {tree.map((node, idx) => (
          <TreeNodeComponent
            key={'id' in node ? node.id : node.title + idx}
            node={node}
            onSelectForm={onSelectForm}
            selectedFormId={selectedFormId}
          />
        ))}
      </ul>
    </nav>
  );
}
