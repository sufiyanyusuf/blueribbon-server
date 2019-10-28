exports.up = function(knex) {
    return knex.schema.alterTable('User_Addresses', function(t) {
        t.dropColumn('user_id');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('User_Addresses', function(t) {
        t.integer('user_id').references('id').inTable('Users').onDelete('Cascade');
    });
};