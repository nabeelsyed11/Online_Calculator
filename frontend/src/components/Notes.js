import React, { useEffect, useState } from 'react';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/notes');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch notes');
      // Sort by createdAt desc
      const sorted = [...json].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotes(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const addNote = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please provide both title and content');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add note');
      setTitle('');
      setContent('');
      setNotes((prev) => [json, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/notes/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete note');
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notes">
      <h2>Notes</h2>

      <div className="notes-form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="add-note-button" onClick={addNote} disabled={loading}>
          Add Note
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {loading && <p>Loading...</p>}

      <div className="notes-list">
        {notes.map((note) => (
          <div key={note.id} className="note-item">
            <div className="note-title">{note.title}</div>
            <div className="note-content">{note.content}</div>
            <div className="note-date">{new Date(note.createdAt).toLocaleString()}</div>
            <button className="delete-note-button" onClick={() => deleteNote(note.id)}>
              Delete
            </button>
          </div>
        ))}
        {!loading && notes.length === 0 && <p>No notes yet.</p>}
      </div>
    </div>
  );
}

export default Notes;
