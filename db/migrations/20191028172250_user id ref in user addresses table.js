
exports.up = function(knex) {
    return knex.schema
    .alterTable('Users', function(t) {   
        t.string('user_id').unique().alter();
    })
    .alterTable('User_Addresses', function(t) {   
        t.string('user_id').references('user_id').inTable('Users').onDelete('Cascade');
    });
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('Users', function(t) {   
        t.string('user_id').alter();
    })
    .alterTable('User_Addresses', function(t) {
        t.dropColumn('user_id');
    });
};
