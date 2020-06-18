const path = require('path');
const express = require('express');
const xss = require('xss');
const FolderService = require('./folder-service.js');

const folderRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = (folder) => ({
  id: folder.id,
  name: folder.name,
});

folderRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    FolderService.getAllFolders(knexInstance)
      .then((folders) => {
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name } = req.body;
    const newFolder = { name };
    for (const [key, value] of Object.entries(newFolder))
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
  });

folderRouter
  .route('/:id')
  .all((req, res, next) => {
    FolderService.getById(req.app.get('db'), req.params.id).then((folder) => {
      if (!folder) {
        return res.status(404).json({
          error: { message: "Folder doesn't exist" },
        });
      }
      res.folder = folder;
      next();
    });
  })
  .get((req, res, next) => {
    res.json({
      id: res.folder.id,
      title: xss(res.folder.name),
    });
  })
  .delete((req, res, next) => {
    FolderService.deleteFolder(req.app.get('db'), req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title } = req.body;
    const folderToUpdate = { title };
    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: "Request body must contain 'title'",
        },
      });
    }
    FolderService.updateFolder(req.app.get('db'), req.params.id, folderToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });
module.exports = folderRouter;
