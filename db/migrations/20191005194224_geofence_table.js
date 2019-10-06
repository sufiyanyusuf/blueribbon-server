
exports.up = function(knex) {
    return knex.schema
    .createTable('ServiceLocations', function(ServiceLocations) {
        ServiceLocations.increments('id').primary();
        ServiceLocations.integer('data_id')
        ServiceLocations.json('polygon')
        ServiceLocations.string('label')
        ServiceLocations.integer('listing_id').references('id').inTable('Listings').onDelete('Cascade');
    });
};

exports.down = function(knex) {
    return knex.schema
    .dropTable('ServiceLocations')
};
