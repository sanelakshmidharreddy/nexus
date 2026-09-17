import React from 'react';
import CommandCenter from './pages/CommandCenter';
import { NavigationProvider } from './context/NavigationContext';

export default function App() {
  return (
    <NavigationProvider>
      <CommandCenter />
    </NavigationProvider>
  );
}
