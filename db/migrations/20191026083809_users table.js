
exports.up = function(knex) {
    return knex.schema
    .createTable('Users', function(Users) {
        Users.increments('id').primary();
        Users.string('user_id');
        Users.boolean('new_user').defaultTo(true);
    })
    .createTable('User_Addresses', function(User_Addresses) {
        User_Addresses.increments('id').primary();
        User_Addresses.integer('user_id').references('id').inTable('Users').onDelete('Cascade');
        User_Addresses.string('complete_address');
        User_Addresses.specificType('coordinates', 'POINT');
        User_Addresses.string('tag');
    })
};

exports.down = function(knex) {
    return knex.schema
    .dropTable('User_Addresses')
    .dropTable('Users');
};
