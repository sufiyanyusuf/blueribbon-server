
exports.up = function(knex) {
    return knex.schema
    .createTable('Service_Locations', function(ServiceLocations) {
        ServiceLocations.increments('id').primary();
        ServiceLocations.integer('data_id')
        ServiceLocations.json('polygon')
        ServiceLocations.integer('listing_id').references('id').inTable('Listings');
    });
};

exports.down = function(knex) {
    return knex.schema
    .dropTable('Service_Locations')
};
