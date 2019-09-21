
exports.up = function(knex) {
    return knex.schema
    .createTable('Organizations', function(Organizations) {
        Organizations.increments('id').primary();
        Organizations.string('title')
    })
    .createTable('Listing', function(Listing) {
        Listing.increments('id').primary();
        table.timestamp('created_at').defaultTo(knex.fn.now())
        Listing.string('title');
        Listing.string('status');
        Listing.integer('organization_id').references('id').inTable('Organizations').notNull().onDelete('SETNULL');
    });
};

exports.down = function(knex) {
    return knex.schema
  .dropTable('Listing')
  .dropTable('Organizations');
};
