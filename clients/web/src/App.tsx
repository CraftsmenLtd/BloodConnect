import './App.css';
import RouterConfig from './presentation/router/router';

const App = () => {
  document.documentElement.setAttribute(
    'data-theme',
    localStorage.getItem('theme') == 'dark' ? 'dark' : 'light'
  );
  return (
    <div>
      <RouterConfig />
    </div>
  );
};

export default App;
