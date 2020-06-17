const path = require('path');
const express = require('express');
const xss = require('xss');
const NoteService = require('./notes-service.js');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializenotes = (note) => ({
  id: note.id,
  note_title: note.note_title,
  content: note.note_content,
  folder_id: note.folder_id,
});

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    NoteService.getAllnotess(knexInstance)
      .then((notes) => {
        res.json(notes.map(serializenotes));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { note_title, note_content, folder_id } = req.body;
    const newnote = { note_title, note_content, folder_id };
    for (const [key, value] of Object.entries(newnote))
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
  });

notesRouter
  .route('/:notes_id')
  .all((req, res, next) => {
    NoteService.getById(req.app.get('db'), req.params.note_id)
      .then((notes) => {
        if (!notes) {
          return res.status(404).json({
            error: { message: "notes doesn't exist" },
          });
        }
        res.notes = notes;
        next();
      })
      .get((req, res, next) => {
        res.json({
          id: res.note.id,
          title: xss(res.note.note_title),
        });
      })
      .delete((req, res, next) => {
        NoteService.deletenotes(req.app.get('db'), req.params.note_id)
          .then(() => {
            res.status(204).end();
          })
          .catch(next);
      });
  })
  .patch(jsonParser, (req, res, next) => {
    const { note_title, note_content, folder_id } = req.body;
    const notesToUpdate = { note_title, note_content, folder_id };
    const numberOfValues = Object.values(notesToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: "Request body must contain 'title'",
        },
      });
    }
    NoteService.updatenotes(
      req.app.get('db'),
      req.params.note_id,
      notesToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });
module.exports = notesRouter;
