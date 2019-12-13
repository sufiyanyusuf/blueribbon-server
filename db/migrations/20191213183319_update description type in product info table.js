
exports.up = function(knex) {
    return knex.schema.alterTable('ProductInfo', function(t) {
        t.text('description').alter();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('ProductInfo', function(t) {
        t.string('description').alter();
    });
};
