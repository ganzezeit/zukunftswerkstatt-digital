import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import BoardPage from './components/BoardPage';
import './styles/global.css';
import './styles/animations.css';

// Simple path-based routing: /board/:code → BoardPage, everything else → App
function Root() {
  const path = window.location.pathname;
  const boardMatch = path.match(/^\/board\/([A-Za-z0-9]+)/);
  if (boardMatch) {
    return <BoardPage code={boardMatch[1].toUpperCase()} />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
