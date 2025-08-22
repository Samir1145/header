import React, { useState } from 'react';
import FormsTree from './forms/FormsTree';
import MyForm from './forms/MyForm';
import PreviewPage from './forms/PreviewPage';
import { formsTree } from './forms/formsData';

// Define form schema types
interface FormNode {
  id: string;
  type: 'form';
  title: string;
  schema: Record<string, any>;     // Adjust based on your actual JSON Schema
  uiSchema?: Record<string, any>;
}

interface FolderNode {
  type: 'folder';
  title: string;
  children: TreeNode[];
}

type TreeNode = FormNode | FolderNode;

function findFormById(tree: TreeNode[], id: string): FormNode | null {
  for (const node of tree) {
    if (node.type === 'form' && node.id === id) return node;
    if (node.type === 'folder') {
      const found = findFormById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function FormBuilderPage1(): JSX.Element {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const selectedForm = selectedFormId ? findFormById(formsTree as TreeNode[], selectedFormId) : null;
// console.log('selectedFormId',selectedFormId)
// console.log('selectedForm',selectedForm)
// console.log('formData',formData)
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left: Tree */}
      <div style={{
        flex: '0 0 260px',
        // background: '#fff',
        borderRight: '1px solid #eee',
        padding: '28px 14px',
        overflowY: 'auto'
      }}>
        <h3>Forms</h3>
        <FormsTree
          tree={formsTree as TreeNode[]}
          onSelectForm={(form: FormNode) => {
            setSelectedFormId(form.id);
            setFormData({});
          }}
          selectedFormId={selectedFormId}
        />
      </div>

      {/* Middle: Form */}
      <div style={{
        flex: '1 1 0',
        padding: '40px 32px',
        // background: '#fafafa',
        borderRight: '1px solid #eee',
        minWidth: 0
      }}>
        {selectedForm ? (
          <>
            <h2 style={{ color: '#1976d2' }}>{selectedForm.title}</h2>
            <MyForm
              schema={selectedForm.schema}
              uiSchema={selectedForm.uiSchema}
              formData={formData}
              setFormData={setFormData}
            />
          </>
        ) : (
          <div style={{  }}>Select a form from the list.</div>
        )}
      </div>

      {/* Right: Preview */}
      <div style={{
        flex: '1 1 0',
        padding: '40px 32px',
        // background: '#fff',
        minWidth: 0
      }}>
        {selectedForm ? (
          <PreviewPage
            formId={selectedForm.id}
            formData={formData}
          />
        ) : (
          <div style={{ }}>Form preview will appear here.</div>
        )}
      </div>
    </div>
  );
}
