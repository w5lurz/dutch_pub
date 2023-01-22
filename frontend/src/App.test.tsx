import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('Renders the DUTCH PUB CARD GAME text', () => {
  render(<App />);
  const linkElement = screen.getByText(/DUTCH PUB CARD GAME/i);
  expect(linkElement).toBeInTheDocument();
});
