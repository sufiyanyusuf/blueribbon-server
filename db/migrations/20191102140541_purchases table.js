
exports.up = function(knex) {
    return knex.schema
    .createTable('Purchases', function(t) {
        t.increments('id').primary();
        t.string('user_id').references('user_id').inTable('Users').onDelete('Cascade');
        t.integer('listing_id').references('id').inTable('Listings');
        t.string('purchase_id').unique();
        t.string('currency');
        t.decimal('amount',20,2);
        t.string('payment_id');
        t.string('payment_gateway');
        t.string('receipt_url');
        t.string('card_last4');
        t.string('card_brand');
    }).alterTable('User_Subscriptions', function(t) {   
        t.string('purchase_id').references('purchase_id').inTable('Purchases');
    })
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('User_Subscriptions', function(t) {   
        t.dropColumn('purchase_id')
    })
    .dropTable('Purchases')
};
