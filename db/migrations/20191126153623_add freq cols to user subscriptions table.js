
exports.up = function(knex) {
    return knex.schema
    .alterTable('User_Subscriptions', function(t) {  
        t.string('frequency_unit')
        t.integer('frequency_value')
    })
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('User_Subscriptions', function(t) {  
        t.dropColumn('frequency_unit')
        t.dropColumn('frequency_value')
    })
};
