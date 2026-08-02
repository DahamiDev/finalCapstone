import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5001/api';

/* ─────────────────────────────────────────────────────────────
   Logo with graceful fallback
───────────────────────────────────────────────────────────── */
function BrandLogo() {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="brand-logo-fallback" role="img" aria-label="StudyMate Logo">
        🧠
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="StudyMate Logo"
      className="brand-logo"
      onError={() => setImgError(true)}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   APP COMPONENT
───────────────────────────────────────────────────────────── */
export default function App() {

  // ── Notes State ─────────────────────────────────────────────
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // ── Form State ──────────────────────────────────────────────
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // note object when editing

  // ── Search ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Summarize State ─────────────────────────────────────────
  const [summarizingId, setSummarizingId] = useState(null);

  // ─────────────────────────────────────────────────────────────
  //   DATA FETCHING
  // ─────────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_BASE}/notes`);
      if (!res.ok) throw new Error('Failed to load notes.');
      setNotes(await res.json());
    } catch (err) {
      setApiError('Cannot connect to the backend. Make sure it is running on port 5001.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // ─────────────────────────────────────────────────────────────
  //   FORM HELPERS
  // ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormTitle('');
    setFormSubject('');
    setFormContent('');
    setEditingNote(null);
    setApiError(null);
  };

  const startEdit = (note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormSubject(note.subject || '');
    setFormContent(note.content);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─────────────────────────────────────────────────────────────
  //   CREATE / UPDATE SUBMIT
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!formTitle.trim() || !formContent.trim()) {
      setApiError('Title and content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        subject: formSubject.trim() || 'General',
        content: formContent.trim(),
      };

      if (editingNote) {
        // ── UPDATE ─────────────────────────────────────────────
        const res = await fetch(`${API_BASE}/notes/${editingNote._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to update note.');
        }
        const updated = await res.json();
        setNotes(prev => prev.map(n => n._id === updated._id ? updated : n));
        resetForm();
      } else {
        // ── CREATE ─────────────────────────────────────────────
        const res = await fetch(`${API_BASE}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to save note.');
        }
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        resetForm();
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //   DELETE
  // ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study note?')) return;
    setApiError(null);
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note.');
      setNotes(prev => prev.filter(n => n._id !== id));
      if (editingNote?._id === id) resetForm();
    } catch (err) {
      setApiError(err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //   AI SUMMARIZE
  // ─────────────────────────────────────────────────────────────
  const handleSummarize = async (id) => {
    setApiError(null);
    setSummarizingId(id);
    try {
      const res = await fetch(`${API_BASE}/notes/${id}/summarize`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI summarization failed.');
      }
      const updated = await res.json();
      setNotes(prev => prev.map(n => n._id === id ? updated : n));
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSummarizingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //   FILTER
  // ─────────────────────────────────────────────────────────────
  const filtered = notes.filter(note => {
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      (note.subject || '').toLowerCase().includes(q)
    );
  });

  // ─────────────────────────────────────────────────────────────
  //   RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-wrapper">

      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-inner">

          {/* Brand */}
          <a href="/" className="brand-link">
            <BrandLogo />
            <span className="brand-name">StudyMate</span>
          </a>

          {/* Search */}
          <div className="header-search">
            <i className="fa-solid fa-magnifying-glass search-icon" />
            <input
              className="search-bar"
              type="text"
              placeholder="Search notes by title or subject…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Note count */}
          <div className="notes-pill">
            <i className="fa-solid fa-book-open" />
            <span>{notes.length} {notes.length === 1 ? 'Note' : 'Notes'}</span>
          </div>

        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <main className="main-content">

        {/* ── LEFT: CREATE / EDIT FORM ── */}
        <section className="glass-card form-panel">

          <h2 className="panel-title">
            {editingNote ? '✏️ Edit Note' : '📝 Create Note'}
          </h2>
          <p className="panel-subtitle">
            {editingNote
              ? 'Update the details of your study note below.'
              : 'Capture study material. AI will summarize it for you.'}
          </p>
          <div className="form-divider" />

          {/* Edit Mode Banner */}
          {editingNote && (
            <div className="edit-banner">
              <i className="fa-solid fa-pen-to-square" />
              <span>Editing: <strong>{editingNote.title}</strong></span>
              <button className="edit-banner-cancel" onClick={resetForm} title="Cancel edit">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="alert-error">
              <i className="fa-solid fa-triangle-exclamation" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="note-title">Title *</label>
              <input
                id="note-title"
                className="form-input"
                type="text"
                placeholder="e.g. Photosynthesis Overview"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note-subject">Subject</label>
              <input
                id="note-subject"
                className="form-input"
                type="text"
                placeholder="e.g. Biology, History, Physics…"
                value={formSubject}
                onChange={e => setFormSubject(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note-content">Content *</label>
              <textarea
                id="note-content"
                className="form-textarea"
                placeholder="Paste or write your full study material here. The AI will condense it into key bullet points and a quiz question…"
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                required
              />
            </div>

            <div className="btn-row">
              <button
                type="submit"
                className="btn btn-save"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="spinner-sm" /> {editingNote ? 'Updating…' : 'Saving…'}</>
                ) : (
                  <><i className={`fa-solid ${editingNote ? 'fa-floppy-disk' : 'fa-plus'}`} /> {editingNote ? 'Update Note' : 'Save Note'}</>
                )}
              </button>
              {(formTitle || formContent || editingNote) && (
                <button type="button" className="btn btn-clear" onClick={resetForm}>
                  <i className="fa-solid fa-rotate-left" />
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── RIGHT: NOTES LIST ── */}
        <section className="notes-area">
          <div className="notes-area-header">
            <h2 className="notes-area-title">Your Study Notes</h2>
            {filtered.length > 0 && (
              <span className="notes-count-tag">
                {searchQuery
                  ? `${filtered.length} of ${notes.length} shown`
                  : `${notes.length} total`}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="loading-state glass-card">
              <div className="spinner" />
              <span>Loading notes from database…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                {searchQuery ? '🔍' : '📂'}
              </span>
              <p className="empty-title">
                {searchQuery ? 'No notes match your search' : 'No study notes yet'}
              </p>
              <p className="empty-sub">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different term.`
                  : 'Create your first note using the form on the left.'}
              </p>
            </div>
          ) : (
            <div className="notes-list">
              {filtered.map(note => {
                const isSummarizing = summarizingId === note._id;
                const hasSummary = note.summary && note.summary.trim();
                const hasQuiz = note.quiz && note.quiz.trim();

                // Parse bullet points
                const bullets = hasSummary
                  ? note.summary
                      .split('\n')
                      .map(b => b.replace(/^[\s\-•*]+/, '').trim())
                      .filter(b => b.length > 0)
                  : [];

                return (
                  <article key={note._id} className="glass-card note-card">

                    {/* Subject Badge */}
                    <div className="subject-badge">
                      <i className="fa-solid fa-tag" />
                      {note.subject || 'General'}
                    </div>

                    {/* Note Header */}
                    <div className="note-header">
                      <h3 className="note-title">{note.title}</h3>
                      <span className="note-date">
                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {' · '}
                        {new Date(note.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Body */}
                    <p className="note-body">{note.content}</p>

                    {/* AI Assistant Section */}
                    {(hasSummary || hasQuiz || isSummarizing) && (
                      <div className="ai-panel">
                        <div className="ai-panel-header">
                          <i className="fa-solid fa-wand-magic-sparkles ai-panel-icon" />
                          <span className="ai-panel-title">AI Study Assistant</span>
                        </div>

                        {isSummarizing ? (
                          <div className="ai-loading">
                            <span className="spinner-sm" style={{ borderTopColor: '#c084fc' }} />
                            Generating summary and quiz question…
                          </div>
                        ) : (
                          <>
                            {bullets.length > 0 && (
                              <div>
                                <p className="ai-summary-label">Key Takeaways</p>
                                <ul className="ai-summary-list">
                                  {bullets.map((b, i) => (
                                    <li key={i}>
                                      <span className="ai-bullet" />
                                      {b}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {hasQuiz && (
                              <div className="ai-quiz-box">
                                <p className="ai-quiz-label">Quiz Question</p>
                                <p className="ai-quiz-text">{note.quiz}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="card-actions" style={{ marginTop: 20 }}>
                      <div className="card-actions-left">
                        <button
                          className={`btn-summarize${isSummarizing ? ' loading' : ''}`}
                          onClick={() => handleSummarize(note._id)}
                          disabled={isSummarizing || summarizingId !== null}
                        >
                          {isSummarizing ? (
                            <><span className="spinner-sm" /> Summarizing…</>
                          ) : (
                            <><i className="fa-solid fa-wand-magic-sparkles" /> {hasSummary ? 'Re-Summarize' : '✨ Summarize'}</>
                          )}
                        </button>

                        <button
                          className="btn-edit"
                          onClick={() => startEdit(note)}
                          disabled={isSummarizing || summarizingId !== null}
                        >
                          <i className="fa-solid fa-pen" /> Edit
                        </button>
                      </div>

                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(note._id)}
                        disabled={isSummarizing || summarizingId !== null}
                      >
                        <i className="fa-solid fa-trash-can" /> Delete
                      </button>
                    </div>

                  </article>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
