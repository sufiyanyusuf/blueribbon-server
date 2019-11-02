
exports.up = function(knex) {
    return knex.schema
    .alterTable('Listings', function(t) {   
        t.string('subscription_type');
    })
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('Listings', function(t) {
        t.dropColumn('subscription_type');
    });
};
