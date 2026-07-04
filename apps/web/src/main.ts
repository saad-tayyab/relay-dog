import './index.css';
import { mount } from 'svelte';
import App from './App.svelte';

// ─── Vercel Analytics (production only) ───
if (import.meta.env.PROD) {
  import('@vercel/analytics').then(({ inject }) => inject());
  import('@vercel/speed-insights').then(({ injectSpeedInsights }) => injectSpeedInsights());
}

const target = document.getElementById('app');
if (!target) throw new Error('Root element #app not found');

const app = mount(App, { target });

export default app;
