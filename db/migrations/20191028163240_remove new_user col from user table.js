
exports.up = function(knex) {
    return knex.schema.table('Users', function(t) {
        t.dropColumn('new_user');
    });
};

exports.down = function(knex) {
    return knex.schema.table('Users', function(t) {
        t.boolean('new_user').defaultTo(true);
    });
};
