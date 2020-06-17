const NoteService = {
  getAllUsers(knex) {
    return knex.select('*').from('notes');
  },

  insertUser(knex, newNote) {
    return knex
      .insert(newNote)
      .into('notes')
      .returning('*')
      .then((rows) => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from('notes').select('*').where('id', id).first();
  },

  deleteUser(knex, id) {
    return knex('notes').where({ id }).delete();
  },

  updateUser(knex, id, newNote) {
    return knex('notes').where({ id }).update(newNote);
  },
};

module.exports = UsersService;
