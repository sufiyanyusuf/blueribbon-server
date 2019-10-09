
exports.up = function(knex) {
    return knex.schema.alterTable('Modifier_Choices', function(t) {
        t.decimal('pricing_impact',20,2).alter();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('Modifier_Choices', function(t) {
        t.integer('pricing_impact').alter();
    });
};
