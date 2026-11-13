// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Boom() { throw new Error('boom'); }

describe('ErrorBoundary', () => {
  it('shows a friendly message instead of a blank page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    document.documentElement.lang = 'ar';
    const el = document.createElement('div');
    await act(async () => {
      createRoot(el).render(createElement(ErrorBoundary, null, createElement(Boom)));
    });
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.textContent).toContain('حدث خطأ ما');
  });

  it('renders children when nothing fails', async () => {
    const el = document.createElement('div');
    await act(async () => {
      createRoot(el).render(createElement(ErrorBoundary, null, createElement('p', null, 'ok')));
    });
    expect(el.textContent).toBe('ok');
  });
});
