import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing page header', () => {
  render(<App />);
  // landing header contains 'QCM-Net' or main hero title
  const logos = screen.getAllByText(/QCM-Net/i);
  expect(logos.length).toBeGreaterThan(0);
});
