const path = require('path');
const express = require('express');
const xss = require('xss');
const NoteService = require('./notes-service.js');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializenotes = (note) => ({
  id: note.id,
  name: note.name,
  content: note.content,
  folderId: note.folderId,
});

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    NoteService.getAllNotes(knexInstance)
      .then((notes) => {
        res.json(notes.map(serializenotes));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, folderId } = req.body;
    const newnote = { name, content, folderId };
    for (const [key, value] of Object.entries(newnote))
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
  });

notesRouter
  .route('/:id')
  .all((req, res, next) => {
    NoteService.getById(req.app.get('db'), req.params.id)
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
          title: xss(res.note.name),
        });
      })
      .delete((req, res, next) => {
        NoteService.deletenotes(req.app.get('db'), req.params.id)
          .then(() => {
            res.status(204).end();
          })
          .catch(next);
      });
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, content, folderId } = req.body;
    const notesToUpdate = { name, content, folderId };
    const numberOfValues = Object.values(notesToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: "Request body must contain 'title'",
        },
      });
    }
    NoteService.updatenotes(req.app.get('db'), req.params.id, notesToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });
module.exports = notesRouter;
