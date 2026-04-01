import React, { useState, useEffect } from 'react';
import { api } from '@/api/sqliteAuth';
import { useParams } from 'react-router-dom';

// Define resource types
interface ResourceNode {
  id: string;
  type: 'resource';
  title: string;
  description: string;
  category: string;
  url?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface FolderNode {
  type: 'folder';
  title: string;
  children: TreeNode[];
}

type TreeNode = ResourceNode | FolderNode;

// Resource document interface
interface ResourceRecord {
  id: string;
  name: string;
  description?: string;
  category?: string;
  resource_type?: string;
  url?: string;
  createdAt?: any;
  updatedAt?: any;
}

function findResourceById(tree: TreeNode[], id: string): ResourceNode | null {
  for (const node of tree) {
    if (node.type === 'resource' && node.id === id) return node;
    if (node.type === 'folder') {
      const found = findResourceById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function ResourcesPage(): React.ReactElement {
  const { resourceType } = useParams<{ resourceType: string }>();
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [resourcesTree, setResourcesTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);

  const selectedResource = selectedResourceId ? findResourceById(resourcesTree, selectedResourceId) : null;

  // Fetch resources from SQLite API filtered by resource_type
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!resourceType) {
          setError('Resource type not specified in URL');
          setLoading(false);
          return;
        }

        let resources: ResourceRecord[] = [];
        try {
          const response = await api.get(`/api/resources?type=${encodeURIComponent(resourceType)}`);
          resources = response.data;
        } catch (fetchError) {
          console.warn('⚠️ Resources API not available:', fetchError);
          resources = [];
        }

        // Sort resources by name
        resources.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        console.log('📋 Found resources:', resources.length, resources);

        // Convert resources to tree structure grouped by category
        const tree = convertResourcesToTree(resources);
        setResourcesTree(tree);
        
        // Auto-select the first resource if available
        if (tree.length > 0 && tree[0].type === 'folder' && tree[0].children.length > 0) {
          const firstResource = tree[0].children[0];
          if (firstResource.type === 'resource') {
            setSelectedResourceId(firstResource.id);
          }
        }
        
      } catch (err) {
        console.error('Error fetching resources:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to load resources: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [resourceType]);

  // Convert resources to tree structure grouped by category
  const convertResourcesToTree = (resources: ResourceRecord[]): TreeNode[] => {
    const categoryMap = new Map<string, ResourceNode[]>();
    
    // Group resources by category
    resources.forEach(resource => {
      const category = resource.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      
      categoryMap.get(category)!.push({
        id: resource.id,
        type: 'resource',
        title: resource.name,
        description: resource.description || '',
        category: category,
        url: resource.url,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt
      });
    });

    // Convert to tree structure
    const tree: TreeNode[] = [];
    categoryMap.forEach((resources, category) => {
      tree.push({
        type: 'folder',
        title: category,
        children: resources
      });
    });

    return tree;
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left: Resources Tree Sidebar */}
      <div style={{
        flex: '0 0 260px',
        background: '#fff',
        borderRight: '1px solid #eee',
        padding: '28px 14px',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#23235b' }}>
          Categories
        </h3>
        
        {loading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px 0',
            color: '#666'
          }}>
            <div>Loading resources...</div>
          </div>
        ) : error ? (
          <div style={{ 
            padding: '20px', 
            background: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '4px',
            color: '#c33'
          }}>
            {error}
          </div>
        ) : resourcesTree.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            color: '#666'
          }}>
            No resources found
          </div>
        ) : (
          <ResourcesTree
            tree={resourcesTree}
            onSelectResource={(resource: ResourceNode) => {
              setSelectedResourceId(resource.id);
              setIframeLoading(true);
            }}
            selectedResourceId={selectedResourceId}
          />
        )}
      </div>

