
exports.up = function(knex) {
    return knex.schema.alterTable('User_Addresses', function(t) {
        t.string('base_address')
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('User_Addresses', function(t) {
        t.dropColumn('base_address');
    });
};
