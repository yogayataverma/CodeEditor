import React, { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import rehypePrism from 'rehype-prism-plus';
import rehypeRewrite from 'rehype-rewrite';
import './styles.css';

function App() {
  const [code, setCode] = useState(
    `import React from "react";
import ReactDOM from "react-dom";

function App() {
  return (
    <h1>Hello World</h1>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));`
  );

  return (
    <div className="app-container" style={{ marginTop: '10em' }}>
      <h2 style={{ textAlign: 'center' }}>Simple Code Editor</h2>
      <div className="code-editor-container" style={{ width: '40em', marginLeft: 'auto', marginRight: 'auto' }}>
        <CodeEditor
          value={code}
          language="jsx"
          placeholder="Please enter JS code."
          onChange={(evn) => setCode(evn.target.value)}
          padding={15}
          rehypePlugins={[
            [rehypePrism, { ignoreMissing: true }],
            [
              rehypeRewrite,
              {
                rewrite: (node, index, parent) => {
                  if (node.properties?.className?.includes('code-line')) {
                    if (index === 0 && node.properties?.className) {
                      node.properties.className.push('demo01');
                    }
                  }
                  if (node.type === 'text' && node.value === 'return' && parent.children.length === 1) {
                    parent.properties.className.push('demo123');
                  }
                },
              },
            ],
          ]}
          style={{
            fontSize: 16,
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace',
          }}
        />
      </div>
    </div>
  );
}

export default App;
