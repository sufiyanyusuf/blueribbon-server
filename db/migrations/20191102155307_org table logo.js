
exports.up = function(knex) {
    return knex.schema
    .alterTable('Organizations', function(t) {
        t.string('logo')
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('User_Addresses', function(t) {
        t.dropColumn('logo');
    });
};
