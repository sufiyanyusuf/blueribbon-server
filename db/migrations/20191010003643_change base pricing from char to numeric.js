
exports.up = function(knex) {
    return knex.schema.alterTable('ProductInfo', function(t) {
        t.decimal('base_price',20,2).alter();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('ProductInfo', function(t) {
        t.string('base_price').alter();
    });
};