      {/* Right: Main Content Area */}
      <div style={{
        flex: '1 1 0',
        padding: '0',
        background: '#fafafa',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {selectedResource ? (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Resource Header */}
            {/* <div style={{
              background: '#fff',
              padding: '20px 32px',
              borderBottom: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ color: '#1976d2', marginBottom: '8px', fontSize: '24px' }}>
                {selectedResource.title}
              </h2>
              {selectedResource.description && (
                <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
                  {selectedResource.description}
                </p>
              )}
            </div> */}
            
            {/* Iframe Content */}
            <div style={{ flex: '1', padding: '0', position: 'relative' }}>
              {selectedResource.url ? (
                <>
                  {/* Loading Spinner */}
                  {iframeLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      flexDirection: 'column'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #1976d2',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '16px'
                      }}></div>
                      <p style={{ color: '#666', fontSize: '14px' }}>Loading content...</p>
                    </div>
                  )}
                  
                  <iframe
                    src={selectedResource.url}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: '#fff',
                      opacity: iframeLoading ? 0 : 1,
                      transition: 'opacity 0.3s ease'
                    }}
                    title={selectedResource.title}
                    onLoad={() => {
                      setIframeLoading(false);
                    }}
                    onError={() => {
                      console.error('Failed to load iframe:', selectedResource.url);
                      setIframeLoading(false);
                    }}
                  />
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  background: '#fff',
                  color: '#666',
                  fontSize: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: '16px' }}>No URL available for this resource</p>
                    <p style={{ fontSize: '14px', color: '#999' }}>
                      This resource doesn't have a URL to display
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh',
            color: '#888',
            fontSize: '18px',
            background: '#fff'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '16px' }}>Select a resource from the sidebar</p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Choose a resource to view its content in the main area
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// Resources Tree Component (similar to FormsTree)
interface ResourcesTreeProps {
  tree: TreeNode[];
  onSelectResource: (resource: ResourceNode) => void;
  selectedResourceId: string | null;
}

function ResourcesTree({
  tree,
  onSelectResource,
  selectedResourceId,
}: ResourcesTreeProps): React.ReactElement {
  return (
    <nav style={{ width: '100%' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tree.map((node, idx) => (
          <TreeNodeComponent
            key={'id' in node ? node.id : node.title + idx}
            node={node}
            onSelectResource={onSelectResource}
            selectedResourceId={selectedResourceId}
          />
        ))}
      </ul>
    </nav>
  );
}

interface TreeNodeProps {
  node: TreeNode;
  onSelectResource: (resource: ResourceNode) => void;
  selectedResourceId: string | null;
  level?: number;
}

function TreeNodeComponent({
  node,
  onSelectResource,
  selectedResourceId,
  level = 0,
}: TreeNodeProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  const paddingLeft = level * 16 + 8;

  if (node.type === 'folder') {
    return (
      <li style={{ marginBottom: '4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: '600',
            color: '#1976d2',
            padding: '8px 0',
            paddingLeft: `${paddingLeft}px`,
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onClick={() => setExpanded(!expanded)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span style={{ marginRight: '8px', fontSize: '16px' }}>
            {expanded ? '📂' : '📁'}
          </span>
          {node.title}
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
            {expanded ? '▼' : '▶'}
          </span>
        </div>
        {expanded && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid #e0e0e0', marginLeft: `${paddingLeft + 8}px` }}>
            {node.children.map((child, idx) => (
              <TreeNodeComponent
                key={'id' in child ? child.id : child.title + idx}
                node={child}
                onSelectResource={onSelectResource}
                selectedResourceId={selectedResourceId}
                level={level + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const resourcePaddingLeft = paddingLeft + 16;

  return (
    <li style={{ marginBottom: '2px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '6px 0',
          paddingLeft: `${resourcePaddingLeft}px`,
          borderRadius: '4px',
          transition: 'all 0.2s',
          backgroundColor: node.id === selectedResourceId ? '#1976d2' : 'transparent',
          color: node.id === selectedResourceId ? '#fff' : '#333',
          fontWeight: node.id === selectedResourceId ? '600' : '400'
        }}
        onClick={() => onSelectResource(node)}
        onMouseEnter={(e) => {
          if (node.id !== selectedResourceId) {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }
        }}
        onMouseLeave={(e) => {
          if (node.id !== selectedResourceId) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <span style={{ marginRight: '8px', fontSize: '14px' }}>📄</span>
        {node.title}
      </div>
    </li>
  );
}
