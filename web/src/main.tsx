import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { store } from './store';
import App from './App';
import './index.scss';
import { ItemNotificationsProvider } from './components/utils/ItemNotifications';
import { isEnvBrowser } from './utils/misc';

const root = document.getElementById('root');

if (isEnvBrowser()) {
  root!.style.backgroundImage = 'url("https://files.catbox.moe/00bsru.png")';
  root!.style.backgroundSize = 'cover';
  root!.style.backgroundRepeat = 'no-repeat';
  root!.style.backgroundPosition = 'center';
}

createRoot(root!).render(
  <React.StrictMode>
    <Provider store={store}>
      <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
        <ItemNotificationsProvider>
          <App />
        </ItemNotificationsProvider>
      </DndProvider>
    </Provider>
  </React.StrictMode>
);
