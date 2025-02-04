# (CodeGlow)Simple Code Syntax Highlighter App

This is a simple React application that demonstrates a code syantx highlighter using PrismJS syntax highlighting.

## Getting Started

To run this application locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/yogayataverma/CodeEditor.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3000` to see the application running.

## Usage

1. The code editor allows you to enter and edit JavaScript (JSX) code.
2. Syntax highlighting is provided by PrismJS.
3. Plugins like `rehype-prism-plus` and `rehype-rewrite` are used to enhance syntax and add custom CSS classes to specific code elements.

## Features

- Supports JSX syntax highlighting.
- Customizable code editor with adjustable padding and styling.
- Demonstrates usage of rehype plugins for advanced syntax manipulation.

## Example Code

```jsx
import React from "react";
import ReactDOM from "react-dom";

function App() {
  return (
    <h1>Hello World</h1>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```
