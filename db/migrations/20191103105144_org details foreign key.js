
exports.up = function(knex) {
    return knex.schema
    .alterTable('Organizations', function(t) {   
        t.unique('logo')
    })
    .alterTable('User_Subscriptions', function(t) {   
        t.string('brand_logo').references('logo').inTable('Organizations').alter();
    })
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('Organizations', function(t) {
        t.dropUnique('organizations_logo_unique')
    })
    .alterTable('User_Subscriptions', function(t) {   
        t.string('brand_logo').alter()
    })
};
