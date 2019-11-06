
exports.up = function(knex) {
    return knex.schema.alterTable('Purchases', function(t) {
        t.timestamp('timestamp').defaultTo(knex.fn.now())
        t.json('order_details')
        t.string('delivery_address')
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('Purchases', function(t) {
        t.dropColumn('timestamp');
        t.dropColumn('order_details');
        t.dropColumn('delivery_address');
    });
};
