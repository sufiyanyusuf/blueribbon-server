
exports.up = function(knex) {
    return knex.schema.alterTable('Subscription_States', function(t) {
        t.specificType('fulfillment_options', 'text ARRAY');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('Subscription_States', function(t) {
        t.dropColumn('fulfillment_options');
    });
};
