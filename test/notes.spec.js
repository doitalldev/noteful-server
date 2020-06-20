require('dotenv').config();
const app = require('../src/app');
const FolderService = require('../folders/folder-service');
const { expect } = require('chai');
const { TEST_DATABASE_URL } = require('../src/config');
const knex = require('knex');
const supertest = require('supertest');

describe('Notes Endpoints', () => {
  let db;

  before(() => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  before(() => db.raw('TRUNCATE TABLE folders, notes CASCADE'));
  afterEach(() => db.raw('TRUNCATE TABLE folders, notes CASCADE'));
  after(() => db.destroy());

  const testFolders = [
    {
      id: 1,
      name: 'Important',
    },
    {
      id: 2,
      name: 'Super',
    },
    {
      id: 3,
      name: 'Spangley',
    },
  ];

  const testNotes = [
    {
      id: 1,
      name: 'Dogs',
      modified: '2019-01-03T00:00:00.000Z',
      folder_id: 1,
      content:
        'Corporis accusamus placeat quas non voluptas. Harum fugit molestias qui. Velit ex animi reiciendis quasi. Suscipit totam delectus ut voluptas aut qui rerum. Non veniam eius molestiae rerum quam.\n \rUnde qui aperiam praesentium alias. Aut temporibus id quidem recusandae voluptatem ut eum. Consequatur asperiores et in quisquam corporis maxime dolorem soluta. Et officiis id est quia sunt qui iste reiciendis saepe. Ut aut doloribus minus non nisi vel corporis. Veritatis mollitia et molestias voluptas neque aspernatur reprehenderit.\n \rMaxime aut reprehenderit mollitia quia eos sit fugiat exercitationem. Minima dolore soluta. Quidem fuga ut sit voluptas nihil sunt aliquam dignissimos. Ex autem nemo quisquam voluptas consequuntur et necessitatibus minima velit. Consequatur quia quis tempora minima. Aut qui dolor et dignissimos ut repellat quas ad.',
    },
    {
      id: 2,
      name: 'Cats',
      modified: '2018-08-15T23:00:00.000Z',
      folder_id: 2,
      content:
        'Eos laudantium quia ab blanditiis temporibus necessitatibus. Culpa et voluptas ut sed commodi. Est qui ducimus id. Beatae sint aspernatur error ullam quae illum sint eum. Voluptas corrupti praesentium soluta cumque illo impedit vero omnis nisi.\n \rNam sunt reprehenderit soluta quis explicabo impedit id. Repudiandae eligendi libero ad ut dolores. Laborum nihil sint et labore iusto reiciendis cum. Repellat quos recusandae natus nobis ullam autem veniam id.\n \rEsse blanditiis neque tempore ex voluptate commodi nemo. Velit sapiente at placeat eveniet ut rem. Quidem harum ut dignissimos. Omnis pariatur quas aperiam. Quasi voluptas qui nulla. Iure quas veniam aut quia et.',
    },
    {
      id: 3,
      name: 'Pigs',
      modified: '2018-03-01T00:00:00.000Z',
      folder_id: 3,
      content:
        'Occaecati dignissimos quam qui facere deserunt quia. Quaerat aut eos laudantium dolor odio officiis illum. Velit vel qui dolorem et.\n \rQui ut vel excepturi in at. Ut accusamus cumque quia sapiente ut ipsa nesciunt. Dolorum quod eligendi qui aliquid sint.\n \rAt id deserunt voluptatem et rerum. Voluptatem fuga tempora aut dignissimos est odio maiores illo. Fugiat in ad expedita voluptas voluptatum nihil.',
    },
    {
      id: 4,
      name: 'Birds',
      modified: '2019-01-04T00:00:00.000Z',
      folder_id: 1,
      content:
        'Eum culpa odit. Veniam porro molestiae dolores sunt reiciendis culpa. Atque accusamus dolore eos odio facilis. Dolores reprehenderit et provident dolores possimus mollitia.\n \rAdipisci dolor necessitatibus nihil quod quia vel veniam. Placeat qui vero. Cum cum amet at nisi. Distinctio rerum similique explicabo atque ratione. Recusandae omnis earum est. Quas iusto nihil itaque architecto ea.\n \rPerferendis neque doloremque quibusdam accusantium ut dolor illum dolorum. Vero et similique nihil beatae. In repellendus dolores praesentium. Optio alias rerum culpa placeat maiores natus sed. Ipsa et qui cum ex maiores.',
    },
  ];

  describe('GET /api/notes', () => {
    context('Given has no notes data', () => {
      it('GET /api/notes responds with 200 containing an empty array', () => {
        return supertest(app).get('/api/notes').expect(200, []);
      });
    });

    context('Given noteful has notes data', () => {
      beforeEach(() => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db.into('notes').insert(testNotes);
          });
      });

      it('GET /api/notes responds with 200 containing all notes', () => {
        return supertest(app).get('/api/notes').expect(200, testNotes);
      });

      it('GET /:id returns a specified note', () => {
        const idToGet = 1;
        const testNote = testNotes[idToGet - 1];

        return supertest(app)
          .get(`/api/notes/${idToGet}`)
          .expect(200, testNote);
      });
    });
  });

  describe('POST endpoints', () => {
    context('Given noteful has no notes in any folder', () => {
      const testFolder = [
        {
          id: 1,
          name: 'Important',
        },
      ];

      beforeEach(() => {
        return db.into('folders').insert(testFolder);
      });

      it('Creates a new note', () => {
        const newNote = {
          name: 'notename',
          content: 'content',
          folder_id: 1,
          modified: '2019-01-04T00:00:00.000Z',
        };

        return supertest(app).post('/api/notes').send(newNote).expect(201);
      });
    });
  });

  describe('PATCH endpoint', () => {
    context('Given there are notes in DB', () => {
      beforeEach(() => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            db.into('notes').insert(testNotes);
          });
      });

      it('responds with 204 and updates bookmark', () => {
        const idToUpdate = 1;
        const updateNote = {
          name: 'New Name!',
          content: 'New content!',
        };
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote,
        };
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send(updateNote)
          .expect(204);
      });
    });
  });

  describe('DELETE /api/notes/:id', () => {
    context('Given that notes exist', () => {
      beforeEach(() => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(db.into('notes').insert(testNotes));
      });

      it('responds with 204 and removes note', () => {
        const idToRemove = 1;
        const expectedNotes = testNotes.filter(
          (note) => note.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then((res) => {
            supertest(app).get('/api/notes').expect(expectedNotes);
          });
      });
    });
  });
});
