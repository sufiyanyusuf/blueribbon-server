
exports.up = function(knex) {
    return knex.schema
    .alterTable('User_Subscriptions', function(t) {  
        t.dropColumn('purchase_id')
    })
    .alterTable('Purchases', function (t) {  
        t.integer('subscription_id').references('id').inTable('User_Subscriptions').onUpdate('cascade');
    })
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('Purchases', function(t) { 
        t.dropColumn('subscription_id')
    })
    .alterTable('User_Subscriptions', function(t) {   
        t.string('purchase_id').references('purchase_id').inTable('Purchases');
    })
};
