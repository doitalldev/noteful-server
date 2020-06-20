const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');
// const FolderService = require('../folders/folder-service');
const { serialize } = require('v8');
const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = (note) => ({
  id: note.id,
  name: note.name,
  content: note.content,
  folderid: note.folderid,
});

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    NotesService.getAllNotes(knexInstance)
      .then((notes) => {
        res.json(notes);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, modified, folderid } = req.body;
    const newNote = { name, content, modified, folderid };

    for (const [key, value] of Object.entries(newNote)) {
      if (!value) {
        return res.status(400).json({
          error: { message: `${key} is required` },
        });
      }
    }

    const knexInstance = req.app.get('db');
    NotesService.insertNote(knexInstance, newNote)
      .then((note) => {
        res.status(201).json(note);
      })
      .catch(next);
  });

notesRouter
  .route('/:id')
  .all((req, res, next) => {
    NotesService.getById(req.app.get('db'), req.params.id)
      .then((note) => {
        if (!note) {
          return res.status(404).json({
            error: { message: 'Note does not exist' },
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get('db'), req.params.id)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, content, folderid } = req.body;
    const noteToUpdate = { name, content, folderid };
    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must contain name, content, and folderid',
        },
      });
    NotesService.updateNote(req.app.get('db'), req.params.id, noteToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
