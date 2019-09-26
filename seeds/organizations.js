
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('Organizations').del()
    .then(function () {
      // Inserts seed entries
      return knex('Organizations').insert([
        {id: 1, title: 'Lulu'},
        {id: 2, title: 'Carrefour'},
        {id: 3, title: 'All Day'}
      ]);
    });
};
