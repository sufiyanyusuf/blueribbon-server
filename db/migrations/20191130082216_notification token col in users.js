
exports.up = function(knex) {
    return knex.schema.alterTable('Users', function(t) {
        t.string('notification_token')
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('Users', function(t) {
        t.dropColumn('notification_token');
    });
};
