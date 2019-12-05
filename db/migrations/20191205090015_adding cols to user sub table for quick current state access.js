
exports.up = function(knex) {
    return knex.schema
    .alterTable('User_Subscriptions', function(t) {  
        t.integer('current_state').references('id').inTable('Subscription_States').onUpdate('cascade');
    })
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('User_Subscriptions', function(t) {  
        t.dropColumn('current_state')
    })
};
