import React, { useState } from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import theme from 'prism-react-renderer/themes/dracula';

const CodeEditor = () => {
  const [code, setCode] = useState('// Type your code here');

  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  return (
    <Highlight {...defaultProps} theme={theme} code={code} language="javascript">
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

export default CodeEditor;