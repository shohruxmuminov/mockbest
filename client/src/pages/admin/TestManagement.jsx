import React, { useState } from 'react';

export default function TestManagement() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    listeningHtml: null,
    listeningAudio: null,
    readingHtml: null,
    writingHtml: null
  });

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('name', formData.name);
    
    if (formData.listeningHtml) data.append('listeningHtml', formData.listeningHtml);
    if (formData.listeningAudio) data.append('listeningAudio', formData.listeningAudio);
    if (formData.readingHtml) data.append('readingHtml', formData.readingHtml);
    if (formData.writingHtml) data.append('writingHtml', formData.writingHtml);

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.success) {
        alert('Test uploaded successfully!');
        setFormData({ title: '', name: '', listeningHtml: null, listeningAudio: null, readingHtml: null, writingHtml: null });
        e.target.reset();
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed due to connection error.');
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel">
      <h4 className="mb-4">Upload New Mock Test</h4>
      <form onSubmit={handleUpload} className="d-flex flex-column gap-4">
        
        <div className="d-flex gap-3">
          <div className="w-100">
            <label className="mb-2 d-block text-light">Test Title (e.g. Cambridge IELTS 15)</label>
            <input required type="text" className="input" name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="w-100">
            <label className="mb-2 d-block text-light">Test Name (e.g. Test 1)</label>
            <input required type="text" className="input" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />

        <div>
          <h5 className="mb-3 text-secondary">1. Listening Section</h5>
          <div className="d-flex gap-3">
            <div className="w-100">
              <label className="mb-2 d-block text-light">Listening HTML File</label>
              <input required type="file" className="input" name="listeningHtml" accept=".html" onChange={handleFileChange} />
            </div>
            <div className="w-100">
              <label className="mb-2 d-block text-light">Listening Audio File (Optional)</label>
              <input type="file" className="input" name="listeningAudio" accept="audio/*" onChange={handleFileChange} />
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />

        <div>
          <h5 className="mb-3 text-secondary">2. Reading Section</h5>
          <div className="w-100">
            <label className="mb-2 d-block text-light">Reading HTML File</label>
            <input required type="file" className="input" name="readingHtml" accept=".html" onChange={handleFileChange} />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />

        <div>
          <h5 className="mb-3 text-secondary">3. Writing Section</h5>
          <div className="w-100">
            <label className="mb-2 d-block text-light">Writing HTML File</label>
            <input required type="file" className="input" name="writingHtml" accept=".html" onChange={handleFileChange} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
          {loading ? 'Uploading...' : 'Publish Mock Test'}
        </button>

      </form>
    </div>
  );
}
