import React, { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UserStore from './stores/UserStore';
import SetupStore from './stores/SetupStore';

export const Context = createContext(null);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Context.Provider value={{
      user: new UserStore(),
      setup: new SetupStore(),
    }}>
      <App />
    </Context.Provider>
  </React.StrictMode>
);

