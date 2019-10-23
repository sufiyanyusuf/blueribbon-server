
exports.up = function(knex) {
    return knex.schema.alterTable('Elements_Steppers', function(t) {
        t.decimal('price_multiplier',20,2).alter();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('Elements_Steppers', function(t) {
        t.integer('price_multiplier').alter();
    });
};
