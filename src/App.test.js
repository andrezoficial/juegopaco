import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the game title', () => {
  render(<App />);
  const title = screen.getByText(/PACO EN LA CIUDAD/i);
  expect(title).toBeInTheDocument();
});
