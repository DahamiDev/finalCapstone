import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Summarize state (tracks which note is summarizing)
  const [summarizingId, setSummarizingId] = useState(null);

  // Fetch all notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE}/notes`);
      if (!response.ok) {
        throw new Error('Failed to retrieve notes from server');
      }
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
      setApiError('Unable to connect to the backend server. Make sure it is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new note
  const handleAddNote = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!title.trim() || !content.trim()) {
      setApiError('Title and content are required to save a note.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject: subject || 'General',
          content,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save the note');
      }

      const newNote = await response.json();
      // Prepend to notes list
      setNotes((prevNotes) => [newNote, ...prevNotes]);

      // Reset form
      setTitle('');
      setSubject('');
      setContent('');
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Error occurred while saving the note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async (id) => {
    setApiError(null);
    if (!window.confirm('Are you sure you want to delete this study note?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete the note');
      }

      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== id));
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Error occurred while deleting the note.');
    }
  };

  // Summarize a note using OpenAI
  const handleSummarize = async (id) => {
    setApiError(null);
    setSummarizingId(id);

    try {
      const response = await fetch(`${API_BASE}/notes/${id}/summarize`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate study summary');
      }

      const updatedNote = await response.json();
      // Update note in list
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note._id === id ? updatedNote : note))
      );
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Error occurred while generating summary. Check OpenAI credentials.');
    } finally {
      setSummarizingId(null);
    }
  };

  // Filter notes client-side
  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = note.title.toLowerCase().includes(query);
    const matchesSubject = note.subject.toLowerCase().includes(query);
    return matchesTitle || matchesSubject;
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-inner">
          <a href="#" className="brand">
            <svg className="brand-logo-svg" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M192 128C147.818 128 112 163.818 112 208C112 232.062 122.656 253.688 139.5 268.5C124.562 284.188 112 308.281 112 336C112 380.182 147.818 416 192 416C213.25 416 232.531 407.625 247 394C249.219 397.688 252.125 401 256 403.5C259.875 401 262.781 397.688 265 394C279.469 407.625 298.75 416 320 416C364.182 416 400 380.182 400 336C400 308.281 387.438 284.188 372.5 268.5C389.344 253.688 400 232.062 400 208C400 163.818 364.182 128 320 128C314.938 128 310.062 128.594 305.312 129.75C293.969 111.469 276.438 96 256 96C235.562 96 218.031 111.469 206.688 129.75C201.938 128.594 197.062 128 192 128Z" stroke="#00F2FE" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M256 112V384" stroke="#00F5A0" strokeWidth="20" strokeLinecap="round"/>
              <path d="M256 192C236 192 216 176 216 160" stroke="#00F2FE" strokeWidth="16" strokeLinecap="round"/>
              <path d="M256 256C216 256 176 236 176 208" stroke="#00F2FE" strokeWidth="16" strokeLinecap="round"/>
              <path d="M256 320C226 320 196 300 196 280" stroke="#00F2FE" strokeWidth="16" strokeLinecap="round"/>
              <path d="M256 192C276 192 296 176 296 160" stroke="#00F5A0" strokeWidth="16" strokeLinecap="round"/>
              <path d="M256 256C296 256 336 236 336 208" stroke="#00F5A0" strokeWidth="16" strokeLinecap="round"/>
              <path d="M256 320C286 320 316 300 316 280" stroke="#00F5A0" strokeWidth="16" strokeLinecap="round"/>
            </svg>
            <span className="brand-text">StudyMate</span>
          </a>

          {/* Search bar */}
          <div className="search-wrapper">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="dashboard-main">
        {/* Left Side: Create Note Form */}
        <section className="glass-card">
          <h2 className="form-title">Create Study Note</h2>
          
          {/* Error Message banner */}
          {apiError && (
            <div className="alert alert-danger">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleAddNote}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                placeholder="Enter note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                placeholder="e.g. Physics, History, Math..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                placeholder="Paste or write your full study material here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-control"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loader-spinner"></div>
                  <span>Saving note...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Save Note</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Side: Notes List */}
        <section className="notes-section">
          <div className="section-top">
            <h2>Study Notes</h2>
            <div className="notes-count">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            </div>
          </div>

          {isLoading ? (
            <div className="loading-block glass-card">
              <div className="loader-spinner"></div>
              <p>Fetching notes from database...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="empty-state">
              <i className="fa-regular fa-clipboard empty-state-icon"></i>
              <h3>No study notes found</h3>
              <p>
                {searchQuery
                  ? 'No results match your search query.'
                  : 'Start by creating your very first study note on the left.'}
              </p>
            </div>
          ) : (
            <div className="notes-grid">
              {filteredNotes.map((note) => {
                // Parse summary into bullet points
                const summaryBullets = note.summary
                  ? note.summary
                      .split('\n')
                      .map((bullet) => bullet.replace(/^[\s-•*]+/, '').trim())
                      .filter((bullet) => bullet.length > 0)
                  : [];

                const isCurrentlySummarizing = summarizingId === note._id;

                return (
                  <article key={note._id} className="glass-card note-card">
                    <span className="note-subject-badge">{note.subject}</span>
                    
                    <div className="note-card-header">
                      <div>
                        <h3 className="note-title">{note.title}</h3>
                        <span className="note-date">
                          {new Date(note.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="note-content-preview">{note.content}</p>

                    {/* AI Summary and Quiz Section */}
                    {(note.summary || note.quiz || isCurrentlySummarizing) && (
                      <div className="ai-section">
                        <h4 className="ai-section-title">
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                          <span>AI Study Assistant</span>
                        </h4>

                        {isCurrentlySummarizing ? (
                          <div className="loading-block" style={{ padding: '20px 0' }}>
                            <div className="loader-spinner" style={{ borderTopColor: '#c084fc' }}></div>
                            <p style={{ fontSize: '13px', color: '#c084fc' }}>StudyMate AI is summarizing and generating a quiz...</p>
                          </div>
                        ) : (
                          <>
                            {summaryBullets.length > 0 && (
                              <div>
                                <h5 className="ai-quiz-title">Key Takeaways</h5>
                                <ul className="ai-summary-list">
                                  {summaryBullets.map((bullet, idx) => (
                                    <li key={idx}>{bullet}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {note.quiz && (
                              <div className="ai-quiz-wrapper">
                                <h5 className="ai-quiz-title">Quiz Question</h5>
                                <p className="ai-quiz-text">{note.quiz}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="note-card-actions">
                      <button
                        onClick={() => handleSummarize(note._id)}
                        className="btn btn-sparkle"
                        disabled={isCurrentlySummarizing || summarizingId !== null}
                      >
                        {isCurrentlySummarizing ? (
                          <>
                            <div className="loader-spinner"></div>
                            <span>Summarizing...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            <span>{note.summary ? 'Re-Summarize' : '✨ Summarize'}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="btn btn-danger-outline"
                        aria-label="Delete note"
                        disabled={isCurrentlySummarizing || summarizingId !== null}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Delete</span>
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

export default App;
