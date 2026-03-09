const API_BASE = '/api';

export const api = {
  async getMetadata(url) {
    const res = await fetch(`${API_BASE}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async analyzeLandCover(url) {
    const res = await fetch(`${API_BASE}/land-cover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async sampleRaster(url, lon, lat) {
    const res = await fetch(`${API_BASE}/sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, lon, lat })
    });
    return res.json();
  },

  async getFootprint(url) {
    const res = await fetch(`${API_BASE}/footprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async getHistogram(url, bins = 256) {
    const res = await fetch(`${API_BASE}/histogram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, bins })
    });
    return res.json();
  },

  async getDatasets() {
    const res = await fetch(`${API_BASE}/datasets`);
    return res.json();
  },

  async getBEVMetadata(recordId) {
    const res = await fetch(`${API_BASE}/bev-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recordId })
    });
    return res.json();
  }
};

export default api;
