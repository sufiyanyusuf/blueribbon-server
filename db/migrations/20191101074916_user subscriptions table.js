
exports.up = function(knex) {
    return knex.schema
    .createTable('User_Subscriptions', function(t) {
        t.increments('id').primary();
        t.string('user_id').references('user_id').inTable('Users').onDelete('Cascade');
        t.integer('listing_id').references('id').inTable('Listings');
        t.string('subscription_id').unique();
        t.string('type');
        t.string('value');
        t.string('title');
        t.string('brand_name');
        t.string('brand_logo');
        t.boolean('is_active');
        t.boolean('in_cart');
        t.string('product_photo');
    })
};

exports.down = function(knex) {
    return knex.schema
    .dropTable('User_Subscriptions')
};
