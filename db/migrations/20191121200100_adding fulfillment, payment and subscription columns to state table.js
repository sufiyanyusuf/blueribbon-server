
exports.up = function(knex) {
    return knex.schema.alterTable('Subscription_States', function(t) {
        t.string('subscription_state')
        t.string('payment_state')
        t.string('fulfillment_state')
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('User_Addresses', function(t) {
        t.string('subscription_state')
        t.string('payment_state')
        t.string('fulfillment_state')
    });
};