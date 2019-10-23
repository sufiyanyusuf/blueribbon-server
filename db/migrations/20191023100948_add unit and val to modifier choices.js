
exports.up = function(knex) {
    return knex.schema.table('Modifier_Choices', function(t) {
        t.string('unit');
        t.integer('value');
    });
};

exports.down = function(knex) {
    return knex.schema.table('Modifier_Choices', function(t) {
        t.dropColumn('unit');
        t.dropColumn('value');
    });
};
