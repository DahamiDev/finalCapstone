import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
    default: 'General',
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  summary: {
    type: String,
    default: '',
  },
  quiz: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Note = mongoose.model('Note', NoteSchema);

export default Note;
