import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AutoSmartML navigation header', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/AutoSmartML/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
